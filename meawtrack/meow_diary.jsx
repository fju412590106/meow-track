/* diary.jsx — day view with meals grouped by type */

function Diary({ day, setDay, meals, goals, totals, onDelete, onLogFor, units, markedDays, activities, onLogActivity, onDeleteActivity }) {
  const d = parseKey(day);
  const week = weekDays(d);
  const remaining = (goals.calories || 0) - totals.cal;
  const [calOpen, setCalOpen] = useState(false);
  const isToday = day === dkey(TODAY);

  const byMeal = {};
  for (const t of MEAL_TYPES) byMeal[t] = meals.filter((m) => (m.meal || "Snack") === t);

  return (
    <>
      <div className="page-head pop" style={{ paddingBottom: 12 }}>
        <div className="between">
          <div className="page-title">Diary</div>
          {!isToday && <button className="pill hot" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setDay(dkey(TODAY))}>Today</button>}
        </div>
      </div>

      {/* date bar: prev day · pick date · next day */}
      <div className="datebar pop">
        <button className="iconbtn ghost" onClick={() => setDay(dkey(addDays(d, -1)))} aria-label="Previous day">{I.chevL()}</button>
        <button className="datepick" onClick={() => setCalOpen((o) => !o)}>
          {I.diary({ width: 17, height: 17, style: { color: "var(--accent)" } })}
          <span>{d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
          <span style={{ transform: calOpen ? "rotate(180deg)" : "", transition: "transform .2s", color: "var(--muted)", display: "inline-flex" }}>{I.chevD({ width: 16, height: 16 })}</span>
        </button>
        <button className="iconbtn ghost" onClick={() => setDay(dkey(addDays(d, 1)))} aria-label="Next day">{I.chevR()}</button>
      </div>

      {calOpen && (
        <div className="card pop" style={{ marginBottom: 16, padding: 16 }}>
          <MonthCalendar value={day} markedDays={markedDays} onPick={(k) => { setDay(k); setCalOpen(false); }} />
        </div>
      )}

      {/* week selector */}
      <div className="row pop" style={{ gap: 0, justifyContent: "space-between", marginBottom: 18 }}>
        {week.map((wd, i) => {
          const k = dkey(wd); const isSel = k === day; const isT = k === dkey(TODAY);
          const marked = markedDays && markedDays.has(k);
          return (
            <button key={i} onClick={() => setDay(k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: isSel ? "6px 4px" : 0, borderRadius: 14, background: isSel ? "var(--well)" : "transparent" }}>
              <div style={{ position: "relative", width: 40, height: 40, borderRadius: 999, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14, border: isSel ? "2.5px solid var(--accent)" : isT ? "2px solid var(--accent-l)" : "2px solid var(--line-2)", color: isSel ? "var(--accent)" : "var(--ink-soft)" }}>
                {DOW[wd.getDay()]}
                {marked && <span style={{ position: "absolute", bottom: 4, width: 5, height: 5, borderRadius: 999, background: isSel ? "var(--accent)" : "var(--carbs)" }}></span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: isSel ? "var(--accent)" : "var(--muted)" }}>{wd.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* summary */}
      <div className="card pop pop-2">
        <h3 style={{ marginBottom: 16 }}>Summary <span style={{ color: "var(--accent)" }}>Energy</span></h3>
        <div style={{ display: "grid", placeItems: "center" }}>
          <Ring value={clampPct(totals.cal, goals.calories)} goal={100} size={186} stroke={16} color="var(--accent)">
            <div className="lab">Remaining</div>
            <div className="big" style={{ fontSize: 40 }}>{fmt(Math.max(0, remaining))}</div>
          </Ring>
        </div>
        <div className="btn" style={{ background: "var(--accent)", color: "#fff", width: "100%", justifyContent: "flex-start", marginTop: 18, borderRadius: 16 }}>
          <div><div style={{ fontSize: 13, fontWeight: 700, opacity: .9 }}>Energy</div><div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(totals.cal)} kcal</div></div>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 12 }}>
          {[["Carbs", totals.carbs], ["Protein", totals.protein], ["Fat", totals.fat]].map(([k, v]) => (
            <div key={k} style={{ flex: 1, background: "var(--well)", borderRadius: 14, padding: "13px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>{k}</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>{round(v)} g</div>
            </div>
          ))}
        </div>
      </div>

      {/* meals */}
      <div className="section-h" style={{ marginTop: 24 }}>Meal</div>
      {MEAL_TYPES.map((t) => {
        const items = byMeal[t]; const kcal = round(sumMeals(items).cal);
        return (
          <div key={t} className="card pop pop-2" style={{ marginBottom: 16 }}>
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
                          {m.ingredients.slice(0, 4).map((ing, idx) => <span className="ing-chip" key={idx}>{ing}</span>)}
                          {m.ingredients.length > 4 && <span className="ing-chip">+{m.ingredients.length - 4}</span>}
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
            </div>
            <button className="logfood" onClick={() => onLogFor(t)}>{I.plus()} Log Food</button>
          </div>
        );
      })}

      {/* activity — sits under the meals (after Snack) */}
      <ActivitySection activities={activities} onLog={onLogActivity} onDelete={onDeleteActivity} />
    </>
  );
}

function ActivitySection({ activities, onLog, onDelete }) {
  const list = activities || [];
  const burned = list.reduce((a, x) => a + (x.kcal || 0), 0);
  return (
    <div className="card pop pop-2" style={{ marginBottom: 16 }}>
      <div className="meal-group-h">
        <span className="gname" style={{ display: "flex", alignItems: "center", gap: 8 }}>{I.dumbbell({ width: 18, height: 18, style: { color: "var(--teal)" } })} Activity</span>
        <span className="gcal" style={{ color: "var(--teal)" }}>−{round(burned)} <small style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>kcal</small></span>
      </div>
      <div className="list">
        {list.map((a) => (
          <div key={a.id} className="mealrow">
            <div className="thumb" style={{ background: "var(--carbs-wash)" }}>{a.emoji || "🏃"}</div>
            <div className="mbody">
              <div className="mname" style={{ textTransform: "capitalize" }}>{a.name}</div>
              <div className="msub">{a.mins} min{a.synced ? " · synced" : ""}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div className="mcal" style={{ color: "var(--teal)" }}>−{round(a.kcal)}</div>
              {!a.synced && onDelete && <button className="iconbtn ghost" style={{ width: 30, height: 30 }} onClick={() => onDelete(a.id)}>{I.trash({ width: 15, height: 15 })}</button>}
            </div>
          </div>
        ))}
      </div>
      <button className="logfood" onClick={onLog}>{I.plus()} Log Activity</button>
    </div>
  );
}

Object.assign(window, { Diary, ActivitySection });
