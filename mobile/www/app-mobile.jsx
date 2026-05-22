// Versión móvil del App component — sin iOS frame ni sidebar.
// Renderiza a pantalla completa para empaquetar con Capacitor.

const App = () => {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [bootDiag, setBootDiag] = useState({ step: 'iniciando', detail: '' });
  const [user, setUser] = useState(null);
  const [tires, setTires] = useState(TIRES);
  const [users, setUsers] = useState(USERS);
  const [catalogs, setCatalogs] = useState(CATALOGS);
  const [listas, setListas] = useState(LISTAS_DEFAULT);

  const [stack, setStack] = useState(['login']);

  // Auto-login si hay token guardado y todavía es válido
  useEffect(() => {
    (async () => {
      const diag = (step, detail) => setBootDiag({ step, detail: detail || '' });
      try {
        diag('cargando token');
        await api.load();
        const tok = api.token();
        const plugin = !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences);
        diag('token check', `plugin=${plugin ? 'sí' : 'no'} · token=${tok ? 'sí (' + tok.slice(0,8) + '...)' : 'no'}`);
        if (!tok) {
          // No hay sesión guardada — al login sin esperar
          return;
        }
        diag('validando sesión', '');
        const sess = await api.session();
        if (sess && sess.user) {
          setUser(mapBackendUser(sess.user));
          setStack(['panel']);
          diag('ok', '');
          return;
        }
        diag('sesión inválida', 'el backend rechazó el token');
      } catch (e) {
        diag('error', String(e && e.message || e));
      } finally {
        // Pequeño delay si hubo error/diagnóstico, para que el usuario lo vea
        setTimeout(() => setBootstrapping(false), 600);
      }
    })();
  }, []);
  const [selectedCode, setSelectedCode] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  const [lastSale, setLastSale] = useState(null);
  const [lastSavedCode, setLastSavedCode] = useState(null);
  const [lastSavedMode, setLastSavedMode] = useState('add');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const current = stack[stack.length - 1];

  const flash = (msg, kind = 'ok') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2200);
  };

  const nav = (screen, opts = {}) => {
    if (opts.code) setSelectedCode(opts.code);
    if (opts.replace) setStack((s) => [...s.slice(0, -1), screen]);
    else if (opts.reset) setStack([screen]);
    else setStack((s) => (s[s.length - 1] === screen ? s : [...s, screen]));
  };
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : ['panel']));

  const login = (u) => {
    setUser(u);
    setStack(['panel']);
    flash('Bienvenido, ' + u.name.split(' ')[0]);
  };
  const logout = () => {
    api.logout(); // fire-and-forget; limpia el token local de inmediato
    setUser(null);
    setStack(['login']);
    setSelectedCode(null);
    setEditingCode(null);
    setLastSale(null);
    setLastSavedCode(null);
    setDrawerOpen(false);
  };

  const onBottomNav = (id) => {
    const allowed = ROLES[user.role].nav;
    if (!allowed.includes(id)) return;
    if (id === 'admin') nav('admin', { reset: true });
    else nav(id, { reset: true });
  };

  const handleSaveTire = (form) => {
    if (editingCode) {
      setTires((ts) =>
        ts.map((t) =>
          t.code === editingCode
            ? {
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
                precio:
                  typeof form.precio === 'number'
                    ? form.precio
                    : parseInt(form.precio) || 0,
              }
            : t
        )
      );
      const code = editingCode;
      setEditingCode(null);
      setLastSavedCode(code);
      setLastSavedMode('edit');
      setStack(['consultar', 'llanta-resumen']);
      return;
    }
    setTires((ts) => [
      {
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
        precio:
          typeof form.precio === 'number' ? form.precio : parseInt(form.precio) || 0,
      },
      ...ts,
    ]);
    setLastSavedCode(form.code);
    setLastSavedMode('add');
    setStack(['consultar', 'llanta-resumen']);
  };

  const handleUpdateTire = (code, updates) => {
    setTires((ts) => ts.map((t) => (t.code === code ? { ...t, ...updates } : t)));
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
    const tire = tires.find((t) => t.code === sale.code);
    setTires((ts) =>
      ts
        .map((t) => (t.code !== sale.code ? t : { ...t, qty: Math.max(0, t.qty - sale.qty) }))
        .filter((t) => t.qty > 0)
    );
    setLastSale({ ...sale, tire: tire ? { photos: tire.photos } : null });
    setSelectedCode(null);
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

  const bottomId = useMemo(() => {
    if (['panel'].includes(current)) return 'panel';
    if (['consultar', 'ficha'].includes(current)) return 'consultar';
    if (['vender', 'venta-resumen'].includes(current)) return 'vender';
    if (['admin', 'usuarios', 'catalogos', 'listas'].includes(current)) return 'admin';
    if (['agregar', 'editar', 'llanta-resumen'].includes(current)) return 'panel';
    return null;
  }, [current]);

  const showBack = stack.length > 1 && current !== 'panel';
  const showChrome = current !== 'login';

  let content = null;
  if (current === 'login') {
    content = <LoginScreen onLogin={login} />;
  } else if (current === 'panel') {
    content = <Dashboard user={user} tires={tires} onNav={(s) => nav(s, { reset: false })} />;
  } else if (current === 'consultar') {
    content = (
      <ConsultarScreen
        tires={tires}
        user={user}
        onOpen={(code) => nav('ficha', { code })}
        onEdit={handleEditTire}
        onNav={nav}
      />
    );
  } else if (current === 'ficha') {
    const tire = tires.find((t) => t.code === selectedCode);
    const canSell = ROLES[user.role].nav.includes('vender');
    const canEdit = user.role === 'admin';
    content = (
      <FichaTecnica
        tire={tire}
        onClose={back}
        canVender={canSell}
        canEdit={canEdit}
        onEdit={(t) => handleEditTire(t.code)}
        onUpdate={handleUpdateTire}
        onVender={(t) => {
          setSelectedCode(t.code);
          nav('vender');
        }}
      />
    );
  } else if (current === 'agregar') {
    content = <AgregarScreen tires={tires} listas={listas} onCancel={back} onSave={handleSaveTire} />;
  } else if (current === 'editar') {
    const editingTire = tires.find((t) => t.code === editingCode);
    content = (
      <AgregarScreen
        tires={tires}
        listas={listas}
        editing={editingTire}
        onCancel={handleCancelEdit}
        onSave={handleSaveTire}
      />
    );
  } else if (current === 'vender') {
    content = (
      <VenderScreen tires={tires} prefill={selectedCode} user={user} onCancel={back} onSell={handleSell} />
    );
  } else if (current === 'venta-resumen') {
    content = (
      <VentaResumenScreen sale={lastSale} onVenderOtro={handleVenderOtro} onVolverInicio={handleVolverInicio} />
    );
  } else if (current === 'llanta-resumen') {
    const savedTire = tires.find((t) => t.code === lastSavedCode);
    content = (
      <LlantaResumenScreen
        tire={savedTire}
        mode={lastSavedMode}
        onAgregarOtra={() => {
          setLastSavedCode(null);
          setStack(['panel', 'agregar']);
        }}
        onVerFicha={() => {
          setSelectedCode(lastSavedCode);
          setLastSavedCode(null);
          setStack(['consultar', 'ficha']);
        }}
        onVolverInicio={() => {
          setLastSavedCode(null);
          setStack(['panel']);
        }}
      />
    );
  } else if (current === 'admin') {
    content = (
      <AdminHub
        users={users}
        catalogs={catalogs}
        listas={listas}
        onNavUsers={() => nav('usuarios')}
        onNavCatalogos={() => nav('catalogos')}
        onNavListas={() => nav('listas')}
        onExport={() => flash('Exportando CSV...')}
        onAudit={() => flash('Auditoría — sin eventos hoy')}
      />
    );
  } else if (current === 'usuarios') {
    content = (
      <UsuariosScreen
        users={users}
        onChange={(u) => {
          setUsers(u);
          flash('Usuarios actualizados');
        }}
        onClose={back}
      />
    );
  } else if (current === 'catalogos') {
    content = (
      <CatalogosScreen
        catalogs={catalogs}
        onChange={(c) => {
          setCatalogs(c);
          flash('Catálogo actualizado');
        }}
        onClose={back}
      />
    );
  } else if (current === 'listas') {
    content = (
      <ListasScreen
        listas={listas}
        onChange={(l) => {
          setListas(l);
          flash('Listas actualizadas');
        }}
        onClose={back}
      />
    );
  }

  if (bootstrapping) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-bg px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-2 shadow-card flex items-center justify-center mx-auto">
            <TireGlyph size={50} />
          </div>
          <div className="mt-4 text-ink text-sm font-medium">Cargando...</div>
          <div className="mt-1 text-ink-soft text-[12px]">Paso: {bootDiag.step}</div>
          {bootDiag.detail && (
            <div className="mt-1 text-outline text-[11px] break-all leading-snug">{bootDiag.detail}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen flex flex-col bg-bg overflow-hidden">
      {showChrome && (
        <TopBar
          showBack={showBack}
          onBack={back}
          onMenu={() => setDrawerOpen(true)}
          onAccount={() => flash(user.name + ' · ' + ROLES[user.role].label)}
        />
      )}
      <div className={'flex-1 overflow-y-auto phone-scroll ' + (showChrome && bottomId ? 'pb-20' : '')}>
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
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
