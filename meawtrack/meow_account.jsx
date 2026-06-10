/* account.jsx — account hub + sub-screens */

function Account({ profile, setProfile, goals, setGoals, units, setUnits, theme, setTheme, showToast, onOpenChat, health, setHealth }) {
  const [sub, setSub] = useState(null);
  if (sub) {
    return (
      <div className="pop">
        <div className="between" style={{ marginBottom: 18 }}>
          <button className="iconbtn" onClick={() => setSub(null)}>{I.back()}</button>
          <h3 style={{ fontSize: 20 }}>{SUB_TITLES[sub]}</h3>
          <span style={{ width: 40 }}></span>
        </div>
        {sub === "pro" && <MeowPro profile={profile} units={units} onOpenChat={onOpenChat} showToast={showToast} />}
        {sub === "personal" && <PersonalDetails profile={profile} setProfile={setProfile} units={units} setUnits={setUnits} showToast={showToast} done={() => setSub(null)} />}
        {sub === "weight" && <AdjustWeightGoal profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals} units={units} showToast={showToast} done={() => setSub(null)} />}
        {sub === "nutrition" && <EditNutrition goals={goals} setGoals={setGoals} units={units} showToast={showToast} done={() => setSub(null)} />}
        {sub === "activity" && <ActivityLogging health={health} setHealth={setHealth} showToast={showToast} />}
        {sub === "integrations" && <Integrations health={health} setHealth={setHealth} showToast={showToast} />}
        {sub === "settings" && <AppSettings theme={theme} setTheme={setTheme} units={units} setUnits={setUnits} showToast={showToast} />}
      </div>
    );
  }

  const healthOn = anyConnected(health);
  return (
    <>
      <div className="page-head pop"><div className="page-title">Account</div></div>

      <div className="card pop" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: "linear-gradient(135deg,var(--accent),var(--yellow))", display: "grid", placeItems: "center", fontSize: 28, flex: "none" }}>🐱</div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 19 }}>{profile.name}</div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-soft)" }}>{profile.sex === "female" ? "Female" : "Male"} · {profile.age} yrs · {healthOn ? "Health connected" : "Free plan"}</div></div>
        <button className="iconbtn ghost" onClick={() => setSub("personal")}>{I.edit()}</button>
      </div>

      <div className="acct-group pop">Assistant</div>
      <button className="referral pop" style={{ width: "100%", textAlign: "left" }} onClick={() => onOpenChat && onOpenChat()}>
        <span className="gift">🐱</span>
        <div style={{ flex: 1 }}><div className="rt">Ask Meow AI</div><div className="rs">Chat with your AI nutrition &amp; fitness assistant — meals, macros, workouts and more.</div></div>
        {I.chevR({ style: { color: "var(--muted)" } })}
      </button>

      <div className="acct-group pop">Meow Track for Professional</div>
      <button className="acct-card pop" style={{ width: "100%", textAlign: "left", padding: 17 }} onClick={() => setSub("pro")}>
        <div className="row" style={{ gap: 14 }}><span style={{ fontSize: 24 }}>🤝</span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 16 }}>Meow Track for Professional</div><div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", marginTop: 2 }}>Find dietitians, health coaches &amp; trainers for you</div></div>
          {I.chevR({ style: { color: "var(--muted)" } })}</div>
      </button>

      <div className="acct-group pop">Personalize</div>
      <div className="acct-card pop">
        <AcctRow icon={I.account} label="Personal details" onClick={() => setSub("personal")} />
        <AcctRow icon={I.flag} label="Adjust weight goal" onClick={() => setSub("weight")} />
        <AcctRow icon={I.target} label="Edit nutrition goals" onClick={() => setSub("nutrition")} />
        <AcctRow icon={I.dumbbell} label="Activity logging" right={healthOn ? <span className="pill good" style={{ fontSize: 11 }}>Synced</span> : null} onClick={() => setSub("activity")} />
        <AcctRow icon={I.link} label="Integrations" onClick={() => setSub("integrations")} />
        <AcctRow icon={I.gear} label="App settings" right={<span className="pill" style={{ background: "var(--well)", color: "var(--ink-soft)", fontSize: 11 }}>{theme === "dark" ? "Dark" : "Light"}</span>} onClick={() => setSub("settings")} />
      </div>
      <div style={{ textAlign: "center", color: "var(--muted)", fontWeight: 700, fontSize: 12.5, marginTop: 22 }}>Meow Track · v1.0 · made with 🐾</div>
    </>
  );
}
const SUB_TITLES = { pro: "Meow Track for Professional", personal: "Personal details", weight: "Adjust weight goal", nutrition: "Edit nutrition goals", activity: "Activity logging", integrations: "Integrations", settings: "App settings" };

