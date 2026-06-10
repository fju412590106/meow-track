/* meow_web_app.jsx — InsightWeb, AddModalWeb, DesktopApp (root + mount) */

const SEED_MEALS = {
  [dkey(TODAY)]: [
    { id: 1, name: "Milk tea 0 sugar with black jelly", emoji: "🧋", serving: "1 serving", meal: "Breakfast", cal: 146, carbs: 24, protein: 4, fat: 4, sugar: 6, sodium: 60, chol: 5 },
    { id: 2, name: "Tuna & soft boiled egg with mashed potato", emoji: "🥗", serving: "1 serving", meal: "Lunch", cal: 444, carbs: 46.8, protein: 31.87, fat: 11.97, sugar: 4, sodium: 620, chol: 210 },
    { id: 3, name: "Protein Milk Tea", emoji: "🥤", serving: "350 ml", meal: "Lunch", cal: 175, carbs: 17.5, protein: 22, fat: 3.5, sugar: 9, sodium: 130, chol: 8 },
    { id: 4, name: "Chicken Rice Bowl", emoji: "🍗", serving: "1 bowl", meal: "Dinner", cal: 509, carbs: 47.7, protein: 49, fat: 11.5, sugar: 5, sodium: 720, chol: 95 },
  ],
};
const SEED_WATER = { [dkey(TODAY)]: 750 };
const SEED_WEIGHT = [{ date: dkey(TODAY), kg: 68 }];
const DEFAULT_IDEA = { name: "Grilled Chicken Breast with Brown Rice", emoji: "🍗", cal: 226, serving: "1 Serving", carbs: 34.5, protein: 37.65, fat: 4.2 };

/* ---------------- Insight ---------------- */
function InsightWeb({ mealsByDay, goals, profile, weightLog, waterByDay, activityByDay, units, health }) {
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
      <div className="between" style={{ marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <PeriodTabs value={period} onChange={setPeriod} />
        <span className="period-range" style={{ margin: 0 }}>{P.rangeLabel}</span>
      </div>
      <div className="web-2">
        <div className="card pop span2">
          <div className="card-h"><h3>Calories intake</h3><div className="legend">{MACROS.map((m) => <span className="lg" key={m.key}><span className="sw" style={{ background: m.color }}></span>{m.label}</span>)}</div></div>
          <div className="row" style={{ gap: 8, alignItems: "baseline", marginBottom: 10 }}><span style={{ fontSize: 34, fontWeight: 800 }}>{fmt(avgCal)}</span><span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-soft)" }}>daily avg kcal · {P.loggedDays} day{P.loggedDays === 1 ? "" : "s"} logged · goal {fmt(goals.calories)}</span></div>
          {P.loggedDays ? <StackedBars labels={P.labels} intake={P.intake} goal={goals.calories} />
            : <div className="empty"><div className="e-emoji">🍽️</div><p>No meals logged in this period yet.</p></div>}
        </div>

        <div className="card pop pop-2">
          <div className="card-h"><h3>Calories burned</h3></div>
          {hasBurned ? <SimpleBars labels={P.labels} values={P.burned.map(round)} color="var(--teal)" /> : <div className="empty"><div className="e-emoji">💪</div><p>Log an activity or connect Apple Health.</p></div>}
        </div>

        <div className="card pop pop-2">
          <div className="card-h"><h3>Water intake</h3></div>
          {hasWater ? <SimpleBars labels={P.labels} values={P.water.map((w) => dispVol(w, units))} color="var(--water)" goal={dispVol(goals.water || 2000, units)} /> : <div className="empty"><div className="e-emoji">💧</div><p>Track water on the dashboard.</p></div>}
        </div>

        <div className="card pop pop-3">
          <div className="card-h"><h3>Weight</h3></div>
          <div className="row" style={{ gap: 10, alignItems: "baseline" }}><span style={{ fontSize: 36, fontWeight: 800 }}>{dispWeight(curWeight, units)}<span style={{ fontSize: 16, color: "var(--ink-soft)" }}> {wUnit(units)}</span></span><span className="pill hot">{round(progress)}% of goal</span></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", margin: "5px 0 12px" }}>Goal {dispWeight(profile.goalWeight, units)} {wUnit(units)} · {shortDate(parseKey(profile.targetDate))}</div>
          <FlatWeightChart weightLog={weightLog} profile={profile} units={units} />
        </div>

        <div className="card pop pop-3">
          <div className="card-h"><h3>BMI</h3></div>
          <div className="row" style={{ gap: 12, alignItems: "center", marginBottom: 16 }}><span style={{ fontSize: 36, fontWeight: 800 }}>{bmi.toFixed(1)}</span><span className="pill warn" style={{ fontSize: 14, padding: "7px 14px" }}>{cat}</span></div>
          <BmiGauge bmi={bmi} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 16 }}>{bmi < 18.5 ? "You're a little under — steady fuelling helps." : bmi < 23 ? "Healthy range. Keep up the consistency!" : "Gradual loss is recommended for your range."}</p>
        </div>

        <div className="span2"><WeeklyRoundup totals={P.sums} loggedDays={P.loggedDays} periodLabel={periodLabel} /></div>
      </div>
    </>
  );
}

