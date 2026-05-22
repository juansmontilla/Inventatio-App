// API client para el backend Apps Script de Salvallantas.
// Toda comunicación con el Sheet pasa por acá.

const DEFAULT_API_URL =
  'https://script.google.com/macros/s/AKfycbwL2B6w0Pttg9gQYBNYmzqNRKFnXE1ggEeEffm_K0O1zT308W35MvMoBWX6lmQuq_o/exec';

const TOKEN_KEY = 'salvallanta.token';
const URL_KEY   = 'salvallanta.apiUrl';

// Acceso al plugin nativo de Preferences (SharedPreferences en Android).
// Si no está disponible (preview en browser), cae a localStorage.
const prefsPlugin = () => {
  try {
    if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Preferences) {
      return Capacitor.Plugins.Preferences;
    }
  } catch (e) {}
  return null;
};

async function prefGet(key) {
  const p = prefsPlugin();
  if (p) {
    try { const r = await p.get({ key }); return (r && r.value) || null; }
    catch (e) { /* fallback abajo */ }
  }
  try { return localStorage.getItem(key) || null; }
  catch (e) { return null; }
}

async function prefSet(key, value) {
  const p = prefsPlugin();
  if (p) {
    try {
      if (value == null) await p.remove({ key });
      else await p.set({ key, value: String(value) });
      return;
    } catch (e) { /* fallback abajo */ }
  }
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch (e) {}
}

const api = {
  _token: null,
  _url: null,
  _loaded: false,

  async load() {
    if (this._loaded) return;
    this._token = await prefGet(TOKEN_KEY);
    this._url   = (await prefGet(URL_KEY)) || DEFAULT_API_URL;
    this._loaded = true;
  },

  url() { return this._url || DEFAULT_API_URL; },
  setUrl(u) { this._url = u; prefSet(URL_KEY, u); },
  token() { return this._token; },
  async setToken(t) {
    this._token = t || null;
    await prefSet(TOKEN_KEY, t || null);
  },

  async call(action, args) {
    const body = JSON.stringify({ action, token: this.token(), args: args || {} });
    let res;
    try {
      res = await fetch(this.url(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
      });
    } catch (err) {
      throw new Error('Sin conexión al servidor');
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let json;
    try { json = await res.json(); }
    catch (e) { throw new Error('Respuesta inválida del servidor'); }
    if (!json.ok) {
      const msg = json.error || 'Error del servidor';
      const err = new Error(msg);
      if (/sesión inválida|sesión expirada|token requerido/i.test(msg)) {
        this.setToken(null);
        err.authExpired = true;
      }
      throw err;
    }
    return json.data;
  },

  // ─── Auth ────────────────────────────────────────────────
  async login(usuario, pass) {
    const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '').slice(0, 200);
    const data = await this.call('auth.login', { usuario, pass, userAgent: ua });
    await this.setToken(data.token);
    return data;
  },
  async logout() {
    try { await this.call('auth.logout'); } catch (e) {}
    await this.setToken(null);
  },
  async session() {
    if (!this.token()) return null;
    try { return await this.call('auth.session'); }
    catch (e) { return null; }
  },

  // ─── Inventario ──────────────────────────────────────────
  inventarioList:   function (filtros)      { return this.call('inventario.list', filtros || {}); },
  inventarioGet:    function (code)         { return this.call('inventario.get', { code }); },
  inventarioCreate: function (data)         { return this.call('inventario.create', data); },
  inventarioUpdate: function (code, data)   { return this.call('inventario.update', Object.assign({ code }, data)); },
  inventarioDelete: function (code)         { return this.call('inventario.delete', { code }); },

  // ─── Ventas ──────────────────────────────────────────────
  ventasList:   function (filtros) { return this.call('ventas.list', filtros || {}); },
  ventasCreate: function (data)    { return this.call('ventas.create', data); },

  // ─── Usuarios ────────────────────────────────────────────
  usuariosList:   function ()         { return this.call('usuarios.list'); },
  usuariosCreate: function (data)     { return this.call('usuarios.create', data); },
  usuariosUpdate: function (id, data) { return this.call('usuarios.update', Object.assign({ id }, data)); },
  usuariosDelete: function (id)       { return this.call('usuarios.delete', { id }); },

  // ─── Listas ──────────────────────────────────────────────
  listasGet:    function ()            { return this.call('listas.get'); },
  listasUpdate: function (hoja, items) { return this.call('listas.update', { hoja, items }); },

  // ─── Catálogos ───────────────────────────────────────────
  catalogosList:   function ()         { return this.call('catalogos.list'); },
  catalogosCreate: function (data)     { return this.call('catalogos.create', data); },
  catalogosUpdate: function (id, data) { return this.call('catalogos.update', Object.assign({ id }, data)); },
  catalogosDelete: function (id)       { return this.call('catalogos.delete', { id }); },

  // ─── Fotos ───────────────────────────────────────────────
  fotosUpload: function (base64, filename) {
    return this.call('fotos.upload', { base64, filename });
  },

  // ─── Sync (polling) ──────────────────────────────────────
  syncChanges: function (since) { return this.call('sync.changes', { since }); },
};

