// Main flow screens: Login, Dashboard, Consultar, FichaTecnica, Vender

// ─── Login ───
const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('admin');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    setErr('');
    setLoading(true);
    try {
      const data = await api.login(user.trim(), pass);
      onLogin(mapBackendUser(data.user));
    } catch (ex) {
      setErr(ex.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-enter min-h-full flex flex-col bg-surface">
      <div className="text-center pt-10 pb-4 border-b border-outline-soft/60">
        <h1 className="text-[22px] font-bold text-primary tracking-tight">Salvallanta</h1>
      </div>

      <div className="flex-1 px-6 pt-10 flex flex-col">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-2 shadow-card flex items-center justify-center">
            <TireGlyph size={60} />
          </div>
          <h2 className="mt-5 text-[26px] font-bold text-primary">Bienvenido</h2>
          <p className="text-ink-soft text-[14px] mt-1">Inicie sesión para continuar</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <Field label="Usuario">
            <TextInput value={user} onChange={e => setUser(e.target.value)} placeholder="Ingrese su usuario" icon="person" />
          </Field>
          <Field label="Contraseña">
            <div className="relative">
              <TextInput
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                icon="lock"
                type={show ? 'text' : 'password'}
              />
              <button type="button" onClick={() => setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary">
                <Icon name={show ? 'visibility_off' : 'visibility'} />
              </button>
            </div>
          </Field>
          <div className="text-right">
            <button type="button" className="text-[13px] text-ink-soft hover:text-primary">¿Olvidó su contraseña?</button>
          </div>

          {err && <div className="bg-err-soft text-err text-[13px] px-3 py-2 rounded-lg font-medium">{err}</div>}

          <PrimaryButton type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </PrimaryButton>

          <div className="text-center text-[13px] text-ink-soft pt-2">
            ¿No tiene una cuenta? <span className="font-semibold text-primary">Solicite acceso</span>
          </div>
        </form>

        <div className="mt-6 mb-2 flex items-center gap-3 text-outline">
          <div className="flex-1 h-px bg-outline-soft/60" />
          <span className="text-[12px]">Versión 2.4.0</span>
          <div className="flex-1 h-px bg-outline-soft/60" />
        </div>

        {/* Demo helper — solo admin existe en el backend hasta que crees más usuarios */}
        <div className="mt-2 rounded-lg bg-surface-mid/70 p-3 text-[11.5px] text-ink-soft leading-relaxed">
          <div className="font-semibold text-ink mb-1">Usuario inicial</div>
          <button type="button" onClick={() => { setUser('admin'); setPass('admin'); }} className="w-full bg-surface-white border border-outline-soft/60 rounded-md px-3 py-2 hover:border-primary text-left">
            <div className="font-semibold text-ink">admin</div>
            <div className="text-outline text-[10px]">pwd: admin · cambiala apenas entres</div>
          </button>
        </div>
      </div>

      <div className="text-center text-[11px] text-outline py-3 px-6">
        © 2026 Salvallanta S.A. Todos los derechos reservados.
      </div>
    </div>
  );
};

// ─── Dashboard / Panel ───
const TILE_META = {
  agregar:   { icon: 'add_circle', label: 'Agregar Llantas',   sub: 'Registrar nuevas unidades',  to: 'agregar' },
  consultar: { icon: 'search',     label: 'Consultar Llantas', sub: 'Buscar inventario',          to: 'consultar' },
  vender:    { icon: 'shopping_cart', label: 'Vender',         sub: 'Registrar salida de venta',  to: 'vender' },
  catalogos: { icon: 'inventory_2', label: 'Catálogos',        sub: 'Gestión de productos',       to: 'catalogos' },
  usuarios:  { icon: 'group',      label: 'Usuarios',          sub: 'Roles y permisos',           to: 'usuarios' },
};

const Dashboard = ({ user, onNav, tires }) => {
  const tiles = ROLES[user.role].tiles;
  const totalUnits = tires.reduce((a,t)=>a+t.qty, 0);

  return (
    <div className="screen-enter px-5 py-5">
      <div className="mb-5">
        <h2 className="text-[24px] font-bold text-primary leading-tight">Panel de Control</h2>
        <p className="text-ink-soft text-[14px] mt-0.5">
          Hola, <span className="font-semibold text-ink">{user.name.split(' ')[0]}</span> · <span className="capitalize">{ROLES[user.role].label}</span>
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat label="Unidades" value={totalUnits} icon="inventory_2" />
        <Stat label="Referencias" value={tires.length} icon="bookmark" />
        <Stat label="Ubicaciones" value={new Set(tires.map(t=>t.ubicacion)).size} icon="location_on" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map(t => {
          const m = TILE_META[t];
          return (
            <button
              key={t}
              onClick={() => onNav(m.to)}
              className="bg-surface-white border border-outline-soft/70 rounded-2xl p-4 flex flex-col items-start text-left hover:border-primary/40 hover:shadow-card active:scale-[0.98] transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-soft/70 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition">
                <Icon name={m.icon} fill />
              </div>
              <div className="mt-3 font-bold text-[14px] text-primary leading-tight">{m.label}</div>
              <div className="text-[11.5px] text-ink-soft mt-0.5">{m.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Inventory card */}
      <div className="mt-5 relative overflow-hidden rounded-2xl bg-primary text-white p-5 shadow-card">
        <div className="absolute -right-6 -bottom-6 opacity-25"><TireGlyph size={140} /></div>
        <div className="absolute right-6 top-5 opacity-15"><TireGlyph size={70} /></div>
        <div className="relative">
          <div className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Inventario</div>
          <div className="font-bold text-[18px] mt-0.5">Estado del Inventario</div>
          <div className="text-[12px] opacity-80 mt-0.5">Actualizado hace 15 minutos</div>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <div className="text-[28px] font-bold leading-none tabular-nums">{totalUnits}</div>
              <div className="text-[11px] opacity-70 mt-1">unidades activas</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <div className="text-[28px] font-bold leading-none tabular-nums">{tires.filter(t=>t.estado==='Nueva').length}</div>
              <div className="text-[11px] opacity-70 mt-1">nuevas en stock</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const Stat = ({ label, value, icon }) => (
  <div className="bg-surface-white border border-outline-soft/60 rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-ink-soft">
      <Icon name={icon} style={{fontSize: 16}} />
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-[22px] font-bold text-primary tabular-nums mt-0.5">{value}</div>
  </div>
);

// ─── Consultar ───
const ConsultarScreen = ({ tires, onOpen, onNav, user, onEdit }) => {
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const canEdit = user.role === 'admin';

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tires.filter(t => {
      const hit = !term ||
        t.code.toLowerCase().includes(term) ||
        t.brand.toLowerCase().includes(term) ||
        t.ref.toLowerCase().includes(term) ||
        t.pattern.toLowerCase().includes(term);
      const filt = activeFilter === 'todos' ||
        (activeFilter === 'nueva' && t.estado === 'Nueva') ||
        (activeFilter === 'usada' && t.estado === 'Usada');
      return hit && filt;
    });
  }, [q, tires, activeFilter]);

  return (
    <div className="screen-enter px-5 py-5">
      <h2 className="text-[24px] font-bold text-primary leading-tight">Consultar Llantas</h2>
      <p className="text-ink-soft text-[14px] mt-0.5 mb-4">Busque por código, marca o referencia.</p>

      <div className="flex gap-2 mb-3">
        <TextInput value={q} onChange={e=>setQ(e.target.value)} placeholder="Código, marca o referencia" icon="search" className="flex-1" />
        <PrimaryButton onClick={() => {}}>Buscar</PrimaryButton>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto -mx-1 px-1 pb-1">
        {[['todos','Todos'],['nueva','Nuevas'],['usada','Usadas']].map(([k,l]) => (
          <button key={k} onClick={()=>setActiveFilter(k)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition ${
              activeFilter===k ? 'bg-primary text-white border-primary' : 'bg-surface-white text-ink-soft border-outline-soft hover:border-primary'
            }`}>
            {l}
          </button>
        ))}
      </div>

      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-2">
        Resultados ({results.length})
      </div>

      <div className="space-y-3">
        {results.map(t => (
          <div key={t.code} className="bg-surface-white border border-outline-soft/60 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-card transition">
            <button onClick={() => onOpen(t.code)} className="w-full p-4 text-left active:scale-[0.99] transition">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[20px] font-bold text-primary leading-none">{t.ref}</div>
                  <div className="font-semibold text-ink mt-1.5">{t.brand}</div>
                  <div className="text-ink-soft text-[13px]">{t.pattern}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Chip kind="estado">{t.estado}</Chip>
                  <Chip kind="condicion">{t.condicion}</Chip>
                </div>
              </div>
              <div className="my-3 h-px bg-outline-soft/60" />
              <div className="grid grid-cols-2 gap-y-2">
                <Field2 label="DOT"><span className="bg-surface-mid px-2 py-0.5 rounded font-mono text-[12px]">{t.dot}</span></Field2>
                <Field2 label="Ubicación"><span className="inline-flex items-center gap-1 text-ink"><Icon name="location_on" style={{fontSize: 16}} className="text-ink-soft" />{t.ubicacion}</span></Field2>
                <Field2 label="Código"><span className="font-semibold text-ink">{t.code}</span></Field2>
                <Field2 label="Disponibilidad">
                  <span className="inline-flex items-center gap-1.5 text-ink">
                    <span className={`w-2 h-2 rounded-full ${t.qty<=1 ? 'bg-err' : t.qty<=3 ? 'bg-accent' : 'bg-ok'}`}/>
                    {t.qty} {t.qty===1 ? 'unidad' : 'unidades'}
                  </span>
                </Field2>
              </div>
            </button>
            {canEdit && (
              <div className="px-4 pb-3 -mt-1 flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(t.code); }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface-lo hover:bg-primary hover:text-white text-ink-soft text-[12px] font-semibold border border-outline-soft/60 hover:border-primary transition active:scale-95"
                >
                  <Icon name="edit" style={{ fontSize: 15 }} /> Editar
                </button>
              </div>
            )}
          </div>
        ))}
        {results.length===0 && (
          <div className="text-center py-10 text-ink-soft">
            <Icon name="search_off" style={{fontSize: 40}} className="text-outline-soft" />
            <div className="mt-2 text-[14px] font-medium">Sin resultados</div>
            <div className="text-[12px]">Intente con otro término de búsqueda.</div>
          </div>
        )}
      </div>
    </div>
  );
};
const Field2 = ({ label, children }) => (
  <div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">{label}</div>
    <div className="text-[14px] mt-0.5">{children}</div>
  </div>
);

// ─── Ficha Técnica ───
const FichaTecnica = ({ tire, onClose, onVender, canVender, onUpdate, canEdit, onEdit }) => {
  if (!tire) return null;
  const [photoIdx, setPhotoIdx] = useState(0);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(tire.precio);
  const [labelOpen, setLabelOpen] = useState(false);
  useEffect(() => { setPriceDraft(tire.precio); setEditingPrice(false); setPhotoIdx(0); setLightboxOpen(false); setLabelOpen(false); }, [tire.code]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const photoLabels = ['Vista frontal','Banda de rodamiento','Lateral','Detalle DOT'];
  const photos = tire.photos && tire.photos.length ? tire.photos : [null, null, null, null];
  const currentPhoto = photos[photoIdx];

  const prof = tire.profundimetro;
  const hasProf = prof && (prof.ext !== '' || prof.cent !== '' || prof.inter !== '');
  const dotResult = useMemo(() => validateDOT(tire.dot), [tire.dot]);
  const profDiagnosis = useMemo(() => diagnoseProf(prof || {}), [prof]);
  const verdict = useMemo(
    () => recommendUsedTire({ profundimetro: prof || {}, dotResult, estado: tire.estado }),
    [prof, dotResult, tire.estado]
  );

  const savePrice = () => {
    if (onUpdate && Number.isFinite(priceDraft) && priceDraft >= 0) {
      onUpdate(tire.code, { precio: priceDraft });
    }
    setEditingPrice(false);
  };

  return (
    <div className="screen-enter px-5 py-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-bold text-primary leading-tight border-b-2 border-primary inline-block pb-1">Ficha técnica</h2>
          <p className="text-ink-soft text-[13px] mt-1">Detalles técnicos del producto</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <button
            onClick={() => setLabelOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-white border border-outline-soft hover:border-primary text-ink-soft hover:text-primary font-semibold text-[12.5px] active:scale-95 transition"
            title="Imprimir etiqueta para estantería"
          >
            <Icon name="print" style={{ fontSize: 16 }} /> Etiqueta
          </button>
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(tire)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-white border border-outline-soft hover:border-primary text-ink-soft hover:text-primary font-semibold text-[12.5px] active:scale-95 transition"
            >
              <Icon name="edit" style={{ fontSize: 16 }} /> Editar
            </button>
          )}
        </div>
      </div>

      <Field label="Código" className="mb-4">
        <div className="h-11 px-3.5 bg-surface-lo border border-outline-soft rounded-lg flex items-center gap-2 text-ink font-medium">
          <span className="text-outline">#</span>
          <span className="font-mono">{tire.code}</span>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <ReadField label="Referencia" value={tire.ref} />
        <ReadField label="Marca" value={tire.brand} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <ReadField label="Grabado" value={tire.pattern} />
        <Field
          label="DOT"
          hint={dotResult?.valid ? dotResult.message : (dotResult?.complete && !dotResult.valid ? dotResult.error : undefined)}
        >
          <div className={`h-11 px-3.5 rounded-lg flex items-center text-[15px] font-mono tabular-nums font-semibold border
            ${dotResult?.complete && !dotResult?.valid
              ? 'bg-err-soft/40 border-err text-err'
              : dotResult?.valid && dotResult.tier === 'critical'
                ? 'bg-err-soft/40 border-err text-err'
                : dotResult?.valid && dotResult.tier === 'warn'
                  ? 'bg-warn-soft/60 border-warn/70 text-[#6b4a10]'
                  : dotResult?.valid && dotResult.tier === 'ok'
                    ? 'bg-ok-soft/40 border-ok/50 text-ok'
                    : 'bg-surface-lo border-outline-soft text-ink-soft'}`}
          >{tire.dot}</div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <ReadField label="Cantidad" value={`${tire.qty} ${tire.qty===1?'unidad':'unidades'}`} />
        <ReadField label="Tipo" value={tire.type} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Estado">
          <div className="h-11 px-3.5 bg-surface-lo border border-outline-soft rounded-lg flex items-center">
            <Chip kind="estado">{tire.estado}</Chip>
          </div>
        </Field>
        <Field label="Condición">
          <div className="h-11 px-3.5 bg-surface-lo border border-outline-soft rounded-lg flex items-center">
            <Chip kind="condicion">{tire.condicion}</Chip>
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <ReadField label="Ubicación" value={tire.ubicacion} />
        <ReadField label="Propiedad" value={tire.prop} />
      </div>

      {/* Profundímetro */}
      <Field label="Profundímetro (mm)" className="mb-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'ext',   l: 'Ext',   sub: 'Externo' },
            { k: 'cent',  l: 'Cent',  sub: 'Centro' },
            { k: 'inter', l: 'Inter', sub: 'Interno' },
          ].map(({ k, l, sub }) => {
            const v = hasProf ? prof[k] : '';
            const display = (v === '' || v == null) ? '—' : Number(v).toFixed(1);
            const cls = classifyProf(v);
            const tone = cls
              ? cls.tier === 'ok'   ? 'bg-ok-soft/50 border-ok/60 text-ok'
                : cls.tier === 'warn' ? 'bg-warn-soft/60 border-warn/70 text-[#6b4a10]'
                :                       'bg-err-soft/50 border-err/60 text-err'
              : 'bg-surface-lo border-outline-soft text-ink-soft';
            const labelTone = cls
              ? cls.tier === 'ok' ? 'text-ok' : cls.tier === 'warn' ? 'text-[#6b4a10]' : 'text-err'
              : 'text-ink';
            return (
              <div key={k} className="flex flex-col">
                <div className={`h-11 px-2 border rounded-lg flex items-center justify-center text-[15px] tabular-nums font-semibold ${tone}`}>
                  {display}
                </div>
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
        <div className={`mb-3 rounded-lg px-3 py-2.5 flex items-start gap-2 text-[12.5px] ${
          profDiagnosis.tier === 'warn' ? 'bg-warn-soft text-[#6b4a10]' : 'bg-err-soft text-err'
        }`}>
          <Icon name={profDiagnosis.icon} style={{ fontSize: 20 }} className="shrink-0 mt-px" />
          <div>
            <div className="font-bold">Sugerencia: {profDiagnosis.title}</div>
            <div className="mt-0.5 leading-relaxed">{profDiagnosis.message}</div>
          </div>
        </div>
      )}

      {/* Overall verdict */}
      {verdict && (
        <div className={`mb-4 rounded-2xl border p-4 ${
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
        </div>
      )}

      <div className="flex items-center justify-between text-[13px] font-semibold mb-2">
        <span className="text-primary">Fotos</span>
        <span className="text-ink-soft">{photoIdx+1} / {photos.length}</span>
      </div>

      <div className="relative rounded-2xl overflow-hidden h-52 flex items-center justify-center bg-primary/95">
        {currentPhoto ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full h-full block group"
            aria-label="Ampliar foto"
          >
            <img src={currentPhoto} alt={photoLabels[photoIdx]} className="w-full h-full object-cover group-active:opacity-90 transition" />
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm">
              <Icon name="zoom_in" style={{ fontSize: 18 }} />
            </div>
          </button>
        ) : (
          <div className="flex flex-col items-center text-white/80">
            <Icon name="image_not_supported" style={{ fontSize: 44 }} />
            <div className="mt-2 text-[12px] font-semibold uppercase tracking-wider">Sin fotografía</div>
            <div className="text-[10px] opacity-70 font-mono mt-0.5">Edite la llanta para agregar</div>
          </div>
        )}
        <div className="absolute bottom-2 left-3 right-3 text-white/90 text-[11px] font-mono uppercase tracking-wider drop-shadow pointer-events-none">
          {photoLabels[photoIdx]}
        </div>
        <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(i => (i-1+photos.length)%photos.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-card active:scale-95 z-10">
          <Icon name="chevron_left" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(i => (i+1)%photos.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-card active:scale-95 z-10">
          <Icon name="chevron_right" />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5">
        {photos.map((_,i) => (
          <button key={i} onClick={()=>setPhotoIdx(i)} className={`h-1.5 flex-1 rounded-full transition ${i===photoIdx ? 'bg-primary' : 'bg-outline-soft'}`} />
        ))}
      </div>

      {/* Precio + existencias */}
      <div className="mt-5 p-4 rounded-2xl bg-surface-lo border border-outline-soft/60">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-ink-soft font-bold">Precio sugerido</span>
              {canEdit && !editingPrice && (
                <button
                  onClick={() => { setPriceDraft(tire.precio); setEditingPrice(true); }}
                  className="w-6 h-6 rounded-md hover:bg-surface-mid flex items-center justify-center text-ink-soft active:scale-95"
                  aria-label="Editar precio"
                >
                  <Icon name="edit" style={{ fontSize: 16 }} />
                </button>
              )}
            </div>
            {editingPrice ? (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1"><MoneyInput value={priceDraft} onChange={setPriceDraft} placeholder="0" /></div>
                <button onClick={savePrice} className="h-11 w-11 rounded-lg bg-primary text-white flex items-center justify-center active:scale-95">
                  <Icon name="check" />
                </button>
                <button onClick={() => setEditingPrice(false)} className="h-11 w-11 rounded-lg bg-surface-white border border-outline-soft text-ink-soft flex items-center justify-center active:scale-95">
                  <Icon name="close" />
                </button>
              </div>
            ) : (
              <div className="text-[22px] font-bold text-primary tabular-nums">{fmtCOP(tire.precio || 0)}</div>
            )}
          </div>
          {!editingPrice && (
            <div className="text-right shrink-0">
              <div className="text-[11px] uppercase tracking-wider text-ink-soft font-bold">Existencias</div>
              <div className="text-[22px] font-bold text-primary tabular-nums">{tire.qty}</div>
            </div>
          )}
        </div>
        {canEdit && !editingPrice && (
          <div className="text-[11px] text-ink-soft mt-1">Toque el lápiz para editar el precio sugerido.</div>
        )}
      </div>

      <div className="mt-5 flex gap-3 pb-4">
        <SecondaryButton onClick={onClose} className="flex-1">Salir</SecondaryButton>
        {canVender && <PrimaryButton onClick={() => onVender(tire)} icon="shopping_cart" className="flex-[1.5]">Vender</PrimaryButton>}
      </div>

      <EtiquetaModal open={labelOpen} onClose={() => setLabelOpen(false)} tire={tire} />

      {/* Photo lightbox */}
      {lightboxOpen && currentPhoto && (
        <div
          className="absolute inset-0 z-50 flex flex-col bg-black/95"
          style={{ animation: 'fadeUp 0.18s ease' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
            <div className="min-w-0">
              <div className="text-[14px] font-bold truncate">{photoLabels[photoIdx]}</div>
              <div className="text-[11px] opacity-70">{photoIdx + 1} de {photos.length} · {tire.code}</div>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white active:scale-95 transition shrink-0"
              aria-label="Cerrar"
            >
              <Icon name="close" />
            </button>
          </div>

          {/* Image area */}
          <div className="relative flex-1 flex items-center justify-center px-2 overflow-hidden">
            <img
              src={currentPhoto}
              alt={photoLabels[photoIdx]}
              className="max-w-full max-h-full object-contain"
              style={{ animation: 'scaleIn 0.18s ease' }}
            />
            {photos.filter(Boolean).length > 1 && (
              <>
                <button
                  onClick={() => {
                    // jump to previous existing photo
                    let i = photoIdx;
                    for (let n = 0; n < photos.length; n++) {
                      i = (i - 1 + photos.length) % photos.length;
                      if (photos[i]) { setPhotoIdx(i); break; }
                    }
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center active:scale-95"
                >
                  <Icon name="chevron_left" />
                </button>
                <button
                  onClick={() => {
                    let i = photoIdx;
                    for (let n = 0; n < photos.length; n++) {
                      i = (i + 1) % photos.length;
                      if (photos[i]) { setPhotoIdx(i); break; }
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center active:scale-95"
                >
                  <Icon name="chevron_right" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="px-4 pb-5 pt-3 shrink-0">
            <div className="flex gap-2 justify-center">
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => p && setPhotoIdx(i)}
                  disabled={!p}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                    i === photoIdx
                      ? 'border-white opacity-100'
                      : p
                        ? 'border-white/30 opacity-60 hover:opacity-100'
                        : 'border-white/10 opacity-30 cursor-not-allowed'
                  }`}
                >
                  {p ? (
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40">
                      <Icon name="image_not_supported" style={{ fontSize: 16 }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-center text-white/50 text-[11px] mt-2">Toca afuera o el aspa para cerrar</div>
          </div>
        </div>
      )}
    </div>
  );
};
const ReadField = ({ label, value }) => (
  <Field label={label}>
    <div className="h-11 px-3.5 bg-surface-lo border border-outline-soft rounded-lg flex items-center text-[15px] text-ink-soft">{value}</div>
  </Field>
);

Object.assign(window, {
  LoginScreen, Dashboard, ConsultarScreen, FichaTecnica, Stat, Field2, ReadField,
});
