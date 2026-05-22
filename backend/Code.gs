/**
 * Salvallantas Inventario — Backend API
 *
 * Deploy as web app:
 *   - Execute as: Me (the owner)
 *   - Who has access: Anyone
 *
 * Setup once:
 *   - Run setup() from the Apps Script editor (authorize permissions when asked)
 *   - In Project Settings > Script Properties, add:
 *       IMGBB_API_KEY = your imgbb API key
 *
 * API protocol:
 *   POST { action: string, token?: string, args?: object }
 *   -> { ok: true, data: any } | { ok: false, error: string }
 *
 * Default admin (created by setup): usuario=admin pass=admin
 *   Cambiar la contraseña inmediatamente desde la app.
 */

// ─── Config ───────────────────────────────────────────────────────────

const SHEETS = {
  USUARIOS: 'Usuarios',
  INVENTARIO: 'Inventario',
  VENTAS: 'Ventas',
  LISTAS: 'Listas',
  CATALOGOS: 'Catalogos',
  SESIONES: 'Sesiones',
  MOVIMIENTOS: 'Movimientos',
};

const HEADERS = {
  Usuarios:    ['id', 'usuario', 'passHash', 'salt', 'nombre', 'rol', 'estado', 'createdAt', 'updatedAt'],
  Inventario:  ['code', 'ref', 'brand', 'pattern', 'dot', 'qty', 'type', 'estado', 'condicion',
                'ubicacion', 'propietario', 'precio',
                'profExt', 'profCent', 'profInter',
                'foto1', 'foto2', 'foto3', 'foto4',
                'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt'],
  Ventas:      ['id', 'code', 'qty', 'precio', 'cliente', 'vendedor', 'fecha', 'notas', 'createdAt', 'createdBy'],
  Listas:      ['hoja', 'clave', 'valor', 'orden', 'activo'],
  Catalogos:   ['id', 'nombre', 'sub', 'items', 'updated', 'tags', 'activo', 'createdAt', 'updatedAt'],
  Sesiones:    ['token', 'userId', 'createdAt', 'expiresAt', 'userAgent'],
  Movimientos: ['timestamp', 'userId', 'accion', 'entidad', 'entidadId', 'detalles'],
};

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

const PUBLIC_ACTIONS = ['auth.login', 'health'];
const WRITE_ACTIONS  = [
  'auth.login', 'auth.logout',
  'inventario.create', 'inventario.update', 'inventario.delete',
  'ventas.create',
  'usuarios.create', 'usuarios.update', 'usuarios.delete',
  'listas.update',
  'catalogos.create', 'catalogos.update', 'catalogos.delete',
];

// ─── Entry points ─────────────────────────────────────────────────────

function doGet(e) {
  return json({ ok: true, message: 'Salvallantas API alive', time: now() });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'Body vacío' });
    }
    const body = JSON.parse(e.postData.contents);
    const result = dispatch(body.action, body.token, body.args || {});
    return json({ ok: true, data: result });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Router ───────────────────────────────────────────────────────────

function dispatch(action, token, args) {
  if (!action) throw new Error('action requerida');

  if (WRITE_ACTIONS.indexOf(action) >= 0) {
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try { return route(action, token, args); }
    finally { lock.releaseLock(); }
  }
  return route(action, token, args);
}

function route(action, token, args) {
  let session = null;
  if (PUBLIC_ACTIONS.indexOf(action) < 0) {
    session = requireSession(token);
  }

  switch (action) {
    case 'health':            return { time: now() };

    case 'auth.login':        return authLogin(args.usuario, args.pass, args.userAgent);
    case 'auth.logout':       return authLogout(token);
    case 'auth.session':      return { user: session.user };

    case 'inventario.list':   return inventarioList(args);
    case 'inventario.get':    return inventarioGet(args.code);
    case 'inventario.create': return inventarioCreate(args, session);
    case 'inventario.update': return inventarioUpdate(args.code, args, session);
    case 'inventario.delete': return inventarioDelete(args.code, session);

    case 'ventas.list':       return ventasList(args);
    case 'ventas.create':     return ventasCreate(args, session);

    case 'usuarios.list':     return usuariosList(session);
    case 'usuarios.create':   return usuariosCreate(args, session);
    case 'usuarios.update':   return usuariosUpdate(args.id, args, session);
    case 'usuarios.delete':   return usuariosDelete(args.id, session);

    case 'listas.get':        return listasGet();
    case 'listas.update':     return listasUpdate(args.hoja, args.items, session);

    case 'catalogos.list':    return catalogosList();
    case 'catalogos.create':  return catalogosCreate(args, session);
    case 'catalogos.update':  return catalogosUpdate(args.id, args, session);
    case 'catalogos.delete':  return catalogosDelete(args.id, session);

    case 'fotos.upload':      return fotosUpload(args.base64, args.filename);

    case 'sync.changes':      return syncChanges(args.since);

    default: throw new Error('Acción desconocida: ' + action);
  }
}