// ─── Mappers backend <-> app ─────────────────────────────────

const mapBackendUser = (u) => ({
  id: u.id,
  user: u.usuario,
  name: u.nombre,
  role: u.rol,
  status: u.estado || 'Activo',
});

// Backend tire (columnas planas) → shape interno que usan las screens
const mapBackendTire = (t) => ({
  code: t.code,
  ref: t.ref || '',
  brand: t.brand || '',
  pattern: t.pattern || '—',
  dot: t.dot != null ? String(t.dot).padStart(4, '0').slice(-4) : '',
  qty: parseInt(t.qty) || 0,
  type: t.type || '',
  estado: t.estado || '',
  condicion: t.condicion || '',
  ubicacion: t.ubicacion || '',
  prop: t.propietario || '',
  precio: parseInt(t.precio) || 0,
  profundimetro: {
    ext:   t.profExt   !== '' && t.profExt   != null ? parseFloat(t.profExt)   : '',
    cent:  t.profCent  !== '' && t.profCent  != null ? parseFloat(t.profCent)  : '',
    inter: t.profInter !== '' && t.profInter != null ? parseFloat(t.profInter) : '',
  },
  photos: [t.foto1 || null, t.foto2 || null, t.foto3 || null, t.foto4 || null],
});

// Form de AgregarScreen → payload para backend
const mapFormToBackendTire = (form, fotoUrls) => ({
  code: form.code,
  ref: form.ref || '',
  brand: form.brand || '',
  pattern: form.pattern || '',
  dot: form.dot || '',
  qty: parseInt(form.qty) || 1,
  type: form.type || '',
  estado: form.estado || '',
  condicion: form.condicion || '',
  ubicacion: form.ubicacion || '',
  propietario: form.prop || '',
  precio: typeof form.precio === 'number' ? form.precio : (parseInt(form.precio) || 0),
  profExt:   form.profundimetro?.ext   ?? '',
  profCent:  form.profundimetro?.cent  ?? '',
  profInter: form.profundimetro?.inter ?? '',
  foto1: fotoUrls[0] || '',
  foto2: fotoUrls[1] || '',
  foto3: fotoUrls[2] || '',
  foto4: fotoUrls[3] || '',
});

// Backend catalogo → shape interno
const mapBackendCatalog = (c) => ({
  id: c.id,
  name: c.nombre,
  sub: c.sub || '',
  items: parseInt(c.items) || 0,
  updated: c.updated || '',
  tags: c.tags ? String(c.tags).split(',').map(s => s.trim()).filter(Boolean) : [],
});

// ─── Compresión de imágenes (browser canvas) ─────────────────

// dataUrl JPEG/PNG → dataUrl JPEG comprimido (maxSize px en la dim mayor, calidad 0-1)
function compressImage(dataUrl, maxSize, quality) {
  return new Promise((resolve, reject) => {
    if (!dataUrl) return resolve(null);
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      // No es dataURL — devolverla tal cual (ya es URL HTTP)
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const M = maxSize || 1024;
        if (width > M || height > M) {
          if (width >= height) { height = Math.round(height * M / width); width = M; }
          else                  { width  = Math.round(width  * M / height); height = M; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality || 0.75));
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Imagen inválida'));
    img.src = dataUrl;
  });
}

// Sube las fotos del form a imgbb (vía Apps Script). Mantiene URLs ya existentes.
// Devuelve array de 4 strings (url o '').
async function uploadFormPhotos(form, codeForName, onProgress) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const p = form.photos && form.photos[i];
    if (!p) { out.push(''); continue; }
    if (typeof p === 'string' && /^https?:\/\//.test(p)) {
      // Ya está subida
      out.push(p);
      continue;
    }
    if (onProgress) onProgress(i + 1, 4);
    const compressed = await compressImage(p, 1024, 0.75);
    const filename = 'llanta_' + codeForName + '_' + (i + 1) + '.jpg';
    const result = await api.fotosUpload(compressed, filename);
    out.push(result.url);
  }
  return out;
}

// Expone como globals para que los .jsx hermanos las usen sin imports
Object.assign(window, {
  api, mapBackendUser, mapBackendTire, mapFormToBackendTire, mapBackendCatalog,
  compressImage, uploadFormPhotos,
});
