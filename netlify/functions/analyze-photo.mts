import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { Context } from '@netlify/functions'
import {
  type AnalyzePhotoErrorCode,
  type AnalyzePhotoRequest,
  type AnalyzePhotoResponse,
  isValidISODate,
  photoAnalysisSchema,
  sanitizeAnalysis,
} from '../../src/shared/photoAnalysis.ts'

// Sonnet 5.5 reads printed labels well and answers in a few seconds, which matters because
// synchronous Netlify functions have a short execution limit. Override with ANTHROPIC_MODEL.
const DEFAULT_MODEL = 'claude-sonnet-5-5'

const MAX_IMAGE_CHARS = 5_500_000
const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const HINTS = new Set(['todo', 'fecha', 'nutricion'])

const SYSTEM_PROMPT = `Eres el asistente de visión de una app de despensa para no desperdiciar comida. Recibes UNA foto hecha con el móvil y devuelves únicamente lo que se ve con claridad. Nunca inventes datos: si algo no se ve o no estás seguro, devuelve null.

La foto puede mostrar un alimento suelto (pechuga de pollo, lubina, fruta...), un envase con etiqueta, un primer plano de la fecha impresa o la tabla de información nutricional; a veces varias cosas a la vez.

Reglas para cada campo:
- foodName: nombre genérico en español, corto y sin marca ni cantidades, con la primera letra en mayúscula ("Pechuga de pollo", "Lubina", "Leche entera", "Tomate frito", "Yogur natural"). Distingue el corte o la especie cuando se aprecie (pechuga o muslo; lubina, dorada o merluza). Si es una salsa, conserva o producto elaborado, el nombre debe reflejarlo ("Tomate frito", nunca "Tomate"). Si no puedes identificarlo, null.
- category: la categoría que mejor encaje. storage: dónde se guarda normalmente en casa (fresco perecedero o "conservar en frío" -> nevera; congelados -> congelador; conservas, legumbres, pasta, fruta y verdura de despensa -> despensa). Si no puedes identificar el alimento, ambos null.
- expirationDate: la fecha de caducidad o de consumo preferente en formato YYYY-MM-DD. Búscala junto a "Caducidad", "CAD", "Consumir antes de", "Consumir preferentemente antes de", "Cons. pref.", "Best before", "BBE", "EXP", "Use by". IGNORA la fecha de envasado o fabricación ("Envasado", "Fab.", "PKD", "MFG"), el lote ("L", "Lote") y los códigos de barras. Si hay varias fechas, elige la de caducidad o consumo. El formato en España es día/mes/año: 12/05/26 es el 12 de mayo de 2026. Si solo aparecen mes y año (05/2026, "MAY 2026") usa el último día de ese mes. Los años de dos cifras son 20xx. Si la lectura es dudosa (borrosa, reflejos, cifras que podrían ser otras), pon null y explícalo en message; es mejor no dar fecha que dar una equivocada.
- dateLabel: el texto literal que has leído junto a la fecha (por ejemplo "CAD 12/05/26"). dateKind: "caducidad" si es "caducidad / consumir antes de" (seguridad alimentaria) o "consumo_preferente" si es "consumir preferentemente antes de" / "best before". Ambos null si no hay fecha.
- shelfLifeDays: solo si NO hay fecha impresa y es un alimento fresco o sin envase con fecha. Días que razonablemente y con prudencia aguanta en el lugar de storage (pechuga de pollo cruda en nevera: 2; pescado fresco en nevera: 2; fruta y verdura según el caso). Si hay fecha impresa, null.
- nutrition: si se ve una tabla de información nutricional, los valores por 100 g o 100 ml (energyKcal en kcal, no kJ; el resto en gramos; punto como separador decimal). Si solo hay columna "por ración" y el tamaño de la ración está en g o ml, conviértela a 100 g o 100 ml; si no puedes, deja esos campos en null. Campos que no aparezcan: null. Si no hay tabla, nutrition es null.
- confidence: "alta" si lo principal se lee sin dudas, "media" si algún dato es incierto, "baja" si la foto es muy mala.
- message: una frase breve en español (máximo 140 caracteres) solo si el usuario debe saber algo, por ejemplo "La fecha sale borrosa, revísala" o "Se ve el envase pero no la fecha; haz otra foto a la zona donde está impresa". Si todo está bien, null.`

const HINT_TEXT: Record<string, string> = {
  todo: 'Identifica el alimento y extrae todo lo que se vea (fecha de caducidad y tabla nutricional si aparecen).',
  fecha: 'El usuario quiere leer la fecha de caducidad. Céntrate en encontrarla; identifica también el alimento si se ve.',
  nutricion: 'El usuario quiere leer la tabla nutricional. Céntrate en ella; identifica también el alimento si se ve.',
}

function json(body: AnalyzePhotoResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function fail(error: AnalyzePhotoErrorCode, status: number): Response {
  return json({ ok: false, error }, status)
}

function parseRequestBody(value: unknown): AnalyzePhotoRequest | null {
  if (typeof value !== 'object' || value === null) return null
  const { image, mediaType, hint, today } = value as Record<string, unknown>
  if (typeof image !== 'string' || image.length < 100 || image.length > MAX_IMAGE_CHARS) return null
  if (typeof mediaType !== 'string' || !MEDIA_TYPES.has(mediaType)) return null
  if (typeof hint !== 'string' || !HINTS.has(hint)) return null
  const safeToday = typeof today === 'string' && isValidISODate(today) ? today : new Date().toISOString().slice(0, 10)
  return {
    image,
    mediaType: mediaType as AnalyzePhotoRequest['mediaType'],
    hint: hint as AnalyzePhotoRequest['hint'],
    today: safeToday,
  }
}

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') return fail('bad_request', 405)

  // Casual-abuse guard only (headers can be forged): browsers always send Origin on cross-site POSTs.
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(req.url).host) return fail('forbidden', 403)

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return fail('not_configured', 503)

  let body: AnalyzePhotoRequest | null
  try {
    body = parseRequestBody(await req.json())
  } catch {
    body = null
  }
  if (!body) return fail('bad_request', 400)

  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 25_000 })

  try {
    const response = await client.messages.parse({
      model: Netlify.env.get('ANTHROPIC_MODEL') || DEFAULT_MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      output_config: { effort: 'low', format: zodOutputFormat(photoAnalysisSchema) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.image } },
            { type: 'text', text: `Hoy es ${body.today}. ${HINT_TEXT[body.hint]}` },
          ],
        },
      ],
    })

    if (response.stop_reason === 'refusal') return fail('refused', 422)
    if (!response.parsed_output) {
      console.error('analyze-photo: unparsable model output, stop_reason =', response.stop_reason)
      return fail('unavailable', 502)
    }

    return json({ ok: true, analysis: sanitizeAnalysis(response.parsed_output, body.today) }, 200)
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      console.error('analyze-photo: API key rejected', error.status)
      return fail('bad_key', 500)
    }
    if (error instanceof Anthropic.RateLimitError) return fail('rate_limited', 429)
    if (error instanceof Anthropic.BadRequestError) {
      console.error('analyze-photo: bad request', error.message)
      return fail(/credit balance/i.test(error.message) ? 'no_credit' : 'unavailable', /credit balance/i.test(error.message) ? 402 : 502)
    }
    console.error('analyze-photo: unexpected error', error instanceof Error ? error.message : error)
    return fail('unavailable', 502)
  }
}
