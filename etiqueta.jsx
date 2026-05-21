// Tire shelf label — printable sticker for Bluetooth thermal printers.
// Designed to be readable from the floor up to 3 shelves high.

// ─── Code 128 (subset B) encoder ─────────────────────────────────────
// Real, scannable barcode. We use Code Set B (uppercase, digits, common ASCII).
const C128_PATTERNS = [
  "11011001100","11001101100","11001100110","10010011000","10010001100",
  "10001001100","10011001000","10011000100","10001100100","11001001000",
  "11001000100","11000100100","10110011100","10011011100","10011001110",
  "10111001100","10011101100","10011100110","11001110010","11001011100",
  "11001001110","11011100100","11001110100","11101101110","11101001100",
  "11100101100","11100100110","11101100100","11100110100","11100110010",
  "11011011000","11011000110","11000110110","10100011000","10001011000",
  "10001000110","10110001000","10001101000","10001100010","11010001000",
  "11000101000","11000100010","10110111000","10110001110","10001101110",
  "10111011000","10111000110","10001110110","11101110110","11010001110",
  "11000101110","11011101000","11011100010","11011101110","11101011000",
  "11101000110","11100010110","11101101000","11101100010","11100011010",
  "11101111010","11001000010","11110001010","10100110000","10100001100",
  "10010110000","10010000110","10000101100","10000100110","10110010000",
  "10110000100","10011010000","10011000010","10000110100","10000110010",
  "11000010010","11001010000","11110111010","11000010100","10001111010",
  "10100111100","10010111100","10010011110","10111100100","10011110100",
  "10011110010","11110100100","11110010100","11110010010","11011011110",
  "11011110110","11110110110","10101111000","10100011110","10001011110",
  "10111101000","10111100010","11110101000","11110100010","10111011110",
  "10111101110","11101011110","11110101110","11010000100","11010010000",
  "11010011100","11000111010"
];
const C128_STOP = "1100011101011";

function encodeCode128B(text) {
  // Codes 0..94 in Code Set B correspond to ASCII 32..126
  const data = String(text || '');
  const values = [104]; // Start Code B
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    // clamp to printable ASCII
    const v = (c >= 32 && c <= 126) ? c - 32 : 0;
    values.push(v);
  }
  // Checksum = (start + sum(value_i * position_i)) mod 103
  let sum = values[0];
  for (let i = 1; i < values.length; i++) sum += values[i] * i;
  values.push(sum % 103);
  // Build the bar pattern
  let bits = '';
  for (const v of values) bits += C128_PATTERNS[v];
  bits += C128_STOP;
  return bits;
}

// ─── Barcode renderer (SVG) ──────────────────────────────────────────
const Barcode128 = ({ value, height = 56, moduleWidth = 2, showText = true, className = '' }) => {
  const bits = useMemo(() => encodeCode128B(value), [value]);
  const width = bits.length * moduleWidth;
  // Build run-length groups so we draw 1 rect per dark run.
  const runs = [];
  let i = 0;
  while (i < bits.length) {
    let j = i;
    while (j < bits.length && bits[j] === bits[i]) j++;
    if (bits[i] === '1') runs.push({ x: i * moduleWidth, w: (j - i) * moduleWidth });
    i = j;
  }
  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        style={{ display: 'block' }}
      >
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
        {runs.map((r, idx) => (
          <rect key={idx} x={r.x} y="0" width={r.w} height={height} fill="#000000" />
        ))}
      </svg>
      {showText && (
        <div
          className="text-center font-mono tracking-[0.18em] text-black mt-0.5"
          style={{ fontSize: 11, fontWeight: 700 }}
        >{value}</div>
      )}
    </div>
  );
};

// ─── The label itself ────────────────────────────────────────────────
// Two sizes mapped to common BT thermal printer widths:
//   58mm → ~220px paper @ 96dpi (compact)
//   80mm → ~302px paper @ 96dpi (large, easier to read from afar)
const LABEL_SIZES = {
  '58': { paper: 240, padX: 12, padY: 14, brandSize: 32, refSize: 42, patternSize: 16, dotSize: 30, codeSize: 22, barcodeH: 54, mod: 1.8 },
  '80': { paper: 320, padX: 16, padY: 18, brandSize: 44, refSize: 56, patternSize: 20, dotSize: 38, codeSize: 28, barcodeH: 70, mod: 2.4 },
};

