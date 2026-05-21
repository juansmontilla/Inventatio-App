# Salvallanta — App móvil

Wrapper Capacitor de la app de inventario. Genera APK Android e IPA iOS desde el HTML+React+Tailwind del prototipo.

## Estado actual

**Lo que funciona hoy (offline, datos en memoria):**
- Todas las pantallas: login, dashboard, consultar, ficha técnica, agregar/editar, vender, admin, usuarios, catálogos, listas
- Profundímetro 3-puntos + diagnóstico de desgaste
- Validación DOT con edad y veredicto
- Autocompletado fuzzy de marcas (Levenshtein)
- Captura de fotos con cámara nativa del teléfono (4 por llanta)
- Etiqueta con código de barras Code 128 escaneable

**Lo que es mock y NO funciona aún:**
- Persistencia: todo se pierde al cerrar la app
- Login: passwords en plaintext, sin servidor
- Impresora Bluetooth: el escaneo y envío están simulados con setTimeout
- Subida de fotos a Drive

## Probar ahora mismo (sin compilar nada)

```bash
cd mobile
npm run build:web
```

Eso genera `mobile/preview.html` — abrílo con doble-click. Funciona desde file://.

> Si modificás los .jsx en la raíz, corré `npm run build:web` de nuevo para actualizar el preview.

## Compilar APK para Android

### Requisitos
- Node.js 18+
- Android Studio + JDK 17

### Pasos
```bash
cd mobile
npm install                  # solo la primera vez
npm run sync:web             # copia los .jsx más recientes
npm run cap:add:android      # solo la primera vez — crea carpeta android/
npm run cap:sync             # sincroniza cambios
npm run cap:open:android     # abre Android Studio
```

En Android Studio: **Run ▶** para probar en emulador/teléfono USB, o **Build → Build APK(s)** para generar `.apk` instalable.

El APK queda en: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### Permisos que pide la app
- **Cámara** — para fotos de llantas (ya configurado)
- **Bluetooth** — para conectar a impresora térmica (configurado, plugin instalado pero implementación pendiente)
- **Internet** — para Google Sheets cuando esté conectado el backend

## Compilar IPA para iPhone

Necesitás **macOS con Xcode**. Desde Windows NO se puede directamente.

Alternativas:
1. Servicio cloud: **Codemagic** (gratis hasta 500 min/mes), **Ionic Appflow**, **EAS Build**
2. Mac prestada
3. Distribuir como **PWA** en iPhone (Safari → Compartir → Agregar a inicio)

## Estructura

```
mobile/
├── www/                 ← lo que se empaqueta en el APK
│   ├── index.html       (versión móvil, sin frame ni sidebar)
│   ├── app-mobile.jsx   (entry point específico de móvil)
│   └── *.jsx            (copiados desde la raíz por sync:web)
├── scripts/
│   ├── sync-web.js      (copia .jsx de raíz → www/)
│   └── bundle-preview.js (genera preview.html standalone)
├── capacitor.config.json
├── package.json
└── preview.html         (generado — abrir con doble-click)
```

## Workflow día a día

1. Editás los `.jsx` en la **raíz** del proyecto (data.jsx, ui.jsx, screens-*.jsx, etc.)
2. `npm run build:web` para regenerar `preview.html` y probar
3. Cuando esté listo: `npm run cap:sync` + recompilar APK

## Roadmap a producción

| Pieza | Estado |
|---|---|
| Empaquetar como APK | ✅ Listo para compilar |
| Backend persistente (Apps Script + Sheet + Drive) | ⏳ Pendiente |
| Auth con hash de passwords | ⏳ Pendiente |
| Subir fotos a Drive automáticamente | ⏳ Pendiente |
| Impresora Bluetooth real (reemplazar mock) | ⏳ Pendiente — plugin BLE ya instalado |
| Modo offline con cola de sincronización | ⏳ Pendiente |
| Iconos y splash propios | ⏳ Pendiente |

## Notas

- React 18 + Tailwind via CDN. Sin paso de build de JS — Babel compila JSX en el navegador. Tarda ~1-2s en arrancar.
- Para producción real conviene pre-compilar JSX → JS con esbuild/Vite. Pendiente.
- El plugin de Bluetooth es `@capacitor-community/bluetooth-le`. Ya está en package.json pero el código de etiqueta.jsx hoy usa el mock (`FAKE_PRINTERS`). Hay que cambiar `PrinterPickerModal` y `EtiquetaModal` para usar la API real cuando estemos listos.
