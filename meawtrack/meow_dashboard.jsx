/* dashboard.jsx — main dashboard tab */

function Dashboard({ profile, goals, meals, totals, water, setWater, activity, weightLog, streak, units, foodIdea, onOpenAdd, go, showToast, onOpenChat }) {
  const baseGoal = goals.calories || 0;
  const food = round(totals.cal);
  const remaining = baseGoal - food + (activity || 0);
  const consumedFrac = clampPct(food, baseGoal + (activity || 0));

  const curWeight = weightLog.length ? weightLog[weightLog.length - 1].kg : profile.weight;
  const cups = 8, cupMl = (goals.water || 2000) / cups;
  const filled = Math.round(water / cupMl);

  return (
    <>
      <div className="page-head pop">
        <div className="page-date">{prettyDate(TODAY)}</div>
        <div className="between">
          <div className="page-title">Dashboard</div>
          <button className="ai-chip" onClick={() => onOpenChat && onOpenChat()}>{I.sparkle({ width: 15, height: 15 })} Ask Meow AI</button>
        </div>
      </div>

      {/* Calories card */}
      <div className="card pop">
        <div className="card-h"><h3>Calories</h3><button className="iconbtn ghost" onClick={() => go("insight")}>⋯</button></div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginTop: -8, marginBottom: 14 }}>Remaining = Base goal − Food + Activity</div>
        <div className="row" style={{ gap: 14, alignItems: "center" }}>
          <Ring value={consumedFrac} goal={100} size={168} stroke={16} color="var(--accent)">
            <div className="lab">Remaining</div>
            <div className="big" style={{ fontSize: 38 }}>{fmt(Math.max(0, remaining))}</div>
          </Ring>
          <div className="stack" style={{ gap: 16, flex: 1 }}>
            <CalStat icon={I.target} label="Base Goal" value={fmt(baseGoal)} />
            <CalStat icon={I.fork} label="Food" value={fmt(food)} />
            <CalStat icon={I.dumbbell} label="Activity" value={fmt(activity || 0)} />
          </div>
        </div>
        <button className="between" style={{ width: "100%", borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 14, color: "var(--ink-soft)" }} onClick={() => go("onboarding-peek")}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Baseline at Goal Setup</span>{I.chevD({ width: 18, height: 18, style: { color: "var(--muted)" } })}
        </button>
      </div>

      {/* Nutritions */}
      <div className="card pop pop-2" style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 18 }}>Nutritions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          {[
            { m: MACROS[0], v: totals.carbs, g: goals.carbs },
            { m: MACROS[1], v: totals.protein, g: goals.protein },
            { m: MACROS[2], v: totals.fat, g: goals.fat },
          ].map(({ m, v, g }) => (
            <div key={m.key} className="m" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              <MacroRadial value={v} goal={g} color={m.color} emoji={m.emoji} size={78} stroke={7} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>{m.label}</div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink-soft)" }}>{round(v)} / {round(g)} g</div>
            </div>
          ))}
        </div>
      </div>

      {/* Food ideas */}
      <FoodIdeas idea={foodIdea} go={go} />

      {/* Streak */}
      <div className="card pop pop-3" style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 14 }}>Streak</h3>
        <div className="row" style={{ gap: 6, alignItems: "baseline", marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <span style={{ fontSize: 32, fontWeight: 800 }}>{streak.current}</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-soft)" }}>Day{streak.current === 1 ? "" : "s"}</span>
        </div>
        <div className="row" style={{ gap: 0, justifyContent: "space-between", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div><div style={{ fontWeight: 800, fontSize: 20 }}>{streak.longestMeal} Day{streak.longestMeal === 1 ? "" : "s"}</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Longest meal log</div></div>
          <div><div style={{ fontWeight: 800, fontSize: 20 }}>{streak.longestWeight} Day{streak.longestWeight === 1 ? "" : "s"}</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Longest weight log</div></div>
        </div>
        <WeekDots logged={streak.loggedDays} />
      </div>

      {/* Weight */}
      <div className="card pop pop-3" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Weight</h3><button className="iconbtn ghost" onClick={() => go("weight")}>{I.plus()}</button></div>
        <div className="row" style={{ gap: 6, alignItems: "baseline" }}>
          <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.03em" }}>{dispWeight(curWeight, units)}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)" }}>{wUnit(units)}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-soft)", margin: "4px 0 14px" }}>Goal: <b style={{ color: "var(--ink)" }}>{dispWeight(profile.goalWeight, units)}</b> <span style={{ color: "var(--muted)", fontWeight: 600 }}>within {shortDate(parseKey(profile.targetDate))}</span></div>
        <FlatWeightChart weightLog={weightLog} profile={profile} units={units} />
      </div>

      {/* Water */}
      <div className="card pop pop-4" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Water</h3>
          <div className="row" style={{ gap: 8 }}>
            <button className="iconbtn ghost" onClick={() => setWater(Math.min((goals.water || 2000) + 500, water + 250))}>{I.plus()}</button>
            <button className="iconbtn ghost" onClick={() => setWater(Math.max(0, water - 250))}>−</button>
          </div>
        </div>
        <div className="row" style={{ gap: 6, alignItems: "baseline" }}>
          <span style={{ fontSize: 40, fontWeight: 800 }}>{dispVol(water, units)}</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-soft)" }}>{vUnit(units)}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-soft)", margin: "4px 0 16px" }}>Goal: <b style={{ color: "var(--ink)" }}>{dispVol(goals.water || 2000, units)}</b> {vUnit(units)}</div>
        <div className="row" style={{ gap: 8, justifyContent: "space-between" }}>
          {Array.from({ length: cups }).map((_, i) => {
            const full = i < filled;
            return (
              <button key={i} onClick={() => setWater(Math.round((i + 1) * cupMl))} style={{ flex: 1, height: 46, borderRadius: "6px 6px 10px 10px", border: `2px solid ${full ? "var(--water)" : "var(--line-2)"}`, background: full ? "var(--water)" : "var(--well)", display: "grid", placeItems: "center", color: full ? "#fff" : "var(--muted)", transition: "all .15s" }}>
                {!full && I.plus({ width: 15, height: 15 })}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function CalStat({ icon, label, value }) {
  return (
    <div className="row" style={{ gap: 11 }}>
      <span style={{ color: "var(--muted)", flex: "none" }}>{icon({ width: 22, height: 22 })}</span>
      <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{label}</div><div style={{ fontSize: 20, fontWeight: 800, whiteSpace: "nowrap" }}>{value}</div></div>
    </div>
  );
}

function WeekDots({ logged }) {
  const days = weekDays(TODAY);
  return (
    <div className="row" style={{ gap: 0, justifyContent: "space-between", marginTop: 16 }}>
      {days.map((d, i) => {
        const isToday = dkey(d) === dkey(TODAY);
        const isLogged = logged.includes(dkey(d));
        const future = d > TODAY;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14,
              border: isToday ? "2.5px solid var(--accent)" : "2px solid var(--line-2)",
              background: isLogged && !isToday ? "var(--carbs-wash)" : "transparent",
              color: isToday ? "var(--accent)" : future ? "var(--muted)" : isLogged ? "var(--carbs)" : "var(--ink-soft)" }}>
              {DOW[d.getDay()]}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? "var(--accent)" : "var(--muted)" }}>{d.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

function FlatWeightChart({ weightLog, profile, units }) {
  const days = weekDays(TODAY);
  const goalKg = profile.goalWeight;
  const startKg = profile.startWeight || profile.weight;
  const lo = Math.min(goalKg, startKg) - 8, hi = Math.max(goalKg, startKg) + 2;
  const W = 330, H = 130, padR = 26, padB = 20, padT = 10;
  const y = (kg) => padT + (1 - (kg - lo) / (hi - lo)) * (H - padT - padB);
  const x = (i) => 6 + (i / 6) * (W - 6 - padR);
  const pts = days.map((d) => {
    const e = weightLog.filter((w) => w.date <= dkey(d)).slice(-1)[0];
    return e ? e.kg : null;
  });
  const ticks = [hi - 1, (hi + lo) / 2, lo + 1];
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {ticks.map((t, i) => <g key={i}><line className="gridline" x1="6" y1={y(t)} x2={W - padR} y2={y(t)} /><text className="axis-lab" x={W - padR + 3} y={y(t) + 4}>{round(units === "imperial" ? kgToLb(t) : t)}</text></g>)}
        <line x1="6" y1={y(goalKg)} x2={W - padR} y2={y(goalKg)} stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="7 6" strokeLinecap="round" />
        {pts.some((p) => p != null) && (
          <polyline fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points={pts.map((p, i) => p != null ? `${x(i)},${y(p)}` : null).filter(Boolean).join(" ")} />
        )}
        {pts.map((p, i) => p != null && <circle key={i} cx={x(i)} cy={y(p)} r="3.5" fill="var(--ink)" />)}
        {days.map((d, i) => <text key={i} className="axis-lab" x={x(i)} y={H - 4} textAnchor="middle">{DOW[d.getDay()]}</text>)}
      </svg>
    </div>
  );
}

function FoodIdeas({ idea, go }) {
  return (
    <button className="card pop pop-2" style={{ marginTop: 18, width: "100%", textAlign: "left", background: "linear-gradient(120deg, var(--accent-wash), var(--yellow-wash))" }} onClick={() => go("addsheet-ai")}>
      <div className="between" style={{ marginBottom: idea ? 14 : 0 }}>
        <div className="row" style={{ gap: 8 }}>{I.sparkle({ width: 20, height: 20, style: { color: "var(--accent)" } })}<span style={{ fontWeight: 800, fontSize: 18 }}>Food ideas</span></div>
        <span className="iconbtn" style={{ background: "var(--surface)", borderColor: "transparent" }}>{I.chevR()}</span>
      </div>
      {idea ? (
        <div className="row" style={{ gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--surface)", display: "grid", placeItems: "center", fontSize: 32, flex: "none" }}>{idea.emoji || "🍱"}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{idea.name}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-soft)", marginTop: 2 }}>{idea.cal} kcal · {idea.serving}</div>
            <div className="row" style={{ gap: 12, marginTop: 5, fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>
              <span>🍞 {idea.carbs}g</span><span>🥩 {idea.protein}g</span><span>🧀 {idea.fat}g</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="row" style={{ gap: 10, color: "var(--ink-soft)", fontWeight: 700, fontSize: 14 }}><div className="spin" style={{ width: 18, height: 18 }}></div> Cooking up an idea for you…</div>
      )}
    </button>
  );
}

Object.assign(window, { Dashboard });
