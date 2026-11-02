import { useState } from 'react';
import { Sheet, SheetHead, Picker } from '../lib/ui.jsx';

// One form for every kind of record. A field is
// { key, label, type?: 'text'|'textarea'|'select'|'date'|'url'|'number'|'checkbox', options?, ph?, wide?, required? }
export default function EntrySheet({ noun, fields, initial, defaults, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() => ({ ...defaults, ...initial }));
  const [confirm, setConfirm] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const missing = fields.some(f => f.required && !String(form[f.key] ?? '').trim());

  const submit = (e) => {
    e.preventDefault();
    if (missing) return;
    const { id, ...data } = form;
    onSave(data);
    onClose();
  };

  return (
    <Sheet onClose={onClose} className="wide" label={initial ? `Edit ${noun}` : `Add ${noun}`}>
      <SheetHead eyebrow={initial ? 'Edit' : 'New'} title={initial ? (form[fields[0].key] || noun) : `Add ${noun}`} onClose={onClose} />
      <form onSubmit={submit}>
        <div className="fields">
          {fields.map(f => {
            const id = `f-${f.key}`;
            const v = form[f.key] ?? '';
            const wide = f.wide || f.type === 'textarea';
            if (f.type === 'checkbox') {
              return (
                <div key={f.key} className={'field' + (wide ? ' wide' : '')} style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label className="toggle" style={{ minHeight: 44 }}><input type="checkbox" checked={!!form[f.key]} onChange={e => set(f.key, e.target.checked)} />{f.label}</label>
                </div>
              );
            }
            return (
              <div key={f.key} className={'field' + (wide ? ' wide' : '')}>
                <label htmlFor={id}>{f.label}{f.required && ' *'}</label>
                {f.type === 'textarea' ? (
                  <textarea id={id} value={v} placeholder={f.ph} onChange={e => set(f.key, e.target.value)} style={{ minHeight: 96 }} />
                ) : f.type === 'select' ? (
                  <Picker label={f.label} value={String(v)} onChange={(val) => set(f.key, val)}
                    options={f.options.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return { value: String(val), label: lab }; })} />
                ) : (
                  <input id={id} type={f.type || 'text'} value={v} placeholder={f.ph} onChange={e => set(f.key, e.target.value)} />
                )}
              </div>
            );
          })}
        </div>
        <div className="sheet-foot">
          {onDelete && (
            <button type="button" className={'danger' + (confirm ? ' solid' : '')} onClick={() => { if (confirm) { onDelete(); onClose(); } else setConfirm(true); }}>
              {confirm ? 'Tap again to delete' : 'Delete'}
            </button>
          )}
          <span className="grow" />
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={missing}>{initial ? 'Save' : `Add ${noun}`}</button>
        </div>
      </form>
    </Sheet>
  );
}
