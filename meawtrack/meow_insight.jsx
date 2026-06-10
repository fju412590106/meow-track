/* insight.jsx — charts + AI nutrient roundup, with flexible periods */

const PERIODS = [
  { k: "thisweek", label: "This week" },
  { k: "lastweek", label: "Last week" },
  { k: "thismonth", label: "This month" },
  { k: "lastmonth", label: "Last month" },
  { k: "thisyear", label: "This year" },
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Build aggregated buckets for a period. Bars show averaged-per-logged-day intake
   so the daily goal line stays a meaningful reference across week/month/year. */
function buildPeriod(key, mealsByDay, waterByDay, activityByDay, dailySynced) {
  const T = TODAY;
  let buckets = [], rangeLabel = "";

  if (key === "thisweek" || key === "lastweek") {
    const wd = weekDays(key === "lastweek" ? addDays(T, -7) : T);
    buckets = wd.map((d) => ({ text: DOW[d.getDay()], show: true, days: [d] }));
    rangeLabel = shortDate(wd[0]) + " – " + shortDate(wd[6]);
  } else if (key === "thismonth" || key === "lastmonth") {
    const base = new Date(T.getFullYear(), T.getMonth() + (key === "lastmonth" ? -1 : 0), 1);
    const y = base.getFullYear(), m = base.getMonth(), n = new Date(y, m + 1, 0).getDate();
    buckets = Array.from({ length: n }, (_, i) => ({ text: String(i + 1), show: i === 0 || (i + 1) % 5 === 0, days: [new Date(y, m, i + 1)] }));
    rangeLabel = base.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  } else {
    const y = T.getFullYear();
    buckets = Array.from({ length: 12 }, (_, m) => {
      const dim = new Date(y, m + 1, 0).getDate();
      return { text: MONTHS_SHORT[m][0], show: true, days: Array.from({ length: dim }, (_, d) => new Date(y, m, d + 1)) };
    });
    rangeLabel = "Year " + y;
  }

  const labels = [], intake = [], burned = [], water = [];
  const sums = { cal: 0, sugar: 0, sodium: 0, chol: 0 };
  let loggedDays = 0;

  for (const b of buckets) {
    const t = { cal: 0, carbs: 0, protein: 0, fat: 0 };
    let logged = 0, burn = 0, wat = 0, watDays = 0;
    for (const d of b.days) {
      const k = dkey(d);
      const ms = mealsByDay[k] || [];
      if (ms.length) {
        const s = sumMeals(ms);
        t.cal += s.cal; t.carbs += s.carbs; t.protein += s.protein; t.fat += s.fat;
        logged++; loggedDays++;
        sums.cal += s.cal; sums.sugar += s.sugar; sums.sodium += s.sodium; sums.chol += s.chol;
      }
      burn += (activityByDay[k] || []).reduce((a, x) => a + (x.kcal || 0), 0) + (dailySynced || 0);
      const w = waterByDay[k] || 0; wat += w; if (w) watDays++;
    }
    const div = Math.max(1, logged);
    labels.push({ text: b.text, show: b.show });
    intake.push({ cal: t.cal / div, carbs: t.carbs / div, protein: t.protein / div, fat: t.fat / div });
    burned.push(b.days.length ? burn / b.days.length : 0);
    water.push(watDays ? wat / watDays : 0);
  }
  return { rangeLabel, labels, intake, burned, water, sums, loggedDays };
}

function Insight({ mealsByDay, goals, profile, weightLog, waterByDay, activityByDay, units, health }) {
  const [period, setPeriod] = useState("thisweek");
  const P = buildPeriod(period, mealsByDay, waterByDay, activityByDay, syncedActivity(health).kcal);
  const periodLabel = PERIODS.find((p) => p.k === period).label;
  const avgCal = P.loggedDays ? round(P.sums.cal / P.loggedDays) : 0;
  const hasBurned = P.burned.some((b) => b > 0);
  const hasWater = P.water.some((w) => w > 0);

  const curWeight = weightLog.length ? weightLog[weightLog.length - 1].kg : profile.weight;
  const startW = profile.startWeight || profile.weight;
  const progress = startW !== profile.goalWeight ? clampPct(startW - curWeight, startW - profile.goalWeight) : 0;
  const { bmi, cat } = bmiInfo(curWeight, profile.height);

  return (
    <>
      <div className="page-head pop"><div className="page-title">Insight</div></div>

      <PeriodTabs value={period} onChange={setPeriod} />
      <div className="period-range pop">{P.rangeLabel}</div>

      {/* calories intake */}
      <div className="card pop pop-2" style={{ marginTop: 14 }}>
        <div className="card-h"><h3>Calories intake</h3><button className="iconbtn ghost">{I.upload({ width: 17, height: 17 })}</button></div>
        <div className="row" style={{ gap: 6, alignItems: "baseline" }}><span style={{ fontSize: 34, fontWeight: 800 }}>{fmt(avgCal)}</span><span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-soft)" }}>Daily avg kcal · {P.loggedDays} day{P.loggedDays === 1 ? "" : "s"} logged</span></div>
        <div className="legend" style={{ margin: "14px 0 6px" }}>
          {MACROS.map((m) => <span className="lg" key={m.key}><span className="sw" style={{ background: m.color }}></span>{m.label}</span>)}
        </div>
        {P.loggedDays ? <StackedBars labels={P.labels} intake={P.intake} goal={goals.calories} />
          : <div className="empty"><div className="e-emoji">🍽️</div><p>No meals logged in this period yet.</p></div>}
      </div>

      {/* calories burned */}
      <div className="card pop pop-2" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Calories burned</h3><button className="iconbtn ghost">{I.upload({ width: 17, height: 17 })}</button></div>
        {hasBurned ? <SimpleBars labels={P.labels} values={P.burned.map(round)} color="var(--teal)" />
          : <div className="empty"><div className="e-emoji">💪</div><p>Log an activity to see calories burned here.</p></div>}
      </div>

      {/* AI roundup */}
      <WeeklyRoundup totals={P.sums} loggedDays={P.loggedDays} periodLabel={periodLabel} />

      {/* weight */}
      <div className="card pop pop-3" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Weight</h3><button className="iconbtn ghost">{I.upload({ width: 17, height: 17 })}</button></div>
        <div className="row" style={{ gap: 10, alignItems: "baseline" }}>
          <span style={{ fontSize: 38, fontWeight: 800 }}>{dispWeight(curWeight, units)}<span style={{ fontSize: 17, color: "var(--ink-soft)" }}> {wUnit(units)}</span></span>
          <span className="pill hot">{round(progress)}% of goal</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-soft)", margin: "5px 0 14px" }}>Goal: <b style={{ color: "var(--ink)" }}>{dispWeight(profile.goalWeight, units)}</b> <span style={{ color: "var(--muted)", fontWeight: 600 }}>within {prettyDate(parseKey(profile.targetDate))}</span></div>
        <FlatWeightChart weightLog={weightLog} profile={profile} units={units} />
      </div>

      {/* BMI */}
      <div className="card pop pop-3" style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 14 }}>BMI</h3>
        <div className="row" style={{ gap: 12, alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 36, fontWeight: 800 }}>{bmi.toFixed(1)}</span>
          <span className="pill warn" style={{ fontSize: 14, padding: "7px 14px" }}>{cat}</span>
        </div>
        <BmiGauge bmi={bmi} />
        <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 16 }}>
          {bmi < 18.5 ? "You're a little under — fuelling up steadily can help."
            : bmi < 23 ? "You're in a healthy range. Keep up the consistency!"
            : "Your BMI suggests gradual weight loss for better health. A steady target works best."}
        </p>
      </div>

      {/* water */}
      <div className="card pop pop-4" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Water intake</h3><button className="iconbtn ghost">{I.upload({ width: 17, height: 17 })}</button></div>
        {hasWater ? <SimpleBars labels={P.labels} values={P.water.map((w) => dispVol(w, units))} color="var(--water)" goal={dispVol(goals.water || 2000, units)} />
          : <div className="empty"><div className="e-emoji">💧</div><p>Track your water on the dashboard to see trends.</p></div>}
      </div>
    </>
  );
}

