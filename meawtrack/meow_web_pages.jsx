/* meow_web_pages.jsx — desktop page layouts + add modal + root DesktopApp */

/* ---------------- Dashboard ---------------- */
function DashboardWeb({ profile, goals, totals, water, setWater, activity, weightLog, streak, units, foodIdea, go }) {
  const baseGoal = goals.calories || 0;
  const food = round(totals.cal);
  const remaining = baseGoal - food + (activity || 0);
  const consumedFrac = clampPct(food, baseGoal + (activity || 0));
  const curWeight = weightLog.length ? weightLog[weightLog.length - 1].kg : profile.weight;
  const cups = 8, cupMl = (goals.water || 2000) / cups, filled = Math.round(water / cupMl);

  return (
    <div className="web-cols">
      <div className="col">
        {/* calories hero */}
        <div className="card pop">
          <div className="card-h"><h3>Calories</h3><span className="pill" style={{ background: "var(--well)", color: "var(--ink-soft)" }}>Goal − Food + Activity</span></div>
          <div className="cal-hero">
            <Ring value={consumedFrac} goal={100} size={196} stroke={18} color="var(--accent)">
              <div className="lab">Remaining</div>
              <div className="big" style={{ fontSize: 44 }}>{fmt(Math.max(0, remaining))}</div>
              <div className="unit">kcal left</div>
            </Ring>
            <div className="stats">
              <CalStat icon={I.target} label="Base Goal" value={fmt(baseGoal)} />
              <CalStat icon={I.fork} label="Food" value={fmt(food)} />
              <CalStat icon={I.dumbbell} label="Activity" value={fmt(activity || 0)} />
              <CalStat icon={I.flame} label="Net" value={fmt(food - (activity || 0))} />
            </div>
          </div>
        </div>

        {/* weight */}
        <div className="card pop pop-2">
          <div className="card-h"><h3>Weight</h3><button className="btn btn-ghost btn-sm" onClick={() => go("weight")}>{I.plus({ width: 16, height: 16 })} Log</button></div>
          <div className="row" style={{ gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-.03em" }}>{dispWeight(curWeight, units)}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)" }}>{wUnit(units)}</span>
            <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: "var(--ink-soft)" }}>Goal: <b style={{ color: "var(--ink)" }}>{dispWeight(profile.goalWeight, units)} {wUnit(units)}</b> · {shortDate(parseKey(profile.targetDate))}</span>
          </div>
          <div style={{ marginTop: 14 }}><FlatWeightChart weightLog={weightLog} profile={profile} units={units} /></div>
        </div>

        {/* streak */}
        <div className="card pop pop-3">
          <h3 style={{ marginBottom: 16 }}>Streak</h3>
          <div className="row" style={{ gap: 22 }}>
            <div className="row" style={{ gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 30 }}>🔥</span><span style={{ fontSize: 34, fontWeight: 800 }}>{streak.current}</span><span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-soft)" }}>Day{streak.current === 1 ? "" : "s"}</span>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}><div style={{ fontWeight: 800, fontSize: 19 }}>{streak.longestMeal} Day{streak.longestMeal === 1 ? "" : "s"}</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Longest meal log</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontWeight: 800, fontSize: 19 }}>{streak.longestWeight} Day{streak.longestWeight === 1 ? "" : "s"}</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Longest weight log</div></div>
          </div>
          <WeekDots logged={streak.loggedDays} />
        </div>
      </div>

      <div className="col">
        {/* nutrition */}
        <div className="card pop pop-2">
          <h3 style={{ marginBottom: 18 }}>Nutritions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[{ m: MACROS[0], v: totals.carbs, g: goals.carbs }, { m: MACROS[1], v: totals.protein, g: goals.protein }, { m: MACROS[2], v: totals.fat, g: goals.fat }].map(({ m, v, g }) => (
              <div key={m.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
                <MacroRadial value={v} goal={g} color={m.color} emoji={m.emoji} size={82} stroke={7} />
                <div style={{ fontWeight: 800, fontSize: 15 }}>{m.label}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-soft)" }}>{round(v)} / {round(g)} g</div>
              </div>
            ))}
          </div>
        </div>

        {/* food ideas */}
        <button className="card pop pop-3" style={{ textAlign: "left", background: "linear-gradient(125deg, var(--accent-wash), var(--yellow-wash))" }} onClick={() => go("ai")}>
          <div className="between" style={{ marginBottom: 16 }}>
            <div className="row" style={{ gap: 9 }}>{I.sparkle({ width: 21, height: 21, style: { color: "var(--accent)" } })}<span style={{ fontWeight: 800, fontSize: 19 }}>Food ideas</span></div>
            <span className="iconbtn" style={{ background: "var(--surface)", borderColor: "transparent" }}>{I.chevR()}</span>
          </div>
          <div className="row" style={{ gap: 16 }}>
            <div style={{ width: 70, height: 70, borderRadius: 18, background: "var(--surface)", display: "grid", placeItems: "center", fontSize: 34, flex: "none" }}>{foodIdea.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{foodIdea.name}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", marginTop: 3 }}>{foodIdea.cal} kcal · {foodIdea.serving}</div>
              <div className="row" style={{ gap: 14, marginTop: 7, fontSize: 13.5, fontWeight: 700, color: "var(--ink-soft)" }}><span>🍞 {foodIdea.carbs}g</span><span>🥩 {foodIdea.protein}g</span><span>🧀 {foodIdea.fat}g</span></div>
            </div>
          </div>
        </button>

        {/* water */}
        <div className="card pop pop-4">
          <div className="card-h"><h3>Water</h3>
            <div className="row" style={{ gap: 8 }}>
              <button className="iconbtn ghost" onClick={() => setWater(Math.max(0, water - 250))}>−</button>
              <button className="iconbtn ghost" onClick={() => setWater(Math.min((goals.water || 2000) + 500, water + 250))}>{I.plus()}</button>
            </div>
          </div>
          <div className="row" style={{ gap: 6, alignItems: "baseline" }}><span style={{ fontSize: 38, fontWeight: 800 }}>{dispVol(water, units)}</span><span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-soft)" }}>/ {dispVol(goals.water || 2000, units)} {vUnit(units)}</span></div>
          <div className="row" style={{ gap: 8, justifyContent: "space-between", marginTop: 16 }}>
            {Array.from({ length: cups }).map((_, i) => {
              const full = i < filled;
              return <button key={i} onClick={() => setWater(Math.round((i + 1) * cupMl))} style={{ flex: 1, height: 48, borderRadius: "6px 6px 10px 10px", border: `2px solid ${full ? "var(--water)" : "var(--line-2)"}`, background: full ? "var(--water)" : "var(--well)", display: "grid", placeItems: "center", color: full ? "#fff" : "var(--muted)", transition: "all .15s" }}>{!full && I.plus({ width: 15, height: 15 })}</button>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Diary ---------------- */
function DiaryWeb({ day, setDay, meals, goals, totals, onDelete, onLogFor, units, markedDays, activities, onLogActivity, onDeleteActivity }) {
  const d = parseKey(day); const week = weekDays(d);
  const remaining = (goals.calories || 0) - totals.cal;
  const isToday = day === dkey(TODAY);
  const byMeal = {}; for (const t of MEAL_TYPES) byMeal[t] = meals.filter((m) => (m.meal || "Snack") === t);

  return (
    <div className="web-diary">
      <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 22 }}>
        <div className="card pop">
          <div className="datebar" style={{ marginBottom: 14 }}>
            <button className="iconbtn ghost" onClick={() => setDay(dkey(addDays(d, -1)))} aria-label="Previous day">{I.chevL()}</button>
            <div className="datepick" style={{ cursor: "default" }}>{I.diary({ width: 17, height: 17, style: { color: "var(--accent)" } })}<span>{d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span></div>
            <button className="iconbtn ghost" onClick={() => setDay(dkey(addDays(d, 1)))} aria-label="Next day">{I.chevR()}</button>
          </div>
          <div className="web-day-strip">
            {week.map((wd, i) => { const k = dkey(wd); const sel = k === day; const isT = k === dkey(TODAY); const marked = markedDays && markedDays.has(k);
              return <button key={i} className={sel ? "on" : ""} style={isT && !sel ? { borderColor: "var(--accent-l)" } : null} onClick={() => setDay(k)}><span className="dn">{DOW[wd.getDay()]}</span><span className="dd">{wd.getDate()}</span>{marked && <span className="daydot" style={{ background: sel ? "var(--accent)" : "var(--carbs)" }}></span>}</button>; })}
          </div>
        </div>
        <div className="card pop">
          <MonthCalendar value={day} markedDays={markedDays} onPick={(k) => setDay(k)} />
        </div>
        <div className="card pop pop-2">
          <h3 style={{ marginBottom: 16 }}>Summary</h3>
          <div style={{ display: "grid", placeItems: "center" }}>
            <Ring value={clampPct(totals.cal, goals.calories)} goal={100} size={186} stroke={16} color="var(--accent)">
              <div className="lab">Remaining</div><div className="big" style={{ fontSize: 40 }}>{fmt(Math.max(0, remaining))}</div><div className="unit">of {fmt(goals.calories)} kcal</div>
            </Ring>
          </div>
          <div className="row" style={{ gap: 10, marginTop: 18 }}>
            {[["Carbs", totals.carbs, "var(--carbs)"], ["Protein", totals.protein, "var(--protein)"], ["Fat", totals.fat, "var(--fat)"]].map(([k, v, c]) => (
              <div key={k} style={{ flex: 1, background: "var(--well)", borderRadius: 14, padding: "13px 12px" }}>
                <div className="row" style={{ gap: 6, alignItems: "center" }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c }}></span><span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)" }}>{k}</span></div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{round(v)} g</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {MEAL_TYPES.map((t) => {
          const items = byMeal[t]; const kcal = round(sumMeals(items).cal);
          return (
            <div key={t} className="card pop pop-2">
              <div className="meal-group-h"><span className="gname">{t}</span><span className="gcal">{kcal} <small style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>kcal</small></span></div>
              <div className="list">
                {items.map((m) => {
                  const lv = nutrientLevels(m);
                  const flags = [["Sugar", lv.sugar], ["Salt", lv.sodium], ["Chol", lv.chol]].filter(([, l]) => l === "high");
                  return (
                    <div key={m.id} className="mealrow">
                      {m.photo ? <img src={m.photo} className="thumb" /> : <div className="thumb">{m.emoji || "🍽️"}</div>}
                      <div className="mbody">
                        <div className="mname">{m.name}</div>
                        <div className="msub">{m.serving}</div>
                        {m.ingredients && m.ingredients.length > 0 && (
                          <div className="ing-chips">
                            {m.ingredients.slice(0, 5).map((ing, idx) => <span className="ing-chip" key={idx}>{ing}</span>)}
                            {m.ingredients.length > 5 && <span className="ing-chip">+{m.ingredients.length - 5}</span>}
                          </div>
                        )}
                        <div className="mmacros"><span>🍞 {round1(m.carbs)}g</span><span>🥩 {round1(m.protein)}g</span><span>🧀 {round1(m.fat)}g</span></div>
                        {flags.length > 0 && <div className="row" style={{ gap: 6, marginTop: 6 }}>{flags.map(([n]) => <span key={n} className="pill warn" style={{ padding: "2px 9px", fontSize: 11 }}>High {n}</span>)}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <div className="mcal">{round(m.cal)}</div>
                        <button className="iconbtn ghost" style={{ width: 30, height: 30 }} onClick={() => onDelete(m.id)}>{I.trash({ width: 15, height: 15 })}</button>
                      </div>
                    </div>
                  );
                })}
                {!items.length && <div style={{ padding: "10px 0", color: "var(--muted)", fontWeight: 600, fontSize: 14 }}>Nothing logged yet.</div>}
              </div>
              <button className="logfood" onClick={() => onLogFor(t)}>{I.plus()} Log Food</button>
            </div>
          );
        })}
        <ActivitySection activities={activities} onLog={onLogActivity} onDelete={onDeleteActivity} />
      </div>
    </div>
  );
}

Object.assign(window, { DashboardWeb, DiaryWeb });
