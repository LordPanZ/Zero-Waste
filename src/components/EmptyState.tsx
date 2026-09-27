import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-200 px-6 py-10 text-center">
      <div className="text-4xl">{icon}</div>
      <div>
        <p className="font-medium text-stone-800">{title}</p>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
      {action}
    </div>
  )
}