function PeriodTabs({ value, onChange }) {
  return (
    <div className="period-tabs pop">
      {PERIODS.map((p) => (
        <button key={p.k} className={value === p.k ? "on" : ""} onClick={() => onChange(p.k)}>{p.label}</button>
      ))}
    </div>
  );
}

function StackedBars({ labels, intake, goal }) {
  const W = 340, H = 170, padB = 22, padT = 6, padR = 34, padL = 6;
  const n = intake.length || 1;
  const max = Math.max(goal || 0, ...intake.map((d) => d.cal), 1);
  const slot = (W - padL - padR) / n;
  const bw = Math.max(3, Math.min(20, slot * 0.62));
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);
  const x = (i) => padL + (i + 0.5) * slot;
  const grids = [0, 0.25, 0.5, 0.75, 1].map((f) => round(max * f));
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {grids.map((g, i) => <g key={i}><line className="gridline" x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} /><text className="axis-lab" x={W - padR + 3} y={y(g) + 4}>{g}</text></g>)}
        {goal > 0 && <line x1={padL} y1={y(goal)} x2={W - padR} y2={y(goal)} stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 5" />}
        {intake.map((t, i) => {
          const segs = [[t.carbs * 4, "var(--carbs)"], [t.protein * 4, "var(--protein)"], [t.fat * 9, "var(--fat)"]];
          let acc = 0;
          return (
            <g key={i}>
              {t.cal > 0 && segs.map(([val, c], si) => { const y0 = y(acc); acc += val; const y1 = y(acc); return <rect key={si} x={x(i) - bw / 2} y={y1} width={bw} height={Math.max(0, y0 - y1)} fill={c} rx={si === 2 ? Math.min(4, bw / 2) : 0} />; })}
              {labels[i] && labels[i].show && <text className="axis-lab" x={x(i)} y={H - 5} textAnchor="middle">{labels[i].text}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SimpleBars({ labels, values, color, goal }) {
  const W = 340, H = 150, padB = 22, padT = 6, padR = 8, padL = 6;
  const n = values.length || 1;
  const max = Math.max(goal || 0, ...values, 1);
  const slot = (W - padL - padR) / n;
  const bw = Math.max(3, Math.min(22, slot * 0.62));
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);
  const x = (i) => padL + (i + 0.5) * slot;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {goal > 0 && <line x1={padL} y1={y(goal)} x2={W - padR} y2={y(goal)} stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 5" />}
        {values.map((v, i) => (
          <g key={i}>
            {v > 0 && <rect x={x(i) - bw / 2} y={y(v)} width={bw} height={H - padB - y(v)} fill={color} rx={Math.min(5, bw / 2)} />}
            {labels[i] && labels[i].show && <text className="axis-lab" x={x(i)} y={H - 5} textAnchor="middle">{labels[i].text}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

function BmiGauge({ bmi }) {
  const pos = Math.max(0, Math.min(100, (bmi - 14) / (40 - 14) * 100));
  return (
    <div style={{ position: "relative", height: 16 }}>
      <div style={{ height: 10, borderRadius: 999, background: "linear-gradient(90deg, var(--water), var(--carbs) 35%, var(--yellow) 60%, var(--accent) 85%, #D6402A)" }}></div>
      <div style={{ position: "absolute", top: -3, left: `calc(${pos}% - 8px)`, width: 16, height: 16, borderRadius: 999, background: "#fff", border: "3px solid var(--ink)", boxShadow: "var(--shadow-sm)" }}></div>
    </div>
  );
}

function WeeklyRoundup({ totals, loggedDays, periodLabel }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const lbl = (periodLabel || "this period").toLowerCase();

  async function gen() {
    if (loggedDays === 0) return;
    setBusy(true); setErr(null);
    try { const r = await aiWeeklyRoundup(totals, loggedDays); if (r) setData(r); else setErr("Couldn't generate. Try again."); }
    catch { setErr("AI unavailable right now."); }
    setBusy(false);
  }
  useEffect(() => { setData(null); setErr(null); }, [loggedDays, totals.cal]);

  const LEVEL = { low: ["var(--carbs)", "Low"], ok: ["var(--yellow-d)", "On track"], high: ["var(--accent)", "High"] };
  return (
    <div className="card pop pop-3" style={{ marginTop: 18, background: "linear-gradient(135deg, var(--accent-wash), var(--yellow-wash))" }}>
      <div className="card-h"><h3 style={{ display: "flex", gap: 9, alignItems: "center" }}>{I.sparkle({ style: { color: "var(--accent)" } })} Nutrient roundup</h3></div>
      {!data && !busy && (
        <>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 14 }}>Let AI review your sugar, sodium &amp; cholesterol for {lbl} and suggest where to focus.</p>
          {err && <div className="banner warn" style={{ marginBottom: 12 }}>{I.info()}{err}</div>}
          <button className="btn btn-primary btn-block" onClick={gen} disabled={loggedDays === 0}>{I.sparkle()} {loggedDays === 0 ? "Log meals to analyze" : "Analyze " + lbl}</button>
        </>
      )}
      {busy && <div className="analyzing"><div className="spin"></div> Reviewing your nutrition…</div>}
      {data && (
        <div className="pop">
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 14 }}>{data.headline}</div>
          {[["Sugar", data.sugar, "g", round(totals.sugar / loggedDays)], ["Sodium", data.sodium, "mg", round(totals.sodium / loggedDays)], ["Cholesterol", data.cholesterol, "mg", round(totals.chol / loggedDays)]].map(([k, o, u, avg]) => (
            <div key={k} className="card flat" style={{ padding: 13, marginBottom: 10, background: "var(--surface)" }}>
              <div className="between" style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 14.5 }}>{k}</span>
                <span className="pill" style={{ background: (LEVEL[o?.level]?.[0] || "var(--muted)") + "22", color: LEVEL[o?.level]?.[0] || "var(--muted)", fontSize: 11.5 }}>{LEVEL[o?.level]?.[1] || "—"} · {avg} {u}/day</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", lineHeight: 1.45 }}>{o?.note}</div>
            </div>
          ))}
          {data.focus && <div className="banner hot" style={{ marginTop: 4 }}>{I.bolt()}<span><b>Up next ·</b> {data.focus}</span></div>}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Insight, PeriodTabs, StackedBars, SimpleBars, BmiGauge, WeeklyRoundup, buildPeriod, PERIODS });
