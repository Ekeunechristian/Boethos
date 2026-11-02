import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import EntrySheet from './EntrySheet.jsx';
import { Empty } from '../lib/ui.jsx';

// A list of records with add / edit / delete, all through one sheet.
// row(item) → { title, sub, meta }
export default function Collection({ noun, items, fields, defaults, row, onAdd, onUpdate, onDelete, emptyTitle, emptyText, numbered, sort }) {
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const list = sort ? [...items].sort(sort) : items;

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <span className="muted small">{items.length ? `${items.length} ${items.length === 1 ? noun : noun + 's'}` : ''}</span>
        <button className="primary" onClick={() => setEditing('new')}><Plus size={18} />Add {noun}</button>
      </div>
      <ul className="list">
        {list.length === 0 && (
          <li><Empty title={emptyTitle} action={<button onClick={() => setEditing('new')}><Plus size={16} />Add your first {noun}</button>}><p style={{ margin: 0 }}>{emptyText}</p></Empty></li>
        )}
        {list.map((it, i) => {
          const r = row(it);
          return (
            <li key={it.id}>
              <button type="button" className="item" onClick={() => setEditing(it)}>
                {numbered && <span className="no">{i + 1}</span>}
                <span className="t"><b>{r.title || 'Untitled'}</b>{r.sub && <small className="clamp">{r.sub}</small>}</span>
                {r.meta && <span className="meta">{r.meta}</span>}
                <ChevronRight className="chev" size={18} />
              </button>
            </li>
          );
        })}
      </ul>
      {editing && (
        <EntrySheet noun={noun} fields={fields} defaults={defaults}
          initial={editing === 'new' ? null : editing}
          onSave={(data) => (editing === 'new' ? onAdd(data) : onUpdate(editing.id, data))}
          onDelete={editing === 'new' ? null : () => onDelete(editing.id)}
          onClose={() => setEditing(null)} />
      )}
    </>
  );
}
