// Mock data + helpers

const USERS = [
  { id: 'u1', user: 'admin', pass: '1234', name: 'Ricardo Mendoza', role: 'admin', status: 'Activo' },
  { id: 'u2', user: 'recepcion', pass: '1234', name: 'Elena Vargas', role: 'recepcion', status: 'Activo' },
  { id: 'u3', user: 'consultor', pass: '1234', name: 'Mario Pérez', role: 'consultor', status: 'Activo' },
  { id: 'u4', user: 'lvargas', pass: '1234', name: 'Lucía Vargas', role: 'recepcion', status: 'Activo' },
  { id: 'u5', user: 'jdiaz', pass: '1234', name: 'Javier Díaz', role: 'consultor', status: 'Inactivo' },
];

const ROLES = {
  admin:     { label: 'Administrador', tiles: ['agregar', 'consultar', 'vender', 'catalogos', 'usuarios'], nav: ['panel','consultar','vender','admin'] },
  recepcion: { label: 'Recepción',     tiles: ['consultar', 'vender'],                                     nav: ['panel','consultar','vender'] },
  consultor: { label: 'Consultor',     tiles: ['consultar'],                                               nav: ['panel','consultar'] },
};

const TIRES = [
  { code: 'LLV-5134', ref: '215/55 R18', brand: 'Michelin',    pattern: 'Primacy 4',   dot: '2324', qty: 1, type: 'PCR',    estado: 'Usada', condicion: 'Reparada',  ubicacion: 'Piso 1',  prop: 'Salvallanta', precio: 420000 },
  { code: 'LLV-5113', ref: '215/55 R18', brand: 'Bridgestone', pattern: 'Turanza T005 A', dot: '2119', qty: 1, type: 'PCR', estado: 'Usada', condicion: 'Excelente', ubicacion: 'Piso 2',  prop: 'Salvallanta', precio: 480000 },
  { code: 'LLV-5102', ref: '225/45 R17', brand: 'Bridgestone', pattern: 'Turanza T005', dot: '2423', qty: 4, type: 'PCR',   estado: 'Nueva', condicion: 'Como nuevo', ubicacion: 'Rack A-12', prop: 'Salvallanta', precio: 520000 },
  { code: 'LLV-4988', ref: '265/70 R16', brand: 'Goodyear',    pattern: 'Wrangler AT',  dot: '0224', qty: 2, type: 'LT',    estado: 'Usada', condicion: 'Excelente', ubicacion: 'Piso 1',  prop: 'Salvallanta', precio: 610000 },
  { code: 'LLV-4877', ref: '195/65 R15', brand: 'Continental', pattern: 'PowerContact', dot: '4823', qty: 4, type: 'PCR',   estado: 'Nueva', condicion: 'Excelente', ubicacion: 'Bodega A', prop: 'Cliente',     precio: 380000 },
  { code: 'LLV-4801', ref: '11R 22.5',   brand: 'Michelin',    pattern: 'XZE2+',        dot: '1523', qty: 6, type: 'TBR',   estado: 'Usada', condicion: 'Reparada',  ubicacion: 'Bodega B', prop: 'Salvallanta', precio: 1850000 },
  { code: 'LLV-4750', ref: '205/55 R16', brand: 'Pirelli',     pattern: 'Cinturato P7', dot: '3623', qty: 3, type: 'PCR',   estado: 'Usada', condicion: 'Excelente', ubicacion: 'Piso 2',  prop: 'Salvallanta', precio: 410000 },
];

const CATALOGS = [
  { id: 'c1', name: 'Llantas OTR - Minería',  items: 42,  updated: 'hoy',         tags: ['Crítico','Ventas'] },
  { id: 'c2', name: 'Repuestos de Suspensión', items: 128, updated: 'Verificado',  tags: ['Stock bajo'] },
  { id: 'c3', name: 'Llantas Pasajero PCR',    items: 86,  updated: 'ayer',         tags: ['Ventas'] },
  { id: 'c4', name: 'Llantas Camión TBR',      items: 54,  updated: 'esta semana',  tags: [] },
];

