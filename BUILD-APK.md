# Cómo obtener el APK de Salvallanta

Dos caminos. Elegí uno.

---

## Camino A — GitHub Actions (recomendado, sin instalar nada)

El workflow `.github/workflows/build-apk.yml` ya está listo. Compila el APK debug en la nube cada vez que hacés push, y te lo deja como **artifact** descargable desde la web de GitHub.

### Una sola vez

1. **Crear cuenta GitHub** (gratis): https://github.com/join
2. **Instalar Git** para Windows: https://git-scm.com/download/win
   - Durante la instalación, dejá las opciones por defecto.
3. **Crear repositorio nuevo** en GitHub:
   - https://github.com/new
   - Nombre: `salvallanta-inventario` (o el que prefieras)
   - **Private** (privado) si querés
   - **No** marques "Add a README" ni .gitignore — los traemos del proyecto
   - Crear repositorio

### Subir el proyecto (primera vez)

Abrí una terminal de Windows (PowerShell o Git Bash) **dentro de la carpeta del proyecto**:

```bash
cd "C:\Users\juans\Desktop\GotyourWeb\Salvallantas\Aplicativos\Inventario\Inventatio App"
git init
git branch -M main
git add .
git commit -m "Estado inicial — app móvil + workflow APK"
git remote add origin https://github.com/TU_USUARIO/salvallanta-inventario.git
git push -u origin main
```

Reemplazá `TU_USUARIO` por tu nombre de usuario de GitHub.

> La primera vez te va a pedir login. Usá GitHub Desktop o un Personal Access Token si te pide password — GitHub ya no acepta passwords planos. Lo más fácil: [GitHub Desktop](https://desktop.github.com/) para empujar cambios desde una UI.

### Descargar el APK

1. Andá a `https://github.com/TU_USUARIO/salvallanta-inventario/actions`
2. Hacé click en la corrida más reciente (debería verse un check verde tras ~5 min)
3. Bajá hasta la sección **Artifacts** abajo de todo
4. Descargá `salvallanta-apk` — es un .zip que contiene `salvallanta-debug.apk`

### Builds siguientes (cada vez que cambies algo)

```bash
git add .
git commit -m "Lo que cambié"
git push
```

GitHub corre el workflow automático. ~5 min después tenés el APK nuevo en Actions.

También podés **disparar el build manualmente** sin commitear:
- Tab Actions → "Build Android APK" → "Run workflow"

---

## Camino B — Compilar en tu PC (Windows + Android Studio)

### Una sola vez

1. **JDK 17 (Temurin)**: https://adoptium.net/temurin/releases/?version=17
   - Bajá el `.msi` para Windows x64. Instalador estándar.
2. **Android Studio**: https://developer.android.com/studio
   - ~1 GB. Durante la instalación deja que descargue el Android SDK (otro ~3 GB).
3. **Node.js 20 LTS**: https://nodejs.org/
   - Instalador `.msi` estándar.

### Compilar el APK

Abrí PowerShell o CMD en la carpeta del proyecto:

```powershell
cd "C:\Users\juans\Desktop\GotyourWeb\Salvallantas\Aplicativos\Inventario\Inventatio App\mobile"
npm install
npm run sync:web
npx cap add android
npx cap sync android
npx cap open android
```

El último comando abre Android Studio. Esperá que indexe (la primera vez tarda 5-10 min) y andá a:

**Build → Build Bundle(s) / APK(s) → Build APK(s)**

Cuando termine, te aparece un link "locate" abajo a la derecha. El APK queda en:

```
mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## Instalar el APK en tu Android

1. **Transferí el .apk** al teléfono (Drive, USB, Telegram, lo que sea).
2. En el teléfono, abrí el archivo .apk.
3. Android te va a avisar que "esta fuente no es confiable" — andá a **Configuración → Seguridad → Instalar apps desconocidas** y autorizá la app desde la que estás abriendo el .apk (ej. Files, Drive).
4. Tocá **Instalar**. Listo, tenés "Salvallanta" en el cajón de apps.

> Es un APK **debug** firmado con un keystore de desarrollo. Funciona para vos y para probar internamente, pero no se puede publicar en Play Store así. Cuando llegue ese momento generamos un APK firmado de release.

---

## Si algo falla

- **GitHub Actions falla en `npx cap add android`**: probablemente la versión de Capacitor no matchea. Revisá el log del paso "Install npm dependencies".
- **Gradle dice "SDK location not found"**: el workflow ya instala el Android SDK; si lo estás corriendo local, abrí Android Studio una vez para que termine de configurarlo.
- **Java version mismatch**: confirmá que el JDK instalado es 17, no 21 ni 11. `java -version` en la terminal.
- **El APK instala pero crashea al abrir**: probablemente Tailwind o React no cargaron — la app necesita internet la primera vez para bajar los CDN. Conectate a wifi y reabrí.