function AcctRow({ icon, label, right, onClick }) {
  return (
    <button className="acct-row" onClick={onClick}>
      <span className="ai">{icon()}</span><span className="at">{label}</span>
      {right}<span className="chev">{I.chevR()}</span>
    </button>
  );
}

/* ---------- Personal details ---------- */
function PersonalDetails({ profile, setProfile, units, setUnits, showToast, done }) {
  const [f, setF] = useState({ ...profile });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  function save() { setProfile((p) => ({ ...p, ...f })); showToast("Profile updated"); done(); }
  return (
    <div className="stack">
      <div className="field"><label>Name</label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="field"><label>Sex</label><div className="seg">{["female", "male"].map((s) => <button key={s} className={f.sex === s ? "on" : ""} onClick={() => set("sex", s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div></div>
      <div className="form-grid">
        <div className="field"><label>Age</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={f.age} onChange={(e) => set("age", +e.target.value || 0)} /><span className="suffix">yrs</span></div></div>
        <div className="field"><label>Height</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={units === "imperial" ? Math.round(f.height / 2.54) : f.height} onChange={(e) => set("height", units === "imperial" ? +e.target.value * 2.54 : +e.target.value || 0)} /><span className="suffix">{units === "imperial" ? "in" : "cm"}</span></div></div>
      </div>
      <div className="field"><label>Current weight</label><div className="input-wrap"><input className="input suffix-pad" type="number" step="0.1" value={units === "imperial" ? round1(kgToLb(f.weight)) : f.weight} onChange={(e) => set("weight", units === "imperial" ? lbToKg(+e.target.value) : +e.target.value || 0)} /><span className="suffix">{wUnit(units)}</span></div></div>
      <div className="field"><label>Units</label><div className="seg">{["metric", "imperial"].map((u) => <button key={u} className={units === u ? "on" : ""} onClick={() => setUnits(u)}>{u === "metric" ? "Metric" : "Imperial"}</button>)}</div></div>
      <button className="btn btn-primary btn-block" onClick={save}>{I.check()} Save</button>
    </div>
  );
}

/* ---------- Adjust weight goal ---------- */
function AdjustWeightGoal({ profile, setProfile, goals, setGoals, units, showToast, done }) {
  const [gw, setGw] = useState(profile.goalWeight);
  const [pace, setPace] = useState(profile.pace || 0.5);
  const plan = computePlan({ ...profile, goalWeight: gw, pace });
  const target = addDays(TODAY, Math.round((Math.abs(profile.weight - gw) / (pace || 0.5)) * 7));
  const months = Math.max(1, Math.round((target - TODAY) / (DAY_MS * 30)));
  function save() {
    setProfile((p) => ({ ...p, goalWeight: gw, pace, targetDate: dkey(target) }));
    setGoals((g) => ({ ...g, calories: plan.calories, carbs: plan.carbs, protein: plan.protein, fat: plan.fat, bmr: plan.bmr, tdee: plan.tdee }));
    showToast("Weight goal updated"); done();
  }
  return (
    <div className="stack">
      <div className="card flat" style={{ padding: 18 }}>
        <div className="between" style={{ marginBottom: 8 }}>
          <div><div className="page-date">{plan.dir === "lose" ? "Lose to" : plan.dir === "gain" ? "Gain to" : "Maintain"}</div><div style={{ fontSize: 20, fontWeight: 800 }}>{dispWeight(gw, units)} {wUnit(units)}</div></div>
          <div style={{ textAlign: "right" }}><div className="page-date">Within</div><div style={{ fontSize: 20, fontWeight: 800 }}>{months} mo</div></div>
        </div>
        <WeightChart start={profile.weight} goal={gw} units={units} height={140} />
      </div>
      <div className="field"><label>Goal weight</label><div className="input-wrap"><input className="input suffix-pad" type="number" step="0.1" value={units === "imperial" ? round1(kgToLb(gw)) : gw} onChange={(e) => setGw(units === "imperial" ? lbToKg(+e.target.value) : +e.target.value || 0)} /><span className="suffix">{wUnit(units)}</span></div></div>
      <div className="field"><label>Weekly pace</label><div className="seg">{[{ v: 0.25, n: "Relaxed" }, { v: 0.5, n: "Steady" }, { v: 0.75, n: "Ambitious" }].map((o) => <button key={o.v} className={pace === o.v ? "on" : ""} onClick={() => setPace(o.v)}>{o.n}</button>)}</div></div>
      <div className="banner info">{I.info({ style: { color: "#2C7BB0" } })}New daily target: <b>&nbsp;{fmt(plan.calories)} kcal</b></div>
      <button className="btn btn-primary btn-block" onClick={save}>{I.check()} Update goal</button>
    </div>
  );
}

/* ---------- Edit nutrition goals ---------- */
function EditNutrition({ goals, setGoals, units, showToast, done }) {
  const [g, setG] = useState({ ...goals });
  const set = (k) => (e) => setG((s) => ({ ...s, [k]: +e.target.value || 0 }));
  const macroKcal = g.carbs * 4 + g.protein * 4 + g.fat * 9;
  function applySplit(c, p, fa) { setG((s) => ({ ...s, carbs: Math.round(s.calories * c / 100 / 4), protein: Math.round(s.calories * p / 100 / 4), fat: Math.round(s.calories * fa / 100 / 9) })); }
  function save() { setGoals(g); showToast("Nutrition goals saved"); done(); }
  return (
    <div className="stack">
      <div className="field"><label>Daily calories</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={g.calories} onChange={set("calories")} /><span className="suffix">kcal</span></div></div>
      <div className="field"><label>Quick macro split</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {[["Balanced", 30, 40, 30], ["High protein", 25, 45, 30], ["Low carb", 20, 40, 40], ["Endurance", 50, 25, 25]].map(([n, c, p, fa]) => <button key={n} className="btn btn-ghost btn-sm" onClick={() => applySplit(c, p, fa)}>{n}</button>)}
      </div></div>
      <div className="form-grid">
        <div className="field"><label><span className="dot" style={{ background: "var(--carbs)" }}></span>Carbs</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={g.carbs} onChange={set("carbs")} /><span className="suffix">g</span></div></div>
        <div className="field"><label><span className="dot" style={{ background: "var(--protein)" }}></span>Protein</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={g.protein} onChange={set("protein")} /><span className="suffix">g</span></div></div>
        <div className="field"><label><span className="dot" style={{ background: "var(--fat)" }}></span>Fat</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={g.fat} onChange={set("fat")} /><span className="suffix">g</span></div></div>
        <div className="field"><label>{I.drop({ width: 13, height: 13, style: { color: "var(--water)" } })}Water</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={g.water} onChange={set("water")} /><span className="suffix">ml</span></div></div>
      </div>
      {Math.abs(macroKcal - g.calories) > 60 && <div className="banner warn">{I.info()}Macros total {fmt(macroKcal)} kcal — {macroKcal > g.calories ? "above" : "below"} your goal.</div>}
      <div className="acct-group" style={{ margin: "4px 2px 0" }}>Health ceilings (used for AI analysis)</div>
      <div className="form-grid">
        <div className="field"><label>Sugar max</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={g.sugar} onChange={set("sugar")} /><span className="suffix">g</span></div></div>
        <div className="field"><label>Sodium max</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={g.sodium} onChange={set("sodium")} /><span className="suffix">mg</span></div></div>
        <div className="field"><label>Cholesterol max</label><div className="input-wrap"><input className="input suffix-pad" type="number" value={g.cholesterol} onChange={set("cholesterol")} /><span className="suffix">mg</span></div></div>
      </div>
      <button className="btn btn-primary btn-block" onClick={save}>{I.check()} Save goals</button>
    </div>
  );
}

/* ---------- App settings ---------- */
function AppSettings({ theme, setTheme, units, setUnits, showToast }) {
  const [notif, setNotif] = usePersisted("meow.notif", { meals: true, water: true, weekly: false });
  return (
    <div className="stack">
      <div className="field"><label>Appearance</label>
        <div className="seg">
          <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>{I.sun({ width: 16, height: 16 })} Light</button>
          <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>{I.moon({ width: 16, height: 16 })} Dark</button>
        </div>
      </div>
      <div className="field"><label>Units</label>
        <div className="seg">{["metric", "imperial"].map((u) => <button key={u} className={units === u ? "on" : ""} onClick={() => setUnits(u)}>{u === "metric" ? "Metric (kg/ml)" : "Imperial (lb/oz)"}</button>)}</div>
      </div>
      <div className="acct-group" style={{ margin: "4px 2px 0" }}>Notifications</div>
      <div className="acct-card">
        {[["meals", "Meal reminders", I.bell], ["water", "Water nudges", I.drop], ["weekly", "Weekly AI report", I.sparkle]].map(([k, label, ico]) => (
          <div key={k} className="acct-row" style={{ cursor: "default" }}>
            <span className="ai">{ico()}</span><span className="at" style={{ fontSize: 15.5 }}>{label}</span>
            <div className={"switch" + (notif[k] ? " on" : "")} onClick={() => setNotif((s) => ({ ...s, [k]: !s[k] }))}></div>
          </div>
        ))}
      </div>
      <button className="btn btn-line btn-block" onClick={() => { if (confirm("Reset all data and restart onboarding?")) { localStorage.clear(); localStorage.setItem("meow.seeded", "1"); location.reload(); } }} style={{ color: "var(--accent-d)", borderColor: "var(--accent-wash)" }}>{I.trash()} Reset all data</button>
    </div>
  );
}

Object.assign(window, { Account });
