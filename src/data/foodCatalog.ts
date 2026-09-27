import type { FoodCategory, StorageLocation } from '../types'

export interface FoodCatalogEntry {
  name: string
  category: FoodCategory
  icon: string
  defaultStorage: StorageLocation
  /** Estimated days it keeps well in each storage location, when it makes sense there. */
  shelfLifeDays: Partial<Record<StorageLocation, number>>
}

/**
 * Approximate shelf-life estimates for fresh foods that rarely carry a printed
 * expiration date (produce, eggs, bread...). Values are practical averages
 * (USDA FoodKeeper / typical home-storage guidance), not food-safety guarantees.
 */
export const FOOD_CATALOG: FoodCatalogEntry[] = [
  // --- Verduras y hortalizas ---
  { name: 'Ajo', category: 'verdura', icon: '🧄', defaultStorage: 'despensa', shelfLifeDays: { despensa: 120, nevera: 150 } },
  { name: 'Cebolla', category: 'verdura', icon: '🧅', defaultStorage: 'despensa', shelfLifeDays: { despensa: 30, nevera: 60 } },
  { name: 'Patata', category: 'verdura', icon: '🥔', defaultStorage: 'despensa', shelfLifeDays: { despensa: 30, nevera: 60 } },
  { name: 'Zanahoria', category: 'verdura', icon: '🥕', defaultStorage: 'nevera', shelfLifeDays: { nevera: 21, despensa: 7 } },
  { name: 'Calabacín', category: 'verdura', icon: '🥒', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7, despensa: 3 } },
  { name: 'Pepino', category: 'verdura', icon: '🥒', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7, despensa: 3 } },
  { name: 'Tomate', category: 'verdura', icon: '🍅', defaultStorage: 'despensa', shelfLifeDays: { despensa: 5, nevera: 10 } },
  { name: 'Pimiento', category: 'verdura', icon: '🫑', defaultStorage: 'nevera', shelfLifeDays: { nevera: 12, despensa: 5 } },
  { name: 'Lechuga', category: 'verdura', icon: '🥬', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7 } },
  { name: 'Espinaca', category: 'verdura', icon: '🥬', defaultStorage: 'nevera', shelfLifeDays: { nevera: 5 } },
  { name: 'Brócoli', category: 'verdura', icon: '🥦', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7 } },
  { name: 'Coliflor', category: 'verdura', icon: '🥦', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7 } },
  { name: 'Champiñón', category: 'verdura', icon: '🍄', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7 } },
  { name: 'Berenjena', category: 'verdura', icon: '🍆', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7, despensa: 4 } },
  { name: 'Apio', category: 'verdura', icon: '🥬', defaultStorage: 'nevera', shelfLifeDays: { nevera: 14 } },
  { name: 'Puerro', category: 'verdura', icon: '🥬', defaultStorage: 'nevera', shelfLifeDays: { nevera: 14 } },
  { name: 'Calabaza', category: 'verdura', icon: '🎃', defaultStorage: 'despensa', shelfLifeDays: { despensa: 60, nevera: 90 } },
  { name: 'Jengibre', category: 'verdura', icon: '🫚', defaultStorage: 'nevera', shelfLifeDays: { nevera: 21, despensa: 7 } },
  { name: 'Boniato', category: 'verdura', icon: '🍠', defaultStorage: 'despensa', shelfLifeDays: { despensa: 35 } },

  // --- Frutas ---
  { name: 'Manzana', category: 'fruta', icon: '🍎', defaultStorage: 'nevera', shelfLifeDays: { nevera: 28, despensa: 7 } },
  { name: 'Plátano', category: 'fruta', icon: '🍌', defaultStorage: 'despensa', shelfLifeDays: { despensa: 5, nevera: 8 } },
  { name: 'Naranja', category: 'fruta', icon: '🍊', defaultStorage: 'despensa', shelfLifeDays: { despensa: 14, nevera: 28 } },
  { name: 'Limón', category: 'fruta', icon: '🍋', defaultStorage: 'nevera', shelfLifeDays: { nevera: 28, despensa: 10 } },
  { name: 'Aguacate', category: 'fruta', icon: '🥑', defaultStorage: 'despensa', shelfLifeDays: { despensa: 5, nevera: 3 } },
  { name: 'Pera', category: 'fruta', icon: '🍐', defaultStorage: 'nevera', shelfLifeDays: { nevera: 14, despensa: 5 } },
  { name: 'Uva', category: 'fruta', icon: '🍇', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7 } },
  { name: 'Fresa', category: 'fruta', icon: '🍓', defaultStorage: 'nevera', shelfLifeDays: { nevera: 5 } },
  { name: 'Melón', category: 'fruta', icon: '🍈', defaultStorage: 'despensa', shelfLifeDays: { despensa: 5, nevera: 7 } },
  { name: 'Sandía', category: 'fruta', icon: '🍉', defaultStorage: 'despensa', shelfLifeDays: { despensa: 7, nevera: 10 } },
  { name: 'Kiwi', category: 'fruta', icon: '🥝', defaultStorage: 'nevera', shelfLifeDays: { nevera: 21, despensa: 7 } },
  { name: 'Melocotón', category: 'fruta', icon: '🍑', defaultStorage: 'despensa', shelfLifeDays: { despensa: 4, nevera: 7 } },

  // --- Panadería ---
  { name: 'Pan', category: 'panaderia', icon: '🍞', defaultStorage: 'despensa', shelfLifeDays: { despensa: 4, congelador: 90 } },
  { name: 'Pan de molde', category: 'panaderia', icon: '🍞', defaultStorage: 'despensa', shelfLifeDays: { despensa: 7, congelador: 90 } },

  // --- Lácteos y huevos ---
  { name: 'Huevos', category: 'lacteo', icon: '🥚', defaultStorage: 'nevera', shelfLifeDays: { nevera: 28 } },
  { name: 'Leche abierta', category: 'lacteo', icon: '🥛', defaultStorage: 'nevera', shelfLifeDays: { nevera: 5 } },
  { name: 'Queso curado', category: 'lacteo', icon: '🧀', defaultStorage: 'nevera', shelfLifeDays: { nevera: 30 } },
  { name: 'Queso fresco', category: 'lacteo', icon: '🧀', defaultStorage: 'nevera', shelfLifeDays: { nevera: 7 } },
  { name: 'Yogur', category: 'lacteo', icon: '🥣', defaultStorage: 'nevera', shelfLifeDays: { nevera: 10 } },
  { name: 'Mantequilla', category: 'lacteo', icon: '🧈', defaultStorage: 'nevera', shelfLifeDays: { nevera: 60 } },

  // --- Carne y pescado (siempre con vigilancia estrecha) ---
  { name: 'Pollo crudo', category: 'carne', icon: '🍗', defaultStorage: 'nevera', shelfLifeDays: { nevera: 2, congelador: 270 } },
  { name: 'Carne picada', category: 'carne', icon: '🥩', defaultStorage: 'nevera', shelfLifeDays: { nevera: 2, congelador: 120 } },
  { name: 'Filetes de ternera', category: 'carne', icon: '🥩', defaultStorage: 'nevera', shelfLifeDays: { nevera: 3, congelador: 270 } },
  { name: 'Pescado fresco', category: 'pescado', icon: '🐟', defaultStorage: 'nevera', shelfLifeDays: { nevera: 2, congelador: 180 } },
  { name: 'Marisco fresco', category: 'pescado', icon: '🦐', defaultStorage: 'nevera', shelfLifeDays: { nevera: 2, congelador: 90 } },

  // --- Despensa seca ---
  { name: 'Arroz', category: 'despensa', icon: '🍚', defaultStorage: 'despensa', shelfLifeDays: { despensa: 730 } },
  { name: 'Pasta', category: 'despensa', icon: '🍝', defaultStorage: 'despensa', shelfLifeDays: { despensa: 730 } },
  { name: 'Legumbres secas', category: 'despensa', icon: '🫘', defaultStorage: 'despensa', shelfLifeDays: { despensa: 730 } },
]

