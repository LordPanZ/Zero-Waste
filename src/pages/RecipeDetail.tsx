import { ArrowLeft, Clock, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RECIPES } from '../data/recipes'
import { useSortedPantryItems } from '../hooks/usePantry'
import { getItemStatus } from '../utils/dateUtils'

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
    </div>
  )
}
