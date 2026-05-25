// Admin screens: Catálogos, Usuarios, AdminHub

const AdminHub = ({ users, catalogs, listas, onNavUsers, onNavCatalogos, onNavListas, onNavImpresora, onExport, onAudit }) => {
  const [q, setQ] = useState('');
  const listasMeta = (typeof LISTAS_META !== 'undefined') ? LISTAS_META : [];
  return (
    <div className="screen-enter px-5 py-5">
      <h2 className="text-[24px] font-bold text-primary leading-tight">Administración</h2>
      <p className="text-ink-soft text-[14px] mt-0.5 mb-4">Gestione los usuarios del sistema y la base de datos de catálogos industriales.</p>

      <TextInput value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar usuarios o productos..." icon="search" />

      <div className="mt-5 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Usuarios</div>
        <button onClick={onNavUsers} className="text-[12px] font-semibold text-primary inline-flex items-center gap-1 hover:underline">
          <Icon name="person_add" style={{fontSize: 18}} /> Gestionar
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {users.slice(0,3).map(u => (
          <div key={u.id} className="bg-surface-white border border-outline-soft/60 rounded-xl p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] ${u.role==='admin' ? 'bg-primary-soft text-primary' : 'bg-surface-mid text-ink-soft'}`}>
              {u.name.split(' ').map(s=>s[0]).slice(0,2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink truncate">{u.name}</div>
              <div className="text-[12px] text-ink-soft capitalize">{ROLES[u.role].label} · {u.status}</div>
            </div>
            <button className="w-8 h-8 rounded-lg hover:bg-surface-mid flex items-center justify-center text-ink-soft" onClick={onNavUsers}><Icon name="edit" style={{fontSize: 18}} /></button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Catálogos</div>
        <button onClick={onNavCatalogos} className="text-[12px] font-semibold text-primary inline-flex items-center gap-1 hover:underline">
          <Icon name="add_circle" style={{fontSize: 18}} /> Añadir
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {catalogs.slice(0,2).map(c => (
          <CatalogCard key={c.id} c={c} compact onClick={onNavCatalogos} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Listas de selección</div>
        <button onClick={onNavListas} className="text-[12px] font-semibold text-primary inline-flex items-center gap-1 hover:underline">
          <Icon name="tune" style={{fontSize: 18}} /> Editar
        </button>
      </div>
      <button
        onClick={onNavListas}
        className="mt-2 w-full bg-surface-white border border-outline-soft/60 rounded-xl p-3 flex items-start gap-3 hover:border-primary/40 hover:shadow-card active:scale-[0.99] transition text-left"
      >
        <div className="w-12 h-12 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
          <Icon name="list_alt" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink leading-tight">Opciones de los desplegables</div>
          <div className="text-[12px] text-ink-soft mt-0.5">Tipos, estados, condiciones, ubicaciones, propiedades y marcas.</div>
          {!!listas && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {listasMeta.map(m => (
                <span key={m.key} className="text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-md bg-surface-mid text-ink-soft tabular-nums">
                  {m.label} <span className="text-primary">{(listas[m.key] || []).length}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="w-8 h-8 rounded-lg hover:bg-surface-mid flex items-center justify-center text-ink-soft shrink-0">
          <Icon name="chevron_right" />
        </div>
      </button>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Hardware</div>
      </div>
      <button
        onClick={onNavImpresora}
        className="mt-2 w-full bg-surface-white border border-outline-soft/60 rounded-xl p-3 flex items-start gap-3 hover:border-primary/40 hover:shadow-card active:scale-[0.99] transition text-left"
      >
        <div className="w-12 h-12 rounded-lg bg-accent-soft text-[#6b4a10] flex items-center justify-center shrink-0">
          <Icon name="print" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink leading-tight">Impresora Bluetooth</div>
          <div className="text-[12px] text-ink-soft mt-0.5">Configurar y probar impresora térmica</div>
        </div>
        <div className="w-8 h-8 rounded-lg hover:bg-surface-mid flex items-center justify-center text-ink-soft shrink-0">
          <Icon name="chevron_right" />
        </div>
      </button>

      <div className="mt-5 rounded-2xl bg-primary-2 text-white p-4">
        <div className="flex items-center gap-2 font-bold text-[15px]">
          <Icon name="database" />
          Mantenimiento de Datos
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button onClick={onExport} className="bg-primary text-white rounded-xl p-3.5 flex flex-col items-center gap-1 hover:bg-black/40 active:scale-95 transition">
            <Icon name="cloud_download" />
            <span className="text-[12px] font-semibold">Exportar CSV</span>
          </button>
          <button onClick={onAudit} className="bg-primary text-white rounded-xl p-3.5 flex flex-col items-center gap-1 hover:bg-black/40 active:scale-95 transition">
            <Icon name="history" />
            <span className="text-[12px] font-semibold">Ver Auditoría</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const CatalogCard = ({ c, compact, onClick, onEdit }) => (
  <button onClick={onClick} className="w-full bg-surface-white border border-outline-soft/60 rounded-xl p-3 flex items-start gap-3 hover:border-primary/40 hover:shadow-card active:scale-[0.99] transition text-left">
    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
      <TireGlyph size={32} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-ink leading-tight">{c.name}</div>
      <div className="text-[12px] text-ink-soft mt-0.5">{c.items} ítems · Actualizado {c.updated}</div>
      {!compact ? null : (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {c.tags.map(t => <span key={t} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-surface-mid text-ink-soft">{t}</span>)}
        </div>
      )}
    </div>
    <div className="w-8 h-8 rounded-lg hover:bg-surface-mid flex items-center justify-center text-ink-soft shrink-0">
      <Icon name="settings" style={{fontSize: 18}} />
    </div>
  </button>
);

// ─── Usuarios ───
const UsuariosScreen = ({ users, onChange, onClose }) => {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const saveUser = (u) => {
    if (editing) onChange(users.map(x => x.id === u.id ? u : x));
    else onChange([...users, { ...u, id: 'u' + Date.now() }]);
    setEditing(null); setAdding(false);
  };
  const removeUser = (id) => {
    if (confirm('¿Eliminar usuario?')) onChange(users.filter(u => u.id !== id));
  };

  return (
    <div className="screen-enter px-5 py-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-[24px] font-bold text-primary leading-tight">Usuarios</h2>
          <p className="text-ink-soft text-[13px] mt-0.5">Gestione roles y permisos.</p>
        </div>
        <button onClick={()=>setAdding(true)} className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-[12px] font-semibold active:scale-95">
          <Icon name="person_add" style={{fontSize: 18}} /> Nuevo
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-surface-white border border-outline-soft/60 rounded-xl p-3 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${u.role==='admin' ? 'bg-primary-soft text-primary' : u.role==='recepcion' ? 'bg-accent-soft text-[#6b4a10]' : 'bg-surface-mid text-ink-soft'}`}>
              {u.name.split(' ').map(s=>s[0]).slice(0,2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink truncate">{u.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <Chip kind="role">{u.role}</Chip>
                <span className={`text-[11px] font-semibold ${u.status==='Activo' ? 'text-ok' : 'text-err'}`}>· {u.status}</span>
              </div>
            </div>
            <button onClick={()=>setEditing(u)} className="w-8 h-8 rounded-lg hover:bg-surface-mid flex items-center justify-center text-ink-soft"><Icon name="edit" style={{fontSize: 18}} /></button>
            <button onClick={()=>removeUser(u.id)} className="w-8 h-8 rounded-lg hover:bg-err-soft hover:text-err flex items-center justify-center text-ink-soft"><Icon name="delete" style={{fontSize: 18}} /></button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <SecondaryButton onClick={onClose} className="w-full">Volver</SecondaryButton>
      </div>

      <UserFormModal
        open={!!editing || adding}
        user={editing}
        onClose={() => { setEditing(null); setAdding(false); }}
        onSave={saveUser}
      />
    </div>
  );
};

const UserFormModal = ({ open, user, onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', user: '', pass: '', role: 'consultor', status: 'Activo' });
  useEffect(() => {
    if (user) setForm({ ...user });
    else setForm({ name: '', user: '', pass: '', role: 'consultor', status: 'Activo' });
  }, [user, open]);
  const valid = form.name && form.user && (user || form.pass);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Editar usuario' : 'Nuevo usuario'}
      footer={
        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton onClick={()=>valid && onSave(form)} disabled={!valid} className="flex-1">Guardar</PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        <Field label="Nombre"><TextInput value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Nombre completo" /></Field>
        <Field label="Usuario"><TextInput value={form.user} onChange={e=>setForm({...form, user: e.target.value.replace(/\s/g,'').toLowerCase()})} placeholder="usuario" /></Field>
        <Field label={user ? 'Contraseña (dejar vacío para conservar)' : 'Contraseña'}>
          <TextInput value={form.pass} onChange={e=>setForm({...form, pass: e.target.value})} placeholder="••••" type="password" />
        </Field>
        <Field label="Rol">
          <Select value={form.role} onChange={e=>setForm({...form, role: e.target.value})} options={['admin','recepcion','consultor']} />
        </Field>
        <Field label="Estado">
          <Select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} options={['Activo','Inactivo']} />
        </Field>
      </div>
    </Modal>
  );
};

// ─── Catálogos ───
const CatalogosScreen = ({ catalogs, onChange, onClose }) => {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(null); // catalog being removed

  const save = (c) => {
    if (editing) onChange(catalogs.map(x => x.id === c.id ? c : x));
    else onChange([...catalogs, { ...c, id: 'c' + Date.now() }]);
    setEditing(null); setAdding(false);
  };
  const confirmRemove = () => {
    if (!removeOpen) return;
    onChange(catalogs.filter(c => c.id !== removeOpen.id));
    setRemoveOpen(null);
  };

  return (
    <div className="screen-enter px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[24px] font-bold text-primary leading-tight">Catálogos</h2>
          <p className="text-ink-soft text-[13px] mt-0.5">Productos agrupados por línea industrial.</p>
        </div>
        <button onClick={()=>setAdding(true)} className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-[12px] font-semibold active:scale-95">
          <Icon name="add" style={{fontSize: 18}} /> Añadir
        </button>
      </div>

      <div className="space-y-2">
        {catalogs.map(c => (
          <div key={c.id} className="bg-surface-white border border-outline-soft/60 rounded-xl p-3 flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <TireGlyph size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-ink leading-tight">{c.name}</div>
              <div className="text-[12px] text-ink-soft mt-0.5">{c.items} ítems · Actualizado {c.updated}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {c.tags.map(t => <span key={t} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-surface-mid text-ink-soft">{t}</span>)}
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={()=>setEditing(c)} className="w-8 h-8 rounded-lg hover:bg-surface-mid flex items-center justify-center text-ink-soft"><Icon name="edit" style={{fontSize: 18}} /></button>
              <button onClick={()=>setRemoveOpen(c)} className="w-8 h-8 rounded-lg hover:bg-err-soft hover:text-err flex items-center justify-center text-ink-soft"><Icon name="delete" style={{fontSize: 18}} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <SecondaryButton onClick={onClose} className="w-full">Volver</SecondaryButton>
      </div>

      <CatalogFormModal
        open={!!editing || adding}
        catalog={editing}
        onClose={()=>{ setEditing(null); setAdding(false); }}
        onSave={save}
      />

      {/* Confirm-remove modal */}
      <Modal
        open={!!removeOpen}
        onClose={() => setRemoveOpen(null)}
        title="Eliminar catálogo"
        footer={
          <div className="flex gap-3">
            <SecondaryButton onClick={() => setRemoveOpen(null)} className="flex-1">Cancelar</SecondaryButton>
            <PrimaryButton onClick={confirmRemove} icon="delete" className="flex-1">Eliminar</PrimaryButton>
          </div>
        }
      >
        <div className="pt-1 pb-2 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-err-soft text-err flex items-center justify-center shrink-0">
              <Icon name="warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] text-ink leading-relaxed">
                ¿Seguro que deseas eliminar el catálogo <span className="font-semibold">"{removeOpen?.name}"</span>?
              </p>
              {!!removeOpen && (
                <p className="text-[12px] text-ink-soft mt-1">
                  {removeOpen.items} ítems · Actualizado {removeOpen.updated}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-err-soft/40 border border-err/20 p-3 text-[12px] text-ink leading-relaxed flex items-start gap-2">
            <Icon name="info" style={{ fontSize: 16 }} className="text-err shrink-0 mt-px" />
            <span>
              Esta acción no se puede deshacer. Se eliminará el catálogo y dejará de estar disponible al registrar nuevas llantas.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const CatalogFormModal = ({ open, catalog, onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', items: 0, updated: 'hoy', tags: [] });
  useEffect(() => {
    if (catalog) setForm({ ...catalog });
    else setForm({ name: '', items: 0, updated: 'hoy', tags: [] });
  }, [catalog, open]);
  const valid = form.name;
  const toggleTag = (t) => setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x=>x!==t) : [...f.tags, t] }));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={catalog ? 'Editar catálogo' : 'Nuevo catálogo'}
      footer={
        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton onClick={()=>valid && onSave(form)} disabled={!valid} className="flex-1">Guardar</PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        <Field label="Nombre"><TextInput value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Ej. Llantas Pasajero" /></Field>
        <Field label="Ítems"><TextInput type="number" value={form.items} onChange={e=>setForm({...form, items: parseInt(e.target.value)||0})} /></Field>
        <Field label="Etiquetas">
          <div className="flex flex-wrap gap-2">
            {['Crítico','Ventas','Stock bajo','Nuevo','Pasajero','Camión'].map(t => (
              <button key={t} type="button" onClick={()=>toggleTag(t)} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition ${
                form.tags.includes(t) ? 'bg-primary text-white border-primary' : 'bg-surface-white text-ink-soft border-outline-soft'
              }`}>{t}</button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
};

// ─── Listas de selección (dropdowns admin) ───
const ListasScreen = ({ listas, onChange, onClose }) => {
  const meta = LISTAS_META;
  const [activeKey, setActiveKey] = useState(meta[0].key);
  const [query, setQuery] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(null); // { idx, value }

  const active = meta.find(m => m.key === activeKey);
  const items = listas[activeKey] || [];
  const filtered = useMemo(() => {
    if (!query) return items.map((v, i) => ({ v, i }));
    const q = query.toLowerCase();
    return items.map((v, i) => ({ v, i })).filter(({ v }) => v.toLowerCase().includes(q));
  }, [items, query]);

  // reset transient UI when switching tabs
  useEffect(() => {
    setQuery(''); setEditingIdx(null); setDraft(''); setAdding(false); setRemoveOpen(null);
  }, [activeKey]);

  const isDup = (val, ignoreIdx) =>
    items.some((x, i) => i !== ignoreIdx && x.trim().toLowerCase() === val.trim().toLowerCase());

  const commitEdit = () => {
    const v = draft.trim();
    if (!v || isDup(v, editingIdx)) { setEditingIdx(null); return; }
    const next = items.slice();
    next[editingIdx] = v;
    onChange({ ...listas, [activeKey]: next });
    setEditingIdx(null);
  };
  const commitAdd = () => {
    const v = draft.trim();
    if (!v || isDup(v, -1)) { setAdding(false); setDraft(''); return; }
    onChange({ ...listas, [activeKey]: [v, ...items] });
    setAdding(false); setDraft('');
  };
  const confirmRemove = () => {
    if (removeOpen == null) return;
    const next = items.filter((_, i) => i !== removeOpen.idx);
    onChange({ ...listas, [activeKey]: next });
    setRemoveOpen(null);
  };
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...listas, [activeKey]: next });
  };

  const atMin = items.length <= active.min;

  return (
    <div className="screen-enter px-5 py-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <h2 className="text-[24px] font-bold text-primary leading-tight">Listas de selección</h2>
          <p className="text-ink-soft text-[13px] mt-0.5">Edita las opciones que aparecen en los desplegables al agregar o editar una llanta.</p>
        </div>
      </div>

      {/* Tab chips */}
      <div className="-mx-5 px-5 overflow-x-auto phone-scroll">
        <div className="flex gap-2 pb-1 w-max">
          {meta.map(m => {
            const active = m.key === activeKey;
            const n = (listas[m.key] || []).length;
            return (
              <button
                key={m.key}
                onClick={() => setActiveKey(m.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12.5px] font-semibold border transition ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-white text-ink-soft border-outline-soft hover:border-primary/40'
                }`}
              >
                <Icon name={m.icon} style={{ fontSize: 16 }} />
                {m.label}
                <span className={`tabular-nums text-[11px] px-1.5 py-px rounded ${active ? 'bg-white/20' : 'bg-surface-mid text-ink'}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section header */}
      <div className="mt-4 p-3.5 rounded-2xl bg-primary text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-2 flex items-center justify-center shrink-0">
            <Icon name={active.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold leading-tight">{active.label}</div>
            <div className="text-[12px] opacity-80 mt-0.5">{active.sub}</div>
            <div className="text-[11px] opacity-70 mt-1">
              <Icon name="info" style={{ fontSize: 12 }} className="align-text-bottom mr-0.5" />
              {active.hint}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: search + add */}
      <div className="mt-3 flex gap-2">
        <div className="flex-1 min-w-0">
          <TextInput
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Buscar en ${active.label.toLowerCase()}…`}
            icon="search"
          />
        </div>
        <button
          onClick={() => { setAdding(true); setDraft(''); setEditingIdx(null); }}
          disabled={items.length >= active.max}
          className="shrink-0 h-11 px-3 rounded-lg bg-primary text-white inline-flex items-center gap-1.5 font-semibold text-[13px] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="add" style={{ fontSize: 18 }} /> Añadir
        </button>
      </div>

      {/* Inline add row */}
      {adding && (
        <div className="mt-2 p-2 rounded-xl bg-primary-soft/40 border-2 border-primary border-dashed">
          <div className="flex gap-2">
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') { setAdding(false); setDraft(''); } }}
              placeholder={`Nueva opción de ${active.label.toLowerCase().replace(/s$/, '')}…`}
              className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-surface-white border border-outline-soft text-[15px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button onClick={commitAdd} className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center active:scale-95">
              <Icon name="check" />
            </button>
            <button onClick={() => { setAdding(false); setDraft(''); }} className="h-10 w-10 rounded-lg bg-surface-white border border-outline-soft text-ink-soft flex items-center justify-center active:scale-95">
              <Icon name="close" />
            </button>
          </div>
          {draft.trim() && isDup(draft, -1) && (
            <div className="text-[11.5px] text-err mt-1 flex items-center gap-1">
              <Icon name="error" style={{ fontSize: 14 }} /> Ya existe esa opción.
            </div>
          )}
        </div>
      )}

      {/* List */}
      <ul className="mt-3 space-y-1.5">
        {filtered.length === 0 && (
          <li className="text-center py-8 text-ink-soft">
            <Icon name="search_off" style={{ fontSize: 28 }} />
            <div className="text-[13px] mt-1">Sin resultados para "{query}"</div>
          </li>
        )}
        {filtered.map(({ v, i }) => {
          const isEd = editingIdx === i;
          return (
            <li key={`${v}-${i}`} className="bg-surface-white border border-outline-soft/60 rounded-xl px-2 py-2 flex items-center gap-2">
              <div className="text-ink-soft font-mono text-[11px] w-6 text-center tabular-nums">{i + 1}</div>
              {isEd ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                  onBlur={commitEdit}
                  className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-primary-soft/30 border-2 border-primary text-[14.5px] font-semibold focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => { setEditingIdx(i); setDraft(v); setAdding(false); }}
                  className="flex-1 min-w-0 text-left px-2 py-1 rounded-md hover:bg-surface-lo text-ink font-medium text-[14.5px] truncate"
                  title="Toque para editar"
                >{v}</button>
              )}
              {!isEd && (
                <>
                  <div className="flex flex-col">
                    <button onClick={() => move(i, -1)} disabled={i === 0 || !!query} className="w-6 h-4 flex items-center justify-center text-ink-soft hover:text-primary disabled:opacity-25" title="Subir">
                      <Icon name="keyboard_arrow_up" style={{ fontSize: 18 }} />
                    </button>
                    <button onClick={() => move(i, +1)} disabled={i === items.length - 1 || !!query} className="w-6 h-4 flex items-center justify-center text-ink-soft hover:text-primary disabled:opacity-25" title="Bajar">
                      <Icon name="keyboard_arrow_down" style={{ fontSize: 18 }} />
                    </button>
                  </div>
                  <button
                    onClick={() => { setEditingIdx(i); setDraft(v); }}
                    className="w-8 h-8 rounded-lg hover:bg-surface-mid text-ink-soft flex items-center justify-center"
                    title="Editar"
                  >
                    <Icon name="edit" style={{ fontSize: 17 }} />
                  </button>
                  <button
                    onClick={() => setRemoveOpen({ idx: i, value: v })}
                    disabled={atMin}
                    className="w-8 h-8 rounded-lg hover:bg-err-soft hover:text-err text-ink-soft flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed"
                    title={atMin ? `Debe quedar al menos ${active.min}` : 'Eliminar'}
                  >
                    <Icon name="delete" style={{ fontSize: 17 }} />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 text-[11.5px] text-ink-soft leading-relaxed flex items-start gap-1.5">
        <Icon name="info" style={{ fontSize: 14 }} className="shrink-0 mt-px" />
        <span>
          Eliminar una opción no afecta las llantas ya registradas con ese valor, pero dejará de aparecer al crear o editar nuevas.
        </span>
      </div>

      <div className="mt-5 pb-4">
        <SecondaryButton onClick={onClose} className="w-full">Volver</SecondaryButton>
      </div>

      {/* Confirm-remove modal */}
      <Modal
        open={!!removeOpen}
        onClose={() => setRemoveOpen(null)}
        title={`Eliminar de ${active.label}`}
        footer={
          <div className="flex gap-3">
            <SecondaryButton onClick={() => setRemoveOpen(null)} className="flex-1">Cancelar</SecondaryButton>
            <PrimaryButton onClick={confirmRemove} icon="delete" className="flex-1">Eliminar</PrimaryButton>
          </div>
        }
      >
        <div className="pt-1 pb-2 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-err-soft text-err flex items-center justify-center shrink-0">
              <Icon name="delete" />
            </div>
            <p className="text-[13.5px] text-ink-soft leading-relaxed">
              ¿Eliminar <span className="font-semibold text-ink">"{removeOpen?.value}"</span> de la lista de {active.label.toLowerCase()}?
            </p>
          </div>
          <div className="rounded-xl bg-surface-lo border border-outline-soft p-3 text-[12px] text-ink-soft">
            Las llantas ya guardadas con este valor lo conservan; sólo dejará de ofrecerse en formularios nuevos.
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─── Impresora (Bluetooth ESC/POS) ───
const ImpresoraScreen = ({ onClose }) => {
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [err, setErr] = useState('');
  const [paired, setPaired] = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [selected, setSelected] = useState(printer.saved());
  const [connectedTo, setConnectedTo] = useState(null);
  const [width, setWidthState] = useState(printer.width());
  const [pluginAvailable] = useState(printer.isAvailable());

  const refreshSaved = () => setSelected(printer.saved());

  const showErr = (e) => setErr(e && e.message ? e.message : String(e));

  const ensureBT = async () => {
    // 1) Pedir permisos runtime (Android 12+)
    await printer.requestBluetoothPermissions();
    // 2) Encender BT si está apagado
    const enabled = await printer.isEnabled();
    if (!enabled) {
      try { await printer.enable(); } catch (e) {
        throw new Error('Bluetooth deshabilitado. Activalo y reintentá.');
      }
    }
  };

  const buscarPareados = async () => {
    setErr(''); setBusy(true); setBusyMsg('Listando dispositivos emparejados...');
    try {
      await ensureBT();
      const list = await printer.list();
      setPaired(Array.isArray(list) ? list : []);
    } catch (e) { showErr(e); }
    finally { setBusy(false); setBusyMsg(''); }
  };

  const escanear = async () => {
    setErr(''); setBusy(true); setBusyMsg('Buscando dispositivos cercanos (~12s)...');
    try {
      await ensureBT();
      const list = await printer.discoverUnpaired();
      setDiscovered(Array.isArray(list) ? list : []);
    } catch (e) { showErr(e); }
    finally { setBusy(false); setBusyMsg(''); }
  };

  const conectar = async (dev) => {
    setErr(''); setBusy(true); setBusyMsg('Conectando a ' + (dev.name || dev.address) + '...');
    try {
      await printer.connect(dev.address);
      await printer.saveSelected(dev.name || 'Impresora', dev.address);
      setConnectedTo(dev.address);
      refreshSaved();
    } catch (e) { showErr(e); setConnectedTo(null); }
    finally { setBusy(false); setBusyMsg(''); }
  };

  const desconectar = async () => {
    setErr(''); setBusy(true); setBusyMsg('Desconectando...');
    try { await printer.disconnect(); setConnectedTo(null); }
    catch (e) { showErr(e); }
    finally { setBusy(false); setBusyMsg(''); }
  };

  const imprimirPrueba = async () => {
    setErr(''); setBusy(true); setBusyMsg('Enviando prueba...');
    try {
      const conn = await printer.isConnected();
      if (!conn) {
        if (!selected.addr) throw new Error('No hay impresora guardada. Conectate una primero.');
        await printer.connect(selected.addr);
        setConnectedTo(selected.addr);
      }
      await printer.testPrint();
    } catch (e) { showErr(e); }
    finally { setBusy(false); setBusyMsg(''); }
  };

  const olvidar = async () => {
    setErr(''); setBusy(true); setBusyMsg('Borrando impresora guardada...');
    try {
      await printer.disconnect().catch(() => {});
      await printer.clearSelected();
      setConnectedTo(null);
      refreshSaved();
    } catch (e) { showErr(e); }
    finally { setBusy(false); setBusyMsg(''); }
  };

  const cambiarAncho = async (w) => {
    await printer.setWidth(w);
    setWidthState(printer.width());
  };

  // Listado combinado: emparejados + descubiertos sin duplicar
  const todos = useMemo(() => {
    const map = {};
    for (const d of paired) if (d && d.address) map[d.address] = { ...d, paired: true };
    for (const d of discovered) if (d && d.address && !map[d.address]) map[d.address] = { ...d, paired: false };
    return Object.values(map);
  }, [paired, discovered]);

  return (
    <div className="screen-enter px-5 py-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="print" className="text-primary" />
        <h2 className="text-[22px] font-bold text-primary">Impresora Bluetooth</h2>
      </div>
      <p className="text-ink-soft text-[13px] mb-4">Configura tu impresora térmica y haz una impresión de prueba.</p>

      {!pluginAvailable && (
        <div className="rounded-lg bg-warn-soft text-[#6b4a10] text-[12px] px-3 py-2 mb-4">
          ⚠ Plugin Bluetooth no detectado. Esto solo funciona en el APK Android, no en el preview de browser.
        </div>
      )}

      {/* Estado de impresora guardada */}
      <div className="bg-surface-white border border-outline-soft/60 rounded-xl p-3 mb-4">
        <div className="text-[11px] uppercase tracking-wider text-ink-soft font-bold mb-1">Impresora guardada</div>
        {selected.addr ? (
          <>
            <div className="font-bold text-ink">{selected.name || 'Impresora'}</div>
            <div className="text-[12px] text-ink-soft">{selected.addr}</div>
            <div className="mt-2 flex gap-2">
              <PrimaryButton onClick={imprimirPrueba} icon="print" className="flex-1" disabled={busy}>Imprimir prueba</PrimaryButton>
              <SecondaryButton onClick={olvidar} className="flex-1" disabled={busy}>Olvidar</SecondaryButton>
            </div>
            {connectedTo === selected.addr && (
              <div className="mt-2 text-[11px] text-ok">● Conectado en esta sesión</div>
            )}
          </>
        ) : (
          <div className="text-[13px] text-ink-soft">Ninguna. Escaneá y seleccioná una abajo.</div>
        )}
      </div>

      {/* Ancho de papel */}
      <div className="bg-surface-white border border-outline-soft/60 rounded-xl p-3 mb-4">
        <div className="text-[11px] uppercase tracking-wider text-ink-soft font-bold mb-2">Ancho de papel</div>
        <div className="flex gap-2">
          {[58, 80].map(w => (
            <button
              key={w}
              onClick={() => cambiarAncho(w)}
              className={'flex-1 py-2 rounded-lg text-[13px] font-semibold border ' + (width === w ? 'bg-primary text-white border-primary' : 'bg-surface-white text-ink border-outline-soft')}
            >
              {w} mm
            </button>
          ))}
        </div>
      </div>

      {/* Buscar impresoras */}
      <div className="flex gap-2 mb-3">
        <SecondaryButton onClick={buscarPareados} icon="list" className="flex-1" disabled={busy}>Emparejados</SecondaryButton>
        <PrimaryButton onClick={escanear} icon="bluetooth_searching" className="flex-1" disabled={busy}>Escanear</PrimaryButton>
      </div>

      {err && (
        <div className="rounded-lg bg-err-soft text-err text-[12px] px-3 py-2 mb-3">
          {err}
        </div>
      )}

      {todos.length === 0 && !busy && (
        <div className="text-[12px] text-ink-soft text-center py-6">
          Tocá "Emparejados" para ver los dispositivos ya pareados con el sistema,<br />
          o "Escanear" para buscar nuevos. Asegurate de que la impresora esté encendida.
        </div>
      )}

      <div className="space-y-2 mb-6">
        {todos.map(d => (
          <button
            key={d.address}
            onClick={() => conectar(d)}
            disabled={busy}
            className="w-full bg-surface-white border border-outline-soft/60 rounded-xl p-3 flex items-center gap-3 hover:border-primary/40 hover:shadow-card active:scale-[0.99] transition text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Icon name="bluetooth" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-ink truncate">{d.name || 'Sin nombre'}</div>
              <div className="text-[11px] text-ink-soft">{d.address}{d.paired ? ' · Emparejado' : ''}</div>
            </div>
            <div className="text-[11px] font-semibold text-primary">Conectar</div>
          </button>
        ))}
      </div>

      <SecondaryButton onClick={onClose} className="w-full">Volver</SecondaryButton>

      {busy && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6">
          <div className="bg-surface-white rounded-2xl shadow-card px-6 py-5 flex flex-col items-center gap-3 max-w-[280px]">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="text-[13px] font-semibold text-primary text-center">{busyMsg || 'Procesando...'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { AdminHub, UsuariosScreen, CatalogosScreen, ListasScreen, ImpresoraScreen, CatalogCard, UserFormModal, CatalogFormModal });
