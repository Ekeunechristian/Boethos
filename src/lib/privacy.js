// Restricted pastoral notes and care needs stay on this device unless you choose otherwise.
// Used by the backup file and by cloud sync, so both follow the same rule.

// A copy of the state with every person's restricted notes and care needs removed.
export function stripRestricted(state) {
  if (!state?.ministry?.people) return state;
  return { ...state, ministry: { ...state.ministry, people: state.ministry.people.map(p => ({ ...p, restricted: { notes: [], care: [], withheld: true } })) } };
}

// Incoming data (a restored file or the cloud copy) never wipes restricted notes kept on this device.
export function keepLocalRestricted(incoming, local) {
  const mine = Object.fromEntries((local?.ministry?.people || []).map(p => [p.id, p.restricted]));
  if (!incoming?.ministry?.people) return incoming;
  return { ...incoming, ministry: { ...incoming.ministry, people: incoming.ministry.people.map(p => {
    const here = mine[p.id];
    if (!here) return { ...p, restricted: { notes: p.restricted?.notes || [], care: p.restricted?.care || [] } };
    if (p.restricted?.withheld || (!p.restricted?.notes?.length && !p.restricted?.care?.length)) return { ...p, restricted: here };
    // both have notes: keep the union, by id
    const join = (a = [], b = []) => [...a, ...b.filter(x => !a.some(y => y.id === x.id))];
    return { ...p, restricted: { notes: join(p.restricted.notes, here.notes), care: join(p.restricted.care, here.care) } };
  }) } };
}
