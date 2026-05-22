// Versión móvil del App component — sin iOS frame ni sidebar.
// Renderiza a pantalla completa para empaquetar con Capacitor.

const App = () => {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [bootDiag, setBootDiag] = useState({ step: 'iniciando', detail: '' });
  const [user, setUser] = useState(null);

  // Datos del backend (vacíos hasta que la app los cargue)
  const [tires, setTires] = useState([]);
  const [users, setUsers] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [listas, setListas] = useState(LISTAS_DEFAULT);

  const [stack, setStack] = useState(['login']);
  const [selectedCode, setSelectedCode] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  const [lastSale, setLastSale] = useState(null);
  const [lastSavedCode, setLastSavedCode] = useState(null);
  const [lastSavedMode, setLastSavedMode] = useState('add');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(null); // {message: string} | null

  const current = stack[stack.length - 1];

  const flash = (msg, kind = 'ok') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2400);
  };

  // ─── Bootstrap: hidratar token y auto-login ──────────────────────────
  useEffect(() => {
    (async () => {
      const diag = (step, detail) => setBootDiag({ step, detail: detail || '' });
      try {
        diag('cargando token');
        await api.load();
        const tok = api.token();
        const plugin = !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences);
        diag('token check', `plugin=${plugin ? 'sí' : 'no'} · token=${tok ? 'sí (' + tok.slice(0,8) + '...)' : 'no'}`);
        if (!tok) return;
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
        setTimeout(() => setBootstrapping(false), 400);
      }
    })();
  }, []);

  // ─── Refrescar todos los datos del backend ───────────────────────────
  const refreshAll = async (currentUser) => {
    const u = currentUser || user;
    if (!u) return;
    try {
      const [inv, lst, cat] = await Promise.all([
        api.inventarioList(),
        api.listasGet(),
        api.catalogosList(),
      ]);
      setTires((inv || []).map(mapBackendTire));
      setListas(Object.assign({}, LISTAS_DEFAULT, lst || {}));
      setCatalogs((cat || []).map(mapBackendCatalog));
      if (u.role === 'admin') {
        const us = await api.usuariosList();
        setUsers((us || []).map(mapBackendUser));
      }
    } catch (e) {
      flash(e.message || 'Error cargando datos', 'err');
    }
  };

  // Cargar datos cuando user cambia (login o session restore)
  useEffect(() => {
    if (user) refreshAll(user);
  }, [user]);

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
    api.logout();
    setUser(null);
    setStack(['login']);
    setSelectedCode(null);
    setEditingCode(null);
    setLastSale(null);
    setLastSavedCode(null);
    setDrawerOpen(false);
    setTires([]); setUsers([]); setCatalogs([]);
  };

  const onBottomNav = (id) => {
    const allowed = ROLES[user.role].nav;
    if (!allowed.includes(id)) return;
    if (id === 'admin') nav('admin', { reset: true });
    else nav(id, { reset: true });
  };

  // ─── Inventario: guardar (crear o editar) ────────────────────────────
  const handleSaveTire = async (form) => {
    try {
      setSaving({ message: 'Preparando fotos...' });
      const fotoUrls = await uploadFormPhotos(form, form.code, (i, total) => {
        setSaving({ message: `Subiendo foto ${i} / ${total}...` });
      });
      setSaving({ message: editingCode ? 'Actualizando llanta...' : 'Registrando llanta...' });
      const payload = mapFormToBackendTire(form, fotoUrls);
      let saved;
      if (editingCode) {
        saved = await api.inventarioUpdate(editingCode, payload);
        const mapped = mapBackendTire(saved);
        setTires((ts) => ts.map((t) => (t.code === editingCode ? mapped : t)));
        const code = editingCode;
        setEditingCode(null);
        setLastSavedCode(code);
        setLastSavedMode('edit');
      } else {
        saved = await api.inventarioCreate(payload);
        const mapped = mapBackendTire(saved);
        setTires((ts) => [mapped, ...ts.filter((t) => t.code !== mapped.code)]);
        setLastSavedCode(form.code);
        setLastSavedMode('add');
      }
      setSaving(null);
      setStack(['consultar', 'llanta-resumen']);
    } catch (e) {
      setSaving(null);
      flash(e.message || 'Error al guardar la llanta', 'err');
    }
  };

  // ─── Ficha: edición inline (cambios sueltos) ─────────────────────────
  const handleUpdateTire = async (code, updates) => {
    try {
      // updates puede contener {photos, profundimetro, ...} en shape app — convertir a backend
      const patch = {};
      if (updates.ref !== undefined)        patch.ref = updates.ref;
      if (updates.brand !== undefined)      patch.brand = updates.brand;
      if (updates.pattern !== undefined)    patch.pattern = updates.pattern;
      if (updates.dot !== undefined)        patch.dot = updates.dot;
      if (updates.qty !== undefined)        patch.qty = updates.qty;
      if (updates.type !== undefined)       patch.type = updates.type;
      if (updates.estado !== undefined)     patch.estado = updates.estado;
      if (updates.condicion !== undefined)  patch.condicion = updates.condicion;
      if (updates.ubicacion !== undefined)  patch.ubicacion = updates.ubicacion;
      if (updates.prop !== undefined)       patch.propietario = updates.prop;
      if (updates.precio !== undefined)     patch.precio = updates.precio;
      if (updates.profundimetro) {
        patch.profExt   = updates.profundimetro.ext   ?? '';
        patch.profCent  = updates.profundimetro.cent  ?? '';
        patch.profInter = updates.profundimetro.inter ?? '';
      }
      if (updates.photos) {
        patch.foto1 = updates.photos[0] || '';
        patch.foto2 = updates.photos[1] || '';
        patch.foto3 = updates.photos[2] || '';
        patch.foto4 = updates.photos[3] || '';
      }
      const updated = await api.inventarioUpdate(code, patch);
      const mapped = mapBackendTire(updated);
      setTires((ts) => ts.map((t) => (t.code === code ? mapped : t)));
      flash('Cambios guardados');
    } catch (e) {
      flash(e.message || 'Error al actualizar', 'err');
    }
  };

  const handleEditTire = (code) => {
    setEditingCode(code);
    nav('editar');
  };
  const handleCancelEdit = () => {
    setEditingCode(null);
    back();
  };

  // ─── Vender ──────────────────────────────────────────────────────────
  const handleSell = async (sale) => {
    try {
      setSaving({ message: 'Registrando venta...' });
      await api.ventasCreate({
        code: sale.code,
        qty: sale.qty,
        precio: sale.precioVenta || sale.precioSugerido || 0,
        cliente: sale.cliente || '',
        notas: sale.notas || '',
      });
      // Refrescar inventario (qty bajó o llanta soft-deleted si llegó a 0)
      const fresh = await api.inventarioList();
      const mappedFresh = (fresh || []).map(mapBackendTire);
      setTires(mappedFresh);
      // tire en el resumen: usar las fotos de la llanta vendida (que puede haber desaparecido)
      const remaining = mappedFresh.find((t) => t.code === sale.code);
      const tireForResumen = remaining
        || tires.find((t) => t.code === sale.code)
        || null;
      setLastSale({ ...sale, tire: tireForResumen ? { photos: tireForResumen.photos } : null });
      setSelectedCode(null);
      setSaving(null);
      setStack(['consultar', 'venta-resumen']);
    } catch (e) {
      setSaving(null);
      flash(e.message || 'Error al registrar la venta', 'err');
    }
  };

  const handleVenderOtro = () => {
    setLastSale(null);
    setStack(['consultar', 'vender']);
  };
  const handleVolverInicio = () => {
    setLastSale(null);
    setStack(['panel']);
  };

  // ─── Usuarios admin: diff y replicar al backend ──────────────────────
  const handleUsersChange = async (newUsers) => {
    const ops = [];
    for (const nu of newUsers) {
      const old = users.find((u) => u.id === nu.id);
      if (!old) {
        ops.push({ type: 'create', user: nu });
      } else {
        const diff = {};
        if (nu.name !== old.name) diff.nombre = nu.name;
        if (nu.role !== old.role) diff.rol = nu.role;
        if (nu.status !== old.status) diff.estado = nu.status;
        if (nu.pass) diff.pass = nu.pass;
        if (Object.keys(diff).length) ops.push({ type: 'update', id: nu.id, diff });
      }
    }
    for (const ou of users) {
      if (!newUsers.find((u) => u.id === ou.id)) ops.push({ type: 'delete', id: ou.id });
    }
    if (ops.length === 0) return;
    try {
      setSaving({ message: 'Guardando usuarios...' });
      for (const op of ops) {
        if (op.type === 'create') {
          await api.usuariosCreate({
            usuario: op.user.user, pass: op.user.pass, nombre: op.user.name,
            rol: op.user.role, estado: op.user.status,
          });
        } else if (op.type === 'update') {
          await api.usuariosUpdate(op.id, op.diff);
        } else {
          await api.usuariosDelete(op.id);
        }
      }
      const fresh = await api.usuariosList();
      setUsers((fresh || []).map(mapBackendUser));
      setSaving(null);
      flash('Usuarios actualizados');
    } catch (e) {
      setSaving(null);
      flash(e.message || 'Error al guardar usuarios', 'err');
    }
  };

  // ─── Catálogos admin: diff y replicar ────────────────────────────────
  const handleCatalogsChange = async (newCatalogs) => {
    const ops = [];
    for (const nc of newCatalogs) {
      const old = catalogs.find((c) => c.id === nc.id);
      if (!old) {
        ops.push({ type: 'create', cat: nc });
      } else {
        const diff = {};
        if (nc.name !== old.name)         diff.nombre = nc.name;
        if (nc.sub !== old.sub)           diff.sub = nc.sub;
        if (nc.items !== old.items)       diff.items = nc.items;
        if (nc.updated !== old.updated)   diff.updated = nc.updated;
        if (JSON.stringify(nc.tags || []) !== JSON.stringify(old.tags || [])) diff.tags = nc.tags;
        if (Object.keys(diff).length) ops.push({ type: 'update', id: nc.id, diff });
      }
    }
    for (const oc of catalogs) {
      if (!newCatalogs.find((c) => c.id === oc.id)) ops.push({ type: 'delete', id: oc.id });
    }
    if (ops.length === 0) return;
    try {
      setSaving({ message: 'Guardando catálogos...' });
      for (const op of ops) {
        if (op.type === 'create') {
          await api.catalogosCreate({
            nombre: op.cat.name, sub: op.cat.sub,
            items: op.cat.items, updated: op.cat.updated, tags: op.cat.tags,
          });
        } else if (op.type === 'update') {
          await api.catalogosUpdate(op.id, op.diff);
        } else {
          await api.catalogosDelete(op.id);
        }
      }
      const fresh = await api.catalogosList();
      setCatalogs((fresh || []).map(mapBackendCatalog));
      setSaving(null);
      flash('Catálogos actualizados');
    } catch (e) {
      setSaving(null);
      flash(e.message || 'Error al guardar catálogos', 'err');
    }
  };

  // ─── Listas admin: diff por hoja ─────────────────────────────────────
  const handleListasChange = async (newListas) => {
    const changed = [];
    for (const key of Object.keys(newListas)) {
      const oldArr = listas[key] || [];
      const newArr = newListas[key] || [];
      if (JSON.stringify(oldArr) !== JSON.stringify(newArr)) {
        changed.push({ hoja: key, items: newArr });
      }
    }
    if (changed.length === 0) return;
    try {
      setSaving({ message: 'Guardando listas...' });
      for (const c of changed) await api.listasUpdate(c.hoja, c.items);
      setListas(newListas);
      setSaving(null);
      flash('Listas actualizadas');
    } catch (e) {
      setSaving(null);
      flash(e.message || 'Error al guardar listas', 'err');
    }
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
    content = <UsuariosScreen users={users} onChange={handleUsersChange} onClose={back} />;
  } else if (current === 'catalogos') {
    content = <CatalogosScreen catalogs={catalogs} onChange={handleCatalogsChange} onClose={back} />;
  } else if (current === 'listas') {
    content = <ListasScreen listas={listas} onChange={handleListasChange} onClose={back} />;
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

      {/* Overlay de "guardando" para operaciones async */}
      {saving && (
        <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-surface-white rounded-2xl shadow-card px-6 py-5 flex flex-col items-center gap-3 max-w-[280px]">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="text-[14px] font-semibold text-primary text-center">{saving.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
