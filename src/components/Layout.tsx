import { BarChart3, ChefHat, Home, Settings, ShoppingBasket } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ProfileSwitcher } from './ProfileSwitcher'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/despensa', label: 'Despensa', icon: ShoppingBasket, end: false },
  { to: '/recetas', label: 'Recetas', icon: ChefHat, end: false },
  { to: '/estadisticas', label: 'Progreso', icon: BarChart3, end: false },
]

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="font-semibold text-stone-900">Zero Waste</span>
        </div>
        <div className="flex items-center gap-1">
          <ProfileSwitcher />
          <NavLink
            to="/ajustes"
            className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            aria-label="Ajustes"
          >
            <Settings size={20} />
          </NavLink>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[480px] items-stretch border-t border-stone-100 bg-white/95 backdrop-blur">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                isActive ? 'text-brand-700' : 'text-stone-400'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-4 pt-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
