// Main app: state, navigation, phone frame composition

const PHONE_W = 402;
const PHONE_H = 870;

const App = () => {
  const [user, setUser] = useState(null);            // logged-in user
  const [tires, setTires] = useState(TIRES);
  const [users, setUsers] = useState(USERS);
  const [catalogs, setCatalogs] = useState(CATALOGS);
  const [listas, setListas] = useState(LISTAS_DEFAULT);

  const [stack, setStack] = useState(['login']);     // navigation stack
  const [selectedCode, setSelectedCode] = useState(null); // for ficha/vender
  const [editingCode, setEditingCode] = useState(null);   // for editar
  const [lastSale, setLastSale] = useState(null);         // for resumen venta
  const [lastSavedCode, setLastSavedCode] = useState(null); // for resumen llanta
  const [lastSavedMode, setLastSavedMode] = useState('add'); // 'add' | 'edit'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const current = stack[stack.length - 1];

  // Show toast briefly
  const flash = (msg, kind='ok') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2200);
  };

  // Navigation
  const nav = (screen, opts={}) => {
    if (opts.code) setSelectedCode(opts.code);
    if (opts.replace) setStack(s => [...s.slice(0,-1), screen]);
    else if (opts.reset) setStack([screen]);
    else setStack(s => s[s.length-1] === screen ? s : [...s, screen]);
  };
  const back = () => setStack(s => s.length > 1 ? s.slice(0,-1) : ['panel']);

  const login = (u) => {
    setUser(u);
    setStack(['panel']);
    flash(`Bienvenido, ${u.name.split(' ')[0]}`);
  };
  const logout = () => {
    setUser(null);
    setStack(['login']);
    setSelectedCode(null);
    setEditingCode(null);
    setLastSale(null);
    setLastSavedCode(null);
    setDrawerOpen(false);
  };

  // Bottom nav handler
  const onBottomNav = (id) => {
    const allowed = ROLES[user.role].nav;
    if (!allowed.includes(id)) return;
    if (id === 'admin') nav('admin', { reset: true });
    else nav(id, { reset: true });
  };

  const handleSaveTire = (form) => {
    if (editingCode) {
      // EDIT: keep original code, replace other fields
      setTires(ts => ts.map(t => t.code === editingCode ? {
        ...t,
        ref: form.ref,
        brand: form.brand,
        pattern: form.pattern || '—',
        dot: form.dot,
        qty: form.qty,
        type: form.type,
        estado: form.estado,
        condicion: form.condicion,
        ubicacion: form.ubicacion,
        prop: form.prop,
        profundimetro: { ...form.profundimetro },
        photos: [...form.photos],
        precio: typeof form.precio === 'number' ? form.precio : (parseInt(form.precio) || 0),
      } : t));
      const code = editingCode;
      setEditingCode(null);
      setLastSavedCode(code);
      setLastSavedMode('edit');
      setStack(['consultar', 'llanta-resumen']);
      return;
    }
    // ADD
    setTires(ts => [{
      code: form.code,
      ref: form.ref,
      brand: form.brand,
      pattern: form.pattern || '—',
      dot: form.dot,
      qty: form.qty,
      type: form.type,
      estado: form.estado,
      condicion: form.condicion,
      ubicacion: form.ubicacion,
      prop: form.prop,
      profundimetro: { ...form.profundimetro },
      photos: [...form.photos],
      precio: typeof form.precio === 'number' ? form.precio : (parseInt(form.precio) || 0),
    }, ...ts]);
    setLastSavedCode(form.code);
    setLastSavedMode('add');
    setStack(['consultar', 'llanta-resumen']);
  };

  const handleUpdateTire = (code, updates) => {
    setTires(ts => ts.map(t => t.code === code ? { ...t, ...updates } : t));
    flash('Cambios guardados');
  };

  const handleEditTire = (code) => {
    setEditingCode(code);
    nav('editar');
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    back();
  };

  const handleSell = (sale) => {
    const tire = tires.find(t => t.code === sale.code);
    setTires(ts => ts.map(t => {
      if (t.code !== sale.code) return t;
      return { ...t, qty: Math.max(0, t.qty - sale.qty) };
    }).filter(t => t.qty > 0));
    // Stash for the summary screen
    setLastSale({ ...sale, tire: tire ? { photos: tire.photos } : null });
    setSelectedCode(null);
    // Replace current screen with resumen so back button goes to consultar
    setStack(['consultar', 'venta-resumen']);
  };

  const handleVenderOtro = () => {
    setLastSale(null);
    setStack(['consultar', 'vender']);
  };

  const handleVolverInicio = () => {
    setLastSale(null);
    setStack(['panel']);
  };

  // ── Bottom nav id from current screen ──
  const bottomId = useMemo(() => {
    if (['panel'].includes(current)) return 'panel';
    if (['consultar','ficha'].includes(current)) return 'consultar';
    if (['vender','venta-resumen'].includes(current)) return 'vender';
    if (['admin','usuarios','catalogos','listas'].includes(current)) return 'admin';
    if (['agregar','editar','llanta-resumen'].includes(current)) return 'panel';
    return null;
  }, [current]);

  const showBack = stack.length > 1 && current !== 'panel';
  const showChrome = current !== 'login';

  // ── Render content ──
  let content = null;
  if (current === 'login') {
    content = <LoginScreen onLogin={login} />;
  } else if (current === 'panel') {
    content = <Dashboard user={user} tires={tires} onNav={(s) => nav(s, { reset: false })} />;
  } else if (current === 'consultar') {
    content = <ConsultarScreen tires={tires} user={user} onOpen={(code) => nav('ficha', { code })} onEdit={handleEditTire} onNav={nav} />;
  } else if (current === 'ficha') {
    const tire = tires.find(t => t.code === selectedCode);
    const canSell = ROLES[user.role].nav.includes('vender');
    const canEdit = user.role === 'admin';
    content = <FichaTecnica tire={tire} onClose={back} canVender={canSell} canEdit={canEdit} onEdit={(t)=>handleEditTire(t.code)} onUpdate={handleUpdateTire} onVender={(t)=>{ setSelectedCode(t.code); nav('vender'); }} />;
  } else if (current === 'agregar') {
    content = <AgregarScreen tires={tires} listas={listas} onCancel={back} onSave={handleSaveTire} />;
  } else if (current === 'editar') {
    const editingTire = tires.find(t => t.code === editingCode);
    content = <AgregarScreen tires={tires} listas={listas} editing={editingTire} onCancel={handleCancelEdit} onSave={handleSaveTire} />;
  } else if (current === 'vender') {
    content = <VenderScreen tires={tires} prefill={selectedCode} user={user} onCancel={back} onSell={handleSell} />;
  } else if (current === 'venta-resumen') {
    content = <VentaResumenScreen sale={lastSale} onVenderOtro={handleVenderOtro} onVolverInicio={handleVolverInicio} />;
  } else if (current === 'llanta-resumen') {
    const savedTire = tires.find(t => t.code === lastSavedCode);
    content = <LlantaResumenScreen
      tire={savedTire}
      mode={lastSavedMode}
      onAgregarOtra={() => { setLastSavedCode(null); setStack(['panel', 'agregar']); }}
      onVerFicha={() => { setSelectedCode(lastSavedCode); setLastSavedCode(null); setStack(['consultar', 'ficha']); }}
      onVolverInicio={() => { setLastSavedCode(null); setStack(['panel']); }}
    />;
  } else if (current === 'admin') {
    content = <AdminHub users={users} catalogs={catalogs} listas={listas}
              onNavUsers={() => nav('usuarios')}
              onNavCatalogos={() => nav('catalogos')}
              onNavListas={() => nav('listas')}
              onExport={() => flash('Exportando CSV…')}
              onAudit={() => flash('Auditoría — sin eventos hoy')}
            />;
  } else if (current === 'usuarios') {
    content = <UsuariosScreen users={users} onChange={(u)=>{ setUsers(u); flash('Usuarios actualizados'); }} onClose={back} />;
  } else if (current === 'catalogos') {
    content = <CatalogosScreen catalogs={catalogs} onChange={(c)=>{ setCatalogs(c); flash('Catálogo actualizado'); }} onClose={back} />;
  } else if (current === 'listas') {
    content = <ListasScreen listas={listas} onChange={(l)=>{ setListas(l); flash('Listas actualizadas'); }} onClose={back} />;
  }

  // ── Compose phone interior ──
  const phoneBody = (
    <div className="relative w-full h-full flex flex-col bg-bg overflow-hidden">
      {showChrome && (
        <TopBar
          showBack={showBack}
          onBack={back}
          onMenu={() => setDrawerOpen(true)}
          onAccount={() => flash(`${user.name} · ${ROLES[user.role].label}`)}
        />
      )}
      <div className={`flex-1 overflow-y-auto phone-scroll ${showChrome && bottomId ? 'pb-20' : ''}`}>
        {content}
      </div>
      {showChrome && bottomId && (
        <BottomNav current={bottomId} role={user.role} onNav={onBottomNav} />
      )}
      <Toast msg={toast?.msg} kind={toast?.kind} />
      {showChrome && (
        <SideDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          onLogout={logout}
          onNav={(s) => nav(s, { reset: true })}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-start justify-center py-8 px-4 bg-[#111315]">
      <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
        {/* Phone */}
        <IOSDevice width={PHONE_W} height={PHONE_H}>
          <div style={{ paddingTop: 50, height: '100%' }}>{phoneBody}</div>
        </IOSDevice>

        {/* Sidebar — context / role switcher */}
        <aside className="text-white max-w-[320px] w-full md:w-[280px]">
          <h1 className="text-[22px] font-bold tracking-tight">Salvallanta · App</h1>
          <p className="text-white/60 text-[13px] mt-1 leading-relaxed">
            Prototipo interactivo de inventario. Cambie de usuario para ver permisos por rol.
          </p>

          <div className="mt-5 space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-white/40 font-bold">Roles</div>
            {[
              { role: 'admin',     desc: 'Agregar · Consultar · Vender · Admin', user: USERS[0] },
              { role: 'recepcion', desc: 'Consultar · Vender',                   user: USERS[1] },
              { role: 'consultor', desc: 'Solo Consultar',                       user: USERS[2] },
            ].map(({ role, desc, user: u }) => (
              <button key={role} onClick={() => login(u)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  user?.role===role ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold capitalize">{ROLES[role].label}</div>
                  {user?.role===role && <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full">activo</span>}
                </div>
                <div className="text-[11.5px] text-white/55 mt-0.5">{desc}</div>
                <div className="text-[10.5px] text-white/40 mt-1 font-mono">{u.user} / 1234</div>
              </button>
            ))}
          </div>

          {user && (
            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-wider text-white/40 font-bold">Sesión</div>
              <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="font-semibold">{user.name}</div>
                <div className="text-[11.5px] text-white/55 capitalize">{ROLES[user.role].label}</div>
                <button onClick={logout} className="mt-2 text-[12px] text-white/70 hover:text-white inline-flex items-center gap-1">
                  <span className="ms" style={{fontSize: 16}}>logout</span> Cerrar sesión
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-[11px] text-white/35 leading-relaxed">
            Hecho con HTML + Tailwind. Inventario, usuarios y catálogos viven en memoria — los cambios se mantienen mientras esté abierta la página.
          </div>
        </aside>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
