// sync-web.js -- copia los .jsx desde la raíz del proyecto a mobile/www/
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const DEST = path.resolve(__dirname, '..', 'www');
const SHARED_FILES = [
  'data.jsx', 'ui.jsx', 'etiqueta.jsx',
  'screens-main.jsx', 'screens-flows.jsx', 'screens-admin.jsx',
];
let copied = 0, missing = 0;
for (const f of SHARED_FILES) {
  const src = path.join(ROOT, f);
  const dst = path.join(DEST, f);
  if (!fs.existsSync(src)) { console.warn('  ! Falta en la raíz: ' + f); missing++; continue; }
  fs.copyFileSync(src, dst);
  console.log('  + ' + f);
  copied++;
}
console.log('\nCopiados ' + copied + ' archivos' + (missing ? ' (faltaron ' + missing + ')' : ''));
