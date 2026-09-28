/**
 * Shared "is this pantry item the same food as this recipe/nutrition ingredient"
 * matcher. A plain substring check ("tomate" inside "tomate frito") would wrongly
 * treat a processed product as the same food as its fresh counterpart, so this
 * requires every word of the shorter name to appear in the longer one *and*
 * rejects the match if the longer name's extra words describe a transformation
 * (fried, sauce, powdered...) that makes it a genuinely different product.
 */

// Words that turn a food into something different enough to not substitute it
// (different nutrition, different shelf life, different role in a recipe).
const TRANSFORMATION_MODIFIERS = new Set([
  'frito', 'frita', 'fritos', 'fritas',
  'triturado', 'triturada', 'triturados', 'trituradas',
  'salsa', 'pure', 'ketchup', 'catsup',
  'zumo', 'mermelada', 'confitado', 'confitada',
  'seco', 'seca', 'secos', 'secas',
  'deshidratado', 'deshidratada',
  'polvo', 'condensada', 'condensado',
  'evaporada', 'evaporado',
  'conserva', 'enlatado', 'enlatada',
  'ahumado', 'ahumada',
  'curado', 'curada',
  'rallado', 'rallada',
  'frita', 'empanado', 'empanada',
  'encurtido', 'encurtida',
])

function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function words(name: string): string[] {
  return normalize(name)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * True when `a` and `b` should be treated as the same food for matching pantry
 * items against recipe ingredients or nutrition lookups.
 */
export function foodNamesMatch(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return false
  if (na === nb) return true

  const wa = words(a)
  const wb = words(b)
  if (wa.length === 0 || wb.length === 0) return false

  const [shortWords, longWords] = wa.length <= wb.length ? [wa, wb] : [wb, wa]
  if (!shortWords.every((w) => longWords.includes(w))) return false

  const extraWords = longWords.filter((w) => !shortWords.includes(w))
  return extraWords.every((w) => !TRANSFORMATION_MODIFIERS.has(w))
}

export function findFoodMatch<T>(name: string, items: T[], nameOf: (item: T) => string): T | undefined {
  return items.find((item) => foodNamesMatch(nameOf(item), name))
}
