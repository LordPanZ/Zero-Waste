import { Clock, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/Layout'
import { RECIPES, scoreRecipe } from '../data/recipes'
import { useSortedPantryItems } from '../hooks/usePantry'
import { getItemStatus } from '../utils/dateUtils'

export function Recipes() {
  const items = useSortedPantryItems()

  const ranked = useMemo(() => {
    const pantryNames = items.map((i) => i.name)
    const urgentNames = new Set(
      items.filter((i) => ['caducado', 'urgente', 'proximo'].includes(getItemStatus(i))).map((i) => i.name),
    )
    return RECIPES.map((recipe) => ({ recipe, ...scoreRecipe(recipe, pantryNames, urgentNames) }))
      .filter((r) => r.matched.length > 0)
      .sort((a, b) => b.score - a.score)
  }, [items])

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader title="Recetas" subtitle="Ordenadas para aprovechar lo que está a punto de caducar" />

      <div className="flex flex-col gap-3 px-4">
        {ranked.length === 0 ? (
          <EmptyState
            icon="🍳"
            title="Añade alimentos a tu despensa"
            description="En cuanto tengas alimentos guardados, te sugeriremos recetas para aprovecharlos."
          />
        ) : (
          ranked.map(({ recipe, matched, missing }) => (
            <Link
              key={recipe.id}
              to={`/recetas/${recipe.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-stone-900">{recipe.name}</h3>
                <div className="flex shrink-0 items-center gap-2 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {recipe.minutes}′
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={13} /> {recipe.servings}
                  </span>
                </div>
              </div>
              <p className="text-sm text-stone-500">{recipe.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {matched.map((ing) => (
                  <span key={ing} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                    ✓ {ing}
                  </span>
                ))}
                {missing.slice(0, 3).map((ing) => (
                  <span key={ing} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                    + {ing}
                  </span>
                ))}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
