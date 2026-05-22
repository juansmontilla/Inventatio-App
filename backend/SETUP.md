# Deploy del backend de Salvallantas

Pasos para poner el Apps Script en producción. Tomá ~10 min en total.

## Prerrequisitos

- Google Sheet vacío ya creado, llamado `Salvallantas Inventario`, abierto en el navegador.
- API key de imgbb a mano (https://api.imgbb.com/).

---

## 1. Abrir el editor de Apps Script

En el Sheet, menú **Extensiones → Apps Script**. Se abre una pestaña nueva con el editor.

Te aparece un archivo `Codigo.gs` (o `Code.gs`) con una función vacía. **Borrá todo el contenido**.

## 2. Pegar el código

Abrí el archivo `Code.gs` que está en este proyecto (`backend/Code.gs`). Copialo entero y pegalo en el editor de Apps Script.

Renombrá el archivo del editor a `Code.gs` (click en el nombre arriba a la izquierda → editar). No es obligatorio pero es más prolijo.

## 3. Guardar el proyecto

Click el ícono de disquete (💾) o **Ctrl+S**. Te pide nombre del proyecto — poné: **`Salvallantas Backend`**.

## 4. Configurar la API key de imgbb

Click el ícono de engranaje ⚙️ en la barra izquierda → **Project Settings** → scroll hasta **Script Properties** → click **"Add script property"**.

- **Property**: `IMGBB_API_KEY`
- **Value**: pegá tu API key de imgbb (la cadena larga)

Click **Save script properties**.

> Importante: si llegás a regenerar el key de imgbb, basta con actualizar este valor — no hay que reinstalar nada en la app.

## 5. Correr `setup()` una vez

Volvé al editor de código (ícono `<>`). Arriba, en el dropdown que dice **"Select function"**, elegí **`setup`**. Click el botón **▶ Run**.

La primera vez te pide autorización:
1. **Review permissions** → elegí tu cuenta Google
2. Te aparece "Google hasn't verified this app" — click **Advanced** → **Go to Salvallantas Backend (unsafe)**.
   - Es normal: es tu propio script, solo Google muestra ese warning porque no es una app publicada en su tienda.
3. **Allow** los permisos (Sheets, UrlFetch).

Después corre el script. Verificá que abajo, en el panel **Execution log**, aparezca:
```
Setup completo. Hojas: Usuarios, Inventario, Ventas, Listas, Sesiones, Movimientos
✓ IMGBB_API_KEY configurado.
Usuario default creado: usuario=admin, pass=admin (CAMBIAR YA).
```

Si volvés al Sheet, vas a ver 6 hojas creadas con sus encabezados.

## 6. Deployar como Web App

Arriba a la derecha del editor, click **Deploy → New deployment**.

En el diálogo:
- Click el ícono de engranaje ⚙️ al lado de "Select type" → elegí **Web app**
- **Description**: `v1`
- **Execute as**: `Me (tu_email@gmail.com)`
- **Who has access**: `Anyone` (cualquiera con el URL, no requiere login Google del usuario que llama)

Click **Deploy**. Tras unos segundos te muestra:

- **Web app URL**: una URL larga tipo `https://script.google.com/macros/s/AKfyc.../exec`

**Copiá esa URL**. Es lo que necesita la app móvil para conectarse.

## 7. Probar que funciona

Abrí la URL del web app en una pestaña nueva del navegador. Si todo está OK, ves un JSON:

```json
{"ok":true,"message":"Salvallantas API alive","time":"2026-05-21T..."}
```

Si en cambio ves un HTML diciendo "Sorry, this content is unavailable" o "Authorization required", revisar:
- Que "Who has access" esté en **Anyone**
- Que el deployment esté guardado (no quedó solo el diálogo abierto)

## 8. Mandame la URL

Cuando tengas la URL del web app, pegámela en el chat. Yo conecto la app móvil a ese endpoint y rebuildeás el APK.

---

## Datos importantes para recordar

- **Usuario admin inicial**: `admin` / `admin` — cambiá la contraseña apenas pruebes el login desde la app.
- **API key imgbb**: vive en Script Properties. Nunca lo pegues en el código fuente.
- **Sesiones**: duran 30 días. Después el usuario tiene que volver a loguearse.
- **Audit log**: la hoja `Movimientos` registra todas las creaciones, ediciones, ventas, borrados. Útil para auditoría.

## Cómo actualizar el código después

Si yo te paso una versión nueva de `Code.gs`, los pasos son:

1. Pegar el código nuevo en el editor (reemplazar todo).
2. Guardar (Ctrl+S).
3. **Deploy → Manage deployments** → ícono lápiz del deployment activo → **Version: New version** → **Deploy**.
4. **Importante**: la URL se mantiene igual. No hay que cambiar nada en la app móvil.

Si en cambio creás un **New deployment** (no Manage), te genera una URL nueva — eso fuerza a actualizar la app. Por eso siempre actualizá el deployment existente.

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| "Authorization required" al abrir el URL | Who has access ≠ Anyone | Manage deployments → editar → cambiar a Anyone |
| "Script function not found: setup" | Ejecutaste el script vacío antes de pegar el código | Pegá el código primero, guardá, después corré setup |
| `setup()` falla con "Cannot read property of null" | El Sheet no está activo o el script no está bound al Sheet | Asegurate de abrir Apps Script desde Extensiones del Sheet, no desde script.google.com |
| `IMGBB_API_KEY no está en Script Properties` | El paso 4 no se guardó | Verificá en Project Settings → Script Properties |
| Errores de "Service invoked too many times" | Pasaste cuotas diarias (~20k UrlFetch) | Esperá 24h, o reducí frecuencia de polling en la app |
