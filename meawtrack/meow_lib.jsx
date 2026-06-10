/* lib.jsx — Meow Track shared helpers, icons, primitives, AI */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ============================================================
   Constants
   ============================================================ */
const MACROS = [
  { key: "carbs",   label: "Carbs",   color: "var(--carbs)",   emoji: "🍞", kcal: 4 },
  { key: "protein", label: "Protein", color: "var(--protein)", emoji: "🥩", kcal: 4 },
  { key: "fat",     label: "Fat",     color: "var(--fat)",     emoji: "🧀", kcal: 9 },
];

const DEFAULT_PROFILE = {
  name: "Alex",
  sex: "female",
  age: 29,
  height: 170,        // cm
  weight: 68,         // kg
  goalWeight: 56.5,   // kg
  startWeight: 68,
  activity: 1.55,
  goalType: "lose",   // lose | maintain | gain
  pace: 0.75,         // kg/week
  months: 4,
  units: "metric",    // metric | imperial
  startDate: "2026-06-04",
  targetDate: "2026-10-02",
  appleHealth: false,
};

const DEFAULT_GOALS = {
  calories: 1581, carbs: 119, protein: 158, fat: 53, water: 2000,
  bmr: 1496, tdee: 2319,
  // soft daily ceilings used for AI / flag analysis
  sugar: 36, sodium: 2300, cholesterol: 300, // g, mg, mg
};

/* macro split percentages used in onboarding plan */
const MACRO_SPLITS = {
  balanced:    { carbs: 30, protein: 40, fat: 30, label: "Balanced" },
  highprotein: { carbs: 25, protein: 45, fat: 30, label: "High protein" },
  lowcarb:     { carbs: 20, protein: 40, fat: 40, label: "Low carb" },
  endurance:   { carbs: 50, protein: 25, fat: 25, label: "Endurance" },
};

/* sample food database */
const FOOD_DB = [
  { name: "Grilled Chicken Breast", emoji: "🍗", serving: "100 g", cal: 165, carbs: 0, protein: 31, fat: 3.6, sugar: 0, sodium: 74, chol: 85 },
  { name: "Brown Rice (cooked)", emoji: "🍚", serving: "100 g", cal: 112, carbs: 24, protein: 2.6, fat: 0.9, sugar: 0.4, sodium: 5, chol: 0 },
  { name: "Banana", emoji: "🍌", serving: "1 medium", cal: 105, carbs: 27, protein: 1.3, fat: 0.4, sugar: 14, sodium: 1, chol: 0 },
  { name: "Greek Yogurt, plain", emoji: "🥛", serving: "170 g", cal: 100, carbs: 6, protein: 17, fat: 0.7, sugar: 6, sodium: 65, chol: 10 },
  { name: "Avocado", emoji: "🥑", serving: "½ fruit", cal: 160, carbs: 8.5, protein: 2, fat: 14.7, sugar: 0.7, sodium: 7, chol: 0 },
  { name: "Egg, large", emoji: "🥚", serving: "1 egg", cal: 78, carbs: 0.6, protein: 6.3, fat: 5.3, sugar: 0.6, sodium: 62, chol: 186 },
  { name: "Salmon, baked", emoji: "🐟", serving: "100 g", cal: 206, carbs: 0, protein: 22, fat: 13, sugar: 0, sodium: 61, chol: 63 },
  { name: "Oatmeal (cooked)", emoji: "🥣", serving: "1 cup", cal: 154, carbs: 27, protein: 6, fat: 3, sugar: 1, sodium: 9, chol: 0 },
  { name: "Almonds", emoji: "🌰", serving: "28 g", cal: 164, carbs: 6, protein: 6, fat: 14, sugar: 1.2, sodium: 0, chol: 0 },
  { name: "Sweet Potato, baked", emoji: "🍠", serving: "1 medium", cal: 112, carbs: 26, protein: 2, fat: 0.1, sugar: 5.4, sodium: 72, chol: 0 },
  { name: "Whole Milk", emoji: "🥛", serving: "250 ml", cal: 149, carbs: 12, protein: 8, fat: 8, sugar: 12, sodium: 105, chol: 24 },
  { name: "Bubble Milk Tea", emoji: "🧋", serving: "500 ml", cal: 320, carbs: 56, protein: 4, fat: 8, sugar: 38, sodium: 110, chol: 12 },
  { name: "Instant Ramen", emoji: "🍜", serving: "1 pack", cal: 380, carbs: 52, protein: 8, fat: 14, sugar: 3, sodium: 1820, chol: 0 },
  { name: "Caesar Salad", emoji: "🥗", serving: "1 bowl", cal: 240, carbs: 10, protein: 9, fat: 19, sugar: 3, sodium: 580, chol: 25 },
  { name: "Protein Bar", emoji: "🍫", serving: "1 bar", cal: 210, carbs: 22, protein: 20, fat: 7, sugar: 5, sodium: 200, chol: 5 },
];

