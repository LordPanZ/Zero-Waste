import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, CheckCircle2, Pencil, ScanLine, Trash2, XCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { db, getNutritionByName } from '../db'
import { CATEGORY_ICONS, CATEGORY_LABELS, STORAGE_LABELS } from '../data/foodCatalog'
import {
  daysUntil,
  formatDateHuman,
  formatDaysLabel,
  getEffectiveExpirationISO,
  getItemStatus,
} from '../utils/dateUtils'
import { formatNutritionValue, NUTRITION_FIELDS } from '../utils/nutrition'

export function ItemDetail() {
  const { id } = useParams()
  const itemId = Number(id)
  const navigate = useNavigate()
  const item = useLiveQuery(() => db.pantryItems.get(itemId), [itemId])
  const nutrition = useLiveQuery(() => (item ? getNutritionByName(item.name) : undefined), [item?.name])

  if (item === undefined) return null
  if (item === null || !item) {
    return (
      <div className="p-4 text-center text-sm text-stone-500">
        Este alimento ya no existe. <Link to="/despensa" className="text-brand-700">Volver a la despensa</Link>
      </div>
    )
  }

  const status = getItemStatus(item)
  const iso = getEffectiveExpirationISO(item)
  const days = daysUntil(iso)

  async function logOutcome(outcome: 'consumido' | 'desperdiciado') {
    if (!item) return
    const daysHeld = Math.round((Date.now() - new Date(item.addedDate).getTime()) / (24 * 60 * 60 * 1000))
    await db.wasteLog.add({
      itemName: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      outcome,
      loggedAt: Date.now(),
      daysHeld: Number.isFinite(daysHeld) ? daysHeld : undefined,
    })
    await db.pantryItems.delete(itemId)
    navigate('/despensa')
  }

  async function handleDelete() {
    await db.pantryItems.delete(itemId)
    navigate('/despensa')
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex items-center justify-between px-4 pt-5">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Link to={`/despensa/${itemId}/editar`} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Editar">
            <Pencil size={18} />
          </Link>
          <button onClick={handleDelete} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Eliminar">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-4xl">
          {CATEGORY_ICONS[item.category]}
        </div>
        <h1 className="text-xl font-semibold text-stone-900">{item.name}</h1>
        <StatusBadge status={status} />
      </div>

      <div className="mx-4 grid grid-cols-2 gap-2 rounded-2xl bg-stone-50 p-3 text-sm">
        <InfoRow label="Categoría" value={CATEGORY_LABELS[item.category]} />
        <InfoRow label="Ubicación" value={STORAGE_LABELS[item.storage]} />
        <InfoRow label="Cantidad" value={`${item.quantity} ${item.unit}`} />
        <InfoRow label="Entrada" value={formatDateHuman(item.addedDate)} />
        <InfoRow
          label={item.trackingMode === 'fecha' ? 'Caducidad' : 'Caducidad estimada'}
          value={formatDateHuman(iso)}
        />
        <InfoRow label="Quedan" value={formatDaysLabel(days)} />
      </div>

      {item.fromOcr && (
        <div className="mx-4 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <ScanLine size={14} /> Fecha detectada automáticamente por foto
        </div>
      )}

      {item.notes && (
        <div className="mx-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{item.notes}</div>
      )}

      {nutrition && (
        <div className="mx-4 rounded-2xl border border-stone-100 p-3">
          <p className="mb-2 text-sm font-semibold text-stone-800">Información nutricional (por 100 g)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {NUTRITION_FIELDS.filter((f) => nutrition[f.key] !== undefined).map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-2">
                <span className="text-stone-500">{f.label}</span>
                <span className="font-medium text-stone-800">
                  {formatNutritionValue(nutrition[f.key]!)} {f.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-4 flex flex-col gap-2 pt-2">
        <p className="text-sm font-medium text-stone-700">¿Qué ha pasado con este alimento?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => logOutcome('consumido')}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white"
          >
            <CheckCircle2 size={16} /> Lo consumí
          </button>
          <button
            onClick={() => logOutcome('desperdiciado')}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-200 py-3 text-sm font-semibold text-stone-700"
          >
            <XCircle size={16} /> Se desperdició
          </button>
        </div>
        <p className="text-center text-xs text-stone-400">
          Registrar el resultado nos ayuda a mostrarte tus estadísticas de ahorro
        </p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-stone-400">{label}</p>
      <p className="font-medium text-stone-800">{value}</p>
    </div>
  )
}
