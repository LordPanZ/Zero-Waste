import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ensureActiveProfile, getSettings } from './db'
import { usePantryItems } from './hooks/usePantry'
import { AddItem } from './pages/AddItem'
import { Home } from './pages/Home'
import { ItemDetail } from './pages/ItemDetail'
import { Pantry } from './pages/Pantry'
import { RecipeDetail } from './pages/RecipeDetail'
import { Recipes } from './pages/Recipes'
import { Settings } from './pages/Settings'
import { Stats } from './pages/Stats'
import { maybeNotifyExpiringItems } from './utils/notifications'

function App() {
  const items = usePantryItems()

  useEffect(() => {
    void ensureActiveProfile()
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    getSettings().then((settings) => {
      if (settings.notificationsEnabled) {
        maybeNotifyExpiringItems(items, settings.reminderDaysAhead)
      }
    })
  }, [items])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="despensa" element={<Pantry />} />
          <Route path="despensa/nuevo" element={<AddItem />} />
          <Route path="despensa/:id" element={<ItemDetail />} />
          <Route path="despensa/:id/editar" element={<AddItem />} />
          <Route path="recetas" element={<Recipes />} />
          <Route path="recetas/:id" element={<RecipeDetail />} />
          <Route path="estadisticas" element={<Stats />} />
          <Route path="ajustes" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