const TireLabel = React.forwardRef(({ tire, size = '80', copyIndex, copyTotal }, ref) => {
  if (!tire) return null;
  const cfg = LABEL_SIZES[size] || LABEL_SIZES['80'];
  return (
    <div
      ref={ref}
      className="bg-white text-black font-sans select-none"
      style={{
        width: cfg.paper,
        padding: `${cfg.padY}px ${cfg.padX}px`,
        fontFamily: 'Inter, system-ui, sans-serif',
        // crisp print look
        boxShadow: '0 0 0 1px #000',
      }}
    >
      {/* Header band */}
      <div
        className="flex items-center justify-between text-white font-bold"
        style={{
          background: '#000',
          padding: `4px ${size === '80' ? 10 : 8}px`,
          margin: `${-cfg.padY}px ${-cfg.padX}px 8px`,
          fontSize: size === '80' ? 13 : 11,
          letterSpacing: '0.18em',
        }}
      >
        <span>SALVALLANTA</span>
        <span style={{ fontSize: size === '80' ? 10 : 9, opacity: 0.85, letterSpacing: '0.1em' }}>
          INVENTARIO
        </span>
      </div>

      {/* Brand — biggest "shout from the floor" element */}
      <div
        className="font-black leading-none uppercase"
        style={{ fontSize: cfg.brandSize, letterSpacing: '-0.01em', textWrap: 'balance' }}
      >
        {tire.brand || '—'}
      </div>

      {/* Reference — the size designation, also huge */}
      <div
        className="font-black leading-none tabular-nums mt-1.5"
        style={{ fontSize: cfg.refSize, letterSpacing: '-0.02em' }}
      >
        {tire.ref || '—'}
      </div>

      {/* Pattern / grabado */}
      {tire.pattern && tire.pattern !== '—' && (
        <div
          className="font-semibold uppercase leading-tight mt-1.5"
          style={{ fontSize: cfg.patternSize, letterSpacing: '0.04em' }}
        >
          {tire.pattern}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 2, background: '#000', margin: `${size === '80' ? 12 : 10}px 0` }} />

      {/* DOT + CODIGO — boxed, like a price tag */}
      <div className="grid grid-cols-2 gap-2">
        <div style={{ border: '2px solid #000', padding: '4px 8px' }}>
          <div
            className="font-bold uppercase"
            style={{ fontSize: size === '80' ? 10 : 9, letterSpacing: '0.18em', lineHeight: 1 }}
          >DOT</div>
          <div
            className="font-black font-mono tabular-nums leading-none"
            style={{ fontSize: cfg.dotSize, marginTop: 2 }}
          >{tire.dot || '----'}</div>
        </div>
        <div style={{ border: '2px solid #000', padding: '4px 8px' }}>
          <div
            className="font-bold uppercase"
            style={{ fontSize: size === '80' ? 10 : 9, letterSpacing: '0.18em', lineHeight: 1 }}
          >Código</div>
          <div
            className="font-black font-mono leading-none whitespace-nowrap overflow-hidden"
            style={{
              fontSize: cfg.codeSize,
              marginTop: 4,
              // Auto-shrink so long codes always fit one line
              transform: `scaleX(${Math.min(1, 9 / Math.max(6, (tire.code || '').length))})`,
              transformOrigin: 'left center',
            }}
          >{tire.code || '—'}</div>
        </div>
      </div>

      {/* Barcode */}
      <div className="mt-3">
        <Barcode128 value={tire.code || '0'} height={cfg.barcodeH} moduleWidth={cfg.mod} />
      </div>

      {/* Footer — meta line. Small but present. */}
      <div
        className="flex items-center justify-between mt-2 pt-1.5"
        style={{ borderTop: '1px dashed #000', fontSize: size === '80' ? 10 : 9 }}
      >
        <span className="font-mono">{(tire.ubicacion || '—').toUpperCase()}</span>
        {copyTotal > 1 && (
          <span className="font-bold tabular-nums">{copyIndex}/{copyTotal}</span>
        )}
        <span className="font-mono opacity-70">{today()}</span>
      </div>
    </div>
  );
});

