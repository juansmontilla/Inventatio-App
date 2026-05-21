// Shared UI primitives — TopBar, BottomNav, inputs, buttons, chips, toast

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── Icon helper ───
const Icon = ({ name, fill = false, className = '', style = {} }) => (
  <span className={`ms ${fill ? 'ms-fill' : ''} ${className}`} style={style}>{name}</span>
);

// ─── Top app bar (fixed in screen) ───
const TopBar = ({ onMenu, onAccount, showBack, onBack }) => (
  <header className="flex items-center justify-between px-5 h-14 bg-surface border-b border-outline-soft/60 sticky top-0 z-30">
    <div className="flex items-center gap-3">
      {showBack ? (
        <button onClick={onBack} className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-surface-mid active:scale-95 transition text-primary">
          <Icon name="arrow_back" />
        </button>
      ) : (
        <button onClick={onMenu} className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-surface-mid active:scale-95 transition text-primary">
          <Icon name="menu" />
        </button>
      )}
      <h1 className="text-[20px] font-bold tracking-tight text-primary">Salvallanta</h1>
    </div>
    <button onClick={onAccount} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-mid active:scale-95 transition text-primary">
      <Icon name="account_circle" />
    </button>
  </header>
);

// ─── Bottom nav ───
const NavItem = ({ icon, label, active, onClick, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    className={`flex flex-col items-center justify-center px-2 py-1.5 min-w-[58px] rounded-xl transition active:scale-95 ${
      active ? 'bg-primary-soft text-primary' : disabled ? 'text-outline-soft' : 'text-ink-soft hover:text-primary'
    }`}
  >
    <Icon name={icon} fill={active} />
    <span className="text-[11px] font-semibold mt-0.5 tracking-tight">{label}</span>
  </button>
);

const BottomNav = ({ current, role, onNav }) => {
  const items = [
    { id: 'panel',     icon: 'dashboard', label: 'Panel' },
    { id: 'consultar', icon: 'search',    label: 'Consultar' },
    { id: 'vender',    icon: 'shopping_cart', label: 'Vender', adminOrRec: true },
    { id: 'admin',     icon: 'settings',  label: 'Admin', adminOnly: true },
  ];
  const allowed = ROLES[role].nav;
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-surface border-t border-outline-soft/60 flex justify-around items-center py-2 pb-[18px] z-30">
      {items.map(it => {
        const isAllowed = allowed.includes(it.id);
        return (
          <NavItem
            key={it.id}
            icon={it.icon}
            label={it.label}
            active={current === it.id}
            disabled={!isAllowed}
            onClick={() => onNav(it.id)}
          />
        );
      })}
    </nav>
  );
};

