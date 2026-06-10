/* Goals.jsx — goal setting page with optional BMR/TDEE calculator */

function NumField({ label, dot, value, onChange, suffix, placeholder, step }) {
  return (
    <div className="field">
      <label>{dot && <span className="dot" style={{ background: dot }}></span>}{label}</label>
      <div className="input-wrap">
        <input className={"input" + (suffix ? " suffix-pad" : "")} type="number" inputMode="decimal"
          min="0" step={step || "1"} value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
    </div>
  );
}

const ACTIVITY = [
  { k: "Sedentary", f: 1.2, d: "Little / no exercise" },
  { k: "Light", f: 1.375, d: "1–3 days / week" },
  { k: "Moderate", f: 1.55, d: "3–5 days / week" },
  { k: "Active", f: 1.725, d: "6–7 days / week" },
  { k: "Athlete", f: 1.9, d: "Hard daily training" },
];

function Goals({ goals, setGoals, showToast }) {
  const [form, setForm] = useState(goals);
  const [calc, setCalc] = useState({ sex: "male", age: 30, weight: 70, height: 175, act: 1.55 });
  useEffect(() => setForm(goals), [goals]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v === "" ? "" : +v }));

  // Macro calories breakdown for the donut hint
  const macroKcal = (+form.protein||0)*4 + (+form.carbs||0)*4 + (+form.fat||0)*9;
  const calTarget = +form.calories || 0;

  function runCalc() {
    const { sex, age, weight, height, act } = calc;
    // Mifflin–St Jeor
    const bmr = 10*weight + 6.25*height - 5*age + (sex === "male" ? 5 : -161);
    const tdee = bmr * act;
    setForm((f) => ({ ...f, bmr: Math.round(bmr), tdee: Math.round(tdee), calories: Math.round(tdee) }));
    showToast("BMR & TDEE calculated");
  }

  function applyMacroSplit(p, c, fa) {
    const cal = +form.calories || 2000;
    setForm((f) => ({
      ...f,
      protein: Math.round(cal * p / 100 / 4),
      carbs:   Math.round(cal * c / 100 / 4),
      fat:     Math.round(cal * fa / 100 / 9),
    }));
  }

  function save() {
    const clean = {};
    for (const k of ["bmr","tdee","calories","protein","carbs","fat"]) clean[k] = Math.max(0, +form[k] || 0);
    setGoals(clean);
    showToast("Goals saved");
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr", maxWidth: 760, margin: "0 auto" }}>
      {/* Calculator */}
      <div className="card card-pad pop">
        <div className="card-h">
          <h3>Estimate your needs</h3>
          <span className="hint">Mifflin–St Jeor</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Sex</label>
            <select className="input" value={calc.sex} onChange={(e)=>setCalc({...calc, sex:e.target.value})}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <NumField label="Age" suffix="yrs" value={calc.age} onChange={(v)=>setCalc({...calc, age:+v||0})} />
          <NumField label="Weight" suffix="kg" value={calc.weight} onChange={(v)=>setCalc({...calc, weight:+v||0})} />
          <NumField label="Height" suffix="cm" value={calc.height} onChange={(v)=>setCalc({...calc, height:+v||0})} />
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label>Activity level</label>
          <select className="input" value={calc.act} onChange={(e)=>setCalc({...calc, act:+e.target.value})}>
            {ACTIVITY.map(a => <option key={a.k} value={a.f}>{a.k} — {a.d}</option>)}
          </select>
        </div>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 18 }} onClick={runCalc}>
          {Icon.bolt()} Calculate BMR & TDEE
        </button>
      </div>

      {/* Targets */}
      <div className="card card-pad pop pop-2">
        <div className="card-h">
          <h3>Daily targets</h3>
          <span className="hint">edit anything</span>
        </div>
        <div className="form-grid">
          <NumField label="BMR" suffix="kcal" value={form.bmr} onChange={set("bmr")} />
          <NumField label="TDEE" suffix="kcal" value={form.tdee} onChange={set("tdee")} />
        </div>
        <div style={{ marginTop: 16 }}>
          <NumField label="Calorie goal" dot="var(--accent)" suffix="kcal / day" value={form.calories} onChange={set("calories")} />
        </div>

        {/* Quick macro presets */}
        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-soft)", display:"block", marginBottom: 9 }}>
            Quick macro split
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { n: "Balanced", v: [30,40,30] },
              { n: "High protein", v: [40,35,25] },
              { n: "Low carb", v: [35,25,40] },
              { n: "Endurance", v: [25,55,20] },
            ].map(p => (
              <button key={p.n} className="btn btn-ghost" style={{ padding: "9px 15px", fontSize: 13.5 }}
                onClick={() => applyMacroSplit(...p.v)}>{p.n}</button>
            ))}
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: 18 }}>
          <NumField label="Protein" dot="var(--protein)" suffix="g" value={form.protein} onChange={set("protein")} />
          <NumField label="Carbs" dot="var(--carbs)" suffix="g" value={form.carbs} onChange={set("carbs")} />
          <NumField label="Fat" dot="var(--fat)" suffix="g" value={form.fat} onChange={set("fat")} />
          <div className="field">
            <label>{Icon.info({style:{width:14,height:14}})} From macros</label>
            <div className="input" style={{ display:"flex", alignItems:"center", background:"var(--bg-2)", border:"none" }}>
              <b style={{ fontFamily:"var(--font-head)", marginRight: 6 }}>{round(macroKcal)}</b>
              <span style={{ color:"var(--muted)", fontSize: 13 }}>kcal</span>
            </div>
          </div>
        </div>

        {calTarget > 0 && Math.abs(macroKcal - calTarget) > 60 && (
          <div className="banner warn" style={{ marginTop: 14 }}>
            {Icon.info()}
            Your macros add up to {round(macroKcal)} kcal — that's {macroKcal > calTarget ? "above" : "below"} your {round(calTarget)} kcal goal.
          </div>
        )}

        <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={save}>
          {Icon.check()} Save goals
        </button>
      </div>
    </div>
  );
}

window.Goals = Goals;
