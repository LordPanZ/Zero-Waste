import { useLiveQuery } from 'dexie-react-hooks'
import { BellRing, Download, Pencil, Plus, RotateCcw, Smartphone, Trash2, Upload, Users } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'
import { PageHeader } from '../components/Layout'
import { STORAGE_LABELS } from '../data/foodCatalog'
import { createProfile, db, deleteProfile, getSettingsRow, nextDefaultProfileEmoji, renameProfile, switchProfile, updateSettings } from '../db'
import { useActiveProfile, useProfiles } from '../hooks/useProfiles'
import { usePwaInstall } from '../hooks/usePwaInstall'
import type { Profile, StorageLocation } from '../types'
import { notificationsSupported, requestNotificationPermission } from '../utils/notifications'

export function Settings() {
  const settings = useLiveQuery(() => getSettingsRow(), [])
  const { canInstall, installed, promptInstall } = usePwaInstall()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const profiles = useProfiles()
  const activeProfile = useActiveProfile()

  if (!settings || !activeProfile) return null

  async function toggleNotifications() {
    if (!settings) return
    if (!settings.notificationsEnabled) {
      const permission = await requestNotificationPermission()
      await updateSettings({ notificationsEnabled: permission === 'granted' })
    } else {
      await updateSettings({ notificationsEnabled: false })
    }
  }

  async function handleExport() {
    const [pantryItems, wasteLog] = await Promise.all([
      db.pantryItems.where('profileId').equals(activeProfile!.id!).toArray(),
      db.wasteLog.where('profileId').equals(activeProfile!.id!).toArray(),
    ])
    const blob = new Blob([JSON.stringify({ pantryItems, wasteLog, exportedAt: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zero-waste-backup-${activeProfile!.name}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const profileId = activeProfile!.id!
      if (Array.isArray(data.pantryItems)) {
        for (const item of data.pantryItems) {
          const { id: _id, ...rest } = item
          await db.pantryItems.add({ ...rest, profileId })
        }
      }
      if (Array.isArray(data.wasteLog)) {
        for (const entry of data.wasteLog) {
          const { id: _id, ...rest } = entry
          await db.wasteLog.add({ ...rest, profileId })
        }
      }
      setImportMessage(`Datos importados en el perfil "${activeProfile!.name}".`)
    } catch {
      setImportMessage('No se pudo leer el archivo. Asegúrate de que es una copia de Zero Waste.')
    }
  }

  async function handleReset() {
    if (!confirm(`Esto borrará la despensa y el historial del perfil "${activeProfile!.name}". ¿Seguro que quieres continuar?`))
      return
    await db.pantryItems.where('profileId').equals(activeProfile!.id!).delete()
    await db.wasteLog.where('profileId').equals(activeProfile!.id!).delete()
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Ajustes" />

      <div className="flex flex-col gap-4 px-4">
        <ProfilesCard profiles={profiles} activeProfile={activeProfile} />

        {!installed && (
          <SettingsCard icon={<Smartphone size={18} />} title="Instalar la app">
            <p className="text-sm text-stone-500">
              Instala Zero Waste en tu pantalla de inicio para acceder más rápido, incluso sin conexión.
            </p>
            {canInstall ? (
              <button onClick={promptInstall} className="mt-2 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white">
                Instalar ahora
              </button>
            ) : (
              <p className="mt-1 text-xs text-stone-400">
                Usa el menú del navegador → "Añadir a pantalla de inicio" si la opción no aparece aquí.
              </p>
            )}
          </SettingsCard>
        )}

        <SettingsCard icon={<BellRing size={18} />} title="Recordatorios">
          {!notificationsSupported() ? (
            <p className="text-sm text-stone-500">Tu navegador no admite notificaciones.</p>
          ) : (
            <>
              <label className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Avisarme de alimentos por caducar</span>
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={toggleNotifications}
                  className="h-5 w-9 shrink-0 appearance-none rounded-full bg-stone-200 transition checked:bg-brand-600 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4"
                />
              </label>
              {settings.notificationsEnabled && (
                <div className="mt-3">
                  <label className="mb-1 block text-sm text-stone-600">
                    Avisar con {settings.reminderDaysAhead} día{settings.reminderDaysAhead === 1 ? '' : 's'} de antelación
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={7}
                    value={settings.reminderDaysAhead}
                    onChange={(e) => updateSettings({ reminderDaysAhead: Number(e.target.value) })}
                    className="w-full accent-brand-600"
                  />
                </div>
              )}
            </>
          )}
        </SettingsCard>

        <SettingsCard icon="📍" title="Preferencias">
          <label className="block">
            <span className="mb-1 block text-sm text-stone-600">Ubicación por defecto al añadir alimentos</span>
            <select
              value={settings.defaultStorage}
              onChange={(e) => updateSettings({ defaultStorage: e.target.value as StorageLocation })}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              {(Object.keys(STORAGE_LABELS) as StorageLocation[]).map((s) => (
                <option key={s} value={s}>
                  {STORAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </SettingsCard>

        <SettingsCard icon={<Download size={18} />} title="Tus datos">
          <p className="text-sm text-stone-500">Todo se guarda solo en este dispositivo. Haz una copia para no perderla.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={handleExport} className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 py-2.5 text-sm font-medium text-stone-700">
              <Download size={15} /> Exportar
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 py-2.5 text-sm font-medium text-stone-700"
            >
              <Upload size={15} /> Importar
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImportFile(file)
              e.target.value = ''
            }}
          />
          {importMessage && <p className="mt-2 text-xs text-stone-500">{importMessage}</p>}

          <button
            onClick={handleReset}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600"
          >
            <RotateCcw size={15} /> Borrar todos los datos
          </button>
        </SettingsCard>

        <p className="pb-4 text-center text-xs text-stone-300">Zero Waste · hecho para no desperdiciar comida 🌱</p>
      </div>
    </div>
  )
}

function ProfilesCard({ profiles, activeProfile }: { profiles: Profile[]; activeProfile: Profile }) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  async function saveRename() {
    if (editingId && editingName.trim()) {
      await renameProfile(editingId, editingName)
    }
    setEditingId(null)
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const id = await createProfile(newName, nextDefaultProfileEmoji(profiles))
    await switchProfile(id)
    setNewName('')
    setCreating(false)
  }

  async function handleDelete(profile: Profile) {
    if (profiles.length <= 1) return
    if (!confirm(`Se eliminará el perfil "${profile.name}" y toda su despensa e historial. ¿Continuar?`)) return
    await deleteProfile(profile.id!)
  }

  return (
    <SettingsCard icon={<Users size={18} />} title="Perfiles">
      <p className="mb-2 text-sm text-stone-500">Cada perfil tiene su propia despensa y estadísticas.</p>
      <div className="flex flex-col gap-1.5">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-xl bg-stone-50 px-2.5 py-2">
            <span className="text-base leading-none">{p.emoji}</span>
            {editingId === p.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                onBlur={saveRename}
                className="min-w-0 flex-1 rounded-lg border border-brand-300 bg-white px-2 py-1 text-sm outline-none"
              />
            ) : (
              <button
                onClick={() => switchProfile(p.id!)}
                className={`flex-1 truncate text-left text-sm ${p.id === activeProfile.id ? 'font-semibold text-brand-700' : 'text-stone-700'}`}
              >
                {p.name}
                {p.id === activeProfile.id && ' (activo)'}
              </button>
            )}
            <button
              onClick={() => {
                setEditingId(p.id!)
                setEditingName(p.name)
              }}
              className="shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-stone-200"
              aria-label={`Renombrar ${p.name}`}
            >
              <Pencil size={14} />
            </button>
            {profiles.length > 1 && (
              <button
                onClick={() => handleDelete(p)}
                className="shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Eliminar ${p.name}`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {creating ? (
        <div className="mt-2 flex items-center gap-1.5">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Nombre del perfil"
            className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
          />
          <button onClick={handleCreate} className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
            Crear
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-100 py-2 text-sm font-medium text-stone-700"
        >
          <Plus size={15} /> Añadir perfil
        </button>
      )}
    </SettingsCard>
  )
}

function SettingsCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-100 p-4">
      <div className="mb-2 flex items-center gap-2 text-stone-800">
        <span className="text-brand-600">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}
