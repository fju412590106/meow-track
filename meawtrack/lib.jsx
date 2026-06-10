/* lib.jsx — shared helpers, icons, and UI primitives */
const { useState, useEffect, useRef, useCallback } = React;

/* ---------- constants ---------- */
const MACROS = [
  { key: "protein", label: "Protein", color: "var(--protein)", cls: "p", kcal: 4 },
  { key: "carbs",   label: "Carbs",   color: "var(--carbs)",   cls: "c", kcal: 4 },
  { key: "fat",     label: "Fat",     color: "var(--fat)",     cls: "f", kcal: 9 },
];

const DEFAULT_GOALS = { bmr: 1600, tdee: 2200, calories: 2000, protein: 150, carbs: 200, fat: 65 };

/* ---------- storage ---------- */
const LS = {
  get(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function usePersisted(key, initial) {
  const [val, setVal] = useState(() => LS.get(key, initial));
  useEffect(() => { LS.set(key, val); }, [key, val]);
  return [val, setVal];
}

/* ---------- date helpers ---------- */
function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
function prettyDate(d = new Date()) {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

/* ---------- math ---------- */
const round = (n) => Math.round(n || 0);
const clampPct = (v, g) => g > 0 ? Math.min(100, (v / g) * 100) : 0;

function sumMeals(meals) {
  return meals.reduce((a, m) => ({
    calories: a.calories + (+m.calories || 0),
    protein:  a.protein  + (+m.protein  || 0),
    carbs:    a.carbs    + (+m.carbs    || 0),
    fat:      a.fat      + (+m.fat      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

/* ---------- icons (inline, stroke-based) ---------- */
const Icon = {
  flame: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 2 1 4 3.2 4 6a7 7 0 1 1-14 0c0-4.5 4-6.5 4-11 1.5.8 3 2.4 3 0z"/></svg>,
  grid:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>,
  plus:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  target:(p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>,
  cal:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="17" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>,
  trash: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  camera:(p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" transform="translate(-1 0)"/><circle cx="11" cy="13" r="3.6"/></svg>,
  x:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  sparkle:(p)=> <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/><path d="M19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6L16 17.5l2.1-.9z"/></svg>,
  drop:  (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2.5s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 9.5 12 2.5 12 2.5z"/></svg>,
  leaf:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16z"/><path d="M4 20c4-6 8-8 13-9"/></svg>,
  bolt:  (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>,
  info:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/></svg>,
};

/* ---------- Ring (donut) ---------- */
function Ring({ value, goal, size = 188, stroke = 16, color = "var(--accent)", label, unit }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clampPct(value, goal) / 100;
  const over = goal > 0 && value > goal;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={over ? "var(--accent-d)" : color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div className="ring-center">
        <div className="big" style={{ color: over ? "var(--accent-d)" : "var(--ink)" }}>{round(value)}</div>
        <div className="lab">{label}</div>
        <div className="goal">{over ? `${round(value - goal)} over` : `of ${round(goal)}${unit ? " " + unit : ""}`}</div>
      </div>
    </div>
  );
}

/* ---------- MacroBar ---------- */
function MacroBar({ macro, value, goal }) {
  const pct = clampPct(value, goal);
  const over = goal > 0 && value > goal;
  return (
    <div className="macro">
      <div className="macro-top">
        <div className="macro-name"><span className="dot" style={{ background: macro.color }}></span>{macro.label}</div>
        <div className={"macro-val" + (over ? " over" : "")}><b>{round(value)}</b> / {round(goal)} g</div>
      </div>
      <div className="bar"><span style={{ width: pct + "%", background: macro.color }}></span></div>
    </div>
  );
}

/* ---------- Toast ---------- */
function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef();
  const show = useCallback((m) => {
    setMsg(m); clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2400);
  }, []);
  const node = (
    <div className={"toast" + (msg ? " show" : "")}>
      {msg && <>{Icon.check()}{msg}</>}
    </div>
  );
  return [node, show];
}

Object.assign(window, {
  React, useState, useEffect, useRef, useCallback,
  MACROS, DEFAULT_GOALS, LS, usePersisted, todayKey, prettyDate,
  round, clampPct, sumMeals, Icon, Ring, MacroBar, useToast,
});
