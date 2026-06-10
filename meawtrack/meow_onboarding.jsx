/* onboarding.jsx — personalized plan flow */

/* shared weight-projection line chart (also reused on dashboard/insight) */
function WeightChart({ start, goal, units, height = 150, days = 7, points = null, showProjection = true }) {
  const W = 320, H = height, padL = 8, padR = 30, padT = 16, padB = 22;
  const lo = Math.min(start, goal) - 5, hi = Math.max(start, goal) + 2;
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const xs = (i, n) => padL + (i / (n - 1)) * (W - padL - padR);
  const ticks = [hi - 1, (hi + lo) / 2, lo + 1].map(round);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line className="gridline" x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} />
            <text className="axis-lab" x={W - padR + 4} y={y(t) + 4}>{t}</text>
          </g>
        ))}
        {showProjection && (
          <>
            <line x1={xs(0,2)} y1={y(start)} x2={xs(1,2)} y2={y(goal)} stroke="url(#wgrad)" strokeWidth="3.5" strokeLinecap="round" />
            <defs><linearGradient id="wgrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--yellow)"/><stop offset="1" stopColor="var(--accent)"/>
            </linearGradient></defs>
            <circle cx={xs(0,2)} cy={y(start)} r="5.5" fill="var(--yellow)" />
            <circle cx={xs(1,2)} cy={y(goal)} r="5.5" fill="var(--accent)" />
            <text className="axis-lab" x={xs(0,2)} y={y(start) - 11} style={{ fontWeight: 800, fill: "var(--ink)" }}>{dispWeight(start, units)}</text>
            <text className="axis-lab" x={xs(1,2) - 16} y={y(goal) - 11} style={{ fontWeight: 800, fill: "var(--ink)" }} textAnchor="end">{dispWeight(goal, units)}</text>
          </>
        )}
        {points && (
          <polyline fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            points={points.map((p, i) => `${xs(i, points.length)},${y(p)}`).join(" ")} />
        )}
      </svg>
    </div>
  );
}

const GOAL_OPTS = [
  { k: "lose", emoji: "📉", t: "Lose weight", s: "Trim down at a healthy pace" },
  { k: "maintain", emoji: "⚖️", t: "Maintain", s: "Stay where you are, eat smarter" },
  { k: "gain", emoji: "💪", t: "Gain muscle", s: "Build up with a surplus" },
];
const ACT_OPTS = [
  { f: 1.2, t: "Sedentary", s: "Little / no exercise" },
  { f: 1.375, t: "Light", s: "1–3 days / week" },
  { f: 1.55, t: "Moderate", s: "3–5 days / week" },
  { f: 1.725, t: "Active", s: "6–7 days / week" },
  { f: 1.9, t: "Athlete", s: "Hard daily training" },
];

function computePlan(p) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const tdee = bmr * p.activity;
  const delta = p.weight - p.goalWeight;
  const dir = Math.abs(delta) < 0.2 ? "maintain" : (delta > 0 ? "lose" : "gain");
  const dailyAdj = (p.pace || 0.5) * 7700 / 7;
  const floor = p.sex === "female" ? 1200 : 1500;
  let cal = Math.round(tdee);
  if (dir === "lose") cal = Math.max(Math.round(tdee - dailyAdj), floor);
  else if (dir === "gain") cal = Math.round(tdee + dailyAdj);
  const split = MACRO_SPLITS.highprotein;
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), calories: cal, dir,
    carbs: Math.round(cal * split.carbs / 100 / 4),
    protein: Math.round(cal * split.protein / 100 / 4),
    fat: Math.round(cal * split.fat / 100 / 9),
    water: 2000,
    sugar: 36, sodium: 2300, cholesterol: 300,
  };
}