// ─── Setup (run once from editor) ─────────────────────────────────────

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Crear/reutilizar hojas con encabezados
  for (const name of Object.keys(HEADERS)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#091426')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    // Limpia columnas extra
    const maxCols = sheet.getMaxColumns();
    if (maxCols > headers.length) sheet.deleteColumns(headers.length + 1, maxCols - headers.length);
    sheet.autoResizeColumns(1, headers.length);
  }

  // Borrar "Sheet1"/"Hoja 1" default si todavía existe
  ['Sheet1', 'Hoja 1', 'Hoja1'].forEach(name => {
    const s = ss.getSheetByName(name);
    if (s && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  // Seed admin si Usuarios vacío
  if (readAll(SHEETS.USUARIOS).length === 0) {
    const salt = randomHex(16);
    const passHash = hashPassword('admin', salt);
    appendRow(SHEETS.USUARIOS, {
      id: 'u' + Date.now(),
      usuario: 'admin', passHash, salt,
      nombre: 'Administrador',
      rol: 'admin',
      estado: 'Activo',
      createdAt: now(), updatedAt: now(),
    });
    Logger.log('Usuario default creado: usuario=admin, pass=admin (CAMBIAR YA).');
  }

  // Seed Listas si vacío
  if (readAll(SHEETS.LISTAS).length === 0) {
    const defaults = {
      tipos:       ['PCR', 'LT', 'TBR', 'OTR'],
      estados:     ['Nueva', 'Usada'],
      condiciones: ['Excelente', 'Como nuevo', 'Reparada', 'Garantía', 'Para revisar'],
      ubicaciones: ['Piso 1', 'Piso 2', 'Rack A-12', 'Bodega A', 'Bodega B'],
      propiedades: ['Salvallanta', 'Cliente'],
      marcas: [
        'MICHELIN','BRIDGESTONE','CONTINENTAL','GOODYEAR','PIRELLI','FIRESTONE','BFGOODRICH',
        'COOPER','DUNLOP','GENERAL TIRE','UNIROYAL','HANKOOK','YOKOHAMA','KUMHO','TOYO',
        'MAXXIS','NEXEN','FALKEN','GT RADIAL','SUMITOMO','LINGLONG','TRIANGLE','DOUBLESTAR',
        'GITI','AEOLUS','WESTLAKE','SAILUN','CHAOYANG','WANLI','AOTELI',
      ],
    };
    for (const hoja of Object.keys(defaults)) {
      defaults[hoja].forEach((valor, idx) => {
        appendRow(SHEETS.LISTAS, {
          hoja, clave: hoja + '_' + (idx + 1),
          valor, orden: idx + 1, activo: true,
        });
      });
    }
  }

  // Seed Catalogos si vacío
  if (readAll(SHEETS.CATALOGOS).length === 0) {
    const catalogosDefault = [
      { nombre: 'Llantas OTR - Minería',   sub: 'Off-the-road, alto desgaste', items: 0, updated: 'hoy',         tags: 'Crítico,Ventas' },
      { nombre: 'Repuestos de Suspensión', sub: 'Amortiguadores, terminales',   items: 0, updated: 'Verificado',  tags: 'Stock bajo' },
      { nombre: 'Llantas Pasajero PCR',    sub: 'Passenger Car Radial',         items: 0, updated: 'ayer',        tags: 'Ventas' },
      { nombre: 'Llantas Camión TBR',      sub: 'Truck Bus Radial',             items: 0, updated: 'esta semana', tags: '' },
    ];
    catalogosDefault.forEach((c, idx) => {
      appendRow(SHEETS.CATALOGOS, {
        id: 'c' + (Date.now() + idx),
        nombre: c.nombre, sub: c.sub,
        items: c.items, updated: c.updated, tags: c.tags,
        activo: true,
        createdAt: now(), updatedAt: now(),
      });
    });
  }

  // Validar IMGBB_API_KEY (warning solo)
  const apiKey = PropertiesService.getScriptProperties().getProperty('IMGBB_API_KEY');
  if (!apiKey) {
    Logger.log('⚠️ IMGBB_API_KEY no está en Script Properties. Configurar antes de subir fotos.');
  } else {
    Logger.log('✓ IMGBB_API_KEY configurado.');
  }

  Logger.log('Setup completo. Hojas: ' + ss.getSheets().map(s => s.getName()).join(', '));
  return { ok: true, sheets: ss.getSheets().map(s => s.getName()) };
}

// ─── Auth ─────────────────────────────────────────────────────────────

function authLogin(usuario, pass, userAgent) {
  if (!usuario || !pass) throw new Error('Usuario y contraseña requeridos');
  const users = readAll(SHEETS.USUARIOS);
  const user = users.find(u => String(u.usuario).toLowerCase() === String(usuario).toLowerCase());
  if (!user) throw new Error('Usuario o contraseña incorrectos');
  if (user.estado !== 'Activo') throw new Error('Usuario inactivo');
  if (hashPassword(pass, user.salt) !== user.passHash) throw new Error('Usuario o contraseña incorrectos');

  const token = randomHex(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  appendRow(SHEETS.SESIONES, {
    token, userId: user.id,
    createdAt: now(), expiresAt,
    userAgent: userAgent || '',
  });
  return {
    token, expiresAt,
    user: { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol },
  };
}

function authLogout(token) {
  const rows = readAll(SHEETS.SESIONES);
  const r = rows.find(x => x.token === token);
  if (r) deleteRow(SHEETS.SESIONES, r._row);
  return { ok: true };
}

function requireSession(token) {
  if (!token) throw new Error('Token requerido (no estás logueado)');
  const sess = readAll(SHEETS.SESIONES).find(r => r.token === token);
  if (!sess) throw new Error('Sesión inválida');
  if (new Date(sess.expiresAt) < new Date()) throw new Error('Sesión expirada');
  const user = readAll(SHEETS.USUARIOS).find(u => u.id === sess.userId);
  if (!user) throw new Error('Usuario no encontrado');
  if (user.estado !== 'Activo') throw new Error('Usuario inactivo');
  return {
    userId: user.id,
    user: { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol },
  };
}

// ─── Inventario ───────────────────────────────────────────────────────

function inventarioList(args) {
  return readAll(SHEETS.INVENTARIO).filter(r => !r.deletedAt);
}

function inventarioGet(code) {
  const r = readAll(SHEETS.INVENTARIO).find(x => x.code === code && !x.deletedAt);
  if (!r) throw new Error('Llanta no encontrada: ' + code);
  return r;
}

function inventarioCreate(data, session) {
  if (!data.code) throw new Error('code requerido');
  const existing = readAll(SHEETS.INVENTARIO).find(r => r.code === data.code && !r.deletedAt);
  if (existing) throw new Error('Ya existe una llanta con code ' + data.code);
  const payload = Object.assign({}, data, {
    createdAt: now(), createdBy: session.userId,
    updatedAt: now(), updatedBy: session.userId,
    deletedAt: '',
  });
  appendRow(SHEETS.INVENTARIO, payload);
  logMovement(session.userId, 'create', 'inventario', data.code, JSON.stringify(stripPhotos(data)));
  return inventarioGet(data.code);
}

function inventarioUpdate(code, data, session) {
  const r = readAll(SHEETS.INVENTARIO).find(x => x.code === code && !x.deletedAt);
  if (!r) throw new Error('Llanta no encontrada: ' + code);
  const patch = Object.assign({}, data, {
    updatedAt: now(), updatedBy: session.userId,
  });
  delete patch.code; // no permitir cambio de code
  updateRow(SHEETS.INVENTARIO, r._row, patch);
  logMovement(session.userId, 'update', 'inventario', code, JSON.stringify(stripPhotos(data)));
  return inventarioGet(code);
}

function inventarioDelete(code, session) {
  const r = readAll(SHEETS.INVENTARIO).find(x => x.code === code && !x.deletedAt);
  if (!r) throw new Error('Llanta no encontrada: ' + code);
  updateRow(SHEETS.INVENTARIO, r._row, {
    deletedAt: now(),
    updatedAt: now(), updatedBy: session.userId,
  });
  logMovement(session.userId, 'delete', 'inventario', code, '');
  return { ok: true };
}

// ─── Ventas ───────────────────────────────────────────────────────────

function ventasList(args) {
  return readAll(SHEETS.VENTAS);
}

function ventasCreate(data, session) {
  if (!data.code) throw new Error('code requerido');
  const inv = readAll(SHEETS.INVENTARIO).find(r => r.code === data.code && !r.deletedAt);
  if (!inv) throw new Error('Llanta no existe: ' + data.code);
  const qty = parseInt(data.qty) || 1;
  const stockActual = parseInt(inv.qty) || 0;
  if (qty > stockActual) throw new Error('Cantidad excede stock (' + stockActual + ')');

  const id = 'v' + Date.now();
  appendRow(SHEETS.VENTAS, {
    id, code: data.code, qty,
    precio: data.precio || inv.precio,
    cliente: data.cliente || '',
    vendedor: session.user.nombre,
    fecha: data.fecha || now(),
    notas: data.notas || '',
    createdAt: now(), createdBy: session.userId,
  });

  // Descontar stock; si llega a 0, soft-delete
  const newQty = stockActual - qty;
  const patch = {
    qty: newQty,
    updatedAt: now(), updatedBy: session.userId,
  };
  if (newQty <= 0) patch.deletedAt = now();
  updateRow(SHEETS.INVENTARIO, inv._row, patch);

  logMovement(session.userId, 'sale', 'venta', id, JSON.stringify({ code: data.code, qty }));
  return { id, ok: true };
}

// ─── Usuarios ─────────────────────────────────────────────────────────

function usuariosList(session) {
  if (session.user.rol !== 'admin') throw new Error('Solo admin');
  return readAll(SHEETS.USUARIOS).map(u => ({
    id: u.id, usuario: u.usuario, nombre: u.nombre,
    rol: u.rol, estado: u.estado,
    createdAt: u.createdAt, updatedAt: u.updatedAt,
  }));
}

function usuariosCreate(data, session) {
  if (session.user.rol !== 'admin') throw new Error('Solo admin');
  if (!data.usuario || !data.pass) throw new Error('usuario y pass requeridos');
  if (readAll(SHEETS.USUARIOS).some(u => String(u.usuario).toLowerCase() === String(data.usuario).toLowerCase())) {
    throw new Error('Usuario ya existe');
  }
  const salt = randomHex(16);
  const id = 'u' + Date.now();
  appendRow(SHEETS.USUARIOS, {
    id, usuario: data.usuario,
    passHash: hashPassword(data.pass, salt), salt,
    nombre: data.nombre || data.usuario,
    rol: data.rol || 'consultor',
    estado: data.estado || 'Activo',
    createdAt: now(), updatedAt: now(),
  });
  logMovement(session.userId, 'create', 'usuario', id, JSON.stringify({ usuario: data.usuario, rol: data.rol }));
  return { id };
}

function usuariosUpdate(id, data, session) {
  const isAdmin = session.user.rol === 'admin';
  if (!isAdmin && session.userId !== id) throw new Error('No autorizado');
  const user = readAll(SHEETS.USUARIOS).find(u => u.id === id);
  if (!user) throw new Error('Usuario no encontrado');

  const patch = { updatedAt: now() };
  if (data.nombre !== undefined)               patch.nombre = data.nombre;
  if (data.rol !== undefined && isAdmin)       patch.rol = data.rol;
  if (data.estado !== undefined && isAdmin)    patch.estado = data.estado;
  if (data.pass) {
    const salt = randomHex(16);
    patch.salt = salt;
    patch.passHash = hashPassword(data.pass, salt);
  }
  updateRow(SHEETS.USUARIOS, user._row, patch);
  logMovement(session.userId, 'update', 'usuario', id, JSON.stringify(Object.keys(patch).filter(k => k !== 'passHash' && k !== 'salt')));
  return { ok: true };
}

function usuariosDelete(id, session) {
  if (session.user.rol !== 'admin') throw new Error('Solo admin');
  if (id === session.userId) throw new Error('No puedes borrar tu propio usuario');
  const user = readAll(SHEETS.USUARIOS).find(u => u.id === id);
  if (!user) throw new Error('Usuario no encontrado');
  updateRow(SHEETS.USUARIOS, user._row, { estado: 'Inactivo', updatedAt: now() });
  logMovement(session.userId, 'delete', 'usuario', id, '');
  return { ok: true };
}

// ─── Listas ───────────────────────────────────────────────────────────

function listasGet() {
  const rows = readAll(SHEETS.LISTAS).filter(r => isTruthy(r.activo));
  rows.sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const out = {};
  for (const row of rows) {
    if (!out[row.hoja]) out[row.hoja] = [];
    out[row.hoja].push(row.valor);
  }
  return out;
}

function listasUpdate(hoja, items, session) {
  if (session.user.rol !== 'admin') throw new Error('Solo admin');
  if (!hoja || !Array.isArray(items)) throw new Error('hoja y items requeridos');

  // Borrar duro todas las filas existentes de esa hoja (de abajo hacia arriba)
  const sheet = getSheet(SHEETS.LISTAS);
  const rows = readAll(SHEETS.LISTAS).filter(r => r.hoja === hoja);
  rows.sort((a, b) => b._row - a._row).forEach(r => sheet.deleteRow(r._row));

  // Agregar items nuevos como activos
  items.forEach((valor, idx) => {
    appendRow(SHEETS.LISTAS, {
      hoja,
      clave: hoja + '_' + (idx + 1),
      valor, orden: idx + 1, activo: true,
    });
  });
  // El historial de quién/cuándo cambió queda en hoja Movimientos
  logMovement(session.userId, 'update', 'lista', hoja, JSON.stringify(items));
  return { ok: true, count: items.length };
}

// ─── Catálogos ────────────────────────────────────────────────────────

function catalogosList() {
  return readAll(SHEETS.CATALOGOS).filter(r => isTruthy(r.activo));
}

function catalogosCreate(data, session) {
  if (session.user.rol !== 'admin') throw new Error('Solo admin');
  if (!data.nombre) throw new Error('nombre requerido');
  const id = 'c' + Date.now();
  appendRow(SHEETS.CATALOGOS, {
    id, nombre: data.nombre, sub: data.sub || '',
    items: parseInt(data.items) || 0,
    updated: data.updated || 'hoy',
    tags: Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || ''),
    activo: true,
    createdAt: now(), updatedAt: now(),
  });
  logMovement(session.userId, 'create', 'catalogo', id, JSON.stringify({ nombre: data.nombre }));
  return { id };
}

function catalogosUpdate(id, data, session) {
  if (session.user.rol !== 'admin') throw new Error('Solo admin');
  const row = readAll(SHEETS.CATALOGOS).find(r => r.id === id);
  if (!row) throw new Error('Catálogo no encontrado');
  const patch = { updatedAt: now() };
  if (data.nombre !== undefined)  patch.nombre = data.nombre;
  if (data.sub !== undefined)     patch.sub = data.sub;
  if (data.items !== undefined)   patch.items = parseInt(data.items) || 0;
  if (data.updated !== undefined) patch.updated = data.updated;
  if (data.tags !== undefined)    patch.tags = Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || '');
  updateRow(SHEETS.CATALOGOS, row._row, patch);
  logMovement(session.userId, 'update', 'catalogo', id, JSON.stringify(Object.keys(patch)));
  return { ok: true };
}

function catalogosDelete(id, session) {
  if (session.user.rol !== 'admin') throw new Error('Solo admin');
  const row = readAll(SHEETS.CATALOGOS).find(r => r.id === id);
  if (!row) throw new Error('Catálogo no encontrado');
  updateRow(SHEETS.CATALOGOS, row._row, { activo: false, updatedAt: now() });
  logMovement(session.userId, 'delete', 'catalogo', id, '');
  return { ok: true };
}

// ─── Fotos (imgbb) ────────────────────────────────────────────────────

function fotosUpload(base64, filename) {
  if (!base64) throw new Error('base64 requerido');
  const apiKey = PropertiesService.getScriptProperties().getProperty('IMGBB_API_KEY');
  if (!apiKey) throw new Error('IMGBB_API_KEY no configurado en Script Properties');

  let data = String(base64);
  if (data.indexOf('data:') === 0) data = data.split(',')[1] || '';

  const response = UrlFetchApp.fetch(
    'https://api.imgbb.com/1/upload?key=' + encodeURIComponent(apiKey),
    {
      method: 'post',
      payload: { image: data, name: filename || ('foto_' + Date.now()) },
      muteHttpExceptions: true,
    }
  );
  const code = response.getResponseCode();
  const body = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('imgbb HTTP ' + code + ': ' + body.slice(0, 300));
  const result = JSON.parse(body);
  if (!result.success) throw new Error('imgbb: ' + JSON.stringify(result).slice(0, 300));
  return {
    url: result.data.url,
    display_url: result.data.display_url,
    delete_url: result.data.delete_url || '',
    size: result.data.size,
    width: result.data.width,
    height: result.data.height,
  };
}

// ─── Sync (polling) ───────────────────────────────────────────────────

function syncChanges(since) {
  const sinceDate = since ? new Date(since) : new Date(0);
  const fresh = (t) => t && new Date(t) > sinceDate;

  return {
    inventario: readAll(SHEETS.INVENTARIO).filter(r => fresh(r.updatedAt)),
    ventas:     readAll(SHEETS.VENTAS).filter(r => fresh(r.createdAt)),
    serverTime: now(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function getSheet(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw new Error('Hoja no existe: ' + name + '. Corré setup() primero.');
  return s;
}

// Helpers para celdas foto1-4 con HYPERLINK
function isFotoColumn(h) { return /^foto[1-4]$/.test(h); }

function wrapFotoFormula(value) {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    return '=HYPERLINK("' + value.replace(/"/g, '""') + '", "ver foto")';
  }
  return value;
}

function extractUrlFromFormula(formula) {
  if (!formula) return null;
  const m = String(formula).match(/HYPERLINK\("([^"]+)"/i);
  return m ? m[1] : null;
}

// Lectura genérica con extracción de URL desde fórmulas HYPERLINK en foto1-4
function readAll(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const lastCol = sheet.getLastColumn();
  const range = sheet.getRange(1, 1, lastRow, lastCol);
  const values = range.getValues();
  const formulas = range.getFormulas();
  const headers = values[0];
  return values.slice(1).map((row, idx) => {
    const obj = { _row: idx + 2 };
    headers.forEach((h, i) => {
      if (!h) return;
      if (isFotoColumn(h)) {
        const f = formulas[idx + 1][i];
        const url = extractUrlFromFormula(f);
        if (url) { obj[h] = url; return; }
      }
      obj[h] = row[i];
    });
    return obj;
  });
}

function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => {
    let v = obj[h] !== undefined && obj[h] !== null ? obj[h] : '';
    if (isFotoColumn(h)) v = wrapFotoFormula(v);
    return v;
  });
  sheet.appendRow(row);
}

function updateRow(sheetName, rowNum, patch) {
  const sheet = getSheet(sheetName);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const currentRange = sheet.getRange(rowNum, 1, 1, lastCol);
  const currentValues = currentRange.getValues()[0];
  const currentFormulas = currentRange.getFormulas()[0];
  const updated = headers.map((h, i) => {
    if (patch[h] !== undefined) {
      let v = patch[h];
      if (isFotoColumn(h)) v = wrapFotoFormula(v);
      return v;
    }
    // Conserva la fórmula original si existe (no la pisamos con su valor renderizado)
    return currentFormulas[i] || currentValues[i];
  });
  currentRange.setValues([updated]);
}

function deleteRow(sheetName, rowNum) {
  getSheet(sheetName).deleteRow(rowNum);
}

function logMovement(userId, accion, entidad, entidadId, detalles) {
  try {
    appendRow(SHEETS.MOVIMIENTOS, {
      timestamp: now(),
      userId, accion, entidad, entidadId,
      detalles: String(detalles || '').slice(0, 5000),
    });
  } catch (e) { /* no romper la operación principal */ }
}

function stripPhotos(obj) {
  const o = Object.assign({}, obj);
  delete o.foto1; delete o.foto2; delete o.foto3; delete o.foto4;
  return o;
}

function now() { return new Date().toISOString(); }

// Tolera boolean true, string "true"/"TRUE"/"True", número 1, etc.
function isTruthy(v) {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') return v.toLowerCase().trim() === 'true';
  return false;
}

function randomHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes; i++) s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return s;
}

function hashPassword(pass, salt) {
  const data = String(salt) + String(pass);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data, Utilities.Charset.UTF_8);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    let b = bytes[i];
    if (b < 0) b += 256;
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

// ─── Limpieza periódica (opcional, configurar trigger semanal) ────────

function cleanupExpiredSessions() {
  const rows = readAll(SHEETS.SESIONES);
  const sheet = getSheet(SHEETS.SESIONES);
  const toDelete = rows.filter(r => new Date(r.expiresAt) < new Date());
  // Borrar de abajo hacia arriba para no corromper índices
  toDelete.sort((a, b) => b._row - a._row).forEach(r => sheet.deleteRow(r._row));
  Logger.log('Limpieza: ' + toDelete.length + ' sesiones expiradas eliminadas.');
}