// ─── Buttons ───
const PrimaryButton = ({ children, onClick, icon, type='button', className='', disabled }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`h-12 px-5 inline-flex items-center justify-center gap-2 bg-primary text-white rounded-lg font-semibold text-[14px] tracking-wide shadow-press hover:bg-primary-2 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {icon && <Icon name={icon} />}
    {children}
  </button>
);
const SecondaryButton = ({ children, onClick, icon, type='button', className='' }) => (
  <button
    type={type}
    onClick={onClick}
    className={`h-12 px-5 inline-flex items-center justify-center gap-2 bg-surface-white text-ink rounded-lg font-semibold text-[14px] border border-outline-soft hover:bg-surface-mid active:scale-[0.98] transition ${className}`}
  >
    {icon && <Icon name={icon} />}
    {children}
  </button>
);
const GhostButton = ({ children, onClick, icon, className='' }) => (
  <button onClick={onClick} className={`inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-primary active:scale-95 transition ${className}`}>
    {icon && <Icon name={icon} style={{fontSize: 18}} />}
    {children}
  </button>
);

// ─── Inputs ───
const Field = ({ label, children, hint, error, className='' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className={`text-[13px] font-semibold tracking-wide ${error ? 'text-err' : 'text-ink'}`}>{label}</label>}
    {children}
    {error ? <span className="text-[11px] text-err font-semibold flex items-center gap-1"><span className="ms" style={{fontSize:14}}>error</span>{error}</span> : hint && <span className="text-[11px] text-ink-soft">{hint}</span>}
  </div>
);

const TextInput = React.forwardRef(({ value, onChange, placeholder, readOnly, icon, type='text', maxLength, className='', error, inactive, uppercase }, ref) => {
  const handleChange = (e) => {
    if (!onChange) return;
    if (uppercase && e.target.value) {
      // Mutate event value to uppercase so consumers see it
      const upper = e.target.value.toUpperCase();
      if (upper !== e.target.value) {
        e.target.value = upper;
      }
    }
    onChange(e);
  };
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${error ? 'text-err' : 'text-outline'}`}>
          <Icon name={icon} style={{ fontSize: 20 }} />
        </span>
      )}
      <input
        ref={ref}
        type={type}
        value={value ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        style={uppercase ? { textTransform: 'uppercase' } : undefined}
        className={`h-11 w-full ${icon ? 'pl-10' : 'pl-3.5'} pr-3.5 rounded-lg text-[15px] placeholder:text-outline/80 placeholder:normal-case focus:outline-none focus:ring-2 transition
          ${error
            ? 'bg-err-soft/30 border border-err text-err focus:border-err focus:ring-err/20'
            : inactive
              ? 'bg-surface-lo/60 border border-dashed border-outline-soft/70 text-outline'
              : readOnly
                ? 'bg-surface-lo border border-outline-soft text-ink-soft'
                : 'bg-surface-white border border-outline-soft text-ink focus:border-primary focus:ring-primary/15'}`}
      />
    </div>
  );
});

