// Flow screens: Agregar/Editar Llantas, Vender, ResumenVenta

// ─── Agregar / Editar ──────────────────────────────────────────────
const AgregarScreen = ({ onCancel, onSave, tires, editing, listas }) => {
  const isEdit = !!editing;
  const L = listas || LISTAS_DEFAULT;
  const TYPES_L = L.tipos, ESTADOS_L = L.estados, CONDICIONES_L = L.condiciones,
        UBICACIONES_L = L.ubicaciones, PROPIEDADES_L = L.propiedades, BRANDS_L = L.marcas;

  const makeInitial = () => editing ? {
    fecha: today(),
    code: editing.code,
    ref: editing.ref || '',
    brand: editing.brand || '',
    pattern: editing.pattern === '—' ? '' : (editing.pattern || ''),
    dot: editing.dot || '',
    qty: editing.qty || 1,
    type: editing.type || '',
    estado: editing.estado || '',
    condicion: editing.condicion || '',
    ubicacion: editing.ubicacion || '',
    prop: editing.prop || '',
    profundimetro: editing.profundimetro
      ? { ext: editing.profundimetro.ext ?? '', cent: editing.profundimetro.cent ?? '', inter: editing.profundimetro.inter ?? '' }
      : { ext: '', cent: '', inter: '' },
    precio: editing.precio ?? '',
    photos: (editing.photos && editing.photos.length === 4) ? [...editing.photos] : [null, null, null, null],
  } : {
    fecha: today(),
    code: nextCode(tires),
    ref: '',
    brand: '',
    pattern: '',
    dot: '',
    qty: 1,
    type: '',
    estado: '',
    condicion: '',
    ubicacion: '',
    prop: '',
    profundimetro: { ext: '', cent: '', inter: '' },
    precio: '',
    photos: [null, null, null, null],
  };

  const initialRef = useRef(makeInitial());
  const [form, setForm] = useState(initialRef.current);
  // Re-seed when editing target changes
  useEffect(() => { const fresh = makeInitial(); initialRef.current = fresh; setForm(fresh); }, [editing?.code]);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [brandSuggestion, setBrandSuggestion] = useState(null); // {typed, suggestion}

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateProf = (k, v) => {
    if (v === '') return setForm(f => ({ ...f, profundimetro: { ...f.profundimetro, [k]: '' } }));
    const n = parseFloat(v);
    if (isNaN(n)) return;
    const clamped = Math.min(17, Math.max(0, n));
    setForm(f => ({ ...f, profundimetro: { ...f.profundimetro, [k]: clamped } }));
  };
  const updatePhoto = (i, v) => setForm(f => ({ ...f, photos: f.photos.map((p, idx) => idx === i ? v : p) }));

  // Normalize reference on blur: "215/45r18" → "215/45 R18"
  const normalizeRef = () => {
    if (!form.ref) return;
    const m = form.ref.replace(/\s+/g, '').match(/^(\d{2,3})\/(\d{2,3})([rzRZ])(\d{2})(.*)$/);
    if (m) {
      const normalized = `${m[1]}/${m[2]} ${m[3].toUpperCase()}${m[4]}${m[5] || ''}`.toUpperCase();
      if (normalized !== form.ref) setForm(f => ({ ...f, ref: normalized }));
    }
  };

  // DOT validation: must be exactly 4 digits (or empty before user types)
  const dotError = form.dot && form.dot.length > 0 && form.dot.length < 4
    ? `Faltan ${4 - form.dot.length} dígito${4-form.dot.length===1?'':'s'} (debe ser exactamente 4)`
    : null;

  // Tire health analysis
  const dotResult = useMemo(() => validateDOT(form.dot), [form.dot]);
  const profDiagnosis = useMemo(() => diagnoseProf(form.profundimetro), [form.profundimetro]);
  const verdict = useMemo(() =>
    recommendUsedTire({ profundimetro: form.profundimetro, dotResult, estado: form.estado }),
    [form.profundimetro, dotResult, form.estado]
  );

  // 10+ years requires explicit acknowledgement
  const [ackOldTire, setAckOldTire] = useState(false);
  useEffect(() => { setAckOldTire(false); }, [dotResult?.tier]);
  const dotCritical = dotResult?.complete && (dotResult.tier === 'critical' || !dotResult.valid);

  const valid =
    form.ref && form.brand && form.dot.length === 4 &&
    form.type && form.estado && form.condicion && form.ubicacion && form.prop &&
    form.precio !== '' && form.precio > 0 &&
    // DOT must validate cleanly
    (dotResult?.valid) &&
    // Critical-age tires require ack
    (!dotCritical || ackOldTire);

  // Compute diff between initial and current
  const diff = useMemo(() => {
    const init = initialRef.current;
    const labels = {
      ref: 'Referencia', brand: 'Marca', pattern: 'Grabado', dot: 'DOT',
      qty: 'Cantidad', type: 'Tipo', estado: 'Estado', condicion: 'Condición',
      ubicacion: 'Ubicación', prop: 'Propiedad', precio: 'Precio sugerido',
    };
    const changes = [];
    Object.keys(labels).forEach(k => {
      if (String(form[k] ?? '') !== String(init[k] ?? '')) {
        changes.push({ key: k, label: labels[k], from: init[k], to: form[k] });
      }
    });
    // profundimetro diff
    ['ext','cent','inter'].forEach(k => {
      const a = init.profundimetro?.[k];
      const b = form.profundimetro?.[k];
      if (String(a ?? '') !== String(b ?? '')) {
        changes.push({ key: 'prof_'+k, label: `Profundímetro · ${k === 'ext' ? 'Ext' : k === 'cent' ? 'Cent' : 'Inter'}`, from: a, to: b });
      }
    });
    // photos count
    const photosBefore = (init.photos || []).filter(Boolean).length;
    const photosAfter = (form.photos || []).filter(Boolean).length;
    if (photosBefore !== photosAfter) {
      changes.push({ key: 'photos', label: 'Fotos', from: `${photosBefore} / 4`, to: `${photosAfter} / 4` });
    }
    return changes;
  }, [form]);

  const isDirty = diff.length > 0;

  const handleCancelClick = () => {
    if (isDirty) setCancelOpen(true);
    else onCancel();
  };
  const handleSaveClick = () => {
    if (!valid) return;
    if (isEdit) setConfirmEditOpen(true);
    else setConfirmAddOpen(true);
  };

  const titleIcon = isEdit ? 'edit' : 'add_circle';
  const titleText = isEdit ? 'Editar Llanta' : 'Agregar Llantas';

  return (
    <div className="screen-enter px-5 py-5">
      <div className="flex items-center gap-2 mb-5">
        <Icon name={titleIcon} className="text-primary" fill />
        <h2 className="text-[22px] font-bold text-primary">{titleText}</h2>
      </div>

      <form onSubmit={(e)=>{ e.preventDefault(); handleSaveClick(); }} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha"><TextInput value={form.fecha} readOnly /></Field>
          <Field label="Código"><TextInput value={form.code} readOnly /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Referencia">
            <input
              type="text"
              value={form.ref ?? ''}
              onChange={e=>update('ref', e.target.value.toUpperCase())}
              onBlur={normalizeRef}
              placeholder="ej: 215/45 R17"
              className="h-11 w-full pl-3.5 pr-3.5 bg-surface-white border border-outline-soft rounded-lg text-[15px] text-ink placeholder:text-outline/80 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
            />
          </Field>
          <Field label="Marca">
            <input
              type="text"
              value={form.brand ?? ''}
              onChange={e=>update('brand', e.target.value.toUpperCase())}
              onBlur={() => {
                if (!form.brand) return;
                const hit = suggestBrand(form.brand, BRANDS_L);
                if (hit) setBrandSuggestion({ typed: form.brand, suggestion: hit.suggestion });
              }}
              placeholder="ej: MICHELIN, LINGLONG…"
              style={{ textTransform: 'uppercase' }}
              className="h-11 w-full pl-3.5 pr-3.5 bg-surface-white border border-outline-soft rounded-lg text-[15px] text-ink placeholder:text-outline/80 placeholder:normal-case focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Grabado" className="col-span-2">
            <TextInput
              value={form.pattern}
              onChange={e=>update('pattern', e.target.value)}
              placeholder="ej: TERRAMAX AT"
              uppercase
            />
          </Field>
          <Field
            label="DOT"
            error={dotError || (dotResult?.complete && !dotResult.valid ? dotResult.error : null)}
            hint={!dotError && dotResult?.valid && dotResult.tier === 'ok' ? dotResult.message : undefined}
          >
            <input
              type="text"
              inputMode="numeric"
              value={form.dot ?? ''}
              onChange={e=>update('dot', e.target.value.replace(/\D/g,'').slice(0,4))}
              placeholder="2321"
              maxLength={4}
              className={`h-11 w-full pl-3.5 pr-3.5 rounded-lg text-[15px] tabular-nums focus:outline-none focus:ring-2 transition
                ${dotError || (dotResult?.complete && !dotResult.valid)
                  ? 'bg-err-soft/40 border border-err text-err focus:border-err focus:ring-err/20'
                  : dotResult?.valid && dotResult.tier === 'critical'
                    ? 'bg-err-soft/40 border border-err text-err focus:border-err focus:ring-err/20'
                    : dotResult?.valid && dotResult.tier === 'warn'
                      ? 'bg-warn-soft/60 border border-warn text-[#6b4a10] focus:border-warn focus:ring-warn/20'
                      : dotResult?.valid && dotResult.tier === 'ok'
                        ? 'bg-ok-soft/40 border border-ok/50 text-ok focus:border-ok focus:ring-ok/20'
                        : 'bg-surface-white border border-outline-soft text-ink focus:border-primary focus:ring-primary/15'}`}
            />
          </Field>
        </div>

        {/* DOT age warning for 6-9 yr / critical for 10+ */}
        {dotResult?.valid && dotResult.tier !== 'ok' && (
          <div className={`-mt-2 rounded-lg px-3 py-2 flex items-start gap-2 text-[12px] ${
            dotResult.tier === 'critical' ? 'bg-err-soft text-err' : 'bg-warn-soft text-[#6b4a10]'
          }`}>
            <Icon name={dotResult.tier === 'critical' ? 'dangerous' : 'warning'} style={{ fontSize: 18 }} className="shrink-0 mt-px" />
            <div>
              <div className="font-bold">{dotResult.tier === 'critical' ? 'Antigüedad crítica' : 'Antigüedad alta'}</div>
              <div className="mt-0.5">{dotResult.message}</div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad"><Counter value={form.qty} onChange={v=>update('qty', v)} /></Field>
          <Field label="Tipo"><Select value={form.type} onChange={e=>update('type', e.target.value)} options={TYPES_L} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado"><Select value={form.estado} onChange={e=>update('estado', e.target.value)} options={ESTADOS_L} /></Field>
          <Field label="Condición"><Select value={form.condicion} onChange={e=>update('condicion', e.target.value)} options={CONDICIONES_L} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ubicación"><Select value={form.ubicacion} onChange={e=>update('ubicacion', e.target.value)} options={UBICACIONES_L} /></Field>
          <Field label="Propiedad"><Select value={form.prop} onChange={e=>update('prop', e.target.value)} options={PROPIEDADES_L} /></Field>
        </div>

        <Field label="Profundímetro" hint="Rango 0.0 – 17.0 mm">
          <div className="grid grid-cols-3 gap-2">
            {[
              { k: 'ext',   l: 'Ext',   sub: 'Externo' },
              { k: 'cent',  l: 'Cent',  sub: 'Centro' },
              { k: 'inter', l: 'Inter', sub: 'Interno' },
            ].map(({ k, l, sub }) => {
              const cls = classifyProf(form.profundimetro[k]);
              const tone = cls
                ? cls.tier === 'ok'   ? 'bg-ok-soft/50 border-ok/60 text-ok focus:border-ok focus:ring-ok/20'
                  : cls.tier === 'warn' ? 'bg-warn-soft/60 border-warn/70 text-[#6b4a10] focus:border-warn focus:ring-warn/20'
                  :                       'bg-err-soft/50 border-err/60 text-err focus:border-err focus:ring-err/20'
                : 'bg-surface-white border-outline-soft text-ink focus:border-primary focus:ring-primary/15';
              const labelTone = cls
                ? cls.tier === 'ok' ? 'text-ok'
                  : cls.tier === 'warn' ? 'text-[#6b4a10]'
                  : 'text-err'
                : 'text-ink';
              return (
                <div key={k} className="flex flex-col">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="17"
                    step="0.1"
                    value={form.profundimetro[k]}
                    onChange={e=>updateProf(k, e.target.value)}
                    placeholder="0.0"
                    className={`h-11 w-full px-2 text-center border rounded-lg text-[15px] tabular-nums font-semibold focus:outline-none focus:ring-2 transition ${tone}`}
                  />
                  <div className="text-center mt-1.5">
                    <div className={`text-[12px] font-bold leading-none ${labelTone}`}>{l}</div>
                    <div className="text-[10px] text-ink-soft mt-0.5">{sub}{cls ? ` · ${cls.label}` : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Field>

        {/* Diagnostic banner */}
        {profDiagnosis && (
          <div className={`-mt-2 rounded-lg px-3 py-2.5 flex items-start gap-2 text-[12.5px] ${
            profDiagnosis.tier === 'warn' ? 'bg-warn-soft text-[#6b4a10]' : 'bg-err-soft text-err'
          }`}>
            <Icon name={profDiagnosis.icon} style={{ fontSize: 20 }} className="shrink-0 mt-px" />
            <div>
              <div className="font-bold">Sugerencia: {profDiagnosis.title}</div>
              <div className="mt-0.5 leading-relaxed">{profDiagnosis.message}</div>
            </div>
          </div>
        )}

        <Field label="Precio sugerido" hint="Valor de referencia para la venta">
          <MoneyInput value={form.precio} onChange={v=>update('precio', v)} placeholder="450.000" />
        </Field>

        {/* Overall verdict card */}
        {verdict && (
          <div className={`rounded-2xl border p-4 ${
            verdict.tier === 'ok'   ? 'bg-ok-soft/40 border-ok/40' :
            verdict.tier === 'warn' ? 'bg-warn-soft/60 border-warn/40' :
                                      'bg-err-soft/50 border-err/40'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                verdict.tier === 'ok'   ? 'bg-ok text-white' :
                verdict.tier === 'warn' ? 'bg-warn text-white' :
                                          'bg-err text-white'
              }`}>
                <Icon name={verdict.icon} fill />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] uppercase tracking-wider font-bold ${
                  verdict.tier === 'ok' ? 'text-ok' : verdict.tier === 'warn' ? 'text-[#6b4a10]' : 'text-err'
                }`}>Veredicto general</div>
                <div className={`text-[16px] font-bold leading-tight mt-0.5 ${
                  verdict.tier === 'ok' ? 'text-ok' : verdict.tier === 'warn' ? 'text-[#6b4a10]' : 'text-err'
                }`}>{verdict.title}</div>
                <div className="text-[12.5px] text-ink-soft mt-1 leading-relaxed">{verdict.message}</div>
              </div>
            </div>

            {/* 10+ years acknowledgement checkbox */}
            {dotCritical && dotResult?.valid && dotResult.tier === 'critical' && (
              <label className="mt-3 flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-white border border-err/30 cursor-pointer hover:bg-err-soft/30 transition">
                <input
                  type="checkbox"
                  checked={ackOldTire}
                  onChange={e => setAckOldTire(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-err shrink-0"
                />
                <span className="text-[12px] text-ink-soft leading-relaxed">
                  Confirmo que esta llanta es <span className="font-semibold text-err">solo para control o reciclaje</span> — entiendo que no debe comercializarse.
                </span>
              </label>
            )}
          </div>
        )}

        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[14px] font-bold text-primary">Fotos</div>
            <div className="text-[11px] text-ink-soft">{form.photos.filter(Boolean).length} / 4</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => (
              <PhotoSlot
                key={i}
                value={form.photos[i]}
                onChange={(v) => updatePhoto(i, v)}
                label={`Foto ${i+1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 pb-2">
          <SecondaryButton onClick={handleCancelClick} icon="close" className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton type="submit" icon="save" className="flex-[1.5]" disabled={!valid || (isEdit && !isDirty)}>
            {isEdit ? 'Actualizar' : 'Grabar'}
          </PrimaryButton>
        </div>
        {!valid && (
          <div className="text-[11px] text-ink-soft -mt-2">
            {dotResult?.complete && !dotResult.valid
              ? '⚠ Corrija el error del DOT para poder grabar.'
              : dotCritical && !ackOldTire
                ? '⚠ Confirme el checkbox de antigüedad crítica para poder grabar.'
                : 'Complete los campos requeridos: referencia, marca, DOT (4 dígitos), tipo, estado, condición, ubicación, propiedad y precio.'}
          </div>
        )}
        {isEdit && valid && !isDirty && <div className="text-[11px] text-ink-soft -mt-2">No hay cambios para actualizar.</div>}
      </form>

      {/* Cancel-with-data confirm */}
      <Modal
        open={cancelOpen}
        onClose={()=>setCancelOpen(false)}
        title={isEdit ? '¿Descartar cambios?' : '¿Cancelar registro?'}
        footer={
          <div className="flex gap-3">
            <SecondaryButton onClick={()=>setCancelOpen(false)} className="flex-1">Seguir editando</SecondaryButton>
            <button onClick={()=>{ setCancelOpen(false); onCancel(); }} className="flex-1 h-12 inline-flex items-center justify-center gap-2 bg-err text-white rounded-lg font-semibold text-[14px] active:scale-[0.98] transition">
              <Icon name="delete_sweep" /> Descartar
            </button>
          </div>
        }
      >
        <div className="pt-1 pb-2 space-y-3">
          <p className="text-[13.5px] text-ink-soft leading-relaxed">
            {isEdit
              ? `Hay ${diff.length} ${diff.length===1?'cambio':'cambios'} sin guardar. Si continúa, los cambios se perderán.`
              : 'Si cancela ahora, se perderán todos los datos ingresados hasta el momento. Esta acción no se puede deshacer.'}
          </p>
          {diff.length > 0 && (
            <div className="rounded-xl bg-surface-lo border border-outline-soft/60 p-2.5 max-h-32 overflow-auto phone-scroll">
              <div className="text-[10px] uppercase tracking-wider text-ink-soft font-bold mb-1.5">Cambios pendientes</div>
              <ul className="text-[12px] text-ink space-y-0.5">
                {diff.slice(0, 6).map(d => (
                  <li key={d.key} className="truncate"><span className="font-semibold">{d.label}</span></li>
                ))}
                {diff.length > 6 && <li className="text-ink-soft">y {diff.length - 6} más…</li>}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {/* Brand fuzzy-match suggestion */}
      <Modal
        open={!!brandSuggestion}
        onClose={() => setBrandSuggestion(null)}
        title="Verificación de marca"
        footer={
          <div className="flex gap-3">
            <SecondaryButton
              onClick={() => setBrandSuggestion(null)}
              className="flex-1"
            >
              Usar &lsquo;{brandSuggestion?.typed}&rsquo;
            </SecondaryButton>
            <PrimaryButton
              onClick={() => {
                update('brand', brandSuggestion.suggestion);
                setBrandSuggestion(null);
              }}
              icon="check"
              className="flex-1"
            >
              Sí, corregir
            </PrimaryButton>
          </div>
        }
      >
        <div className="pt-1 pb-2 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-warn-soft text-[#6b4a10] flex items-center justify-center shrink-0">
              <Icon name="spellcheck" />
            </div>
            <p className="text-[13.5px] text-ink-soft leading-relaxed">
              La marca <span className="font-mono font-semibold text-ink">{brandSuggestion?.typed}</span> no coincide exactamente con ninguna de nuestra lista. Detectamos una posible coincidencia.
            </p>
          </div>
          <div className="rounded-xl bg-primary-soft/60 border border-primary/30 p-4 text-center">
            <div className="text-[11px] uppercase tracking-wider text-primary font-bold">¿Quisiste decir?</div>
            <div className="text-[24px] font-bold text-primary mt-1 tracking-tight">{brandSuggestion?.suggestion}</div>
          </div>
          <div className="text-[11.5px] text-ink-soft leading-relaxed">
            Confirmar usará la marca corregida en el inventario. Si tu intención fue capturarla tal como la escribiste (por ejemplo una marca nueva o regional), elige <span className="font-semibold">Usar &lsquo;{brandSuggestion?.typed}&rsquo;</span>.
          </div>
        </div>
      </Modal>

      {/* Confirm update with diff */}
      <Modal
        open={confirmEditOpen}
        onClose={()=>setConfirmEditOpen(false)}
        title="Confirmar cambios"
        footer={
          <div className="flex gap-3">
            <SecondaryButton onClick={()=>setConfirmEditOpen(false)} className="flex-1">Revisar</SecondaryButton>
            <PrimaryButton onClick={()=>{ setConfirmEditOpen(false); onSave(form); }} icon="save" className="flex-1">Confirmar</PrimaryButton>
          </div>
        }
      >
        <div className="pt-1 pb-2 space-y-3">
          <p className="text-[13.5px] text-ink-soft leading-relaxed">
            Está a punto de actualizar la llanta <span className="font-mono font-semibold text-ink">{editing?.code}</span>. Revise los cambios antes de confirmar:
          </p>
          <div className="rounded-xl bg-surface-lo border border-outline-soft/60 divide-y divide-outline-soft/60">
            {diff.map(d => (
              <div key={d.key} className="px-3 py-2.5 flex flex-col gap-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{d.label}</div>
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="line-through text-ink-soft truncate max-w-[42%]">{formatDiffValue(d.from, d.key)}</span>
                  <Icon name="arrow_forward" style={{ fontSize: 14 }} className="text-ink-soft shrink-0" />
                  <span className="font-bold text-primary truncate">{formatDiffValue(d.to, d.key)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Confirm new tire with summary */}
      <Modal
        open={confirmAddOpen}
        onClose={()=>setConfirmAddOpen(false)}
        title="Confirmar registro"
        footer={
          <div className="flex gap-3">
            <SecondaryButton onClick={()=>setConfirmAddOpen(false)} className="flex-1">Revisar</SecondaryButton>
            <PrimaryButton onClick={()=>{ setConfirmAddOpen(false); onSave(form); }} icon="save" className="flex-1">Confirmar</PrimaryButton>
          </div>
        }
      >
        <div className="pt-1 pb-2 space-y-3">
          <p className="text-[13.5px] text-ink-soft leading-relaxed">
            Está a punto de registrar una nueva llanta con código <span className="font-mono font-semibold text-ink">{form.code}</span>. Revise los datos antes de confirmar:
          </p>

          <div className="rounded-xl bg-surface-lo border border-outline-soft/60 overflow-hidden">
            {/* hero summary */}
            <div className="p-3 flex items-center gap-3 bg-primary text-white">
              <div className="w-12 h-12 rounded-lg bg-primary-2 flex items-center justify-center shrink-0 overflow-hidden">
                {form.photos?.[0] ? <img src={form.photos[0]} alt="" className="w-full h-full object-cover" /> : <TireGlyph size={32} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[15px] truncate">{form.ref}</div>
                <div className="text-[12px] opacity-80 truncate">{form.brand}{form.pattern ? ` · ${form.pattern}` : ''}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase opacity-70 font-semibold">Precio</div>
                <div className="text-[15px] font-bold tabular-nums">{fmtCOP(Number(form.precio) || 0)}</div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-[12.5px] p-3">
              <dt className="text-ink-soft">DOT</dt>
              <dd className="text-right font-semibold text-ink font-mono">{form.dot}</dd>

              <dt className="text-ink-soft">Tipo</dt>
              <dd className="text-right font-semibold text-ink">{form.type}</dd>

              <dt className="text-ink-soft">Cantidad</dt>
              <dd className="text-right font-semibold text-ink">{form.qty} {form.qty===1?'unidad':'unidades'}</dd>

              <dt className="text-ink-soft">Estado</dt>
              <dd className="text-right font-semibold text-ink">{form.estado}</dd>

              <dt className="text-ink-soft">Condición</dt>
              <dd className="text-right font-semibold text-ink">{form.condicion}</dd>

              <dt className="text-ink-soft">Ubicación</dt>
              <dd className="text-right font-semibold text-ink truncate">{form.ubicacion}</dd>

              <dt className="text-ink-soft">Propiedad</dt>
              <dd className="text-right font-semibold text-ink">{form.prop}</dd>

              <dt className="text-ink-soft">Fotos</dt>
              <dd className="text-right font-semibold text-ink">{form.photos.filter(Boolean).length} / 4</dd>
            </dl>

            {(form.profundimetro.ext !== '' || form.profundimetro.cent !== '' || form.profundimetro.inter !== '') && (
              <div className="px-3 pb-3">
                <div className="text-[10px] uppercase tracking-wider text-ink-soft font-bold mb-1.5">Profundímetro (mm)</div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { k: 'ext',   l: 'Ext' },
                    { k: 'cent',  l: 'Cent' },
                    { k: 'inter', l: 'Inter' },
                  ].map(({ k, l }) => (
                    <div key={k} className="bg-surface-white border border-outline-soft/60 rounded-md py-1.5">
                      <div className="text-[14px] font-bold tabular-nums text-ink">
                        {form.profundimetro[k] === '' ? '—' : Number(form.profundimetro[k]).toFixed(1)}
                      </div>
                      <div className="text-[10px] text-ink-soft uppercase">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[11.5px] text-ink-soft leading-relaxed">
            Al confirmar, la llanta se agregará al inventario con estos datos. Podrá editarla luego desde la ficha técnica.
          </div>
        </div>
      </Modal>
    </div>
  );
};

const formatDiffValue = (v, key) => {
  if (v === '' || v == null) return '—';
  if (key === 'precio') return fmtCOP(v);
  if (key.startsWith('prof_')) return Number(v).toFixed(1);
  return String(v);
};

// ─── Vender ────────────────────────────────────────────────────────
const VenderScreen = ({ tires, prefill, user, onCancel, onSell }) => {
  const initial = prefill ? tires.find(t => t.code === prefill) : null;
  const [form, setForm] = useState({
    fecha: today(),
    code: initial?.code || '',
    ref: initial?.ref || '',
    brand: initial?.brand || '',
    pattern: initial?.pattern || '',
    dot: initial?.dot || '',
    qty: 1,
    precioVenta: initial?.precio ?? '',
    orden: '',
    vendedor: user?.name ? user.name.toUpperCase() : '',
    pickerOpen: false,
  });
  const [stockAlert, setStockAlert] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState({});         // field-level red borders
  const [missingOpen, setMissingOpen] = useState(null); // {fields:[…]} popup

  useEffect(() => {
    if (prefill) {
      const t = tires.find(x => x.code === prefill);
      if (t) setForm(f => ({ ...f, code: t.code, ref: t.ref, brand: t.brand, pattern: t.pattern, dot: t.dot, qty: 1, precioVenta: t.precio ?? '' }));
    }
  }, [prefill]);

  useEffect(() => {
    if (!stockAlert) return;
    const id = setTimeout(() => setStockAlert(''), 3200);
    return () => clearTimeout(id);
  }, [stockAlert]);

  const tire = form.code ? tires.find(t => t.code === form.code) : null;
  const max = tire?.qty || 0;
  const hasTire = !!tire;

  const handleOverflow = () => {
    if (!tire) return;
    if (max === 1) setStockAlert('Solo hay 1 unidad en existencias — no puede vender más de 1.');
    else setStockAlert(`Solo hay ${max} unidades en existencias — no puede exceder ese máximo.`);
  };

  const handlePick = (t) => {
    setForm(f => ({ ...f, code: t.code, ref: t.ref, brand: t.brand, pattern: t.pattern, dot: t.dot, qty: 1, precioVenta: t.precio ?? '', pickerOpen: false }));
    setStockAlert('');
    setErrors(e => ({ ...e, code: undefined, precioVenta: undefined }));
  };

  const precioSugerido = tire?.precio || 0;
  const sellingPrice = Number(form.precioVenta) || 0;
  const total = sellingPrice * form.qty;
  const priceEdited = hasTire && form.precioVenta !== '' && Number(form.precioVenta) !== precioSugerido;
  const priceDelta = sellingPrice - precioSugerido;

  const validate = () => {
    const errs = {};
    const missing = [];
    if (!form.code) { errs.code = 'Seleccione una llanta'; missing.push('Código (llanta a vender)'); }
    if (!form.orden) { errs.orden = 'Requerido'; missing.push('No. Orden'); }
    if (!form.vendedor) { errs.vendedor = 'Requerido'; missing.push('Vendedor'); }
    if (hasTire && form.qty > max) { errs.qty = `Máx ${max}`; missing.push('Cantidad válida'); }
    if (hasTire && (form.precioVenta === '' || Number(form.precioVenta) <= 0)) {
      errs.precioVenta = 'Requerido';
      missing.push('Precio de venta');
    }
    setErrors(errs);
    return missing;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const missing = validate();
    if (missing.length > 0) {
      setMissingOpen({ fields: missing });
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <div className="screen-enter px-5 py-5">
      <div className="flex items-center gap-2 mb-5">
        <Icon name="shopping_cart" className="text-primary" />
        <h2 className="text-[22px] font-bold text-primary">Vender</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha"><TextInput value={form.fecha} readOnly /></Field>
          <Field
            label="Código"
            hint={!hasTire && !errors.code ? 'Comience aquí — toque para seleccionar' : undefined}
            error={errors.code}
          >
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setForm(f=>({...f, pickerOpen: true}))}
                className={`h-11 px-3.5 flex-1 min-w-0 rounded-lg flex items-center justify-between text-[15px] transition
                  ${errors.code
                    ? 'bg-err-soft/30 border border-err text-err'
                    : hasTire
                      ? 'bg-surface-white border border-outline-soft text-ink hover:border-primary'
                      : 'bg-primary-soft/40 border-2 border-primary text-primary font-semibold ring-2 ring-primary/20 hover:bg-primary-soft/60'}`}
              >
                <span className="truncate">{form.code || 'Seleccionar'}</span>
                <Icon name="search" className={errors.code ? 'text-err' : hasTire ? 'text-outline' : 'text-primary'} />
              </button>
              {hasTire && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      code: '', ref: '', brand: '', pattern: '', dot: '', qty: 1, precioVenta: '',
                    }));
                    setErrors({});
                    setStockAlert('');
                  }}
                  className="h-11 w-11 rounded-lg bg-surface-white border border-outline-soft hover:border-err hover:bg-err-soft/40 hover:text-err text-ink-soft flex items-center justify-center shrink-0 active:scale-95 transition"
                  aria-label="Limpiar selección"
                  title="Limpiar selección"
                >
                  <Icon name="backspace" style={{ fontSize: 18 }} />
                </button>
              )}
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Referencia"><TextInput value={form.ref} readOnly inactive={!hasTire} placeholder="—" /></Field>
          <Field label="Marca"><TextInput value={form.brand} readOnly inactive={!hasTire} placeholder="—" /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Grabado" className="col-span-2"><TextInput value={form.pattern} readOnly inactive={!hasTire} placeholder="—" /></Field>
          <Field label="DOT"><TextInput value={form.dot} readOnly inactive={!hasTire} placeholder="—" /></Field>
        </div>

        <Field
          label={hasTire ? `Cantidad · disponibles ${max}` : 'Cantidad'}
          error={errors.qty}
        >
          <div className="w-1/2">
            <Counter
              value={form.qty}
              onChange={v=>setForm(f=>({...f, qty: Math.min(v, max || 1)}))}
              max={max || 1}
              min={1}
              disabled={!hasTire}
              onOverflow={handleOverflow}
            />
          </div>
          {!hasTire && (
            <div className="text-[11px] text-ink-soft mt-1 flex items-center gap-1">
              <Icon name="lock" style={{ fontSize: 14 }} />
              Seleccione un código para habilitar la cantidad.
            </div>
          )}
          {hasTire && !stockAlert && !errors.qty && (
            <div className="text-[11px] text-ink-soft mt-1">
              {max === 1 ? 'Solo hay 1 unidad en existencias.' : `Puede vender entre 1 y ${max} unidades.`}
            </div>
          )}
          {stockAlert && (
            <div className="mt-1.5 flex items-start gap-1.5 bg-err-soft text-err px-2.5 py-1.5 rounded-md text-[12px] font-semibold">
              <Icon name="error" style={{ fontSize: 16 }} className="shrink-0 mt-px" />
              <span>{stockAlert}</span>
            </div>
          )}
        </Field>

        <Field
          label="Precio de venta"
          hint={hasTire && !errors.precioVenta
            ? `Sugerido: ${fmtCOP(precioSugerido)} · puede ajustarlo para esta venta`
            : undefined}
          error={errors.precioVenta}
        >
          <div className="flex gap-1.5">
            <div className="flex-1 min-w-0">
              <MoneyInput
                value={form.precioVenta}
                onChange={v => { setForm(f => ({...f, precioVenta: v})); setErrors(er => ({...er, precioVenta: undefined})); }}
                placeholder={hasTire ? String(precioSugerido) : '0'}
                error={errors.precioVenta}
              />
            </div>
            {priceEdited && (
              <button
                type="button"
                onClick={() => { setForm(f => ({...f, precioVenta: precioSugerido})); setErrors(er => ({...er, precioVenta: undefined})); }}
                className="h-11 px-2.5 rounded-lg bg-surface-white border border-outline-soft hover:border-primary hover:text-primary text-ink-soft flex items-center gap-1 shrink-0 active:scale-95 transition text-[12px] font-semibold"
                title="Restablecer al precio sugerido"
              >
                <Icon name="undo" style={{ fontSize: 16 }} />
                Restablecer
              </button>
            )}
          </div>
          {!hasTire && (
            <div className="text-[11px] text-ink-soft mt-1 flex items-center gap-1">
              <Icon name="lock" style={{ fontSize: 14 }} />
              Seleccione un código para habilitar el precio.
            </div>
          )}
          {priceEdited && !errors.precioVenta && (
            <div className={`mt-1.5 flex items-start gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-semibold ${priceDelta < 0 ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok'}`}>
              <Icon name={priceDelta < 0 ? 'trending_down' : 'trending_up'} style={{ fontSize: 16 }} className="shrink-0 mt-px" />
              <span>
                {priceDelta < 0 ? 'Descuento' : 'Sobre sugerido'} de {fmtCOP(Math.abs(priceDelta))} por unidad
                <span className="opacity-70 font-normal"> · sugerido {fmtCOP(precioSugerido)}</span>
              </span>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="No. Orden" error={errors.orden}>
            <TextInput
              value={form.orden}
              onChange={e=>{ setForm(f=>({...f, orden: e.target.value.replace(/\D/g,'').slice(0,6)})); setErrors(er=>({...er, orden: undefined})); }}
              placeholder="00000"
              error={errors.orden}
            />
          </Field>
          <Field label="Vendedor" error={errors.vendedor}>
            <TextInput
              value={form.vendedor}
              onChange={e=>{ setForm(f=>({...f, vendedor: e.target.value})); setErrors(er=>({...er, vendedor: undefined})); }}
              placeholder="Nombre"
              error={errors.vendedor}
              uppercase
            />
          </Field>
        </div>

        {tire && (
          <div className="rounded-2xl bg-primary text-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary-2 flex items-center justify-center shrink-0 overflow-hidden">
                {tire.photos?.[0] ? <img src={tire.photos[0]} alt="" className="w-full h-full object-cover" /> : <TireGlyph size={42} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[15px] truncate">{tire.ref}</div>
                <div className="text-[12px] opacity-80 truncate">{tire.brand} · {tire.pattern}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-2 gap-x-3 gap-y-1">
              <div className="text-[10px] uppercase opacity-70 font-semibold">Precio unitario</div>
              <div className="text-[10px] uppercase opacity-70 font-semibold text-right">Disponible</div>
              <div className="text-[14px] font-semibold tabular-nums">
                {fmtCOP(sellingPrice)}
                {priceEdited && (
                  <span className="ml-1.5 text-[11px] font-normal opacity-70 line-through">{fmtCOP(precioSugerido)}</span>
                )}
              </div>
              <div className="text-[14px] font-semibold text-right">{tire.qty} unid.</div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/15 flex justify-between items-end">
              <div>
                <div className="text-[10px] uppercase opacity-70 font-semibold">Total</div>
                <div className="text-[22px] font-bold tabular-nums">{fmtCOP(total)}</div>
              </div>
              <div className="text-right text-[11px] opacity-80">
                {form.qty} × {fmtCOP(sellingPrice)}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2 pb-4">
          <PrimaryButton type="submit" icon="check_circle" className="w-full">Ejecutar venta</PrimaryButton>
          <SecondaryButton onClick={onCancel} className="w-full">Cancelar</SecondaryButton>
        </div>
      </form>

      <TirePickerModal
        open={form.pickerOpen}
        onClose={() => setForm(f=>({...f, pickerOpen: false}))}
        tires={tires}
        onPick={handlePick}
      />

      <ConfirmVentaModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        tire={tire}
        qty={form.qty}
        orden={form.orden}
        vendedor={form.vendedor}
        precioVenta={sellingPrice}
        precioSugerido={precioSugerido}
        total={total}
        onConfirm={() => {
          setConfirmOpen(false);
          onSell({ ...form, precioVenta: sellingPrice, precioSugerido, total });
        }}
      />

      {/* Missing-fields popup */}
      <Modal
        open={!!missingOpen}
        onClose={()=>setMissingOpen(null)}
        title="Faltan datos"
        footer={
          <PrimaryButton onClick={()=>setMissingOpen(null)} className="w-full">Entendido</PrimaryButton>
        }
      >
        <div className="pt-1 pb-2 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-err-soft text-err flex items-center justify-center shrink-0">
              <Icon name="error" fill />
            </div>
            <p className="text-[13.5px] text-ink-soft leading-relaxed">
              Para ejecutar la venta debe completar {missingOpen?.fields.length === 1 ? 'el siguiente campo' : 'los siguientes campos'}:
            </p>
          </div>
          <ul className="bg-err-soft/40 border border-err/30 rounded-xl p-3 space-y-1.5">
            {missingOpen?.fields.map(f => (
              <li key={f} className="flex items-center gap-2 text-[13px] text-err font-semibold">
                <Icon name="radio_button_unchecked" style={{ fontSize: 14 }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
};

// ─── Modal de confirmación ─────────────────────────────────────────
const ConfirmVentaModal = ({ open, onClose, tire, qty, orden, vendedor, precioVenta, precioSugerido, total, onConfirm }) => {
  if (!tire) return null;
  const edited = precioVenta != null && precioSugerido != null && precioVenta !== precioSugerido;
  const delta = (precioVenta || 0) - (precioSugerido || 0);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmar venta"
      footer={
        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton onClick={onConfirm} icon="check_circle" className="flex-1">Confirmar</PrimaryButton>
        </div>
      }
    >
      <div className="space-y-3 pt-1 pb-2">
        <p className="text-[13.5px] text-ink-soft leading-relaxed">
          Está a punto de registrar la siguiente venta. Esta acción descontará las unidades del inventario.
        </p>

        <div className="bg-surface-lo border border-outline-soft rounded-xl p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shrink-0 overflow-hidden">
            {tire.photos?.[0] ? <img src={tire.photos[0]} alt="" className="w-full h-full object-cover" /> : <TireGlyph size={32} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-primary truncate">{tire.ref}</div>
            <div className="text-[12px] text-ink-soft truncate">{tire.brand} · {tire.code}</div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-y-2.5 gap-x-3 text-[13px] mt-1">
          <dt className="text-ink-soft">Cantidad</dt>
          <dd className="text-right font-semibold text-ink">{qty} {qty === 1 ? 'unidad' : 'unidades'}</dd>
          <dt className="text-ink-soft">Precio unitario</dt>
          <dd className="text-right font-semibold text-ink tabular-nums">
            {fmtCOP(precioVenta || 0)}
            {edited && (
              <div className="text-[11px] font-normal text-ink-soft">
                sugerido <span className="line-through">{fmtCOP(precioSugerido || 0)}</span>
                <span className={`ml-1 font-semibold ${delta < 0 ? 'text-warn' : 'text-ok'}`}>
                  {delta < 0 ? '−' : '+'}{fmtCOP(Math.abs(delta))}
                </span>
              </div>
            )}
          </dd>
          <dt className="text-ink-soft">No. Orden</dt>
          <dd className="text-right font-semibold text-ink font-mono">#{orden}</dd>
          <dt className="text-ink-soft">Vendedor</dt>
          <dd className="text-right font-semibold text-ink truncate">{vendedor}</dd>
          <dt className="text-ink-soft pt-2 border-t border-outline-soft/60 self-end">Total</dt>
          <dd className="text-right pt-2 border-t border-outline-soft/60 font-bold text-primary text-[18px] tabular-nums">{fmtCOP(total)}</dd>
        </dl>
      </div>
    </Modal>
  );
};

// ─── Resumen de venta ──────────────────────────────────────────────
const VentaResumenScreen = ({ sale, onVenderOtro, onVolverInicio }) => {
  if (!sale) return null;
  return (
    <div className="screen-enter px-5 py-6 flex flex-col min-h-full">
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-16 h-16 rounded-full bg-ok-soft flex items-center justify-center text-ok">
          <Icon name="check_circle" fill style={{ fontSize: 40 }} />
        </div>
        <h2 className="mt-3 text-[22px] font-bold text-primary">Venta registrada</h2>
        <p className="text-ink-soft text-[13px] mt-1">La venta se guardó y las unidades se descontaron del inventario.</p>
      </div>

      <div className="rounded-2xl bg-surface-white border border-outline-soft/60 p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shrink-0 overflow-hidden">
            {sale.tire?.photos?.[0] ? <img src={sale.tire.photos[0]} alt="" className="w-full h-full object-cover" /> : <TireGlyph size={42} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-bold text-primary truncate leading-tight">{sale.ref}</div>
            <div className="text-[12.5px] text-ink-soft truncate">{sale.brand} · {sale.pattern}</div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-soft/60 grid grid-cols-2 gap-y-2.5 gap-x-3 text-[13px]">
          <span className="text-ink-soft">Código</span>
          <span className="text-right font-semibold text-ink font-mono">{sale.code}</span>
          <span className="text-ink-soft">Cantidad</span>
          <span className="text-right font-semibold text-ink">{sale.qty} {sale.qty === 1 ? 'unidad' : 'unidades'}</span>
          <span className="text-ink-soft">Precio unitario</span>
          <span className="text-right font-semibold text-ink tabular-nums">
            {fmtCOP(sale.precioVenta || 0)}
            {sale.precioSugerido != null && sale.precioVenta !== sale.precioSugerido && (
              <span className="ml-1.5 text-[11px] font-normal text-ink-soft line-through">{fmtCOP(sale.precioSugerido)}</span>
            )}
          </span>
          <span className="text-ink-soft">No. Orden</span>
          <span className="text-right font-semibold text-ink font-mono">#{sale.orden}</span>
          <span className="text-ink-soft">Vendedor</span>
          <span className="text-right font-semibold text-ink truncate">{sale.vendedor}</span>
          <span className="text-ink-soft">Fecha</span>
          <span className="text-right font-semibold text-ink">{sale.fecha}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-soft/60 flex items-end justify-between">
          <div className="text-[11px] uppercase tracking-wider text-ink-soft font-bold">Total cobrado</div>
          <div className="text-[26px] font-bold text-primary tabular-nums leading-none">{fmtCOP(sale.total)}</div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="space-y-3 pt-6 pb-4">
        <PrimaryButton onClick={onVenderOtro} icon="add_shopping_cart" className="w-full">Vender otro ítem</PrimaryButton>
        <SecondaryButton onClick={onVolverInicio} icon="home" className="w-full">Volver al inicio</SecondaryButton>
      </div>
    </div>
  );
};

// ─── Tire picker ───────────────────────────────────────────────────
const TirePickerModal = ({ open, onClose, tires, onPick }) => {
  const [q, setQ] = useState('');
  const list = tires.filter(t => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return t.code.toLowerCase().includes(term) || t.brand.toLowerCase().includes(term) || t.ref.toLowerCase().includes(term);
  });
  return (
    <Modal open={open} onClose={onClose} title="Seleccionar llanta">
      <div className="pt-1">
        <TextInput value={q} onChange={e=>setQ(e.target.value)} placeholder="Código, marca o referencia" icon="search" />
        <div className="mt-3 space-y-2 max-h-[55vh]">
          {list.map(t => (
            <button key={t.code} onClick={()=>onPick(t)} className="w-full bg-surface-white border border-outline-soft rounded-xl p-3 flex items-center gap-3 hover:border-primary text-left active:scale-[0.99] transition">
              <div className="w-12 h-12 rounded-lg bg-surface-mid flex items-center justify-center shrink-0 overflow-hidden">
                {t.photos?.[0] ? <img src={t.photos[0]} alt="" className="w-full h-full object-cover" /> : <TireGlyph size={32} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-primary truncate">{t.ref}</div>
                <div className="text-[12px] text-ink-soft truncate">{t.brand} · {t.code}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-ink-soft">stock</div>
                <div className="font-bold text-ink">{t.qty}</div>
              </div>
            </button>
          ))}
          {list.length===0 && <div className="text-center py-6 text-ink-soft text-[13px]">Sin coincidencias</div>}
        </div>
      </div>
    </Modal>
  );
};

// ─── Resumen Llanta (post-Grabar / post-Actualizar) ────────────────
const LlantaResumenScreen = ({ tire, mode, onAgregarOtra, onVerFicha, onVolverInicio, onConsultar }) => {
  if (!tire) return null;
  const isAdd = mode === 'add';
  const [labelOpen, setLabelOpen] = useState(false);
  return (
    <div className="screen-enter px-5 py-6 flex flex-col min-h-full">
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-16 h-16 rounded-full bg-ok-soft flex items-center justify-center text-ok">
          <Icon name="check_circle" fill style={{ fontSize: 40 }} />
        </div>
        <h2 className="mt-3 text-[22px] font-bold text-primary">{isAdd ? 'Llanta registrada' : 'Cambios guardados'}</h2>
        <p className="text-ink-soft text-[13px] mt-1">
          {isAdd
            ? 'La llanta se agregó al inventario correctamente.'
            : 'La información de la llanta fue actualizada.'}
        </p>
      </div>

      <div className="rounded-2xl bg-surface-white border border-outline-soft/60 shadow-card overflow-hidden">
        <div className="p-4 flex items-center gap-3 bg-primary text-white">
          <div className="w-14 h-14 rounded-xl bg-primary-2 flex items-center justify-center shrink-0 overflow-hidden">
            {tire.photos?.[0] ? <img src={tire.photos[0]} alt="" className="w-full h-full object-cover" /> : <TireGlyph size={42} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-bold truncate leading-tight">{tire.ref}</div>
            <div className="text-[12.5px] opacity-80 truncate">{tire.brand}{tire.pattern && tire.pattern !== '—' ? ` · ${tire.pattern}` : ''}</div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-y-2.5 gap-x-3 text-[13px]">
          <span className="text-ink-soft">Código</span>
          <span className="text-right font-semibold text-ink font-mono">{tire.code}</span>
          <span className="text-ink-soft">DOT</span>
          <span className="text-right font-semibold text-ink font-mono">{tire.dot}</span>
          <span className="text-ink-soft">Cantidad</span>
          <span className="text-right font-semibold text-ink">{tire.qty} {tire.qty===1?'unidad':'unidades'}</span>
          <span className="text-ink-soft">Tipo</span>
          <span className="text-right font-semibold text-ink">{tire.type}</span>
          <span className="text-ink-soft">Estado</span>
          <span className="text-right font-semibold text-ink">{tire.estado}</span>
          <span className="text-ink-soft">Condición</span>
          <span className="text-right font-semibold text-ink">{tire.condicion}</span>
          <span className="text-ink-soft">Ubicación</span>
          <span className="text-right font-semibold text-ink truncate">{tire.ubicacion}</span>
          <span className="text-ink-soft">Propiedad</span>
          <span className="text-right font-semibold text-ink">{tire.prop}</span>
        </div>

        <div className="px-4 pb-4 pt-1 border-t border-outline-soft/60 flex items-end justify-between">
          <div className="text-[11px] uppercase tracking-wider text-ink-soft font-bold">Precio sugerido</div>
          <div className="text-[22px] font-bold text-primary tabular-nums leading-none">{fmtCOP(tire.precio || 0)}</div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="space-y-3 pt-6 pb-4">
        <PrimaryButton onClick={() => setLabelOpen(true)} icon="print" className="w-full">
          Imprimir etiqueta
        </PrimaryButton>
        {isAdd && <SecondaryButton onClick={onAgregarOtra} icon="add_circle" className="w-full">Agregar otra llanta</SecondaryButton>}
        <SecondaryButton onClick={onVerFicha} icon="visibility" className="w-full">Ver ficha técnica</SecondaryButton>
        <SecondaryButton onClick={onVolverInicio} icon="home" className="w-full">Volver al inicio</SecondaryButton>
      </div>

      <EtiquetaModal open={labelOpen} onClose={() => setLabelOpen(false)} tire={tire} />
    </div>
  );
};

Object.assign(window, { AgregarScreen, VenderScreen, TirePickerModal, ConfirmVentaModal, VentaResumenScreen, LlantaResumenScreen });