export function findCatalogEntry(name: string): FoodCatalogEntry | undefined {
  const normalized = name.trim().toLowerCase()
  return FOOD_CATALOG.find((entry) => entry.name.toLowerCase() === normalized)
}

export function searchCatalog(query: string, limit = 8): FoodCatalogEntry[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []
  return FOOD_CATALOG.filter((entry) => entry.name.toLowerCase().includes(normalized)).slice(0, limit)
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  fruta: 'Fruta',
  verdura: 'Verdura / hortaliza',
  lacteo: 'Lácteos y huevos',
  carne: 'Carne',
  pescado: 'Pescado y marisco',
  panaderia: 'Panadería',
  despensa: 'Despensa seca',
  congelado: 'Congelados',
  bebida: 'Bebidas',
  otro: 'Otro',
}

export const CATEGORY_ICONS: Record<FoodCategory, string> = {
  fruta: '🍎',
  verdura: '🥕',
  lacteo: '🥛',
  carne: '🥩',
  pescado: '🐟',
  panaderia: '🍞',
  despensa: '🥫',
  congelado: '🧊',
  bebida: '🥤',
  otro: '🍽️',
}

export const STORAGE_LABELS: Record<StorageLocation, string> = {
  nevera: 'Nevera',
  despensa: 'Despensa',
  congelador: 'Congelador',
}