// Money input — formats with dot thousands separators (es-CO)
const MoneyInputFormatted = ({ value, onChange, placeholder = '0', error }) => {
  // value is a number (or '' when empty). Display formatted, parse on input.
  const display = value === '' || value == null ? '' : Number(value).toLocaleString('es-CO');
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') return onChange('');
    onChange(parseInt(raw, 10));
  };
  return (
    <div className="relative">
      <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none font-semibold ${error ? 'text-err' : 'text-outline'}`}>$</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={`h-11 w-full pl-7 pr-3.5 rounded-lg text-[15px] tabular-nums placeholder:text-outline/80 focus:outline-none focus:ring-2 transition
          ${error
            ? 'bg-err-soft/30 border border-err text-err focus:border-err focus:ring-err/20'
            : 'bg-surface-white border border-outline-soft text-ink focus:border-primary focus:ring-primary/15'}`}
      />
    </div>
  );
};

const Select = ({ value, onChange, options, placeholder = '— Seleccionar —' }) => (
  <div className="relative">
    <select
      value={value ?? ''}
      onChange={onChange}
      className={`appearance-none h-11 w-full pl-3.5 pr-9 bg-surface-white border border-outline-soft rounded-lg text-[15px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition ${!value ? 'text-outline' : 'text-ink'}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
  </div>
);

// Text input with datalist suggestions (free-text, not restricted to list)
const AutocompleteInput = ({ value, onChange, suggestions = [], placeholder, id, uppercase, error }) => {
  const listId = useMemo(() => id || 'dl-' + Math.random().toString(36).slice(2, 9), [id]);
  const handleChange = (e) => {
    if (uppercase && e.target.value) {
      const upper = e.target.value.toUpperCase();
      if (upper !== e.target.value) e.target.value = upper;
    }
    onChange(e);
  };
  return (
    <>
      <input
        list={listId}
        value={value ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        style={uppercase ? { textTransform: 'uppercase' } : undefined}
        className={`h-11 w-full pl-3.5 pr-3.5 rounded-lg text-[15px] placeholder:text-outline/80 placeholder:normal-case focus:outline-none focus:ring-2 transition
          ${error
            ? 'bg-err-soft/30 border border-err text-err focus:border-err focus:ring-err/20'
            : 'bg-surface-white border border-outline-soft text-ink focus:border-primary focus:ring-primary/15'}`}
      />
      <datalist id={listId}>
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    </>
  );
};

// Money input (formatted, COP) — alias to formatted version
const MoneyInput = MoneyInputFormatted;

// Photo slot — opens camera (mobile) or file picker (desktop), shows preview
const PhotoSlot = ({ value, onChange, label }) => {
  const ref = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    // reset value so picking the same file twice re-fires onChange
    e.target.value = '';
  };
  return (
    <div className="relative aspect-square">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      {value ? (
        <div className="w-full h-full rounded-xl overflow-hidden bg-surface-mid border border-outline-soft relative group">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-black/80 active:scale-95"
            aria-label="Eliminar foto"
          >
            <Icon name="close" style={{ fontSize: 16 }} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-1 text-white text-[11px] font-semibold">
            {label}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full h-full bg-surface-mid border-2 border-dashed border-outline-soft rounded-xl flex flex-col items-center justify-center gap-1.5 text-outline hover:bg-surface-hi hover:text-ink-soft active:scale-[0.98] transition"
        >
          <Icon name="photo_camera" style={{ fontSize: 28 }} />
          <span className="text-[12px] font-semibold">{label}</span>
          <span className="text-[10px] uppercase tracking-wider">Cámara / Archivo</span>
        </button>
      )}
    </div>
  );
};

const Counter = ({ value, onChange, min=1, max=99, onOverflow, onUnderflow, disabled }) => (
  <div className={`h-11 flex items-center bg-surface-white border border-outline-soft rounded-lg overflow-hidden ${disabled ? 'opacity-50 bg-surface-lo' : ''}`}>
    <button type="button" disabled={disabled} onClick={() => {
      if (disabled) return;
      if (value <= min) { onUnderflow && onUnderflow(); return; }
      onChange(Math.max(min, value-1));
    }} className="w-12 h-full flex items-center justify-center text-ink hover:bg-surface-mid active:scale-95 transition disabled:cursor-not-allowed disabled:hover:bg-transparent">
      <Icon name="remove" />
    </button>
    <div className="flex-1 text-center font-semibold text-[15px] tabular-nums">{value}</div>
    <button type="button" disabled={disabled} onClick={() => {
      if (disabled) return;
      if (value >= max) { onOverflow && onOverflow(); return; }
      onChange(Math.min(max, value+1));
    }} className="w-12 h-full flex items-center justify-center text-ink hover:bg-surface-mid active:scale-95 transition disabled:cursor-not-allowed disabled:hover:bg-transparent">
      <Icon name="add" />
    </button>
  </div>
);

// ─── Chips / Status ───
const chipColor = (kind, value) => {
  if (kind === 'estado') return value === 'Nueva' ? 'bg-ok-soft text-ok' : 'bg-primary-soft text-primary';
  if (kind === 'condicion') {
    if (/excelente|nuevo/i.test(value)) return 'bg-accent-soft text-[#6b4a10]';
    if (/repar/i.test(value)) return 'bg-err-soft text-err';
    if (/garant/i.test(value)) return 'bg-primary-soft text-primary';
    return 'bg-surface-hi text-ink-soft';
  }
  if (kind === 'role') {
    if (value === 'admin') return 'bg-primary-soft text-primary';
    if (value === 'recepcion') return 'bg-accent-soft text-[#6b4a10]';
    return 'bg-surface-hi text-ink-soft';
  }
  return 'bg-surface-hi text-ink-soft';
};
const Chip = ({ kind, children, className='' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${chipColor(kind, children)} ${className}`}>{children}</span>
);

// ─── Tire visual placeholder (no real photos) ───
const TireGlyph = ({ size = 48, className='' }) => (
  <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <circle cx="32" cy="32" r="28" fill="#1b1b1d" />
      <circle cx="32" cy="32" r="20" fill="#303032" />
      <circle cx="32" cy="32" r="9"  fill="#75777d" />
      <circle cx="32" cy="32" r="4"  fill="#1b1b1d" />
      {Array.from({length:12}).map((_,i)=>{
        const a = (i/12)*Math.PI*2;
        const x1 = 32 + Math.cos(a)*21, y1 = 32 + Math.sin(a)*21;
        const x2 = 32 + Math.cos(a)*27, y2 = 32 + Math.sin(a)*27;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0a0a0b" strokeWidth="3" />;
      })}
    </svg>
  </div>
);

// ─── Photo placeholder (subtle stripes + label) ───
const PhotoPlaceholder = ({ label = 'foto', size = 'square', className = '' }) => (
  <div className={`ph-stripes rounded-lg border border-outline-soft/60 flex items-center justify-center ${size==='square' ? 'aspect-square' : ''} ${className}`}>
    <div className="flex flex-col items-center text-outline">
      <Icon name="photo_camera" style={{ fontSize: 28 }} />
      <span className="font-mono text-[10px] mt-1 uppercase tracking-wide">{label}</span>
    </div>
  </div>
);

// ─── Toast ───
const Toast = ({ msg, kind='ok' }) => {
  if (!msg) return null;
  const color = kind==='ok' ? 'bg-primary text-white' : 'bg-err text-white';
  return (
    <div className={`toast-enter absolute top-16 left-1/2 -translate-x-1/2 ${color} px-4 py-2.5 rounded-full text-[13px] font-semibold shadow-press z-50 flex items-center gap-2`}>
      <Icon name={kind==='ok' ? 'check_circle' : 'error'} style={{ fontSize: 18 }} />
      {msg}
    </div>
  );
};

// ─── Side drawer (menu) ───
const SideDrawer = ({ open, onClose, user, onLogout, onNav }) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="absolute left-0 top-0 bottom-0 w-[78%] bg-surface shadow-2xl flex flex-col" style={{animation: 'fadeUp 0.22s ease'}}>
        <div className="px-5 py-5 bg-primary text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-2 flex items-center justify-center font-bold text-lg">
              {user.name.split(' ').map(s=>s[0]).slice(0,2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{user.name}</div>
              <div className="text-[12px] opacity-80 capitalize">{ROLES[user.role].label}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 py-3">
          {ROLES[user.role].nav.includes('panel') && (
            <DrawerItem icon="dashboard" label="Panel de Control" onClick={() => { onNav('panel'); onClose(); }} />
          )}
          {ROLES[user.role].nav.includes('consultar') && (
            <DrawerItem icon="search" label="Consultar Llantas" onClick={() => { onNav('consultar'); onClose(); }} />
          )}
          {user.role === 'admin' && (
            <DrawerItem icon="add_circle" label="Agregar Llantas" onClick={() => { onNav('agregar'); onClose(); }} />
          )}
          {ROLES[user.role].nav.includes('vender') && (
            <DrawerItem icon="shopping_cart" label="Vender" onClick={() => { onNav('vender'); onClose(); }} />
          )}
          {user.role === 'admin' && <>
            <DrawerItem icon="inventory_2" label="Catálogos" onClick={() => { onNav('catalogos'); onClose(); }} />
            <DrawerItem icon="group" label="Usuarios" onClick={() => { onNav('usuarios'); onClose(); }} />
          </>}
        </div>
        <div className="p-4 border-t border-outline-soft/60">
          <button onClick={onLogout} className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border border-err/30 text-err font-semibold bg-err-soft/40 hover:bg-err-soft active:scale-[0.98] transition">
            <Icon name="logout" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
const DrawerItem = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-mid text-ink active:scale-[0.99] transition text-left">
    <Icon name={icon} className="text-primary" />
    <span className="font-medium text-[14px]">{label}</span>
  </button>
);

// ─── Modal ───
const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative bg-surface w-full max-h-[85%] rounded-t-3xl shadow-2xl flex flex-col modal-enter">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="font-bold text-[18px] text-primary">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-mid">
            <Icon name="close" />
          </button>
        </div>
        <div className="px-5 pb-3 overflow-auto phone-scroll">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-outline-soft/60">{footer}</div>}
      </div>
    </div>
  );
};

Object.assign(window, {
  Icon, TopBar, BottomNav, NavItem,
  PrimaryButton, SecondaryButton, GhostButton,
  Field, TextInput, Select, Counter, AutocompleteInput, MoneyInput, PhotoSlot,
  Chip, TireGlyph, PhotoPlaceholder, Toast,
  SideDrawer, Modal,
});