/* sample barcode products */
const BARCODE_DB = [
  { code: "8 850999 320014", name: "Protein Milk Tea", emoji: "🥤", serving: "350 ml", cal: 175, carbs: 17.5, protein: 22, fat: 3.5, sugar: 9, sodium: 130, chol: 8, ingredients: ["Skim milk", "Whey protein isolate", "Black tea extract", "Cane sugar", "Stevia"] },
  { code: "4 901234 567890", name: "Greek Yogurt Cup", emoji: "🥛", serving: "150 g", cal: 90, carbs: 5, protein: 15, fat: 0.5, sugar: 5, sodium: 60, chol: 8, ingredients: ["Cultured pasteurized milk", "Live active cultures", "Pectin"] },
  { code: "0 049000 028911", name: "Sparkling Water", emoji: "🫧", serving: "330 ml", cal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 10, chol: 0, ingredients: ["Carbonated water", "Natural flavor"] },
];

/* ============================================================
   Storage
   ============================================================ */
const LS = {
  get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
function usePersisted(key, initial) {
  const [val, setVal] = useState(() => LS.get(key, initial));
  useEffect(() => { LS.set(key, val); }, [key, val]);
  return [val, setVal];
}

/* ============================================================
   Math / units
   ============================================================ */
const round = (n) => Math.round(n || 0);
const round1 = (n) => Math.round((n || 0) * 10) / 10;
const clampPct = (v, g) => g > 0 ? Math.min(100, (v / g) * 100) : 0;
const fmt = (n) => round(n).toLocaleString();

function kgToLb(kg) { return kg * 2.2046226; }
function lbToKg(lb) { return lb / 2.2046226; }
function cmToFtIn(cm) { const t = cm / 2.54; const ft = Math.floor(t / 12); return { ft, in: Math.round(t - ft * 12) }; }
function mlToOz(ml) { return ml / 29.5735; }

function dispWeight(kg, units, dp = 1) {
  if (units === "imperial") return round1(kgToLb(kg)).toFixed(dp === 0 ? 0 : 1);
  return round1(kg).toFixed(1);
}
const wUnit = (u) => u === "imperial" ? "lb" : "kg";
function dispVol(ml, units) { return units === "imperial" ? round(mlToOz(ml)) : round(ml); }
const vUnit = (u) => u === "imperial" ? "oz" : "ml";

function sumMeals(meals) {
  return (meals || []).reduce((a, m) => ({
    cal: a.cal + (+m.cal || 0), carbs: a.carbs + (+m.carbs || 0),
    protein: a.protein + (+m.protein || 0), fat: a.fat + (+m.fat || 0),
    sugar: a.sugar + (+m.sugar || 0), sodium: a.sodium + (+m.sodium || 0), chol: a.chol + (+m.chol || 0),
  }), { cal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, chol: 0 });
}

/* ============================================================
   Dates
   ============================================================ */
const DAY_MS = 86400000;
function dkey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function parseKey(k) { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function prettyDate(d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
function shortDate(d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
/* week (Mon-Sun) containing date d */
function weekDays(d) {
  const day = d.getDay(); const mondayOffset = (day + 6) % 7;
  const mon = addDays(d, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}
/* "Today" — the real current date, normalized to local midnight */
const _now = new Date();
const TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());

/* ============================================================
   Icons
   ============================================================ */
const I = {
  home:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/></svg>,
  diary:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M3.5 9h17M8 3v3.5M16 3v3.5"/></svg>,
  insight: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="6" y1="20" x2="6" y2="13"/><line x1="12" y1="20" x2="12" y2="5"/><line x1="18" y1="20" x2="18" y2="10"/></svg>,
  account: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  plus:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  camera:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 8a2 2 0 0 1 2-2h1.5L9 4h6l1.5 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.4"/></svg>,
  barcode: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M4 6v12M7.5 6v12M10 6v12M13 6v9M16.5 6v12M20 6v12"/></svg>,
  search:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></svg>,
  sparkle: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.7 5.1a3 3 0 0 0 1.9 1.9L21 11l-5.4 1.7a3 3 0 0 0-1.9 1.9L12 21l-1.7-5.4a3 3 0 0 0-1.9-1.9L3 11l5.4-1.7a3 3 0 0 0 1.9-1.9z"/></svg>,
  dumbbell:(p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/></svg>,
  scale:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3.5" y="4" width="17" height="16" rx="4"/><path d="M12 8l2.5-1.5"/><circle cx="12" cy="9" r="1" fill="currentColor" stroke="none"/></svg>,
  history: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/></svg>,
  fork:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 3v6a2 2 0 0 0 4 0V3M8 11v10M16 3c-1.5 0-2.5 2-2.5 4.5S15 12 16 12v9"/></svg>,
  target:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>,
  flag:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>,
  crown:   (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M3 7l4 4 5-7 5 7 4-4-2 13H5z"/></svg>,
  link:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 13a4 4 0 0 0 5.6.6l3-3A4 4 0 0 0 12 5l-1.5 1.5"/><path d="M15 11a4 4 0 0 0-5.6-.6l-3 3A4 4 0 0 0 12 19l1.5-1.5"/></svg>,
  gear:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.2-1.3L14 1.5h-4l-.4 2.5a7 7 0 0 0-2.2 1.3l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.2 1.3l.4 2.5h4l.4-2.5a7 7 0 0 0 2.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/></svg>,
  edit:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M13.5 6.5l3 3"/></svg>,
  check:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  x:       (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>,
  chevR:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 6 15 12 9 18"/></svg>,
  chevL:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="15 6 9 12 15 18"/></svg>,
  chevD:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="6 9 12 15 18 9"/></svg>,
  back:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="20" y1="12" x2="5" y2="12"/><polyline points="11 5 4 12 11 19"/></svg>,
  drop:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2.5s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 9.5 12 2.5 12 2.5z"/></svg>,
  flame:   (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 2 1 4 3.2 4 6a7 7 0 1 1-14 0c0-4.5 4-6.5 4-11 1.5.8 3 2.4 3 0z"/></svg>,
  heart:   (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 21s-7-4.6-9.3-9C1 8.5 2.5 5 6 5c2 0 3.2 1.2 4 2.4C10.8 6.2 12 5 14 5c3.5 0 5 3.5 3.3 7-2.3 4.4-9.3 9-9.3 9z" transform="translate(-1 0)"/></svg>,
  bolt:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>,
  info:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/></svg>,
  upload:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 16V4M8 8l4-4 4 4"/><path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>,
  trash:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  moon:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>,
  sun:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>,
  apple:   (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M16.5 12.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8z"/><path d="M14.3 5.4c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.2z"/></svg>,
  google:  (p) => <svg viewBox="0 0 24 24" {...p}><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg>,
  watch:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="6" y="6" width="12" height="12" rx="3.5"/><path d="M9 6l.5-3h5L15 6M9 18l.5 3h5l.5-3"/></svg>,
  ruler:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2.5" y="7" width="19" height="10" rx="2.5"/><path d="M7 7v3M11 7v4M15 7v3M19 7v4"/></svg>,
  bell:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10.5 20a1.8 1.8 0 0 0 3 0"/></svg>,
  shield:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>,
};

/* signal / wifi / battery for status bar */
function StatusIcons({ ink }) {
  return (
    <div className="sysicons">
      <svg width="18" height="12" viewBox="0 0 18 12" fill={ink}><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4.5" width="3" height="7.5" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity=".35"/></svg>
      <svg width="17" height="12" viewBox="0 0 17 12" fill={ink}><path d="M8.5 2.5c2.3 0 4.4.9 6 2.4l-1.4 1.5A6.6 6.6 0 0 0 8.5 4.6 6.6 6.6 0 0 0 3.9 6.4L2.5 4.9A8.6 8.6 0 0 1 8.5 2.5z" opacity=".95"/><path d="M8.5 6.3c1.3 0 2.5.5 3.4 1.4l-1.5 1.5a2.7 2.7 0 0 0-3.8 0L5.1 7.7A4.7 4.7 0 0 1 8.5 6.3z"/><circle cx="8.5" cy="10.6" r="1.3"/></svg>
      <span className="batt"><span style={{color:"#34C759"}}>85</span>
        <svg width="26" height="13" viewBox="0 0 26 13"><rect x="1" y="1" width="21" height="11" rx="3.2" fill="none" stroke={ink} strokeOpacity=".4" strokeWidth="1.2"/><rect x="2.6" y="2.6" width="16" height="7.8" rx="1.8" fill="#34C759"/><rect x="23" y="4.5" width="1.8" height="4" rx="1" fill={ink} fillOpacity=".4"/></svg>
      </span>
    </div>
  );
}

/* ============================================================
   Ring (donut)
   ============================================================ */
function Ring({ value, goal, size = 200, stroke = 18, color = "var(--accent)", track = "var(--well)", children, rounded = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clampPct(value, goal) / 100;
  const over = goal > 0 && value > goal;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={over ? "var(--accent-d)" : color} strokeWidth={stroke} strokeLinecap={rounded ? "round" : "butt"}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

/* small macro radial used on dashboard nutrition card */
function MacroRadial({ value, goal, color, emoji, size = 76, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clampPct(value, goal) / 100;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--well)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div className="ring-center" style={{ fontSize: 26 }}>{emoji}</div>
    </div>
  );
}

function MacroBar({ macro, value, goal }) {
  const pct = clampPct(value, goal);
  const over = goal > 0 && value > goal;
  return (
    <div className="macro">
      <div className="macro-top">
        <div className="macro-name" style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span className="dot" style={{ width: 10, height: 10, borderRadius: 3, background: macro.color }}></span>{macro.label}
        </div>
        <div className={"macro-val" + (over ? " over" : "")}><b>{round(value)}</b> / {round(goal)} g</div>
      </div>
      <div className="bar"><span style={{ width: pct + "%", background: macro.color }}></span></div>
    </div>
  );
}

/* ============================================================
   Toast
   ============================================================ */
function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef();
  const show = useCallback((m) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2400); }, []);
  const node = <div className={"toast" + (msg ? " show" : "")}>{msg && <>{I.check()}{msg}</>}</div>;
  return [node, show];
}

/* ============================================================
   AI helpers (real calls via window.claude.complete)
   ============================================================ */
function extractJSON(text) {
  if (!text) return null;
  let t = String(text).trim().replace(/^```(?:json)?/i, "").replace(/```$/,"").trim();
  try { return JSON.parse(t); } catch {}
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s >= 0 && e > s) { try { return JSON.parse(t.slice(s, e + 1)); } catch {} }
  return null;
}

async function aiComplete(prompt, imageDataURL) {
  if (!window.claude || !window.claude.complete) throw new Error("AI unavailable");
  let messages;
  if (imageDataURL) {
    const base64 = imageDataURL.split(",")[1];
    const media_type = (imageDataURL.match(/data:(.*?);/) || [])[1] || "image/jpeg";
    messages = [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type, data: base64 } },
      { type: "text", text: prompt },
    ]}];
    return await window.claude.complete({ messages });
  }
  return await window.claude.complete(prompt);
}

/* Estimate a food's nutrition. Returns normalized object or null. */
async function aiEstimateFood(query, imageDataURL) {
  const schema = '{"name":"short food name","serving":"portion description","cal":number,"carbs":number,"protein":number,"fat":number,"sugar":number,"sodium":number,"chol":number,"emoji":"single food emoji","ingredients":["3-8 main ingredients as short strings"],"note":"one short sentence on assumptions"}';
  const base = imageDataURL
    ? "Identify the food in this photo and estimate nutrition for the portion shown."
    : `Estimate the nutrition for: "${query}".`;
  const prompt = base + " Respond ONLY with strict minified JSON, no prose, no code fences, exactly: " + schema +
    " carbs/protein/fat/sugar in grams; sodium and chol(esterol) in mg; cal in kcal. ingredients: the main components you see/assume. Keep numbers realistic.";
  const reply = await aiComplete(prompt, imageDataURL);
  const j = extractJSON(reply);
  if (!j) return null;
  return {
    name: String(j.name || query || "Food"),
    serving: String(j.serving || "1 serving"),
    cal: round(+j.cal || 0), carbs: round1(+j.carbs || 0), protein: round1(+j.protein || 0), fat: round1(+j.fat || 0),
    sugar: round1(+j.sugar || 0), sodium: round(+j.sodium || 0), chol: round(+j.chol || 0),
    emoji: j.emoji || "🍽️", note: j.note || "",
    ingredients: Array.isArray(j.ingredients) ? j.ingredients.map((x) => String(x)).filter(Boolean).slice(0, 10) : [],
  };
}

/* Per-meal health analysis of sugar / sodium / cholesterol. */
async function aiHealthAnalysis(meal) {
  const prompt = `A logged food: ${meal.name}, ${meal.serving || "1 serving"}. ` +
    `Per serving it has ~${meal.sugar||0} g sugar, ${meal.sodium||0} mg sodium, ${meal.chol||0} mg cholesterol, ` +
    `${meal.cal||0} kcal. Daily reference: sugar 36 g, sodium 2300 mg, cholesterol 300 mg. ` +
    "Give a concise health read. Respond ONLY with strict minified JSON, no code fences, exactly: " +
    '{"verdict":"one of: great|good|moderate|watch","summary":"one friendly sentence, max 22 words","sugar":"short note","sodium":"short note","cholesterol":"short note","swap":"one practical swap or tip, max 16 words"}';
  const reply = await aiComplete(prompt);
  return extractJSON(reply);
}

/* Weekly nutrient roundup across many meals. */
async function aiWeeklyRoundup(totals, days) {
  const prompt = `Over ${days} logged days a user averaged per day: sugar ${round(totals.sugar/days)} g, ` +
    `sodium ${round(totals.sodium/days)} mg, cholesterol ${round(totals.chol/days)} mg, ` +
    `${round(totals.cal/days)} kcal. Daily reference: sugar 36 g, sodium 2300 mg, cholesterol 300 mg. ` +
    "Respond ONLY with strict minified JSON, no code fences, exactly: " +
    '{"headline":"one short encouraging headline, max 9 words","sugar":{"level":"low|ok|high","note":"short"},"sodium":{"level":"low|ok|high","note":"short"},"cholesterol":{"level":"low|ok|high","note":"short"},"focus":"one focus suggestion for next week, max 18 words"}';
  const reply = await aiComplete(prompt);
  return extractJSON(reply);
}

/* Estimate calories burned for a free-text activity + duration. */
async function aiActivityCalories(name, mins, weightKg) {
  const prompt = `Estimate calories burned for this exercise. Activity: "${name}". ` +
    `Duration: ${mins} minutes. Person body weight: ${round(weightKg || 68)} kg. ` +
    "Use realistic MET values. Respond ONLY with strict minified JSON, no prose, no code fences, exactly: " +
    '{"kcal":number,"emoji":"single related emoji","intensity":"light|moderate|vigorous","note":"one short sentence, max 16 words"}';
  const reply = await aiComplete(prompt);
  const j = extractJSON(reply);
  if (!j) return null;
  return { kcal: round(+j.kcal || 0), emoji: j.emoji || "🔥", intensity: j.intensity || "moderate", note: j.note || "" };
}


function fileToDataURL(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
function downscale(dataURL, max = 768) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (Math.max(w, h) > max) { const s = max / Math.max(w, h); w = Math.round(w*s); h = Math.round(h*s); }
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      res(cv.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => res(dataURL);
    img.src = dataURL;
  });
}

/* nutrient flag levels for sugar/sodium/chol given a single serving */
function nutrientLevels(meal) {
  const lv = (v, hi, mid) => v >= hi ? "high" : v >= mid ? "ok" : "low";
  return {
    sugar: lv(+meal.sugar || 0, 20, 8),
    sodium: lv(+meal.sodium || 0, 600, 230),
    chol: lv(+meal.chol || 0, 150, 60),
  };
}

/* ============================================================
   Month calendar (date picker) — Monday-first, any date in any year
   ============================================================ */
const MCAL_DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
function MonthCalendar({ value, onPick, markedDays }) {
  const sel = parseKey(value);
  const [view, setView] = useState(() => new Date(sel.getFullYear(), sel.getMonth(), 1));
  const y = view.getFullYear(), m = view.getMonth();
  const startDow = (new Date(y, m, 1).getDay() + 6) % 7;   // Monday-first offset
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  const title = view.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const todayKey = dkey(TODAY);

  return (
    <div className="mcal">
      <div className="mcal-head">
        <button className="iconbtn ghost" onClick={() => setView(new Date(y, m - 1, 1))} aria-label="Previous month">{I.chevL({ width: 18, height: 18 })}</button>
        <div className="mcal-title">{title}</div>
        <button className="iconbtn ghost" onClick={() => setView(new Date(y, m + 1, 1))} aria-label="Next month">{I.chevR({ width: 18, height: 18 })}</button>
      </div>
      <div className="mcal-dow">{MCAL_DOW.map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="mcal-grid">
        {cells.map((c, i) => {
          if (!c) return <span key={i}></span>;
          const k = dkey(c);
          const marked = markedDays && markedDays.has(k);
          return (
            <button key={i} className={"mcal-day" + (k === value ? " sel" : "") + (k === todayKey ? " today" : "")} onClick={() => onPick(k)}>
              {c.getDate()}
              {marked && <span className="mcal-dot"></span>}
            </button>
          );
        })}
      </div>
      <div className="mcal-foot">
        <button className="btn btn-ghost btn-sm" onClick={() => { const t = new Date(TODAY); setView(new Date(t.getFullYear(), t.getMonth(), 1)); onPick(todayKey); }}>Today</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  React, useState, useEffect, useRef, useCallback, useMemo,
  MACROS, DEFAULT_PROFILE, DEFAULT_GOALS, MACRO_SPLITS, FOOD_DB, BARCODE_DB,
  LS, usePersisted, round, round1, clampPct, fmt,
  kgToLb, lbToKg, cmToFtIn, mlToOz, dispWeight, wUnit, dispVol, vUnit, sumMeals,
  DAY_MS, dkey, parseKey, addDays, prettyDate, shortDate, DOW, weekDays, TODAY,
  I, StatusIcons, Ring, MacroRadial, MacroBar, useToast, MonthCalendar,
  aiEstimateFood, aiHealthAnalysis, aiWeeklyRoundup, aiActivityCalories, aiComplete, extractJSON,
  fileToDataURL, downscale, nutrientLevels,
});