// ─── Bluetooth printer fake-state helpers ────────────────────────────
const PRINTER_KEY = 'salva.printer';
const loadPrinter = () => {
  try { return JSON.parse(localStorage.getItem(PRINTER_KEY) || 'null'); }
  catch { return null; }
};
const savePrinter = (p) => {
  if (p) localStorage.setItem(PRINTER_KEY, JSON.stringify(p));
  else   localStorage.removeItem(PRINTER_KEY);
};

const FAKE_PRINTERS = [
  { id: 'salva58', name: 'Salva-58',    model: 'Térmica 58mm · Bluetooth' },
  { id: 'pt80',    name: 'PT-80 Móvil', model: 'Térmica 80mm · Bluetooth' },
  { id: 'mpos',    name: 'mPOS-A8',     model: 'Térmica 58mm · Bluetooth' },
];

// ─── Printer picker modal ────────────────────────────────────────────
const PrinterPickerModal = ({ open, onClose, onPick }) => {
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState([]);
  useEffect(() => {
    if (!open) return;
    setScanning(true);
    setFound([]);
    // Reveal printers one by one to feel like a real BT scan
    const timers = FAKE_PRINTERS.map((p, i) =>
      setTimeout(() => setFound(f => [...f, p]), 500 + i * 600)
    );
    const stopAt = setTimeout(() => setScanning(false), 500 + FAKE_PRINTERS.length * 600 + 300);
    return () => { timers.forEach(clearTimeout); clearTimeout(stopAt); };
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buscar impresora Bluetooth"
      footer={<SecondaryButton onClick={onClose} className="w-full">Cancelar</SecondaryButton>}
    >
      <div className="pt-1 pb-2">
        <div className="flex items-center gap-2 text-[12.5px] text-ink-soft mb-3">
          <Icon name="bluetooth_searching" className={scanning ? 'animate-pulse text-primary' : 'text-ink-soft'} style={{ fontSize: 18 }} />
          {scanning ? 'Buscando dispositivos cercanos…' : `${found.length} dispositivo${found.length===1?'':'s'} encontrado${found.length===1?'':'s'}`}
        </div>
        <ul className="space-y-2">
          {found.map(p => (
            <li key={p.id}>
              <button
                onClick={() => { savePrinter(p); onPick(p); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-white border border-outline-soft hover:border-primary active:scale-[0.99] transition text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Icon name="print" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-primary">{p.name}</div>
                  <div className="text-[12px] text-ink-soft truncate">{p.model}</div>
                </div>
                <Icon name="chevron_right" className="text-ink-soft" />
              </button>
            </li>
          ))}
          {scanning && Array.from({ length: Math.max(0, FAKE_PRINTERS.length - found.length) }).map((_, i) => (
            <li key={`sk-${i}`} className="h-[64px] rounded-xl bg-surface-lo border border-outline-soft/60 animate-pulse" />
          ))}
        </ul>
        {!scanning && (
          <div className="mt-3 text-[11.5px] text-ink-soft leading-relaxed">
            <Icon name="info" style={{ fontSize: 14 }} className="align-text-bottom mr-1" />
            Asegúrese de tener encendida la impresora y el Bluetooth del teléfono.
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Etiqueta (print preview) modal ──────────────────────────────────
const EtiquetaModal = ({ open, onClose, tire, onPrinted }) => {
  const [copies, setCopies] = useState(1);
  const [size, setSize] = useState('80');             // '58' | '80'
  const [printer, setPrinter] = useState(() => loadPrinter());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [progress, setProgress] = useState(null);     // {sent, total} | null
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setCopies(Math.min(tire?.qty || 1, 4));
      setSize('80');
      setProgress(null);
      setDone(false);
    }
  }, [open, tire?.code]);

  if (!tire) return null;

  const startPrint = () => {
    if (!printer) { setPickerOpen(true); return; }
    setProgress({ sent: 0, total: copies });
    let i = 0;
    const tick = () => {
      i += 1;
      setProgress({ sent: i, total: copies });
      if (i < copies) setTimeout(tick, 700);
      else {
        setTimeout(() => {
          setDone(true);
          setProgress(null);
          onPrinted && onPrinted(copies);
        }, 400);
      }
    };
    setTimeout(tick, 500);
  };

  return (
    <Modal
      open={open}
      onClose={progress ? undefined : onClose}
      title={done ? 'Etiquetas enviadas' : 'Imprimir etiqueta'}
      footer={
        done ? (
          <PrimaryButton onClick={onClose} icon="check_circle" className="w-full">Cerrar</PrimaryButton>
        ) : progress ? (
          <div className="w-full">
            <div className="text-center text-[12.5px] text-ink-soft mb-2">
              Enviando {progress.sent} de {progress.total}…
            </div>
            <div className="h-2 rounded-full bg-surface-mid overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(progress.sent / progress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton>
            <PrimaryButton
              onClick={startPrint}
              icon={printer ? 'print' : 'bluetooth_searching'}
              className="flex-[1.6]"
            >
              {printer ? `Imprimir ${copies}` : 'Conectar e imprimir'}
            </PrimaryButton>
          </div>
        )
      }
    >
      <div className="pt-1 pb-2 space-y-4">
        {done ? (
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-14 h-14 rounded-full bg-ok-soft text-ok flex items-center justify-center">
              <Icon name="check_circle" fill style={{ fontSize: 36 }} />
            </div>
            <div className="mt-3 font-bold text-primary">
              {copies} {copies === 1 ? 'etiqueta enviada' : 'etiquetas enviadas'}
            </div>
            <div className="text-[12.5px] text-ink-soft mt-1">
              Verifique en {printer?.name || 'la impresora'}.
            </div>
          </div>
        ) : (
          <>
            {/* Label preview — checkered backdrop suggests "this is paper" */}
            <div
              className="rounded-xl p-4 flex justify-center overflow-x-auto"
              style={{
                background:
                  'repeating-conic-gradient(#eee 0 25%, #f7f7f7 0 50%) 0 0/16px 16px',
              }}
            >
              <TireLabel tire={tire} size={size} copyIndex={1} copyTotal={copies} />
            </div>

            {/* Size selector */}
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5">
                Tamaño de papel
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: '58', label: '58 mm', sub: 'Compacto' },
                  { v: '80', label: '80 mm', sub: 'Recomendado · estantería' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setSize(opt.v)}
                    className={`p-2.5 rounded-lg border text-left transition active:scale-[0.99] ${
                      size === opt.v
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-white border-outline-soft text-ink hover:border-primary/60'
                    }`}
                  >
                    <div className="font-bold text-[14px] leading-none">{opt.label}</div>
                    <div className={`text-[11px] mt-1 ${size === opt.v ? 'text-white/75' : 'text-ink-soft'}`}>
                      {opt.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Copies */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                  Copias
                </div>
                <div className="text-[11px] text-ink-soft">
                  Existencias: <span className="font-semibold text-ink">{tire.qty}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-36"><Counter value={copies} onChange={setCopies} min={1} max={Math.max(20, tire.qty || 20)} /></div>
                <button
                  type="button"
                  onClick={() => setCopies(tire.qty || 1)}
                  className="h-9 px-2.5 rounded-lg bg-surface-white border border-outline-soft hover:border-primary hover:text-primary text-ink-soft text-[12px] font-semibold active:scale-95"
                >
                  Una por unidad ({tire.qty})
                </button>
              </div>
            </div>

            {/* Printer status */}
            <div
              className={`rounded-xl p-3 border flex items-center gap-3 ${
                printer
                  ? 'bg-ok-soft/40 border-ok/40'
                  : 'bg-warn-soft/60 border-warn/40'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                printer ? 'bg-ok text-white' : 'bg-warn text-white'
              }`}>
                <Icon name={printer ? 'print' : 'bluetooth_disabled'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">
                  {printer ? 'Impresora conectada' : 'Sin impresora'}
                </div>
                <div className="font-bold text-ink truncate">
                  {printer ? printer.name : 'Toque para buscar dispositivos Bluetooth'}
                </div>
                {printer && (
                  <div className="text-[11.5px] text-ink-soft truncate">{printer.model}</div>
                )}
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="shrink-0 h-9 px-2.5 rounded-lg bg-surface-white border border-outline-soft hover:border-primary text-ink-soft hover:text-primary text-[12px] font-semibold active:scale-95"
              >
                {printer ? 'Cambiar' : 'Buscar'}
              </button>
            </div>
          </>
        )}
      </div>

      <PrinterPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(p) => { setPrinter(p); setPickerOpen(false); }}
      />
    </Modal>
  );
};

Object.assign(window, { TireLabel, Barcode128, EtiquetaModal });
