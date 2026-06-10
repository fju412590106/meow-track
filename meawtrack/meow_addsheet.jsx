/* addsheet.jsx — the + sheet and all logging flows */

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const ACTIVITIES = [
  { name: "Walking", emoji: "🚶", met: 3.5 }, { name: "Running", emoji: "🏃", met: 9.8 },
  { name: "Cycling", emoji: "🚴", met: 7.5 }, { name: "Swimming", emoji: "🏊", met: 8.0 },
  { name: "Strength training", emoji: "🏋️", met: 6.0 }, { name: "Yoga", emoji: "🧘", met: 2.5 },
  { name: "HIIT", emoji: "🔥", met: 10.0 }, { name: "Hiking", emoji: "🥾", met: 6.5 },
];

function AddSheet({ open, mode, setMode, onClose, onAddMeal, onAddActivity, onAddWeight, units, profile, weightLog, recents, showToast, defaultMeal }) {
  const isMenu = !mode;
  const full = !isMenu;

  return (
    <>
      <div className={"sheet-scrim" + (open ? " show" : "")} onClick={onClose}></div>
      <div className={"sheet" + (open ? " show" : "") + (full ? " full" : "")}>
        {full && (
          <div className="sheet-h" style={{ position: "absolute", top: 12, left: 20, right: 20, zIndex: 5 }}>
            <button className="iconbtn" onClick={() => setMode(null)}>{I.back()}</button>
            <h3 style={{ flex: 1, textAlign: "center", fontSize: 19 }}>{MODE_TITLES[mode]}</h3>
            <button className="iconbtn" onClick={onClose}>{I.x()}</button>
          </div>
        )}
        {isMenu && <div className="grabber"></div>}

        {isMenu && (
          <div className="pop">
            <div className="qa-grid">
              <button className="qa" onClick={() => setMode("scan")}><span className="ico">{I.camera()}</span><span>Scan Meal</span></button>
              <button className="qa" onClick={() => setMode("barcode")}><span className="ico">{I.barcode()}</span><span>Barcode Scan</span></button>
              <button className="qa" onClick={() => setMode("database")}><span className="ico">{I.search()}</span><span>Food Database</span></button>
              <button className="qa" onClick={() => setMode("quick")}><span className="ico">{I.plus()}</span><span>Quick Add</span></button>
            </div>
            <div className="qa-wide">
              <button className="qa-card" onClick={() => setMode("activity")}><span className="ico" style={{ background: "var(--carbs-wash)", color: "var(--teal)" }}>{I.dumbbell()}</span><span>Activity</span></button>
              <button className="qa-card" onClick={() => setMode("ai")}><span className="ico" style={{ background: "var(--accent-wash)", color: "var(--accent)" }}>{I.sparkle()}</span><span>AI Search</span></button>
              <button className="qa-card" onClick={() => setMode("weight")}><span className="ico" style={{ background: "var(--yellow-wash)", color: "var(--yellow-d)" }}>{I.scale()}</span><span>Weight</span></button>
              <button className="qa-card" onClick={() => setMode("history")}><span className="ico" style={{ background: "var(--water-wash)", color: "var(--water)" }}>{I.history()}</span><span>History</span></button>
            </div>
          </div>
        )}

        {full && (
          <div style={{ paddingTop: 12 }}>
            {mode === "scan" && <ScanMeal onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
            {mode === "barcode" && <BarcodeScan onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
            {mode === "database" && <FoodDatabase onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
            {mode === "quick" && <QuickAdd onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
            {mode === "ai" && <AISearch onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
            {mode === "activity" && <ActivityLog profile={profile} onConfirm={onAddActivity} showToast={showToast} />}
            {mode === "weight" && <WeightLog profile={profile} units={units} onConfirm={onAddWeight} showToast={showToast} />}
            {mode === "history" && <HistoryList recents={recents} onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
          </div>
        )}
      </div>
    </>
  );
}
const MODE_TITLES = { scan: "Scan Meal", barcode: "Barcode Scan", database: "Food Database", quick: "Quick Add", ai: "AI Search", activity: "Activity", weight: "Log Weight", history: "History" };

/* ---------------- Food confirm (shared) ---------------- */
function FoodConfirm({ food, onConfirm, showToast, defaultMeal }) {
  const [meal, setMeal] = useState(defaultMeal || guessMeal());
  const [qty, setQty] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [aLoading, setALoading] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [name, setName] = useState(food.name);
  const [ingredients, setIngredients] = useState(() => (food.ingredients && food.ingredients.length ? [...food.ingredients] : []));
  const [newIng, setNewIng] = useState("");
  const scaled = (n) => round1((n || 0) * qty);

  async function loadAnalysis() {
    if (analysis || aLoading) { setShowHealth((s) => !s); return; }
    setShowHealth(true); setALoading(true);
    try {
      const r = await aiHealthAnalysis({ ...food, name, sugar: scaled(food.sugar), sodium: scaled(food.sodium), chol: scaled(food.chol), cal: scaled(food.cal) });
      setAnalysis(r || { summary: "Couldn't analyze right now.", sugar: "", sodium: "", cholesterol: "", swap: "" });
    } catch { setAnalysis({ summary: "Couldn't reach AI. Try again.", sugar: "", sodium: "", cholesterol: "", swap: "" }); }
    setALoading(false);
  }

  function editIng(i, v) { setIngredients((s) => s.map((x, idx) => idx === i ? v : x)); }
  function removeIng(i) { setIngredients((s) => s.filter((_, idx) => idx !== i)); }
  function addIng() { const v = newIng.trim(); if (!v) return; setIngredients((s) => [...s, v]); setNewIng(""); }

  function add() {
    onConfirm({
      id: Date.now() + Math.random(), name: name.trim() || food.name, emoji: food.emoji || "🍽️",
      serving: qty === 1 ? food.serving : `${qty} × ${food.serving}`, meal,
      cal: scaled(food.cal), carbs: scaled(food.carbs), protein: scaled(food.protein), fat: scaled(food.fat),
      sugar: scaled(food.sugar), sodium: scaled(food.sodium), chol: scaled(food.chol),
      ingredients: ingredients.filter((x) => x.trim()),
      photo: food.photo || null, analysis,
    });
    showToast(`Added to ${meal}`);
  }

  const hasIng = food.ingredients !== undefined; // AI/scan/barcode flows attach this (even if empty)
  const lv = nutrientLevels({ sugar: scaled(food.sugar), sodium: scaled(food.sodium), chol: scaled(food.chol) });
  return (
    <div className="stack pop">
      <div className="card flat" style={{ padding: 18 }}>
        <div className="row" style={{ gap: 14 }}>
          {food.photo ? <img src={food.photo} className="thumb" style={{ width: 64, height: 64 }} /> : <div className="thumb" style={{ width: 64, height: 64, fontSize: 32 }}>{food.emoji || "🍽️"}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <input className="name-edit" value={name} onChange={(e) => setName(e.target.value)} aria-label="Food name" />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", marginTop: 3 }}>{scaled(food.cal)} kcal · {food.serving}</div>
          </div>
        </div>
        <div className="macro3" style={{ marginTop: 16 }}>
          {[["🍞", scaled(food.carbs), "Carbs"], ["🥩", scaled(food.protein), "Protein"], ["🧀", scaled(food.fat), "Fat"]].map(([e, v, k]) => (
            <div className="m" key={k}><div className="emoji">{e}</div><div className="mk">{v} g</div><div className="mv">{k}</div></div>
          ))}
        </div>
      </div>

      {/* Editable ingredients (scan / barcode / AI search) */}
      {hasIng && (
        <div className="card flat" style={{ padding: 16 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <div className="row" style={{ gap: 8 }}>{I.fork({ width: 17, height: 17, style: { color: "var(--accent)" } })}<span style={{ fontWeight: 800, fontSize: 15 }}>Ingredients</span></div>
            <span className="pill" style={{ background: "var(--well)", color: "var(--ink-soft)", fontSize: 11.5 }}>{ingredients.length}</span>
          </div>
          <div className="ing-list">
            {ingredients.map((ing, i) => (
              <div className="ing-row" key={i}>
                <span className="ing-dot"></span>
                <input className="ing-input" value={ing} onChange={(e) => editIng(i, e.target.value)} placeholder="Ingredient" />
                <button className="ing-x" onClick={() => removeIng(i)} aria-label="Remove">{I.x({ width: 14, height: 14 })}</button>
              </div>
            ))}
            {!ingredients.length && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", padding: "4px 2px 10px" }}>No ingredients detected — add them below.</div>}
          </div>
          <div className="ing-add">
            <input className="ing-input" value={newIng} onChange={(e) => setNewIng(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addIng(); }} placeholder="Add an ingredient…" />
            <button className="btn btn-sm btn-ghost" onClick={addIng} disabled={!newIng.trim()}>{I.plus({ width: 16, height: 16 })} Add</button>
          </div>
        </div>
      )}

      <div className="field"><label>Meal</label>
        <div className="seg">{MEAL_TYPES.map((m) => <button key={m} className={meal === m ? "on" : ""} onClick={() => setMeal(m)}>{m}</button>)}</div>
      </div>

      <div className="between">
        <label style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink-soft)" }}>Servings</label>
        <div className="row" style={{ gap: 12 }}>
          <button className="iconbtn ghost" onClick={() => setQty((q) => Math.max(0.5, round1(q - 0.5)))}>−</button>
          <span style={{ fontWeight: 800, fontSize: 18, minWidth: 36, textAlign: "center" }}>{qty}</span>
          <button className="iconbtn ghost" onClick={() => setQty((q) => round1(q + 0.5))}>{I.plus()}</button>
        </div>
      </div>

      {/* AI health analysis */}
      <button className="health-card" style={{ width: "100%", textAlign: "left" }} onClick={loadAnalysis}>
        <div className="health-h"><span style={{ flex: 1, display: "flex", gap: 9, alignItems: "center" }}>{I.sparkle()} AI health analysis</span>
          <span style={{ display: "flex", gap: 5 }}>
            <FlagDot level={lv.sugar} />{<FlagDot level={lv.sodium} />}{<FlagDot level={lv.chol} />}
          </span>
          <span style={{ transform: showHealth ? "rotate(180deg)" : "", transition: "transform .2s", marginLeft: 8, color: "var(--muted)" }}>{I.chevD({ width: 16, height: 16 })}</span>
        </div>
        {showHealth && (
          <div className="health-body">
            {aLoading && <div className="analyzing" style={{ padding: 8 }}><div className="spin"></div> Analyzing sugar, sodium &amp; cholesterol…</div>}
            {!aLoading && analysis && (
              <>
                {analysis.summary && <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>{analysis.summary}</p>}
                <NutriRow k="Sugar" v={`${scaled(food.sugar)} g`} pct={clampPct(scaled(food.sugar), 36)} level={lv.sugar} note={analysis.sugar} />
                <NutriRow k="Sodium" v={`${scaled(food.sodium)} mg`} pct={clampPct(scaled(food.sodium), 2300)} level={lv.sodium} note={analysis.sodium} />
                <NutriRow k="Cholesterol" v={`${scaled(food.chol)} mg`} pct={clampPct(scaled(food.chol), 300)} level={lv.chol} note={analysis.cholesterol} />
                {analysis.swap && <div className="banner hot" style={{ marginTop: 12 }}>{I.bolt()}<span><b>Tip ·</b> {analysis.swap}</span></div>}
              </>
            )}
          </div>
        )}
      </button>

      <button className="btn btn-primary btn-block" onClick={add}>{I.check()} Add to diary</button>
    </div>
  );
}

const LEVEL_COLOR = { low: "var(--carbs)", ok: "var(--yellow-d)", high: "var(--accent)" };
function FlagDot({ level }) { return <span style={{ width: 9, height: 9, borderRadius: 999, background: LEVEL_COLOR[level] || "var(--muted)" }}></span>; }
function NutriRow({ k, v, pct, level, note }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="nutri-row" style={{ padding: "2px 0" }}>
        <span className="nk">{k}</span>
        <span className="nbar"><span style={{ width: pct + "%", background: LEVEL_COLOR[level] }}></span></span>
        <span className="nv">{v}</span>
      </div>
      {note && <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", paddingLeft: 0, marginTop: 2 }}>{note}</div>}
    </div>
  );
}
function guessMeal() { const h = new Date().getHours(); return h < 11 ? "Breakfast" : h < 16 ? "Lunch" : h < 21 ? "Dinner" : "Snack"; }

/* ---------------- Scan Meal ---------------- */
function ScanMeal({ onConfirm, showToast, defaultMeal }) {
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [food, setFood] = useState(null);
  const [err, setErr] = useState(null);
  const [over, setOver] = useState(false);
  const fileRef = useRef();

  async function handle(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setErr(null);
    const raw = await fileToDataURL(file); const small = await downscale(raw);
    setPhoto(small); setBusy(true);
    try {
      const r = await aiEstimateFood(null, small);
      if (r) setFood({ ...r, photo: small }); else setErr("Couldn't read that photo. Try another.");
    } catch { setErr("AI is unavailable right now."); }
    setBusy(false);
  }

  if (food) return <FoodConfirm food={food} onConfirm={onConfirm} showToast={showToast} defaultMeal={defaultMeal} />;
  return (
    <div className="stack pop">
      {!photo && (
        <div className={"drop" + (over ? " over" : "")} onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}>
          <div className="ico">{I.camera()}</div>
          <h4>Snap or upload your meal</h4>
          <p>AI estimates calories, macros &amp; nutrients</p>
        </div>
      )}
      {photo && <div className="preview"><img src={photo} /><button className="x" onClick={() => { setPhoto(null); setFood(null); setErr(null); }}>{I.x()}</button></div>}
      {busy && <div className="analyzing"><div className="spin"></div> Looking at your plate…</div>}
      {err && <div className="banner warn">{I.info()}{err}</div>}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files[0])} />
      {!photo && <div className="banner info">{I.sparkle({ style: { color: "#2C7BB0" } })}Works best with a clear, well-lit photo of the full plate.</div>}
    </div>
  );
}

/* ---------------- Barcode Scan ---------------- */
function BarcodeScan({ onConfirm, showToast, defaultMeal }) {
  const [scanning, setScanning] = useState(true);
  const [found, setFound] = useState(null);
  useEffect(() => {
    if (!scanning) return;
    const t = setTimeout(() => { setFound(BARCODE_DB[Math.floor(Math.random() * BARCODE_DB.length)]); setScanning(false); }, 2200);
    return () => clearTimeout(t);
  }, [scanning]);

  if (found) return (
    <div className="stack pop">
      <div className="banner good">{I.check()}Barcode {found.code} matched</div>
      <FoodConfirm food={found} onConfirm={onConfirm} showToast={showToast} defaultMeal={defaultMeal} />
    </div>
  );
  return (
    <div className="stack pop" style={{ alignItems: "center", paddingTop: 30 }}>
      <div style={{ width: "100%", height: 220, borderRadius: 20, background: "var(--ink)", position: "relative", overflow: "hidden", display: "grid", placeItems: "center" }}>
        <div style={{ width: "70%", height: 120, border: "2px solid rgba(255,255,255,.4)", borderRadius: 12, position: "relative" }}>
          <div className="scanline"></div>
          {I.barcode({ width: 120, height: 80, style: { color: "rgba(255,255,255,.55)", margin: "20px auto", display: "block" } })}
        </div>
      </div>
      <div className="row" style={{ gap: 10, color: "var(--ink-soft)", fontWeight: 700 }}><div className="spin"></div> Scanning for a barcode…</div>
      <style>{`.scanline{position:absolute;left:8px;right:8px;height:3px;background:var(--accent);border-radius:3px;box-shadow:0 0 12px var(--accent);animation:scan 1.6s ease-in-out infinite}@keyframes scan{0%,100%{top:8px}50%{top:108px}}`}</style>
    </div>
  );
}

/* ---------------- Food Database ---------------- */
function FoodDatabase({ onConfirm, showToast, defaultMeal }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const list = FOOD_DB.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
  if (sel) return <FoodConfirm food={sel} onConfirm={onConfirm} showToast={showToast} defaultMeal={defaultMeal} />;
  return (
    <div className="stack pop">
      <div className="input-wrap"><input className="input suffix-pad" placeholder="Search foods…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus /><span className="suffix">{I.search({ width: 18, height: 18 })}</span></div>
      <div className="list">
        {list.map((f, i) => (
          <button key={i} className="mealrow" style={{ width: "100%", textAlign: "left" }} onClick={() => setSel(f)}>
            <div className="thumb">{f.emoji}</div>
            <div className="mbody"><div className="mname">{f.name}</div><div className="msub">{f.serving} · {f.cal} kcal</div>
              <div className="mmacros"><span>🍞 {f.carbs}g</span><span>🥩 {f.protein}g</span><span>🧀 {f.fat}g</span></div></div>
            <span className="iconbtn ghost" style={{ width: 34, height: 34 }}>{I.plus({ width: 18, height: 18 })}</span>
          </button>
        ))}
        {!list.length && <div className="empty"><div className="e-emoji">🔍</div><p>No matches. Try AI Search instead.</p></div>}
      </div>
    </div>
  );
}

/* ---------------- Quick Add ---------------- */
function QuickAdd({ onConfirm, showToast, defaultMeal }) {
  const [f, setF] = useState({ name: "", cal: "", carbs: "", protein: "", fat: "", sugar: "", sodium: "", chol: "" });
  const [meal, setMeal] = useState(defaultMeal || guessMeal());
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  function add() {
    onConfirm({ id: Date.now() + Math.random(), name: f.name || "Quick add", emoji: "🍽️", serving: "1 serving", meal,
      cal: +f.cal || 0, carbs: +f.carbs || 0, protein: +f.protein || 0, fat: +f.fat || 0, sugar: +f.sugar || 0, sodium: +f.sodium || 0, chol: +f.chol || 0 });
    showToast(`Added to ${meal}`);
  }
  return (
    <div className="stack pop">
      <div className="field"><label>Name</label><input className="input" placeholder="e.g. Homemade smoothie" value={f.name} onChange={set("name")} /></div>
      <div className="field"><label>Meal</label><div className="seg">{MEAL_TYPES.map((m) => <button key={m} className={meal === m ? "on" : ""} onClick={() => setMeal(m)}>{m}</button>)}</div></div>
      <div className="field"><label>Calories</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={f.cal} onChange={set("cal")} /><span className="suffix">kcal</span></div></div>
      <div className="form-grid">
        <div className="field"><label><span className="dot" style={{ background: "var(--carbs)" }}></span>Carbs</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={f.carbs} onChange={set("carbs")} /><span className="suffix">g</span></div></div>
        <div className="field"><label><span className="dot" style={{ background: "var(--protein)" }}></span>Protein</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={f.protein} onChange={set("protein")} /><span className="suffix">g</span></div></div>
        <div className="field"><label><span className="dot" style={{ background: "var(--fat)" }}></span>Fat</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={f.fat} onChange={set("fat")} /><span className="suffix">g</span></div></div>
        <div className="field"><label>Sugar</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={f.sugar} onChange={set("sugar")} /><span className="suffix">g</span></div></div>
      </div>
      <button className="btn btn-primary btn-block" onClick={add}>{I.check()} Add to diary</button>
    </div>
  );
}

/* ---------------- AI Search ---------------- */
function AISearch({ onConfirm, showToast, defaultMeal }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [food, setFood] = useState(null);
  const [err, setErr] = useState(null);
  const examples = ["a bowl of pho with brisket", "venti caramel macchiato", "2 slices pepperoni pizza", "chicken katsu curry"];

  async function go() {
    if (!q.trim()) return; setBusy(true); setErr(null);
    try { const r = await aiEstimateFood(q.trim()); if (r) setFood(r); else setErr("Couldn't estimate that. Rephrase?"); }
    catch { setErr("AI is unavailable right now."); }
    setBusy(false);
  }
  if (food) return <FoodConfirm food={food} onConfirm={onConfirm} showToast={showToast} defaultMeal={defaultMeal} />;
  return (
    <div className="stack pop">
      <div className="banner hot">{I.sparkle()}Describe anything you ate — AI estimates the full nutrition.</div>
      <textarea className="input" rows={3} placeholder="e.g. grilled salmon with rice and a side salad" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{examples.map((e) => <button key={e} className="pill" style={{ background: "var(--well)", color: "var(--ink-soft)" }} onClick={() => setQ(e)}>{e}</button>)}</div>
      {busy && <div className="analyzing"><div className="spin"></div> Estimating nutrition…</div>}
      {err && <div className="banner warn">{I.info()}{err}</div>}
      <button className="btn btn-primary btn-block" onClick={go} disabled={busy || !q.trim()}>{I.sparkle()} Estimate with AI</button>
    </div>
  );
}

/* ---------------- Activity ---------------- */
function ActivityLog({ profile, onConfirm, showToast }) {
  const [sel, setSel] = useState(null);
  const [mins, setMins] = useState(30);
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { kcal, emoji, intensity, note }
  const [aiErr, setAiErr] = useState(null);
  const kg = profile.weight || 68;

  // Library activities use MET; custom activities use the AI estimate.
  const burned = sel ? round(sel.met * 3.5 * kg / 200 * mins) : 0;

  async function estimate() {
    if (!customName.trim()) return;
    setAiBusy(true); setAiErr(null); setAiResult(null);
    try {
      const r = await aiActivityCalories(customName.trim(), mins, kg);
      if (r) setAiResult(r); else setAiErr("Couldn't estimate that. Try rephrasing.");
    } catch { setAiErr("AI is unavailable right now."); }
    setAiBusy(false);
  }

  // re-estimate when duration changes after a result exists
  useEffect(() => { if (custom && aiResult) setAiResult(null); }, [mins]);

  // ---- Picker screen ----
  if (!sel && !custom) return (
    <div className="pop">
      <div className="banner info" style={{ marginBottom: 14 }}>{I.heart({ style: { color: "#2C7BB0" } })}Pick an activity — calories burned add back to your daily budget.</div>
      <div className="qa-wide">
        {ACTIVITIES.map((a) => (
          <button key={a.name} className="qa-card" onClick={() => setSel(a)}><span className="ico" style={{ background: "var(--carbs-wash)" }}>{a.emoji}</span><span style={{ fontSize: 14 }}>{a.name}</span></button>
        ))}
      </div>
      <button className="qa-card" style={{ width: "100%", marginTop: 12 }} onClick={() => { setCustom(true); setMins(30); }}>
        <span className="ico" style={{ background: "var(--accent-wash)", color: "var(--accent)" }}>{I.sparkle()}</span>
        <span style={{ flex: 1, textAlign: "left" }}><span style={{ fontWeight: 800, fontSize: 15, display: "block" }}>Other activity</span><span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>Type your own — AI calculates the burn</span></span>
        {I.chevR({ style: { color: "var(--muted)" } })}
      </button>
    </div>
  );

  // ---- Custom activity screen ----
  if (custom) return (
    <div className="stack pop">
      <div className="banner hot">{I.sparkle()}Describe any activity and AI estimates the calories you burned.</div>
      <div className="field"><label>Activity</label>
        <input className="input" placeholder="e.g. rock climbing, vacuuming, dancing" value={customName} onChange={(e) => { setCustomName(e.target.value); setAiResult(null); }} autoFocus />
      </div>
      <div className="field"><label>Duration</label>
        <div className="between"><input type="range" min="5" max="180" step="5" value={mins} onChange={(e) => setMins(+e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} /><span style={{ fontWeight: 800, fontSize: 17, minWidth: 64, textAlign: "right" }}>{mins} min</span></div>
      </div>

      {aiBusy && <div className="analyzing"><div className="spin"></div> Calculating calories burned…</div>}
      {aiErr && <div className="banner warn">{I.info()}{aiErr}</div>}

      {aiResult && (
        <div className="card flat row pop" style={{ gap: 14, padding: 18 }}>
          <div className="thumb" style={{ fontSize: 30 }}>{aiResult.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, textTransform: "capitalize" }}>{customName.trim()}</div>
            <div style={{ fontSize: 14, color: "var(--accent-d)", fontWeight: 800 }}>{aiResult.kcal} kcal · {mins} min</div>
            {aiResult.note && <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.4 }}>{aiResult.note}</div>}
          </div>
          <span className="pill" style={{ background: "var(--accent-wash)", color: "var(--accent-d)", fontSize: 11, textTransform: "capitalize" }}>{aiResult.intensity}</span>
        </div>
      )}

      <div className="row" style={{ gap: 10 }}>
        <button className="iconbtn ghost" style={{ width: 48, flex: "none" }} onClick={() => { setCustom(false); setCustomName(""); setAiResult(null); setAiErr(null); }}>{I.chevL()}</button>
        {!aiResult
          ? <button className="btn btn-primary" style={{ flex: 1 }} onClick={estimate} disabled={aiBusy || !customName.trim()}>{I.sparkle()} Estimate with AI</button>
          : <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onConfirm({ id: Date.now(), name: customName.trim(), emoji: aiResult.emoji, mins, kcal: aiResult.kcal }); showToast(`Logged ${customName.trim()}`); }}>{I.check()} Log activity</button>}
      </div>
    </div>
  );

  // ---- Library activity duration screen ----
  return (
    <div className="stack pop">
      <div className="card flat row" style={{ gap: 14, padding: 18 }}>
        <div className="thumb" style={{ fontSize: 30 }}>{sel.emoji}</div>
        <div><div style={{ fontWeight: 800, fontSize: 18 }}>{sel.name}</div><div style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 700 }}>{burned} kcal burned</div></div>
        <button className="iconbtn ghost spacer" style={{ marginLeft: "auto" }} onClick={() => setSel(null)}>{I.chevL()}</button>
      </div>
      <div className="field"><label>Duration</label>
        <div className="between"><input type="range" min="5" max="180" step="5" value={mins} onChange={(e) => setMins(+e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} /><span style={{ fontWeight: 800, fontSize: 17, minWidth: 64, textAlign: "right" }}>{mins} min</span></div>
      </div>
      <button className="btn btn-primary btn-block" onClick={() => { onConfirm({ id: Date.now(), name: sel.name, emoji: sel.emoji, mins, kcal: burned }); showToast(`Logged ${sel.name}`); }}>{I.check()} Log activity</button>
    </div>
  );
}

/* ---------------- Weight ---------------- */
function WeightLog({ profile, units, onConfirm, showToast }) {
  const [w, setW] = useState(units === "imperial" ? round1(kgToLb(profile.weight)) : profile.weight);
  function add() { const kg = units === "imperial" ? lbToKg(+w) : +w; onConfirm({ date: dkey(TODAY), kg: round1(kg) }); showToast("Weight logged"); }
  return (
    <div className="stack pop" style={{ alignItems: "center" }}>
      <div style={{ fontSize: 40 }}>⚖️</div>
      <div className="field" style={{ width: "100%", maxWidth: 240 }}><label style={{ justifyContent: "center" }}>Today's weight</label>
        <div className="input-wrap"><input className="input suffix-pad" type="number" step="0.1" value={w} onChange={(e) => setW(e.target.value)} style={{ textAlign: "center", fontSize: 24, fontWeight: 800 }} autoFocus /><span className="suffix">{wUnit(units)}</span></div>
      </div>
      <button className="btn btn-primary btn-block" onClick={add}>{I.check()} Save weight</button>
    </div>
  );
}

/* ---------------- History ---------------- */
function HistoryList({ recents, onConfirm, showToast, defaultMeal }) {
  const [sel, setSel] = useState(null);
  if (sel) return <FoodConfirm food={sel} onConfirm={onConfirm} showToast={showToast} defaultMeal={defaultMeal || sel.meal} />;
  if (!recents.length) return <div className="empty"><div className="e-emoji">🕓</div><p>Nothing logged yet. Your recent foods show up here.</p></div>;
  return (
    <div className="list pop">
      {recents.map((f, i) => (
        <button key={i} className="mealrow" style={{ width: "100%", textAlign: "left" }} onClick={() => setSel(f)}>
          {f.photo ? <img src={f.photo} className="thumb" /> : <div className="thumb">{f.emoji || "🍽️"}</div>}
          <div className="mbody"><div className="mname">{f.name}</div><div className="msub">{f.serving} · {f.cal} kcal</div></div>
          <span className="iconbtn ghost" style={{ width: 34, height: 34 }}>{I.plus({ width: 18, height: 18 })}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { AddSheet, MEAL_TYPES, ACTIVITIES, guessMeal });
