// Model: all data + the functions that change it. No DOM, no view imports.
const KEY = 'netzone-state-v2';
const RATE = { regular: 20, vip: 35 }; // pesos per hour

export const state = { nextId: 100, users: [], units: [], waitlist: [], pending: [], updates: [] };

const newId = () => state.nextId++;
const persist = () => localStorage.setItem(KEY, JSON.stringify(state));

const seed = () => {
  state.users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', balance: 0 },
    { id: 2, username: 'juan', password: '1234', role: 'player', balance: 120 },
  ];
  state.units = [1, 2, 3, 4, 5, 6].map(id => ({
    id, name: `Unit ${id}`, type: id <= 4 ? 'regular' : 'vip', broken: id === 6, player: null, startedAt: null, paid: 0,
  }));
  Object.assign(state.units[1], { player: 'Ana', startedAt: Date.now() - 45 * 60000, paid: 40 });
  state.updates = [
    { id: 3, kind: 'Tournament', title: 'Rules of Survival Tournament', date: '2026-11-28', link: 'https://example.com/register', details: 'Battle for your life! Register using the form link.' },
    { id: 4, kind: 'Raffle', title: 'Top-up raffle ticket', date: '', link: '', details: 'Top up ₱100 or more and get one raffle ticket.' },
  ];
};

export const init = () => {
  const saved = localStorage.getItem(KEY);
  if (saved) Object.assign(state, JSON.parse(saved));
  else { seed(); persist(); }
};

// ---------- helpers ----------
let currentId = Number(sessionStorage.getItem('netzone-user')) || null; // per browser tab
const setCurrent = id => (id ? sessionStorage.setItem('netzone-user', id) : sessionStorage.removeItem('netzone-user'), (currentId = id));
export const currentUser = () => state.users.find(u => u.id === currentId) ?? null;

// Another tab (e.g. a shop PC) changed the data: pull it in.
export const reload = key => {
  if (key !== KEY) return false;
  Object.assign(state, JSON.parse(localStorage.getItem(KEY)));
  return true;
};
const requireUser = () => {
  const user = currentUser();
  if (!user) throw new Error('Please log in first.');
  return user;
};
const requireAdmin = () => {
  if (requireUser().role !== 'admin') throw new Error('Admins only.');
};
const findUnit = id => state.units.find(u => u.id === id);
const myUnit = user => state.units.find(u => u.player === user.username);
const minutesPlayed = unit => Math.floor((Date.now() - unit.startedAt) / 60000);
const sessionValue = unit => Math.max(0, unit.paid - ((Date.now() - unit.startedAt) / 3600000) * RATE[unit.type]);
const minutesLeft = unit => Math.floor((sessionValue(unit) / RATE[unit.type]) * 60);

// wallet + what is left of the current session
export const balanceOf = user => {
  const unit = myUnit(user);
  return user.balance + (unit ? sessionValue(unit) : 0);
};

// ---------- auth ----------
export const login = (username, password, unitId = null) => {
  const user = state.users.find(u => u.username === username.trim() && u.password === password);
  if (!user) throw new Error('Wrong username or password.');
  if (unitId) beginSession(user, findUnit(unitId)); // logging in on a shop PC takes that unit
  setCurrent(user.id);
  persist();
};

export const register = (username, password) => {
  username = username.trim();
  if (username.length < 3) throw new Error('Username must be at least 3 characters.');
  if (password.length < 4) throw new Error('Password must be at least 4 characters.');
  if (state.users.some(u => u.username === username)) throw new Error('Username is already taken.');
  const user = { id: newId(), username, password, role: 'player', balance: 0 };
  state.users.push(user);
  setCurrent(user.id);
  persist();
};

export const logout = unitId => {
  const unit = findUnit(unitId);
  if (unit && unit.player === currentUser()?.username) freeUnit(unit); // quitting on the shop PC frees it
  setCurrent(null);
  persist();
};

// ---------- units + waiting list ----------
export const unitsInfo = () => {
  const user = currentUser();
  return state.units.map(u => {
    const busy = Boolean(u.player);
    const queue = state.waitlist.filter(w => w.unitId === u.id).map(w => w.username);
    return {
      id: u.id, name: u.name, type: u.type, rate: RATE[u.type], player: u.player, queue,
      state: u.broken ? 'broken' : busy ? 'busy' : 'free',
      played: busy ? minutesPlayed(u) : 0,
      left: busy ? minutesLeft(u) : 0,
      balance: busy ? sessionValue(u) : 0,
      mine: u.player === user.username,
      canJoin: busy && u.player !== user.username && !queue.includes(user.username),
      inQueue: queue.includes(user.username),
      canToggle: user.role === 'admin' && !busy,
    };
  });
};