function bmiInfo(weight, heightCm) {
  const h = heightCm / 100; const bmi = h > 0 ? weight / (h * h) : 0;
  let cat = "—", color = "var(--muted)";
  if (bmi) {
    if (bmi < 18.5) { cat = "Underweight"; color = "var(--water)"; }
    else if (bmi < 23) { cat = "Healthy"; color = "var(--carbs)"; }
    else if (bmi < 27.5) { cat = "Overweight"; color = "var(--yellow-d)"; }
    else { cat = "Obese"; color = "var(--accent)"; }
  }
  return { bmi, cat, color };
}

function Onboarding({ onDone, units, setUnits, bare }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ ...DEFAULT_PROFILE, name: "", age: 0, height: 0, weight: 0, goalWeight: 0 });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const plan = useMemo(() => computePlan(p), [p]);
  const { bmi, cat, color } = bmiInfo(p.weight, p.height);
  const STEPS = 5;

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  function finish() {
    const target = addDays(TODAY, Math.round((Math.abs(p.weight - p.goalWeight) / (p.pace || 0.5)) * 7));
    onDone(
      { ...p, startWeight: p.weight, startDate: dkey(TODAY), targetDate: dkey(target) },
      { calories: plan.calories, carbs: plan.carbs, protein: plan.protein, fat: plan.fat,
        water: plan.water, bmr: plan.bmr, tdee: plan.tdee, sugar: 36, sodium: 2300, cholesterol: 300 }
    );
  }

  const inner = (
        <div className={"ob" + (bare ? " ob-bare" : "")}>
          {step > 0 && step < STEPS - 1 && (
            <button className="iconbtn" style={{ marginBottom: 16 }} onClick={back}>{I.back()}</button>
          )}

          {step < STEPS - 1 && (
            <div className="ob-prog">{Array.from({ length: STEPS - 1 }).map((_, i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
          )}

          {/* STEP 0 — goal */}
          {step === 0 && (
            <div className="pop">
              <div style={{ fontSize: 38 }}>🐱</div>
              <h1 style={{ fontSize: 28, marginTop: 8 }}>Welcome to Meow Track</h1>
              <p style={{ color: "var(--ink-soft)", fontWeight: 600, marginTop: 8, fontSize: 15 }}>What would you like to focus on?</p>
              <div className="stack" style={{ marginTop: 22 }}>
                {GOAL_OPTS.map((o) => (
                  <button key={o.k} className={"choice" + (p.goalType === o.k ? " on" : "")} onClick={() => set("goalType", o.k)}>
                    <span className="c-emoji">{o.emoji}</span>
                    <span><span className="c-t">{o.t}</span><span className="c-s">{o.s}</span></span>
                    <span className="c-check">{p.goalType === o.k && I.check()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 — about you */}
          {step === 1 && (
            <div className="pop">
              <h1>A bit about you</h1>
              <p style={{ color: "var(--ink-soft)", fontWeight: 600, margin: "8px 0 20px", fontSize: 15 }}>So we can tailor your numbers.</p>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Your name</label>
                <input className="input" placeholder="e.g. Saihan" value={p.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Sex</label>
                <div className="seg">
                  {["female", "male"].map((s) => <button key={s} className={p.sex === s ? "on" : ""} onClick={() => set("sex", s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}
                </div>
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Units</label>
                <div className="seg">
                  {["metric", "imperial"].map((u) => <button key={u} className={units === u ? "on" : ""} onClick={() => setUnits(u)}>{u === "metric" ? "Metric (kg/cm)" : "Imperial (lb/ft)"}</button>)}
                </div>
              </div>
              <div className="form-grid">
                <div className="field"><label>Age</label><div className="input-wrap"><input className="input suffix-pad" type="number" placeholder="0" value={p.age || ""} onChange={(e) => set("age", +e.target.value || 0)} /><span className="suffix">yrs</span></div></div>
                <div className="field"><label>Height</label><div className="input-wrap"><input className="input suffix-pad" type="number" placeholder="0" value={p.height ? (units === "imperial" ? Math.round(p.height / 2.54) : p.height) : ""} onChange={(e) => set("height", units === "imperial" ? +e.target.value * 2.54 : +e.target.value || 0)} /><span className="suffix">{units === "imperial" ? "in" : "cm"}</span></div></div>
              </div>
              <div className="field" style={{ marginTop: 16 }}><label>Current weight</label><div className="input-wrap"><input className="input suffix-pad" type="number" step="0.1" placeholder="0" value={p.weight ? (units === "imperial" ? round1(kgToLb(p.weight)) : p.weight) : ""} onChange={(e) => set("weight", units === "imperial" ? lbToKg(+e.target.value) : +e.target.value || 0)} /><span className="suffix">{wUnit(units)}</span></div></div>
            </div>
          )}

          {/* STEP 2 — target */}
          {step === 2 && (
            <div className="pop">
              <h1>Set your target</h1>
              <p style={{ color: "var(--ink-soft)", fontWeight: 600, margin: "8px 0 20px", fontSize: 15 }}>BMI {bmi ? bmi.toFixed(1) : "—"} · <span style={{ color }}>{cat}</span></p>
              <div className="field" style={{ marginBottom: 18 }}><label>Goal weight</label><div className="input-wrap"><input className="input suffix-pad" type="number" step="0.1" placeholder="0" value={p.goalWeight ? (units === "imperial" ? round1(kgToLb(p.goalWeight)) : p.goalWeight) : ""} onChange={(e) => set("goalWeight", units === "imperial" ? lbToKg(+e.target.value) : +e.target.value || 0)} /><span className="suffix">{wUnit(units)}</span></div></div>
              <div className="field" style={{ marginBottom: 18 }}>
                <label>Activity level</label>
                <div className="stack" style={{ gap: 8 }}>
                  {ACT_OPTS.map((a) => (
                    <button key={a.f} className={"choice" + (p.activity === a.f ? " on" : "")} style={{ padding: 13 }} onClick={() => set("activity", a.f)}>
                      <span><span className="c-t" style={{ fontSize: 15 }}>{a.t}</span><span className="c-s">{a.s}</span></span>
                      <span className="c-check">{p.activity === a.f && I.check()}</span>
                    </button>
                  ))}
                </div>
              </div>
              {p.goalType !== "maintain" && (
                <div className="field">
                  <label>Weekly pace</label>
                  <div className="seg">
                    {[{ v: 0.25, n: "Relaxed" }, { v: 0.5, n: "Steady" }, { v: 0.75, n: "Ambitious" }].map((o) => (
                      <button key={o.v} className={p.pace === o.v ? "on" : ""} onClick={() => set("pace", o.v)}>{o.n}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — building */}
          {step === 3 && <PlanBuilding onDone={next} />}

          {/* STEP 4 — plan ready */}
          {step === 4 && (
            <PlanReady p={p} plan={plan} bmi={bmi} cat={cat} color={color} units={units} onContinue={finish} />
          )}

          {step < 3 && (
            <div style={{ marginTop: "auto", paddingTop: 28 }}>
              <button className="btn btn-primary btn-block" disabled={(step === 1 && (!p.name.trim() || !(p.age > 0) || !(p.height > 0) || !(p.weight > 0))) || (step === 2 && !(p.goalWeight > 0))} onClick={next}>Continue</button>
            </div>
          )}
        </div>
  );

  if (bare) return inner;
  return (
    <div className="screen">
      <div className="island"></div>
      <div className="statusbar"><span className="time">9:41</span><StatusIcons ink="var(--ink)" /></div>
      <div className="view no-pad">
        {inner}
      </div>
    </div>
  );
}

function PlanBuilding({ onDone }) {
  const [i, setI] = useState(0);
  const steps = ["Crunching your numbers", "Balancing your macros", "Drawing your plan"];
  useEffect(() => {
    const t1 = setInterval(() => setI((x) => Math.min(steps.length - 1, x + 1)), 750);
    const t2 = setTimeout(onDone, 2500);
    return () => { clearInterval(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 20, padding: "60px 0" }}>
      <div style={{ fontSize: 46 }}>🐱</div>
      <div className="spin" style={{ width: 34, height: 34 }}></div>
      <div style={{ fontWeight: 800, fontSize: 18, textAlign: "center" }}>{steps[i]}…</div>
    </div>
  );
}

function PlanReady({ p, plan, bmi, cat, color, units, onContinue }) {
  const target = addDays(TODAY, Math.round((Math.abs(p.weight - p.goalWeight) / (p.pace || 0.5)) * 7));
  const months = Math.max(1, Math.round((target - TODAY) / (DAY_MS * 30)));
  const split = [
    { ...MACROS[0], g: plan.carbs, pct: MACRO_SPLITS.highprotein.carbs },
    { ...MACROS[1], g: plan.protein, pct: MACRO_SPLITS.highprotein.protein },
    { ...MACROS[2], g: plan.fat, pct: MACRO_SPLITS.highprotein.fat },
  ];
  return (
    <div className="pop" style={{ paddingBottom: 10 }}>
      <div style={{ fontSize: 34 }}>👋</div>
      <h1 style={{ fontSize: 27, marginTop: 6 }}>{p.name ? p.name.trim().split(/\s+/)[0] + ", your" : "Your"} personalized health plan is ready!</h1>

      {p.goalType !== "maintain" && (
        <div className="card flat pop pop-2" style={{ marginTop: 22, padding: 18 }}>
          <div className="between" style={{ marginBottom: 8 }}>
            <div><div className="page-date">{plan.dir === "lose" ? "Lose weight to" : "Gain weight to"}</div><div style={{ fontSize: 21, fontWeight: 800 }}>{dispWeight(p.goalWeight, units)} {wUnit(units)}</div></div>
            <div style={{ textAlign: "right" }}><div className="page-date">Within</div><div style={{ fontSize: 21, fontWeight: 800 }}>{months} months</div></div>
          </div>
          <WeightChart start={p.weight} goal={p.goalWeight} units={units} height={150} />
          <div className="between" style={{ marginTop: 4 }}>
            <div><div style={{ fontWeight: 800, fontSize: 14 }}>Today</div><div className="page-date">{shortDate(TODAY)}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontWeight: 800, fontSize: 14 }}>Goal</div><div className="page-date">{shortDate(target)}</div></div>
          </div>
        </div>
      )}

      <div className="card flat pop pop-3" style={{ marginTop: 16, padding: 20 }}>
        <h3 style={{ fontSize: 19, marginBottom: 16 }}>Your daily calories goal</h3>
        <div style={{ display: "grid", placeItems: "center" }}>
          <Ring value={1} goal={1} size={176} stroke={15} color="var(--accent)" track="var(--accent)">
            <div className="big" style={{ fontSize: 38 }}>{fmt(plan.calories)}</div>
            <div className="unit">Calories</div>
          </Ring>
        </div>
        <div className="macro3" style={{ marginTop: 18 }}>
          {split.map((m) => (
            <div className="m" key={m.key}>
              <div className="mk" style={{ color: m.color }}>{m.label}</div>
              <div className="bar" style={{ width: "100%" }}><span style={{ width: "60%", background: m.color }}></span></div>
              <div className="mv">{m.g} g · {m.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card flat pop pop-4" style={{ marginTop: 16, padding: 20 }}>
        <h3 style={{ fontSize: 19, marginBottom: 6 }}>Baseline at goal setup</h3>
        <div className="baserow">
          <div><div className="bk">Body mass index</div><div className="bv">BMI: {bmi.toFixed(1)} <span className="pill warn" style={{ marginLeft: 4 }}>{cat}</span></div></div>
        </div>
        <div className="baserow"><div><div className="bk">Basal metabolic rate</div><div className="bv">BMR: {fmt(plan.bmr)} kcal</div></div></div>
        <div className="baserow"><div><div className="bk">Total daily energy</div><div className="bv">TDEE: {fmt(plan.tdee)} kcal</div></div></div>
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} onClick={onContinue}>Continue</button>
    </div>
  );
}

Object.assign(window, { Onboarding, WeightChart, computePlan, bmiInfo, GOAL_OPTS, ACT_OPTS });