const BRANDS = [
  // Premium globales
  'MICHELIN','BRIDGESTONE','CONTINENTAL','GOODYEAR','PIRELLI','FIRESTONE','BFGOODRICH','COOPER','DUNLOP','GENERAL TIRE','UNIROYAL',
  // Asiáticas premium / establecidas
  'HANKOOK','YOKOHAMA','KUMHO','TOYO','MAXXIS','NEXEN','FALKEN','GT RADIAL','SUMITOMO',
  // Chinas alto volumen / valor
  'LINGLONG','TRIANGLE','DOUBLESTAR','GITI','AEOLUS','WESTLAKE','SAILUN','CHAOYANG','WANLI','AOTELI',
  'ROADX','DOUBLECOIN','KAPSEN','AUFINE','BOTO','ZEETEX','HAIDA','COMPASAL','ANTARES','FRONWAY',
  'MILESTAR','GREMAX','HEADWAY','ARROYO','EVERGREEN','BLACKLION','LANDSAIL','ROYAL BLACK','WINDFORCE','AUSTONE',
  'JINYU','ZC RUBBER','SUNNY','ROVELO','OVATION','FORTUNE','FULLRUN','ROADCRUZA','NEXTYRE','LEAO',
  // Camión / OTR / agro
  'APOLLO','JK TYRE','MRF','CEAT','BIRLA','ALLIANCE','TITAN','GALAXY','ARMOUR','TECHKING','ALTURA','GOLDEN CROWN',
  // Europeas / regionales
  'VREDESTEIN','SEMPERIT','BARUM','MATADOR','KLEBER','FULDA','NOKIAN','AVON','NORDMAN','TIGAR','VIKING','RIKEN',
  // Americanas / nicho
  'MASTERCRAFT','HERCULES','PACE','GLADIATOR','INTERCO','MICKEY THOMPSON','FUZION','MOHAWK',
  // Latinoamericanas
  'TORNEL','EUZKADI','OLYMPIA','MAGGION','FATE','PETLAS',
];

