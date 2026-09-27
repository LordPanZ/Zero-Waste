import { createWorker } from 'tesseract.js'
import { toISO } from './dateUtils'

export interface DateCandidate {
  iso: string
  raw: string
  confidence: 'alta' | 'media'
}

const MONTHS: Record<string, number> = {
  ene: 1, enero: 1, jan: 1, january: 1,
  feb: 2, febrero: 2, february: 2,
  mar: 3, marzo: 3, march: 3,
  abr: 4, abril: 4, apr: 4, april: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6, june: 6,
  jul: 7, julio: 7, july: 7,
  ago: 8, agosto: 8, aug: 8, august: 8,
  sep: 9, sept: 9, septiembre: 9, september: 9,
  oct: 10, octubre: 10, october: 10,
  nov: 11, noviembre: 11, november: 11,
  dic: 12, diciembre: 12, dec: 12, december: 12,
}

function normalizeYear(y: number): number {
  if (y < 100) return y < 70 ? 2000 + y : 1900 + y
  return y
}

function safeISO(year: number, month: number, day: number): string | undefined {
  if (month < 1 || month > 12) return undefined
  if (day < 1 || day > 31) return undefined
  const date = new Date(year, month - 1, day)
  if (date.getMonth() !== month - 1) return undefined
  return toISO(date)
}

/**
 * Scans OCR text for date-like patterns commonly printed on food packaging
 * (dd/mm/yyyy, dd-mm-yy, yyyy-mm-dd, "12 MAY 2025"...). Returns unique ISO
 * candidates, most-explicit format first.
 */
export function extractDateCandidates(text: string): DateCandidate[] {
  const results: DateCandidate[] = []
  const seen = new Set<string>()

  const add = (iso: string | undefined, raw: string, confidence: DateCandidate['confidence']) => {
    if (!iso || seen.has(iso)) return
    seen.add(iso)
    results.push({ iso, raw, confidence })
  }

  // yyyy-mm-dd or yyyy/mm/dd
  for (const m of text.matchAll(/\b(20\d{2})[./-](\d{1,2})[./-](\d{1,2})\b/g)) {
    add(safeISO(Number(m[1]), Number(m[2]), Number(m[3])), m[0], 'alta')
  }

  // dd-mm-yyyy or dd/mm/yyyy (explicit 4-digit year)
  for (const m of text.matchAll(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/g)) {
    add(safeISO(Number(m[3]), Number(m[2]), Number(m[1])), m[0], 'alta')
  }

  // dd-mm-yy or dd/mm/yy (2-digit year)
  for (const m of text.matchAll(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/g)) {
    add(safeISO(normalizeYear(Number(m[3])), Number(m[2]), Number(m[1])), m[0], 'media')
  }

  // "12 MAY 2025" / "12 de mayo de 2025" / "12 may 25"
  const monthNames = Object.keys(MONTHS).join('|')
  const textDateRe = new RegExp(`\\b(\\d{1,2})\\s*(?:de)?\\s*(${monthNames})\\.?\\s*(?:de)?\\s*(\\d{2,4})\\b`, 'gi')
  for (const m of text.matchAll(textDateRe)) {
    const month = MONTHS[m[2].toLowerCase()]
    const year = normalizeYear(Number(m[3]))
    add(safeISO(year, month, Number(m[1])), m[0], 'alta')
  }

  return results
}

let workerPromise: ReturnType<typeof createWorker> | null = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('spa')
  }
  return workerPromise
}

export interface ScanResult {
  text: string
  candidates: DateCandidate[]
}

/** Runs OCR on an image (File, Blob or data URL) and extracts date candidates. */
export async function scanExpirationDate(image: File | Blob | string): Promise<ScanResult> {
  const worker = await getWorker()
  const { data } = await worker.recognize(image)
  return { text: data.text, candidates: extractDateCandidates(data.text) }
}

/** Frees the underlying Tesseract worker; call when leaving the scan screen. */
export async function terminateOcrWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise
    await worker.terminate()
    workerPromise = null
  }
}
