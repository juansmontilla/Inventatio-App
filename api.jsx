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

  // Llamar UNA vez al arrancar la app. Hidrata _token y _url desde el storage persistente.
  async load() {
    if (this._loaded) return;
    this._token = await prefGet(TOKEN_KEY);
    this._url   = (await prefGet(URL_KEY)) || DEFAULT_API_URL;
    this._loaded = true;
  },

  url() {
    return this._url || DEFAULT_API_URL;
  },

  setUrl(u) {
    this._url = u;
    prefSet(URL_KEY, u);
  },

  token() {
    return this._token;
  },

  setToken(t) {
    this._token = t || null;
    prefSet(TOKEN_KEY, t || null);
  },

  // Llamada genérica al backend. Usa POST con text/plain para evitar preflight CORS.
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
    this.setToken(data.token);
    return data;
  },
  async logout() {
    try { await this.call('auth.logout'); } catch (e) { /* ignore */ }
    this.setToken(null);
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

  // ─── Fotos ───────────────────────────────────────────────
  fotosUpload: function (base64, filename) {
    return this.call('fotos.upload', { base64, filename });
  },

  // ─── Sync (polling) ──────────────────────────────────────
  syncChanges: function (since) { return this.call('sync.changes', { since }); },
};

// Mapea el shape del backend → shape que usan los componentes existentes
const mapBackendUser = (u) => ({
  id: u.id,
  user: u.usuario,
  name: u.nombre,
  role: u.rol,
  status: 'Activo',
});

// Expone como globals para que los .jsx hermanos las usen sin imports
Object.assign(window, { api, mapBackendUser });