// Called when a player logs in on a shop PC: the unit becomes theirs automatically.
const beginSession = (user, unit) => {
  if (!unit) throw new Error('Unknown unit.');
  if (unit.player === user.username) return; // already playing here
  if (unit.broken) throw new Error('That unit is out of service.');
  if (unit.player) throw new Error('That unit is already in use.');
  if (myUnit(user)) throw new Error('You already have a unit.');
  if (user.balance <= 0) throw new Error('No balance yet. Top up first.');
  Object.assign(unit, { player: user.username, startedAt: Date.now(), paid: user.balance });
  user.balance = 0;
  state.waitlist = state.waitlist.filter(w => w.username !== user.username);
};

const freeUnit = unit => {
  const owner = state.users.find(u => u.username === unit.player);
  if (owner) owner.balance += Math.round(sessionValue(unit) * 100) / 100;
  Object.assign(unit, { player: null, startedAt: null, paid: 0 });
};

export const expireSessions = () => {
  const done = state.units.filter(u => u.player && sessionValue(u) < 0.01);
  done.forEach(freeUnit);
  if (done.length) persist();
  return done.length > 0;
};

export const toggleBroken = unitId => {
  requireAdmin();
  const unit = findUnit(unitId);
  if (unit.player) throw new Error('Unit is in use.');
  unit.broken = !unit.broken;
  persist();
};

export const joinWaitlist = unitId => {
  const user = requireUser();
  const unit = findUnit(unitId);
  if (!unit.player) throw new Error('That unit is free. Start a session instead.');
  if (unit.player === user.username) throw new Error('You are already playing on this unit.');
  if (state.waitlist.some(w => w.unitId === unitId && w.username === user.username)) throw new Error('You are already on this waiting list.');
  state.waitlist.push({ id: newId(), unitId, username: user.username });
  persist();
};

export const leaveWaitlist = unitId => {
  const user = requireUser();
  state.waitlist = state.waitlist.filter(w => !(w.unitId === unitId && w.username === user.username));
  persist();
};

// ---------- top-up ----------
export const previewMinutes = amount => {
  const unit = myUnit(requireUser());
  return Math.floor((amount / RATE[unit?.type ?? 'regular']) * 60) || 0;
};

export const checkPayment = (amount, method) => {
  if (!Number.isFinite(amount) || amount < 10) throw new Error('Minimum top-up is ₱10.');
  if (amount > 1000) throw new Error('Maximum top-up is ₱1000.');
  if (!['GCash', 'Maya', 'Counter'].includes(method)) throw new Error('Choose a payment method.');
};

// Time is credited now. GCash/Maya count as paid; Pay to Counter stays unpaid until the counter marks it paid.
export const topUp = (amount, method) => {
  const user = requireUser();
  checkPayment(amount, method);
  const unit = myUnit(user);
  if (unit) unit.paid += amount;
  else user.balance += amount;
  if (method === 'Counter') state.pending.push({ id: newId(), username: user.username, amount });
  persist();
};

export const markPaid = id => {
  requireAdmin();
  state.pending = state.pending.filter(p => p.id !== id);
  persist();
};

export const pendingInfo = () => {
  const user = currentUser();
  const admin = user.role === 'admin';
  return state.pending.filter(p => admin || p.username === user.username).map(p => ({ ...p, canMarkPaid: admin }));
};

export const unpaidTotal = () => {
  const user = currentUser();
  return user ? state.pending.filter(p => p.username === user.username).reduce((sum, p) => sum + p.amount, 0) : 0;
};

// ---------- announcements ----------
export const getUpdate = id => state.updates.find(u => u.id === id) ?? null;

const cleanUpdate = ({ kind, title, details, date, link }) => {
  title = title.trim();
  details = details.trim();
  link = link.trim();
  if (title.length < 3) throw new Error('Title must be at least 3 characters.');
  if (!details) throw new Error('Please add some details.');
  if (link && !/^https?:\/\//.test(link)) throw new Error('Link must start with http:// or https://');
  return { kind, title, details, date, link };
};

export const addUpdate = data => {
  requireAdmin();
  state.updates.unshift({ id: newId(), ...cleanUpdate(data) });
  persist();
};

export const editUpdate = data => {
  requireAdmin();
  Object.assign(getUpdate(Number(data.id)), cleanUpdate(data));
  persist();
};

export const deleteUpdate = id => {
  requireAdmin();
  state.updates = state.updates.filter(u => u.id !== id);
  persist();
};