// Levenshtein distance — used by fuzzy brand verifier
const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      curr[j] = Math.min(curr[j-1] + 1, prev[j] + 1, prev[j-1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
};

// Normalize string for comparison: uppercase, strip accents, collapse spaces
const normalizeBrand = (s) => (s || '')
  .toUpperCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ').trim();

// Returns {suggestion} if a near-match is found (≠ exact); null otherwise.
// `brandsList` defaults to the global BRANDS but can be overridden so the admin's edited list takes effect.
const suggestBrand = (input, brandsList = BRANDS) => {
  const norm = normalizeBrand(input);
  if (!norm || norm.length < 4) return null;
  // Exact match (already on the list) → no suggestion
  if (brandsList.some(b => normalizeBrand(b) === norm)) return null;
  let best = null;
  for (const b of brandsList) {
    const target = normalizeBrand(b);
    const d = levenshtein(norm, target);
    // Threshold scales gently with length
    const maxD = Math.max(2, Math.floor(Math.min(norm.length, target.length) / 5));
    if (d <= maxD && (!best || d < best.dist)) {
      best = { brand: b, dist: d };
    }
  }
  return best ? { suggestion: best.brand, dist: best.dist } : null;
};
const TYPES = ['PCR','LT','TBR','OTR'];
const ESTADOS = ['Nueva','Usada'];
const CONDICIONES = ['Excelente','Como nuevo','Reparada','Garantía','Para revisar'];
const UBICACIONES = ['Piso 1','Piso 2','Rack A-12','Bodega A','Bodega B'];
const PROPIEDADES = ['Salvallanta','Cliente'];

// Metadata for the Listas de selección admin screen.
// `min` = how many entries are required to keep the dropdown usable.
const LISTAS_META = [
  { key: 'tipos',       label: 'Tipos',       sub: 'Categoría comercial de la llanta',     icon: 'category',     hint: 'Ej: PCR, LT, TBR, OTR',                       min: 1, max: 30 },
  { key: 'estados',     label: 'Estados',     sub: 'Si la llanta es nueva o usada',         icon: 'auto_awesome', hint: 'Ej: Nueva, Usada, Reencauchada',              min: 1, max: 10 },
  { key: 'condiciones', label: 'Condiciones', sub: 'Diagnóstico físico al ingresar',        icon: 'health_and_safety', hint: 'Ej: Excelente, Reparada, Para revisar',  min: 1, max: 20 },
  { key: 'ubicaciones', label: 'Ubicaciones', sub: 'Pisos, racks o bodegas',                icon: 'location_on',  hint: 'Ej: Piso 1, Bodega A, Rack 12',               min: 1, max: 80 },
  { key: 'propiedades', label: 'Propiedades', sub: 'A quién pertenece la llanta',           icon: 'badge',        hint: 'Ej: Salvallanta, Cliente, Consignación',      min: 1, max: 10 },
  { key: 'marcas',      label: 'Marcas',      sub: 'Catálogo para autocompletado y validación', icon: 'sell',     hint: 'Ej: MICHELIN, BRIDGESTONE, LINGLONG',         min: 1, max: 500 },
];

const LISTAS_DEFAULT = {
  tipos:       [...TYPES],
  estados:     [...ESTADOS],
  condiciones: [...CONDICIONES],
  ubicaciones: [...UBICACIONES],
  propiedades: [...PROPIEDADES],
  marcas:      [...BRANDS],
};

// ─── Tire health helpers ───────────────────────────────────────────

// Classify a tread depth value (mm)
const classifyProf = (mmValue) => {
  if (mmValue === '' || mmValue == null || isNaN(parseFloat(mmValue))) return null;
  const v = parseFloat(mmValue);
  if (v >= 4.0) return { tier: 'ok',   label: 'Seguro',   color: 'ok',   bg: 'bg-ok-soft',     text: 'text-ok',   ring: 'border-ok/50' };
  if (v >= 2.0) return { tier: 'warn', label: 'Precaución', color: 'warn', bg: 'bg-warn-soft', text: 'text-warn', ring: 'border-warn/50' };
  return                { tier: 'err', label: 'Crítico',  color: 'err',  bg: 'bg-err-soft',    text: 'text-err',  ring: 'border-err/60' };
};

// Diagnose wear pattern across three measurements
const diagnoseProf = ({ ext, cent, inter }) => {
  const e = parseFloat(ext), c = parseFloat(cent), i = parseFloat(inter);
  if (isNaN(e) || isNaN(c) || isNaN(i)) return null;
  const range = Math.max(e, c, i) - Math.min(e, c, i);
  if (range < 1.0) return null; // uniform — no specific diagnosis

  // Both edges noticeably worse than center → low pressure
  if (e < c - 0.6 && i < c - 0.6) {
    return {
      tier: 'warn',
      icon: 'compress',
      title: 'Posible baja presión de inflado',
      message: 'Los bordes externo e interno están más gastados que el centro. Verifique la presión y aumente al valor recomendado por el fabricante.',
    };
  }
  // Center worse than both edges → high pressure
  if (c < e - 0.6 && c < i - 0.6) {
    return {
      tier: 'warn',
      icon: 'expand',
      title: 'Posible exceso de presión',
      message: 'El centro está más gastado que los bordes. Reduzca la presión al valor recomendado y revise la válvula.',
    };
  }
  // Only one shoulder worse → alignment / camber
  if (Math.abs(e - i) >= 1.2) {
    const ladoGastado = e < i ? 'externo' : 'interno';
    return {
      tier: 'warn',
      icon: 'build',
      title: `Posible problema de alineación (borde ${ladoGastado})`,
      message: `El borde ${ladoGastado} está significativamente más gastado. Revise alineación y ángulo de camber del vehículo.`,
    };
  }
  // Irregular pattern not matching above
  return {
    tier: 'warn',
    icon: 'engineering',
    title: 'Desgaste irregular',
    message: 'Los valores varían considerablemente sin un patrón claro. Sugerencia: revisar suspensión, amortiguadores y rotación de llantas.',
  };
};

// Validate DOT (4 digits, WWYY). Returns rich object.
const validateDOT = (dot) => {
  if (!dot) return { complete: false };
  if (dot.length < 4) return { complete: false, partial: true };
  if (!/^\d{4}$/.test(dot)) return { complete: true, valid: false, error: 'El DOT debe ser numérico de 4 dígitos.' };
  const week = parseInt(dot.slice(0, 2), 10);
  const yy = parseInt(dot.slice(2, 4), 10);
  if (week < 1 || week > 53) {
    return { complete: true, valid: false, error: `Semana ${String(week).padStart(2,'0')} inválida — debe estar entre 01 y 53.` };
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentYY = currentYear % 100;
  if (yy > currentYY) {
    return { complete: true, valid: false, error: `Año 20${String(yy).padStart(2,'0')} no puede ser futuro (actual: ${currentYear}).` };
  }
  const year = 2000 + yy;
  // current week (rough ISO-ish)
  const startOfYear = new Date(currentYear, 0, 1);
  const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
  const currentWeek = Math.ceil((dayOfYear + startOfYear.getDay()) / 7);
  if (year === currentYear && week > currentWeek) {
    return { complete: true, valid: false, error: `Semana ${week} del ${year} aún no ha ocurrido (semana actual: ${currentWeek}).` };
  }
  // Compute approximate age in years using fabrication week
  const fabDate = new Date(year, 0, 1);
  fabDate.setDate(fabDate.getDate() + (week - 1) * 7);
  const ageYears = (now - fabDate) / (365.25 * 86400000);
  const ageInt = Math.floor(ageYears);

  let tier, message;
  if (ageYears < 6) {
    tier = 'ok';
    message = `Llanta de ${ageInt} año${ageInt===1?'':'s'} — Óptimo`;
  } else if (ageYears < 10) {
    tier = 'warn';
    message = `Llanta de ${ageInt} años — requiere inspección visual obligatoria buscando grietas antes de la venta.`;
  } else {
    tier = 'critical';
    message = `Llanta de ${ageInt} años — no apta para venta. Solo debe registrarse con fines de control o reciclaje.`;
  }
  return { complete: true, valid: true, week, year, ageYears, ageInt, tier, message };
};

// Combine prof + DOT into an overall verdict for used-tire decision-making
const recommendUsedTire = ({ profundimetro, dotResult, estado }) => {
  const values = ['ext','cent','inter'].map(k => parseFloat(profundimetro?.[k])).filter(v => !isNaN(v));
  const minProf = values.length ? Math.min(...values) : null;

  // Map prof to tier
  let profTier = null;
  if (minProf !== null) {
    if (minProf < 2.0) profTier = 'critical';
    else if (minProf < 4.0) profTier = 'warn';
    else profTier = 'ok';
  }
  // Map DOT to tier
  let dotTier = null;
  if (dotResult?.complete && dotResult?.valid) dotTier = dotResult.tier;
  else if (dotResult?.complete && !dotResult?.valid) dotTier = 'critical';

  // Combine: worst wins
  const order = { ok: 0, warn: 1, critical: 2 };
  const tiers = [profTier, dotTier].filter(Boolean);
  if (!tiers.length) return null;
  const worst = tiers.reduce((a, b) => order[a] >= order[b] ? a : b);

  if (worst === 'ok') return {
    tier: 'ok',
    title: 'Apta para venta',
    message: estado === 'Nueva'
      ? 'Llanta nueva con todos los indicadores en verde.'
      : 'Indicadores en verde — puede comercializarse y almacenarse normalmente.',
    icon: 'verified',
  };
  if (worst === 'warn') return {
    tier: 'warn',
    title: 'Apta con inspección o descuento',
    message: 'Algún indicador en amarillo. Realice inspección visual completa antes de exhibir; considere venta con descuento o cliente informado.',
    icon: 'warning',
  };
  return {
    tier: 'critical',
    title: 'No apta para venta',
    message: 'Indicadores en rojo o DOT inválido. Solo debe ingresarse al inventario con fines de control o disposición final / reciclaje.',
    icon: 'dangerous',
  };
};

const fmtCOP = (n) => '$' + n.toLocaleString('es-CO');
const today = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};
const nextCode = (tires) => {
  const nums = tires.map(t => parseInt(String(t.code).replace(/\D/g,''))).filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : 5000;
  return 'LLV-' + (max + 1);
};

Object.assign(window, {
  USERS, ROLES, TIRES, CATALOGS,
  BRANDS, TYPES, ESTADOS, CONDICIONES, UBICACIONES, PROPIEDADES,
  LISTAS_META, LISTAS_DEFAULT,
  fmtCOP, today, nextCode,
  levenshtein, normalizeBrand, suggestBrand,
  classifyProf, diagnoseProf, validateDOT, recommendUsedTire,
});
