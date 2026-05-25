// Wrapper Bluetooth Classic SPP para impresora ESC/POS térmica (JAL-1258 y similares).
// Usa el plugin Cordova `cordova-plugin-bluetooth-serial` integrado en Capacitor 6.
// Persiste la impresora seleccionada en Capacitor Preferences.

const PRINTER_NAME_KEY = 'printer.name';
const PRINTER_ADDR_KEY = 'printer.addr';
const PRINTER_WIDTH_KEY = 'printer.width'; // 58 | 80

// Acceso a Preferences (replica el patrón de api.jsx para evitar dependencia entre archivos)
const _prefsPlugin = () => {
  try {
    if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Preferences) {
      return Capacitor.Plugins.Preferences;
    }
  } catch (e) {}
  return null;
};
async function _prefGet(key) {
  const p = _prefsPlugin();
  if (p) {
    try { const r = await p.get({ key }); return (r && r.value) || null; }
    catch (e) {}
  }
  try { return localStorage.getItem(key) || null; } catch (e) { return null; }
}
async function _prefSet(key, value) {
  const p = _prefsPlugin();
  if (p) {
    try {
      if (value == null) await p.remove({ key });
      else await p.set({ key, value: String(value) });
      return;
    } catch (e) {}
  }
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch (e) {}
}

const printer = {
  _connectedTo: null,    // MAC dirección actual o null
  _selectedAddr: null,
  _selectedName: null,
  _width: 58,
  _loaded: false,

  // Encuentra el plugin Cordova de Bluetooth Serial
  plugin() {
    if (window.bluetoothSerial) return window.bluetoothSerial;
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.bluetoothSerial) {
      return window.cordova.plugins.bluetoothSerial;
    }
    return null;
  },

  isAvailable() { return !!this.plugin(); },

  // Promisifica callbacks del plugin (success, failure)
  _call(method, ...args) {
    return new Promise((resolve, reject) => {
      const p = this.plugin();
      if (!p) { reject(new Error('Plugin Bluetooth no disponible (¿app no compilada con el plugin?)')); return; }
      if (typeof p[method] !== 'function') { reject(new Error('Método no soportado: ' + method)); return; }
      try {
        p[method](...args,
          (result) => resolve(result),
          (err) => reject(new Error(err && err.message ? err.message : String(err || 'Error Bluetooth'))));
      } catch (e) { reject(e); }
    });
  },

  // Carga estado persistido. Llamar una vez al arrancar.
  async load() {
    if (this._loaded) return;
    this._selectedName = await _prefGet(PRINTER_NAME_KEY);
    this._selectedAddr = await _prefGet(PRINTER_ADDR_KEY);
    const w = await _prefGet(PRINTER_WIDTH_KEY);
    this._width = w === '80' ? 80 : 58;
    this._loaded = true;
  },

  saved() {
    return { name: this._selectedName, addr: this._selectedAddr, width: this._width };
  },

  async saveSelected(name, addr) {
    this._selectedName = name;
    this._selectedAddr = addr;
    await _prefSet(PRINTER_NAME_KEY, name);
    await _prefSet(PRINTER_ADDR_KEY, addr);
  },

  async clearSelected() {
    this._selectedName = null;
    this._selectedAddr = null;
    await _prefSet(PRINTER_NAME_KEY, null);
    await _prefSet(PRINTER_ADDR_KEY, null);
  },

  async setWidth(w) {
    this._width = (w === 80) ? 80 : 58;
    await _prefSet(PRINTER_WIDTH_KEY, String(this._width));
  },
  width() { return this._width; },

  // ─── Estado del adaptador ────────────────────────────────────
  isEnabled() { return this._call('isEnabled'); },
  enable()    { return this._call('enable'); },

  // ─── Descubrimiento ──────────────────────────────────────────
  // list(): dispositivos YA emparejados con el sistema
  list()              { return this._call('list'); },
  // discoverUnpaired(): dispositivos visibles no emparejados (scan)
  discoverUnpaired()  { return this._call('discoverUnpaired'); },

  // ─── Conexión ────────────────────────────────────────────────
  async connect(addr) {
    if (!addr) throw new Error('Dirección requerida');
    await this._call('connect', addr);
    this._connectedTo = addr;
  },
  async disconnect() {
    try { await this._call('disconnect'); } catch (e) {}
    this._connectedTo = null;
  },
  async isConnected() {
    try { await this._call('isConnected'); return true; }
    catch (e) { return false; }
  },

  // ─── Envío de bytes ──────────────────────────────────────────
  // Acepta Uint8Array o string. Envia al puerto serial Bluetooth.
  async write(data) {
    if (data instanceof Uint8Array) {
      // El plugin acepta ArrayBuffer
      return this._call('write', data.buffer);
    }
    return this._call('write', data);
  },

  // ─── Comandos ESC/POS de prueba ──────────────────────────────
  buildTestBytes() {
    const out = [];
    const push = (...xs) => xs.forEach(x => out.push(x));
    const pushStr = (s) => { for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xFF); };

    // ESC @  Init
    push(0x1B, 0x40);
    // ESC a 1  Centrado
    push(0x1B, 0x61, 0x01);
    // ESC ! 0x30  Doble alto y ancho
    push(0x1B, 0x21, 0x30);
    pushStr('SALVALLANTAS\n');
    // ESC ! 0  Normal
    push(0x1B, 0x21, 0x00);
    pushStr('\nPrueba de impresion\n');
    pushStr('Bluetooth OK\n');
    pushStr('JAL-1258 conectado\n');
    // ESC a 0  Izquierda
    push(0x1B, 0x61, 0x00);
    // 4 saltos para que salga el papel
    push(0x0A, 0x0A, 0x0A, 0x0A);
    return new Uint8Array(out);
  },

  async testPrint() {
    return this.write(this.buildTestBytes());
  },
};

Object.assign(window, { printer });
