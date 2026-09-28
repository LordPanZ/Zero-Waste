import { Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { createProfile, deleteProfile, switchProfile, updateProfile } from '../db'
import type { Profile } from '../types'

const EMOJI_OPTIONS = [
  '🙂', '😀', '😎', '🤓', '🧑‍🍳', '👩', '👨', '🧒',
  '👵', '👴', '🐱', '🐶', '🦊', '🐼', '🐰', '🦁',
  '🐸', '🐧', '🌟', '🍎',
]

export function ProfileEditSheet({
  profile,
  canDelete,
  suggestedEmoji,
  onClose,
}: {
  /** null to create a new profile instead of editing an existing one. */
  profile: Profile | null
  canDelete: boolean
  suggestedEmoji: string
  onClose: () => void
}) {
  const [name, setName] = useState(profile?.name ?? '')
  const [emoji, setEmoji] = useState(profile?.emoji ?? suggestedEmoji)
  const isNew = !profile

  async function handleSave() {
    if (!name.trim()) return
    if (isNew) {
      const id = await createProfile(name, emoji)
      await switchProfile(id)
    } else {
      await updateProfile(profile!.id!, { name, emoji })
    }
    onClose()
  }

  async function handleDelete() {
    if (!profile || !canDelete) return
    if (!confirm(`Se eliminará el perfil "${profile.name}" y toda su despensa e historial. ¿Continuar?`)) return
    await deleteProfile(profile.id!)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">{isNew ? 'Nuevo perfil' : 'Editar perfil'}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">{emoji}</span>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-stone-600">Nombre</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Nombre del perfil"
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <div className="mb-5">
          <span className="mb-1.5 block text-sm text-stone-600">Icono</span>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                aria-label={`Elegir icono ${e}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                  emoji === e ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-stone-50'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {!isNew && canDelete && (
            <button
              onClick={handleDelete}
              aria-label="Eliminar perfil"
              className="flex items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-red-600"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
