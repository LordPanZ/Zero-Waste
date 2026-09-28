import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { nextDefaultProfileEmoji, switchProfile } from '../db'
import { useActiveProfile, useProfiles } from '../hooks/useProfiles'
import type { Profile } from '../types'
import { ProfileEditSheet } from './ProfileEditSheet'

export function ProfilesShowcase() {
  const profiles = useProfiles()
  const active = useActiveProfile()
  const [editing, setEditing] = useState<Profile | 'new' | null>(null)

  if (!active) return null

  return (
    <section className="flex flex-col gap-2 px-4">
      <h2 className="font-medium text-stone-800">Perfiles</h2>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {profiles.map((p) => {
          const isActive = p.id === active.id
          return (
            <div key={p.id} className="relative flex shrink-0 flex-col items-center gap-1.5">
              <button
                onClick={() => switchProfile(p.id!)}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl transition ${
                  isActive ? 'bg-brand-600 ring-4 ring-brand-100' : 'bg-stone-100'
                }`}
              >
                {p.emoji}
              </button>
              <button
                onClick={() => setEditing(p)}
                aria-label={`Editar ${p.name}`}
                className="absolute -right-1 -top-1 rounded-full bg-white p-1 text-stone-500 shadow ring-1 ring-stone-200"
              >
                <Pencil size={12} />
              </button>
              <span className={`max-w-[4.5rem] truncate text-xs font-medium ${isActive ? 'text-brand-700' : 'text-stone-500'}`}>
                {p.name}
              </span>
            </div>
          )
        })}

        <button onClick={() => setEditing('new')} className="flex shrink-0 flex-col items-center gap-1.5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-stone-200 text-stone-400">
            <Plus size={22} />
          </span>
          <span className="text-xs font-medium text-stone-400">Nuevo</span>
        </button>
      </div>

      {editing && (
        <ProfileEditSheet
          profile={editing === 'new' ? null : editing}
          canDelete={profiles.length > 1}
          suggestedEmoji={nextDefaultProfileEmoji(profiles)}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
