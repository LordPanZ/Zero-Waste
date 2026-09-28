import { Camera, Check, ChevronDown, ClipboardList, Loader2, X } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { db, getNutritionByName, getSettings, upsertNutrition } from '../db'
import { CATEGORY_LABELS, findCatalogEntry, searchCatalog, STORAGE_LABELS } from '../data/foodCatalog'
import type { FoodCategory, PantryItem, StorageLocation, TrackingMode } from '../types'
import { formatDateHuman, todayISO } from '../utils/dateUtils'
import { NUTRITION_FIELDS } from '../utils/nutrition'
import { type DateCandidate, scanExpirationDate } from '../utils/ocr'
import { type ScannedNutrition, scanNutritionLabel } from '../utils/nutritionOcr'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as FoodCategory[]
const STORAGES = Object.keys(STORAGE_LABELS) as StorageLocation[]

export function AddItem() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const editingId = id ? Number(id) : undefined

  const [name, setName] = useState('')
  const [category, setCategory] = useState<FoodCategory>('verdura')
  const [storage, setStorage] = useState<StorageLocation>('nevera')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('ud')
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('fecha')
  const [expirationDate, setExpirationDate] = useState('')
  const [shelfLifeDays, setShelfLifeDays] = useState(7)
  const [addedDate, setAddedDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [fromOcr, setFromOcr] = useState(false)

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'scanning' | 'error' | 'no-match'>('idle')
  const [ocrCandidates, setOcrCandidates] = useState<DateCandidate[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nutritionExpanded, setNutritionExpanded] = useState(searchParams.get('nutricion') === '1')
  const [nutrition, setNutrition] = useState<ScannedNutrition>({})
  const [nutritionFromOcr, setNutritionFromOcr] = useState(false)
  const [nutritionOcrStatus, setNutritionOcrStatus] = useState<'idle' | 'scanning' | 'error' | 'no-match'>('idle')
  const [nutritionPhoto, setNutritionPhoto] = useState<string | undefined>()
  const nutritionFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSettings().then((s) => setStorage(s.defaultStorage))
  }, [])

  useEffect(() => {
    if (!editingId) return
    db.pantryItems.get(editingId).then((item) => {
      if (!item) return
      setName(item.name)
      setCategory(item.category)
      setStorage(item.storage)
      setQuantity(item.quantity)
      setUnit(item.unit)
      setTrackingMode(item.trackingMode)
      setExpirationDate(item.expirationDate ?? '')
      setShelfLifeDays(item.shelfLifeDays ?? 7)
      setAddedDate(item.addedDate)
      setNotes(item.notes ?? '')
      setFromOcr(!!item.fromOcr)
      loadSavedNutrition(item.name)
    })
  }, [editingId])

  async function loadSavedNutrition(forName: string) {
    const saved = await getNutritionByName(forName)
    if (!saved) return
    setNutrition({
      energyKcal: saved.energyKcal,
      fat: saved.fat,
      saturatedFat: saved.saturatedFat,
      carbs: saved.carbs,
      sugars: saved.sugars,
      fiber: saved.fiber,
      protein: saved.protein,
      salt: saved.salt,
    })
    setNutritionExpanded(true)
  }

  function updateNutritionField(key: keyof ScannedNutrition, raw: string) {
    setNutrition((prev) => ({ ...prev, [key]: raw === '' ? undefined : Number(raw) }))
    setNutritionFromOcr(false)
  }

  const suggestions = useMemo(() => (name.length > 0 ? searchCatalog(name) : []), [name])

  function applyCatalogEntry(entryName: string) {
    const entry = findCatalogEntry(entryName)
    setName(entryName)
    setShowSuggestions(false)
    void loadSavedNutrition(entryName)
    if (!entry) return
    setCategory(entry.category)
    setStorage(entry.defaultStorage)
    const days = entry.shelfLifeDays[entry.defaultStorage]
    if (days) {
      setShelfLifeDays(days)
      setTrackingMode('estimado')
    }
  }

  function handleStorageChange(next: StorageLocation) {
    setStorage(next)
    const entry = findCatalogEntry(name)
    const days = entry?.shelfLifeDays[next]
    if (days) setShelfLifeDays(days)
  }

  async function handlePhotoSelected(file: File) {
    setPhotoPreview(URL.createObjectURL(file))
    setOcrStatus('scanning')
    setOcrCandidates([])
    try {
      const result = await scanExpirationDate(file)
      setOcrCandidates(result.candidates)
      if (result.candidates.length > 0) {
        setOcrStatus('idle')
        setExpirationDate(result.candidates[0].iso)
        setTrackingMode('fecha')
        setFromOcr(true)
      } else {
        setOcrStatus('no-match')
      }
    } catch {
      setOcrStatus('error')
    }
  }

  async function handlePhotoSelectedNutrition(file: File) {
    setNutritionPhoto(URL.createObjectURL(file))
    setNutritionOcrStatus('scanning')
    try {
      const result = await scanNutritionLabel(file)
      const found = Object.values(result.values).some((v) => v !== undefined)
      if (found) {
        setNutrition((prev) => ({ ...prev, ...result.values }))
        setNutritionFromOcr(true)
        setNutritionOcrStatus('idle')
      } else {
        setNutritionOcrStatus('no-match')
      }
    } catch {
      setNutritionOcrStatus('error')
    }
  }

  const hasNutritionData = NUTRITION_FIELDS.some((f) => nutrition[f.key] !== undefined)

  async function handleSave() {
    if (!name.trim()) return
    const now = Date.now()
    const payload: PantryItem = {
      name: name.trim(),
      category,
      storage,
      quantity,
      unit,
      trackingMode,
      expirationDate: trackingMode === 'fecha' ? expirationDate || undefined : undefined,
      shelfLifeDays: trackingMode === 'estimado' ? shelfLifeDays : undefined,
      addedDate,
      notes: notes.trim() || undefined,
      fromOcr: trackingMode === 'fecha' ? fromOcr : undefined,
      createdAt: now,
      updatedAt: now,
    }

    if (hasNutritionData) {
      await upsertNutrition({ name: name.trim(), perGrams: 100, ...nutrition, fromOcr: nutritionFromOcr })
    }

    if (editingId) {
      await db.pantryItems.update(editingId, payload)
      navigate(`/despensa/${editingId}`)
    } else {
      const newId = await db.pantryItems.add(payload)
      navigate(`/despensa/${newId}`)
    }
  }

  const canSave = name.trim().length > 0 && (trackingMode === 'estimado' || expirationDate)

  return (
    <div className="flex flex-col gap-5 pb-28">
      <PageHeader title={editingId ? 'Editar alimento' : 'Añadir alimento'} />

      <div className="flex flex-col gap-4 px-4">
        <div>
          <span className="mb-1 block text-sm font-medium text-stone-700">Nombre</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            placeholder="Ej. Tomate, Leche, Pollo…"
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              {suggestions.map((s) => (
                <button
                  key={s.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCatalogEntry(s.name)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50"
                >
                  <span>{s.icon}</span> {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ubicación">
            <select
              value={storage}
              onChange={(e) => handleStorageChange(e.target.value as StorageLocation)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              {STORAGES.map((s) => (
                <option key={s} value={s}>
                  {STORAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad">
            <input
              type="number"
              min={0}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </Field>
          <Field label="Unidad">
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="ud, kg, g, L…"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </Field>
        </div>

        <Field label="Fecha de entrada">
          <input
            type="date"
            value={addedDate}
            onChange={(e) => setAddedDate(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-700">¿Cómo controlamos la caducidad?</p>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              active={trackingMode === 'fecha'}
              label="Tiene fecha impresa"
              onClick={() => setTrackingMode('fecha')}
            />
            <ModeButton
              active={trackingMode === 'estimado'}
              label="Sin fecha (estimar)"
              onClick={() => setTrackingMode('estimado')}
            />
          </div>
        </div>

        {trackingMode === 'fecha' ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-stone-50 p-3">
            <Field label="Fecha de caducidad">
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => {
                  setExpirationDate(e.target.value)
                  setFromOcr(false)
                }}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </Field>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-400 bg-white py-2.5 text-sm font-medium text-brand-700"
            >
              {ocrStatus === 'scanning' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              {ocrStatus === 'scanning' ? 'Leyendo la fecha…' : 'Escanear fecha con la cámara'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handlePhotoSelected(file)
                e.target.value = ''
              }}
            />

            {photoPreview && (
              <div className="flex items-center gap-3">
                <img src={photoPreview} alt="Foto de la etiqueta" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  onClick={() => {
                    setPhotoPreview(undefined)
                    setOcrCandidates([])
                  }}
                  className="text-stone-400"
                  aria-label="Quitar foto"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {ocrStatus === 'error' && (
              <p className="text-xs text-red-600">No se pudo leer la imagen. Prueba con otra foto o introduce la fecha a mano.</p>
            )}

            {ocrStatus === 'no-match' && (
              <p className="text-xs text-amber-700">
                No hemos podido detectar ninguna fecha en la foto. Prueba con otra foto bien enfocada e iluminada, o
                escribe la fecha directamente arriba.
              </p>
            )}

            {ocrCandidates.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-stone-500">Fechas detectadas — toca para usar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ocrCandidates.map((c) => (
                    <button
                      key={c.iso}
                      onClick={() => {
                        setExpirationDate(c.iso)
                        setFromOcr(true)
                      }}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                        expirationDate === c.iso
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      {expirationDate === c.iso && <Check size={12} />}
                      {formatDateHuman(c.iso)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl bg-stone-50 p-3">
            <Field label={`Duración estimada en ${STORAGE_LABELS[storage].toLowerCase()} (días)`}>
              <input
                type="number"
                min={1}
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </Field>
            <p className="text-xs text-stone-500">
              Estimación orientativa{findCatalogEntry(name) ? ` para ${name.toLowerCase()}` : ''}. Puedes ajustarla si lo
              conoces mejor.
            </p>
          </div>
        )}

        <Field label="Notas (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ej. Abierto el lunes, para la receta del viernes…"
            className="w-full resize-none rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </Field>

        <div className="rounded-2xl border border-brand-200 bg-brand-50/40">
          <button
            onClick={() => setNutritionExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <ClipboardList size={16} className="text-brand-600" />
              Información nutricional (opcional){hasNutritionData && ' ✓'}
            </span>
            <ChevronDown size={16} className={`text-stone-400 transition ${nutritionExpanded ? 'rotate-180' : ''}`} />
          </button>

          {nutritionExpanded && (
            <div className="flex flex-col gap-3 border-t border-stone-100 p-3">
              <button
                onClick={() => nutritionFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-400 bg-white py-2.5 text-sm font-medium text-brand-700"
              >
                {nutritionOcrStatus === 'scanning' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                {nutritionOcrStatus === 'scanning' ? 'Leyendo la etiqueta…' : 'Escanear tabla nutricional'}
              </button>
              <input
                ref={nutritionFileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handlePhotoSelectedNutrition(file)
                  e.target.value = ''
                }}
              />

              {nutritionPhoto && (
                <div className="flex items-center gap-3">
                  <img src={nutritionPhoto} alt="Foto de la etiqueta nutricional" className="h-16 w-16 rounded-lg object-cover" />
                  <button onClick={() => setNutritionPhoto(undefined)} className="text-stone-400" aria-label="Quitar foto">
                    <X size={16} />
                  </button>
                </div>
              )}

              {nutritionOcrStatus === 'error' && (
                <p className="text-xs text-red-600">No se pudo leer la imagen. Prueba con otra foto o introduce los valores a mano.</p>
              )}

              {nutritionOcrStatus === 'no-match' && (
                <p className="text-xs text-amber-700">
                  No hemos podido leer ningún valor en la foto. Prueba con otra foto bien enfocada de la tabla
                  nutricional, o escribe los valores directamente abajo.
                </p>
              )}

              <p className="text-xs text-stone-500">Valores por 100 g / 100 ml. Revisa y corrige si algo no se ha leído bien.</p>

              <div className="grid grid-cols-2 gap-3">
                {NUTRITION_FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-1 block text-xs font-medium text-stone-600">
                      {f.label} <span className="text-stone-400">({f.unit})</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={nutrition[f.key] ?? ''}
                      onChange={(e) => updateNutritionField(f.key, e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 mx-auto max-w-[480px] border-t border-stone-100 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          disabled={!canSave}
          onClick={handleSave}
          className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {editingId ? 'Guardar cambios' : 'Añadir a la despensa'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  )
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-200 bg-white text-stone-600'
      }`}
    >
      {label}
    </button>
  )
}
