import type { AnalyzePhotoErrorCode, AnalyzePhotoResponse, PhotoAnalysis, ScanHint } from '../shared/photoAnalysis'
import { todayISO } from './dateUtils'

export type { PhotoAnalysis, ScanHint }

const ENDPOINT = '/.netlify/functions/analyze-photo'

// The model downsizes anything larger than this on its side anyway, so sending more only slows the upload.
const MAX_IMAGE_SIDE = 1568

export type AiScanErrorCode = AnalyzePhotoErrorCode | 'offline' | 'bad_image'

export class AiScanError extends Error {
  readonly code: AiScanErrorCode

  constructor(code: AiScanErrorCode) {
    super(code)
    this.code = code
  }

  /** True when the AI service simply isn't reachable/configured, so a local OCR fallback makes sense. */
  get canFallBackToLocalOcr(): boolean {
    return this.code === 'not_configured' || this.code === 'unavailable' || this.code === 'offline'
  }
}

const ERROR_MESSAGES: Record<AiScanErrorCode, string> = {
  not_configured: 'El escaneo con IA todavía no está activado en esta app.',
  no_credit: 'La cuenta de IA se ha quedado sin saldo. Avisa a quien administra la app.',
  bad_key: 'La clave de la IA no es válida. Avisa a quien administra la app.',
  rate_limited: 'Se ha alcanzado el límite gratuito de la IA (por minuto o por día). Espera un poco y vuelve a intentarlo.',
  refused: 'La IA no ha podido analizar esta foto. Prueba con otra.',
  bad_request: 'La foto no se ha podido enviar. Prueba con otra.',
  forbidden: 'Esta petición no está permitida desde aquí.',
  unavailable: 'No se ha podido analizar la foto. Inténtalo de nuevo en unos segundos.',
  offline: 'Sin conexión: el escaneo con IA necesita internet.',
  bad_image: 'No se ha podido abrir la imagen. Prueba con otra foto.',
}

export function describeAiScanError(code: AiScanErrorCode): string {
  return ERROR_MESSAGES[code]
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(file)
  }
}

async function prepareImage(file: File): Promise<string> {
  let bitmap: ImageBitmap
  try {
    bitmap = await loadBitmap(file)
  } catch {
    throw new AiScanError('bad_image')
  }

  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new AiScanError('bad_image')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
}

/** Sends a photo to the AI endpoint and returns what it could read. Throws AiScanError. */
export async function analyzePhoto(file: File, hint: ScanHint = 'todo'): Promise<PhotoAnalysis> {
  const image = await prepareImage(file)

  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image, mediaType: 'image/jpeg', hint, today: todayISO() }),
      signal: AbortSignal.timeout(45_000),
    })
  } catch {
    throw new AiScanError(navigator.onLine ? 'unavailable' : 'offline')
  }

  let payload: AnalyzePhotoResponse | undefined
  try {
    payload = (await response.json()) as AnalyzePhotoResponse
  } catch {
    // Not JSON: the endpoint doesn't exist here (local dev, GitHub Pages) or the platform timed out.
    throw new AiScanError(response.status === 404 ? 'not_configured' : 'unavailable')
  }

  if (!payload?.ok) throw new AiScanError(payload?.error ?? 'unavailable')
  return payload.analysis
}
