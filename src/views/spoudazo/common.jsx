import { useStore } from '../../store/index.jsx';
import { todayKey } from '../../store/engine';
import { useToast, Picker } from '../../lib/ui.jsx';
import { BIBLE } from '../../data/spoudazo';

// Everything a Spoudazō page needs: your data, today's date and one way to change it.
export function useLife() {
  const store = useStore();
  const toast = useToast();
  const now = new Date().toTimeString().slice(0, 5);
  return { ...store, l: store.state.life, g: store.state.life.goals, today: todayKey(), now, toast, act: store.life };
}

export const BookPicker = ({ value, onChange }) => (
  <Picker label="Book of the Bible" value={value} onChange={onChange} options={BIBLE.map(([b, n]) => ({ value: b, label: b, meta: `${n} ch` }))} />
);

export const greeting = (time) => (time < '12:00' ? 'Good morning' : time < '17:00' ? 'Good afternoon' : 'Good evening');

// A small "have of goal" meter
export function Meter({ have = 0, goal = 0, unit = '' }) {
  const pct = goal ? Math.min(100, (have / goal) * 100) : 0;
  return (
    <span className={'meter' + (goal && have >= goal ? ' full' : '')}>
      <i style={{ width: `${pct}%` }} />
      <small>{have}{goal ? ` / ${goal}` : ''}{unit ? ` ${unit}` : ''}</small>
    </span>
  );
}
