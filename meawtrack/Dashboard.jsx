/* Dashboard.jsx — daily summary: calorie ring, macro bars, water, history */

function WaterTracker({ cups, goal, onSet }) {
  const arr = Array.from({ length: goal });
  return (
    <div className="card card-pad pop pop-3">
      <div className="card-h">
        <h3 style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"var(--water)" }}>{Icon.drop({style:{width:18,height:18}})}</span> Water
        </h3>
        <span className="hint">{(cups * 0.25).toFixed(2)} L</span>
      </div>
      <div className="water">
        <div className="cups">
          {arr.map((_, i) => (
            <button key={i} className={"cup" + (i < cups ? " full" : "")}
              title={`${i+1} cup${i ? "s" : ""}`}
              onClick={() => onSet(i + 1 === cups ? i : i + 1)} aria-label={`set ${i+1} cups`} />
          ))}
        </div>
        <div className="water-meta">
          <div className="v">{cups}<span style={{ fontSize:14, color:"var(--muted)" }}>/{goal}</span></div>
          <div className="k">cups</div>
        </div>
      </div>
    </div>
  );
}

function HistoryTable({ meals, onDelete }) {
  return (
    <div className="card card-pad pop pop-3">
      <div className="card-h">
        <h3>Today's meals</h3>
        <span className="hint">{meals.length} item{meals.length === 1 ? "" : "s"}</span>
      </div>
      {meals.length === 0 ? (
        <div className="empty">
          {Icon.cal()}
          <p>No meals logged yet.<br/>Head to <b>Add Meal</b> to start tracking.</p>
        </div>
      ) : (
        <div className="meal-list">
          {meals.slice().reverse().map(m => (
            <div className="meal" key={m.id}>
              <div className="meal-main">
                <div className="meal-name">
                  {m.photo && <img className="photo" src={m.photo} alt="" />}
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</span>
                </div>
                <div className="meal-macros">
                  <span className="mchip p">P {round(m.protein)}g</span>
                  <span className="mchip c">C {round(m.carbs)}g</span>
                  <span className="mchip f">F {round(m.fat)}g</span>
                </div>
              </div>
              <div className="meal-cal">{round(m.calories)}<br/><small>kcal</small></div>
              <button className="del" onClick={() => onDelete(m.id)} aria-label={`delete ${m.name}`}>
                {Icon.trash()}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard({ goals, meals, onDelete, water, setWater, goToAdd }) {
  const tot = sumMeals(meals);
  const remaining = (+goals.calories || 0) - tot.calories;

  return (
    <div className="grid pop" style={{ gridTemplateColumns: "1fr" }}>
      <div className="dash-grid">
        {/* Calorie ring + tiles */}
        <div className="card card-pad">
          <div className="card-h">
            <h3>Calories</h3>
            <button className="btn btn-ghost" style={{ padding:"8px 14px", fontSize:13.5 }} onClick={goToAdd}>
              {Icon.plus({style:{width:16,height:16}})} Add
            </button>
          </div>
          <div style={{ display:"grid", placeItems:"center", padding:"6px 0 18px" }}>
            <Ring value={tot.calories} goal={+goals.calories || 0} label="eaten" unit="kcal" />
          </div>
          <div className="tiles">
            <div className="tile">
              <div className="k">Goal</div>
              <div className="v">{round(goals.calories)}<small> kcal</small></div>
            </div>
            <div className="tile">
              <div className="k">Eaten</div>
              <div className="v">{round(tot.calories)}<small> kcal</small></div>
            </div>
            <div className="tile">
              <div className="k">{remaining >= 0 ? "Left" : "Over"}</div>
              <div className="v" style={{ color: remaining >= 0 ? "var(--fat)" : "var(--accent-d)" }}>
                {round(Math.abs(remaining))}<small> kcal</small>
              </div>
            </div>
          </div>
        </div>

        {/* Macros + water */}
        <div className="grid" style={{ gridTemplateColumns:"1fr" }}>
          <div className="card card-pad pop pop-2">
            <div className="card-h"><h3>Macros</h3><span className="hint">grams today</span></div>
            <div className="macro-row">
              {MACROS.map(m => (
                <MacroBar key={m.key} macro={m} value={tot[m.key]} goal={+goals[m.key] || 0} />
              ))}
            </div>
          </div>
          <WaterTracker cups={water} goal={8} onSet={setWater} />
        </div>
      </div>

      <HistoryTable meals={meals} onDelete={onDelete} />
    </div>
  );
}

window.Dashboard = Dashboard;