/* ---------------- Add modal ---------------- */
const WEB_MODE_TITLES = { menu: "Add to your day", scan: "Scan Meal", barcode: "Barcode Scan", database: "Food Database", quick: "Quick Add", ai: "AI Search", activity: "Log Activity", weight: "Log Weight", history: "Recent Foods" };
function AddModalWeb({ open, mode, setMode, onClose, onAddMeal, onAddActivity, onAddWeight, units, profile, recents, showToast, defaultMeal }) {
  return (
    <div className={"web-modal-scrim" + (open ? " show" : "")} onClick={onClose}>
      <div className="web-modal" onClick={(e) => e.stopPropagation()}>
        <div className="web-modal-h">
          {mode && mode !== "menu" ? <button className="iconbtn" onClick={() => setMode("menu")}>{I.back()}</button> : <span style={{ width: 40 }}></span>}
          <h3>{WEB_MODE_TITLES[mode] || "Add"}</h3>
          <button className="iconbtn" onClick={onClose}>{I.x()}</button>
        </div>
        <div className="web-modal-body">
          {(!mode || mode === "menu") && (
            <div className="pop">
              <div className="qa-grid">
                <button className="qa" onClick={() => setMode("scan")}><span className="ico">{I.camera()}</span><span>Scan Meal</span></button>
                <button className="qa" onClick={() => setMode("barcode")}><span className="ico">{I.barcode()}</span><span>Barcode</span></button>
                <button className="qa" onClick={() => setMode("database")}><span className="ico">{I.search()}</span><span>Database</span></button>
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
          {mode === "scan" && <ScanMeal onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
          {mode === "barcode" && <BarcodeScan onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
          {mode === "database" && <FoodDatabase onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
          {mode === "quick" && <QuickAdd onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
          {mode === "ai" && <AISearch onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
          {mode === "activity" && <ActivityLog profile={profile} onConfirm={onAddActivity} showToast={showToast} />}
          {mode === "weight" && <WeightLog profile={profile} units={units} onConfirm={onAddWeight} showToast={showToast} />}
          {mode === "history" && <HistoryList recents={recents} onConfirm={onAddMeal} showToast={showToast} defaultMeal={defaultMeal} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Root ---------------- */
function DesktopApp() {
  const [theme, setTheme] = usePersisted("meow.theme", "light");
  const [units, setUnits] = usePersisted("meow.units", "metric");
  const [onboarded, setOnboarded] = usePersisted("meow.onboarded", false);
  const [profile, setProfile] = usePersisted("meow.profile", DEFAULT_PROFILE);
  const [goals, setGoals] = usePersisted("meow.goals", DEFAULT_GOALS);
  const [mealsByDay, setMealsByDay] = usePersisted("meow.meals", {});
  const [waterByDay, setWaterByDay] = usePersisted("meow.water", {});
  const [activityByDay, setActivityByDay] = usePersisted("meow.activity", {});
  const [weightLog, setWeightLog] = usePersisted("meow.weightlog", []);
  const [health, setHealth] = usePersisted("meow.health", {});
  const [seeded, setSeeded] = usePersisted("meow.seeded", false);

  useEffect(() => {
    if (seeded) return;
    if (!Object.keys(mealsByDay).length) setMealsByDay(SEED_MEALS);
    if (!Object.keys(waterByDay).length) setWaterByDay(SEED_WATER);
    if (!weightLog.length) setWeightLog(SEED_WEIGHT);
    setSeeded(true);
  }, []);

  const [tab, setTab] = useState("dashboard");
  const [diaryDay, setDiaryDay] = useState(dkey(TODAY));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("menu");
  const [pendingMeal, setPendingMeal] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState(null);
  const [toastNode, showToast] = useToast();
  const openChat = (seed) => { setChatSeed(typeof seed === "string" ? seed : null); setChatOpen(true); };

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); document.body.classList.add("web"); }, [theme]);

  const today = dkey(TODAY);
  const todayMeals = mealsByDay[today] || [];
  const todayTotals = sumMeals(todayMeals);
  const todayWater = waterByDay[today] || 0;
  const todayActivity = (activityByDay[today] || []).reduce((a, x) => a + (x.kcal || 0), 0) + syncedActivity(health).kcal;
  const diaryMeals = mealsByDay[diaryDay] || [];
  const diaryTotals = sumMeals(diaryMeals);

  const recents = useMemo(() => {
    const all = Object.keys(mealsByDay).sort().reverse().flatMap((k) => mealsByDay[k]);
    const seen = new Set(); const out = [];
    for (const m of all) { if (!seen.has(m.name)) { seen.add(m.name); out.push(m); } if (out.length >= 12) break; }
    return out;
  }, [mealsByDay]);

  const streak = useMemo(() => {
    const logged = Object.keys(mealsByDay).filter((k) => (mealsByDay[k] || []).length > 0).sort();
    let cur = 0; let d = new Date(TODAY);
    while (logged.includes(dkey(d))) { cur++; d = addDays(d, -1); }
    return { current: cur, longestMeal: Math.max(cur, logged.length ? 1 : 0), longestWeight: weightLog.length > 1 ? weightLog.length : 0, loggedDays: logged };
  }, [mealsByDay, weightLog]);

  function openModal(mode = "menu") { if (mode === "menu") setPendingMeal(null); setModalMode(mode); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setTimeout(() => { setModalMode("menu"); setPendingMeal(null); }, 240); }
  function addMeal(m) { const dk = tab === "diary" ? diaryDay : today; setMealsByDay((s) => ({ ...s, [dk]: [...(s[dk] || []), m] })); closeModal(); }
  function deleteMeal(id, day) { const dk = day || diaryDay; setMealsByDay((s) => ({ ...s, [dk]: (s[dk] || []).filter((x) => x.id !== id) })); }
  function addActivity(a) { const dk = tab === "diary" ? diaryDay : today; setActivityByDay((s) => ({ ...s, [dk]: [...(s[dk] || []), a] })); closeModal(); }
  function deleteActivity(id, day) { const dk = day || diaryDay; setActivityByDay((s) => ({ ...s, [dk]: (s[dk] || []).filter((x) => x.id !== id) })); }
  function addWeight(w) { setWeightLog((l) => [...l.filter((x) => x.date !== w.date), w].sort((a, b) => a.date.localeCompare(b.date))); setProfile((p) => ({ ...p, weight: w.kg })); closeModal(); }
  function go(dest) { if (dest === "weight") openModal("weight"); else if (dest === "ai") openModal("ai"); }
  function logFor(mealType) { setPendingMeal(mealType); setModalMode("database"); setModalOpen(true); }

  if (!onboarded) {
    return (
      <LaptopFrame profile={profile}>
        <div className="ob-web-wrap">
          <div className="ob-web">
            <Onboarding bare units={units} setUnits={setUnits} onDone={(p, g) => { setProfile(p); setGoals(g); setOnboarded(true); }} />
          </div>
        </div>
      </LaptopFrame>
    );
  }

  const TITLES = { dashboard: "Dashboard", diary: "Diary", insight: "Insight", account: "Account" };
  return (
    <LaptopFrame profile={profile}>
      <div className="web-app">
        <Sidebar tab={tab} setTab={setTab} onAdd={() => openModal("menu")} onAskAI={() => openChat()} profile={profile} units={units} setUnits={setUnits} theme={theme} setTheme={setTheme} />
        <div className="web-main">
          <div className="web-page">
            {tab !== "account" && (
              <TopBar title={TITLES[tab]} date={tab === "dashboard" ? prettyDate(TODAY) : tab === "diary" ? shortDate(parseKey(diaryDay)) : "Your weekly trends"}
                streak={tab === "dashboard" ? streak.current : null} onAskAI={() => openChat()} />
            )}
            {tab === "dashboard" && <DashboardWeb profile={profile} goals={goals} totals={todayTotals} water={todayWater} setWater={(n) => setWaterByDay((s) => ({ ...s, [today]: n }))} activity={todayActivity} weightLog={weightLog} streak={streak} units={units} foodIdea={DEFAULT_IDEA} go={go} />}
            {tab === "diary" && <DiaryWeb day={diaryDay} setDay={setDiaryDay} meals={diaryMeals} goals={goals} totals={diaryTotals} onDelete={(id) => deleteMeal(id, diaryDay)} onLogFor={logFor} units={units} markedDays={new Set(streak.loggedDays)} activities={activityByDay[diaryDay] || []} onLogActivity={() => openModal("activity")} onDeleteActivity={(id) => deleteActivity(id, diaryDay)} />}
            {tab === "insight" && <InsightWeb mealsByDay={mealsByDay} goals={goals} profile={profile} weightLog={weightLog} waterByDay={waterByDay} activityByDay={activityByDay} units={units} health={health} />}
            {tab === "account" && (
              <div style={{ maxWidth: 640, margin: "0 auto" }}>
                <Account profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals} units={units} setUnits={setUnits} theme={theme} setTheme={setTheme} showToast={showToast} onOpenChat={openChat} health={health} setHealth={setHealth} />
              </div>
            )}
          </div>
        </div>
        <AddModalWeb open={modalOpen} mode={modalMode} setMode={setModalMode} onClose={closeModal} onAddMeal={addMeal} onAddActivity={addActivity} onAddWeight={addWeight} units={units} profile={profile} recents={recents} showToast={showToast} defaultMeal={pendingMeal} />
        <MeowChat open={chatOpen} onClose={() => setChatOpen(false)} seed={chatSeed} profile={profile} goals={goals} />
        {toastNode}
      </div>
    </LaptopFrame>
  );
}

ReactDOM.createRoot(document.getElementById("stage")).render(<DesktopApp />);
