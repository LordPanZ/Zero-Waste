import { Check, ChevronDown, Plus } from 'lucide-react'
import { useState } from 'react'
import { createProfile, nextDefaultProfileEmoji, switchProfile } from '../db'
import { useActiveProfile, useProfiles } from '../hooks/useProfiles'

export function ProfileSwitcher() {
  const profiles = useProfiles()
  const active = useActiveProfile()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  if (!active) return null

  async function handleCreate() {
    if (!newName.trim()) return
    const id = await createProfile(newName, nextDefaultProfileEmoji(profiles))
    await switchProfile(id)
    setNewName('')
    setCreating(false)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full bg-stone-100 py-1.5 pl-2 pr-2.5 text-sm font-medium text-stone-700"
      >
        <span className="text-base leading-none">{active.emoji}</span>
        {active.name}
        <ChevronDown size={14} className="text-stone-400" />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => {
              setOpen(false)
              setCreating(false)
            }}
            aria-label="Cerrar"
          />
          <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-lg">
            <p className="px-3 pt-3 pb-1 text-xs font-medium text-stone-400">Perfiles</p>
            {profiles.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={async () => {
                  await switchProfile(p.id!)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50"
              >
                <span className="text-base leading-none">{p.emoji}</span>
                <span className="flex-1 truncate">{p.name}</span>
                {p.id === active.id && <Check size={14} className="text-brand-600" />}
              </button>
            ))}

            <div className="border-t border-stone-100 p-2">
              {creating ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="Nombre"
                    className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={handleCreate}
                    className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                  >
                    Crear
                  </button>
                </div>
              ) : (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-sm text-brand-700 hover:bg-brand-50"
                >
                  <Plus size={16} /> Nuevo perfil
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
