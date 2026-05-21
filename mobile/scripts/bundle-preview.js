// bundle-preview.js -- genera HTML auto-contenido para abrir desde file://
// Usa función como reemplazo en .replace() para evitar interpretación de $'
const fs = require('fs');
const path = require('path');
const WWW = path.resolve(__dirname, '..', 'www');
const OUT = path.resolve(__dirname, '..', 'preview.html');
const JSX_FILES = [
  'data.jsx', 'ui.jsx', 'etiqueta.jsx',
  'screens-main.jsx', 'screens-flows.jsx', 'screens-admin.jsx',
  'app-mobile.jsx',
];
let html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
const inline = JSX_FILES.map((f) => {
  const code = fs.readFileSync(path.join(WWW, f), 'utf8');
  return '// --- ' + f + ' ---\n' + code;
}).join('\n\n');
html = html.replace(/<script\s+type="text\/babel"\s+src="[^"]+\.jsx"><\/script>\s*/g, '');

const errorCatcher = [
  '<script>',
  'window.addEventListener("error", function (e) {',
  '  var root = document.getElementById("root");',
  '  if (root && !root.hasChildNodes()) {',
  '    var msg = (e.message || "") + "\\n\\n" + (e.filename || "") + " (linea " + (e.lineno || "?") + ")";',
  '    if (e.error && e.error.stack) msg += "\\n\\n" + e.error.stack;',
  '    root.innerHTML = "<pre style=\\"padding:20px;font-family:monospace;font-size:12px;color:#900;background:#fee;border:1px solid #f99;border-radius:6px;margin:20px;white-space:pre-wrap;word-wrap:break-word;\\"><b>Error al cargar la app:</b>\\n\\n" + msg + "</pre>";',
  '  }',
  '});',
  '</script>',
].join('\n') + '\n';

const injection = errorCatcher + '<script type="text/babel">\n' + inline + '\n</script>\n';
html = html.replace('</body>', function () { return injection + '</body>'; });

fs.writeFileSync(OUT, html);
console.log('Generado: ' + OUT);
console.log('Tamano: ' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
