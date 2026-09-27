# 🌱 Zero Waste

App web instalable (PWA) para llevar el control de tu despensa, evitar que
la comida caduque y aprovecharla al máximo antes de tirarla.

## Funcionalidades

- **Despensa inteligente**: guarda alimentos frescos sin fecha de caducidad
  impresa (ajos, cebollas, verduras…) y la app estima cuánto duran según
  dónde los guardes (nevera, despensa o congelador), con un catálogo de más
  de 50 alimentos comunes.
- **Fecha de caducidad por foto**: para alimentos envasados, apunta la fecha
  manualmente o haz una foto de la etiqueta y la app la lee automáticamente
  mediante reconocimiento óptico de caracteres (OCR, 100% en el dispositivo,
  sin enviar la foto a ningún servidor).
- **Recetas anti-desperdicio**: un recetario local sugiere recetas priorizando
  los alimentos que están a punto de caducar.
- **Panel de estado**: distingue de un vistazo lo caducado, lo urgente y lo
  que está en buen estado.
- **Estadísticas y racha**: registra si cada alimento se consumió o se
  desperdició para ver tu porcentaje de aprovechamiento y tu racha de días
  sin desperdicio.
- **Recordatorios**: notificaciones locales opcionales cuando algo está a
  punto de caducar.
- **Copia de seguridad**: exporta/importa tus datos en JSON. Todo se guarda
  localmente en el dispositivo (IndexedDB), sin backend ni cuentas.
- **Instalable y offline**: funciona como app instalable (PWA) en móvil y
  escritorio, con soporte offline.

## Stack técnico

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) para el diseño
- [Dexie.js](https://dexie.org/) (IndexedDB) como almacenamiento local
- [Tesseract.js](https://tesseract.projectnaptha.com/) para el OCR de fechas
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) para el manifest y el
  service worker
- [React Router](https://reactrouter.com/) para la navegación

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (dist/)
npm run preview  # sirve el build de producción
```

Los iconos de la app (`public/icons/`) se generan con
`node scripts/generate-icons.mjs`, sin dependencias externas de imagen.
