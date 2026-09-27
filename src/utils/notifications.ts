import type { PantryItem } from '../types'
import { daysUntil, getEffectiveExpirationISO } from './dateUtils'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

const LAST_CHECK_KEY = 'zw-last-notification-check'

/**
 * Shows one local notification summarizing items that need attention, at most
 * once per day per browser (there's no server, so this runs opportunistically
 * whenever the app is opened/foregrounded).
 */
export function maybeNotifyExpiringItems(items: PantryItem[], reminderDaysAhead: number): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return

  const today = new Date().toDateString()
  if (localStorage.getItem(LAST_CHECK_KEY) === today) return

  const urgent = items.filter((item) => {
    const iso = getEffectiveExpirationISO(item)
    const days = daysUntil(iso)
    return days !== undefined && days <= reminderDaysAhead
  })

  if (urgent.length === 0) {
    localStorage.setItem(LAST_CHECK_KEY, today)
    return
  }

  const title = urgent.length === 1 ? '1 alimento necesita atención' : `${urgent.length} alimentos necesitan atención`
  const body =
    urgent
      .slice(0, 3)
      .map((i) => i.name)
      .join(', ') + (urgent.length > 3 ? ` y ${urgent.length - 3} más…` : '')

  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      tag: 'zero-waste-expiring',
    })
    localStorage.setItem(LAST_CHECK_KEY, today)
  } catch {
    // Some browsers (e.g. iOS Safari outside installed PWA) may throw; ignore.
  }
}
