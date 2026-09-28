import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Calculator, Clock, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import { RECIPES } from '../data/recipes'
import { useSortedPantryItems } from '../hooks/usePantry'
import type { NutritionFacts, Recipe } from '../types'
import { getItemStatus } from '../utils/dateUtils'
import { findNutritionMatch, formatNutritionValue, NUTRITION_FIELDS, sumNutrition } from '../utils/nutrition'

export function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const recipe = RECIPES.find((r) => r.id === id)
  const items = useSortedPantryItems()

  const inPantry = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const ingredient of recipe?.ingredients ?? []) {
      const ing = ingredient.toLowerCase()
      const match = items.find((i) => i.name.toLowerCase().includes(ing) || ing.includes(i.name.toLowerCase()))
      map.set(ingredient, !!match && ['caducado', 'urgente', 'proximo'].includes(getItemStatus(match)))
    }
    return map
  }, [recipe, items])

  if (!recipe) {
    return <div className="p-4 text-sm text-stone-500">Receta no encontrada.</div>
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex items-center gap-2 px-4 pt-5">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-stone-900">{recipe.name}</h1>
      </div>

      <div className="px-4">
        <p className="text-sm text-stone-500">{recipe.description}</p>
        <div className="mt-3 flex items-center gap-4 text-sm text-stone-500">
          <span className="flex items-center gap-1.5">
            <Clock size={15} /> {recipe.minutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={15} /> {recipe.servings} raciones
          </span>
        </div>
      </div>

      <div className="px-4">
        <h2 className="mb-2 text-sm font-semibold text-stone-800">Ingredientes</h2>
        <ul className="flex flex-col gap-1.5">
          {recipe.ingredients.map((ing) => (
            <li key={ing} className="flex items-center gap-2 text-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  inPantry.get(ing) ? 'bg-orange-500' : items.some((i) => i.name.toLowerCase().includes(ing.toLowerCase())) ? 'bg-emerald-500' : 'bg-stone-300'
                }`}
              />
              {ing}
              {inPantry.get(ing) && <span className="text-xs text-orange-600">(a punto de caducar)</span>}
            </li>
          ))}
          {recipe.optionalIngredients?.map((ing) => (
            <li key={ing} className="flex items-center gap-2 text-sm text-stone-400">
              <span className="h-2 w-2 rounded-full bg-stone-200" />
              {ing} <span className="text-xs">(opcional)</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4">
        <h2 className="mb-2 text-sm font-semibold text-stone-800">Preparación</h2>
        <ol className="flex flex-col gap-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-stone-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <NutritionCalculator recipe={recipe} />
    </div>
  )
}

function NutritionCalculator({ recipe }: { recipe: Recipe }) {
  const catalog = useLiveQuery(() => db.nutritionFacts.toArray(), []) ?? []
  const ingredients = useMemo(
    () => [...recipe.ingredients, ...(recipe.optionalIngredients ?? [])],
    [recipe],
  )
  const [grams, setGrams] = useState<Record<string, number>>({})

  const rows = useMemo(
    () => ingredients.map((name) => ({ name, facts: findNutritionMatch(name, catalog) })),
    [ingredients, catalog],
  )
  const matchedCount = rows.filter((r) => r.facts).length

  const totals = useMemo(
    () =>
      sumNutrition(
        rows
          .filter((r): r is { name: string; facts: NutritionFacts } => !!r.facts)
          .map((r) => ({ facts: r.facts, grams: grams[r.name] ?? 0 })),
      ),
    [rows, grams],
  )
  const hasTotals = Object.keys(totals).length > 0

  if (matchedCount === 0) return null

  return (
    <div className="mx-4 rounded-2xl border border-stone-100 p-3">
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-stone-800">
        <Calculator size={15} /> Calculadora nutricional
      </h2>
      <p className="mb-3 text-xs text-stone-500">
        Indica cuántos gramos vas a usar de cada ingrediente con datos guardados y suma los valores de la receta.
      </p>

      <div className="flex flex-col gap-2">
        {rows
          .filter((r) => r.facts)
          .map((r) => (
            <div key={r.name} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-stone-700">{r.name}</span>
              <input
                type="number"
                min={0}
                step="any"
                value={grams[r.name] ?? ''}
                onChange={(e) => setGrams((prev) => ({ ...prev, [r.name]: Number(e.target.value) }))}
                placeholder="g"
                className="w-20 rounded-lg border border-stone-200 px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500"
              />
              <span className="w-3 text-xs text-stone-400">g</span>
            </div>
          ))}
      </div>

      {matchedCount < rows.length && (
        <p className="mt-2 text-xs text-stone-400">
          {rows.length - matchedCount} ingrediente{rows.length - matchedCount === 1 ? '' : 's'} sin datos nutricionales
          guardados — escanea su etiqueta al añadirlo a la despensa para incluirlo aquí.
        </p>
      )}

      {hasTotals && (
        <div className="mt-3 border-t border-stone-100 pt-3">
          <p className="mb-1.5 text-xs font-semibold text-stone-500">Total del plato</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {NUTRITION_FIELDS.filter((f) => totals[f.key] !== undefined).map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-2">
                <span className="text-stone-500">{f.label}</span>
                <span className="font-medium text-stone-800">
                  {formatNutritionValue(totals[f.key]!)} {f.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
