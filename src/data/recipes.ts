import type { Recipe } from '../types'
import { foodNamesMatch } from '../utils/matching'

/**
 * Small offline recipe book. Ingredient names are matched loosely (case-insensitive,
 * substring) against pantry item names, so recipes can be suggested without any
 * network call or API key.
 */
export const RECIPES: Recipe[] = [
  {
    id: 'tortilla-patatas',
    name: 'Tortilla de patatas',
    description: 'El clásico de siempre, perfecto para aprovechar patatas y huevos antes de que pasen su punto.',
    ingredients: ['Patata', 'Huevos', 'Cebolla'],
    optionalIngredients: ['Aceite de oliva', 'Sal'],
    minutes: 35,
    servings: 4,
    tags: ['vegetariano', 'económico'],
    steps: [
      'Pela y corta las patatas (y la cebolla, si la usas) en láminas finas.',
      'Fríe a fuego medio-bajo hasta que estén tiernas.',
      'Bate los huevos y mezcla con las patatas escurridas.',
      'Cuaja la tortilla en la sartén por ambos lados.',
    ],
  },
  {
    id: 'sofrito-base',
    name: 'Sofrito base para guisos',
    description: 'Congela en porciones: aprovecha cebolla, ajo, pimiento y tomate que estén a punto de pasarse.',
    ingredients: ['Cebolla', 'Ajo', 'Tomate', 'Pimiento'],
    minutes: 25,
    servings: 6,
    tags: ['congelable', 'base'],
    steps: [
      'Pica finamente la cebolla, el ajo y el pimiento.',
      'Rehoga a fuego lento 15 minutos.',
      'Añade el tomate troceado y cocina 10 minutos más.',
      'Reparte en botes o bolsas y congela lo que no vayas a usar ya.',
    ],
  },
  {
    id: 'crema-verduras',
    name: 'Crema de verduras',
    description: 'Sirve para casi cualquier combinación de verduras que empiecen a ablandarse.',
    ingredients: ['Calabacín', 'Zanahoria', 'Patata', 'Cebolla', 'Puerro', 'Calabaza'],
    minutes: 30,
    servings: 4,
    tags: ['vegetariano', 'sin gluten'],
    steps: [
      'Corta en trozos las verduras que tengas y ponlas en una olla con agua o caldo.',
      'Cuece 20-25 minutos hasta que estén blandas.',
      'Tritura hasta conseguir una crema fina.',
      'Ajusta de sal y un chorrito de aceite de oliva.',
    ],
  },
  {
    id: 'pisto',
    name: 'Pisto de verduras',
    description: 'Ideal para calabacín, berenjena, pimiento y tomate maduros.',
    ingredients: ['Calabacín', 'Berenjena', 'Pimiento', 'Tomate', 'Cebolla'],
    minutes: 40,
    servings: 4,
    tags: ['vegetariano', 'vegano'],
    steps: [
      'Corta todas las verduras en dados.',
      'Sofríe la cebolla y el pimiento, luego añade el calabacín y la berenjena.',
      'Incorpora el tomate y cocina a fuego lento 20 minutos.',
      'Salpimienta al gusto.',
    ],
  },
  {
    id: 'batido-fruta-madura',
    name: 'Batido de fruta madura',
    description: 'La forma más rápida de salvar plátanos, fresas o melocotones muy maduros.',
    ingredients: ['Plátano', 'Fresa', 'Melocotón', 'Leche abierta', 'Yogur'],
    minutes: 5,
    servings: 2,
    tags: ['rápido', 'sin cocción'],
    steps: [
      'Pela y trocea la fruta madura.',
      'Añade leche o yogur al gusto.',
      'Tritura hasta obtener la textura deseada.',
    ],
  },
  {
    id: 'pan-rallado-tostadas',
    name: 'Pan rallado o picatostes',
    description: 'No tires el pan duro: rállalo o hazlo picatostes para sopas y ensaladas.',
    ingredients: ['Pan', 'Pan de molde'],
    minutes: 15,
    servings: 4,
    tags: ['antidesperdicio', 'congelable'],
    steps: [
      'Corta el pan duro en dados o trocéalo grueso.',
      'Tuesta en el horno o sartén con un poco de aceite hasta dorar.',
      'Para pan rallado, tritura el pan ya seco.',
      'Guarda en un bote hermético o congela.',
    ],
  },
  {
    id: 'ensalada-verde',
    name: 'Ensalada fresca',
    description: 'Combina lechuga, espinaca, pepino o zanahoria antes de que pierdan textura.',
    ingredients: ['Lechuga', 'Espinaca', 'Pepino', 'Zanahoria', 'Tomate', 'Aguacate'],
    minutes: 10,
    servings: 2,
    tags: ['rápido', 'sin cocción', 'vegano'],
    steps: [
      'Lava y trocea las hojas verdes.',
      'Añade el resto de verduras en trozos o láminas.',
      'Aliña con aceite, vinagre y sal.',
    ],
  },
  {
    id: 'salteado-arroz',
    name: 'Arroz salteado de nevera',
    description: 'Aprovecha verduras sueltas y un poco de proteína con arroz cocido.',
    ingredients: ['Arroz', 'Zanahoria', 'Pimiento', 'Brócoli', 'Champiñón', 'Pollo crudo', 'Huevos'],
    minutes: 20,
    servings: 3,
    tags: ['rápido', 'antidesperdicio'],
    steps: [
      'Cuece el arroz si no lo tienes ya cocido.',
      'Saltea las verduras troceadas en una sartén bien caliente.',
      'Añade el arroz y, si quieres, huevo batido o pollo cocinado.',
      'Sazona con salsa de soja u otras especias.',
    ],
  },
  {
    id: 'guiso-legumbres',
    name: 'Guiso de legumbres',
    description: 'Perfecto para dar salida a zanahoria, patata, cebolla y legumbres secas.',
    ingredients: ['Legumbres secas', 'Patata', 'Zanahoria', 'Cebolla', 'Ajo'],
    minutes: 60,
    servings: 4,
    tags: ['económico', 'congelable'],
    steps: [
      'Si usas legumbres secas, déjalas en remojo la noche anterior.',
      'Sofríe cebolla, ajo y zanahoria.',
      'Añade las legumbres, la patata y agua o caldo.',
      'Cuece a fuego lento hasta que estén tiernas.',
    ],
  },
  {
    id: 'sopa-miso-champi',
    name: 'Salteado de champiñón y puerro',
    description: 'Una guarnición rápida para champiñones y puerro que empiezan a resecarse.',
    ingredients: ['Champiñón', 'Puerro', 'Ajo'],
    minutes: 15,
    servings: 2,
    tags: ['rápido', 'vegano'],
    steps: [
      'Corta el puerro en rodajas finas y los champiñones en láminas.',
      'Saltea el ajo picado, añade el puerro y luego los champiñones.',
      'Cocina a fuego medio 8-10 minutos.',
    ],
  },
  {
    id: 'compota-manzana',
    name: 'Compota de manzana o pera',
    description: 'Da una segunda vida a manzanas o peras con golpes o demasiado maduras.',
    ingredients: ['Manzana', 'Pera'],
    minutes: 25,
    servings: 4,
    tags: ['postre', 'congelable'],
    steps: [
      'Pela y trocea la fruta, retirando las partes dañadas.',
      'Cocina a fuego lento con un poco de agua y canela.',
      'Tritura o deja en trozos al gusto.',
    ],
  },
  {
    id: 'guacamole',
    name: 'Guacamole exprés',
    description: 'La mejor forma de aprovechar un aguacate que ya está en su punto óptimo.',
    ingredients: ['Aguacate', 'Limón', 'Tomate', 'Cebolla'],
    minutes: 10,
    servings: 2,
    tags: ['rápido', 'sin cocción', 'vegano'],
    steps: [
      'Machaca la pulpa de aguacate con un tenedor.',
      'Añade zumo de limón, tomate y cebolla picados finos.',
      'Sazona con sal al gusto.',
    ],
  },
  {
    id: 'caldo-verduras',
    name: 'Caldo de verduras aprovechado',
    description: 'Usa pieles, tallos y verduras que empiezan a pasarse para un caldo base.',
    ingredients: ['Zanahoria', 'Apio', 'Puerro', 'Cebolla', 'Ajo'],
    minutes: 50,
    servings: 6,
    tags: ['congelable', 'antidesperdicio'],
    steps: [
      'Pon todas las verduras (enteras o en trozos grandes) en una olla con agua.',
      'Lleva a ebullición y cuece a fuego lento 40 minutos.',
      'Cuela y guarda el caldo; congela en porciones si sobra.',
    ],
  },
  {
    id: 'revuelto-nevera',
    name: 'Revuelto de nevera',
    description: 'Combina huevos con cualquier verdura o queso que quede suelto.',
    ingredients: ['Huevos', 'Champiñón', 'Espinaca', 'Queso fresco', 'Pimiento'],
    minutes: 12,
    servings: 2,
    tags: ['rápido', 'antidesperdicio'],
    steps: [
      'Saltea las verduras que tengas disponibles.',
      'Bate los huevos y añádelos a la sartén.',
      'Remueve a fuego medio-bajo hasta cuajar. Añade queso si quieres.',
    ],
  },
  {
    id: 'pescado-horno',
    name: 'Pescado al horno con verduras',
    description: 'Cocina el pescado fresco el mismo día que empiece a acercarse su límite.',
    ingredients: ['Pescado fresco', 'Patata', 'Limón', 'Pimiento'],
    minutes: 35,
    servings: 3,
    tags: ['horno', 'sin gluten'],
    steps: [
      'Precalienta el horno a 190°C.',
      'Coloca las verduras cortadas como base en la bandeja.',
      'Pon el pescado encima, con rodajas de limón y un chorrito de aceite.',
      'Hornea 20-25 minutos.',
    ],
  },
]

/**
 * Score a recipe against a set of pantry item names, weighting matches on
 * near-expiry items much higher so those recipes float to the top.
 */
export function scoreRecipe(
  recipe: Recipe,
  pantryNames: string[],
  urgentNames: Set<string>,
): { score: number; matched: string[]; missing: string[] } {
  const matched: string[] = []
  const missing: string[] = []
  let score = 0

  for (const ingredient of recipe.ingredients) {
    const isInPantry = pantryNames.some((p) => foodNamesMatch(p, ingredient))
    if (isInPantry) {
      matched.push(ingredient)
      const isUrgent = [...urgentNames].some((u) => foodNamesMatch(u, ingredient))
      score += isUrgent ? 10 : 3
    } else {
      missing.push(ingredient)
    }
  }

  return { score, matched, missing }
}
