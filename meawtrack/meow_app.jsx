/* app.jsx — root: frame, scaling, state, navigation */

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

function App() {
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

  /* one-time demo seed — never re-seeds after a reset (seeded sentinel) */
  useEffect(() => {
    if (seeded) return;
    if (!Object.keys(mealsByDay).length) setMealsByDay(SEED_MEALS);
    if (!Object.keys(waterByDay).length) setWaterByDay(SEED_WATER);
    if (!weightLog.length) setWeightLog(SEED_WEIGHT);
    setSeeded(true);
  }, []);

  const [tab, setTab] = useState("dashboard");
  const [diaryDay, setDiaryDay] = useState(dkey(TODAY));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState(null);
  const [pendingMeal, setPendingMeal] = useState(null); // meal-type for log-for
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState(null);
  const [toastNode, showToast] = useToast();
  const openChat = (seed) => { setChatSeed(seed || null); setChatOpen(true); };

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  const today = dkey(TODAY);
  const todayMeals = mealsByDay[today] || [];
  const todayTotals = sumMeals(todayMeals);
  const todayWater = waterByDay[today] || 0;
  const todayActivity = (activityByDay[today] || []).reduce((a, x) => a + (x.kcal || 0), 0)
    + syncedActivity(health).kcal; /* connected devices & apps */

  const diaryMeals = mealsByDay[diaryDay] || [];
  const diaryTotals = sumMeals(diaryMeals);

  /* recents for History (unique by name, latest first) */
  const recents = useMemo(() => {
    const all = Object.keys(mealsByDay).sort().reverse().flatMap((k) => mealsByDay[k]);
    const seen = new Set(); const out = [];
    for (const m of all) { if (!seen.has(m.name)) { seen.add(m.name); out.push(m); } if (out.length >= 12) break; }
    return out;
  }, [mealsByDay]);

  /* streak */
  const streak = useMemo(() => {
    const logged = Object.keys(mealsByDay).filter((k) => (mealsByDay[k] || []).length > 0).sort();
    let cur = 0; let d = new Date(TODAY);
    while (logged.includes(dkey(d))) { cur++; d = addDays(d, -1); }
    return { current: cur, longestMeal: Math.max(cur, logged.length ? 1 : 0), longestWeight: weightLog.length > 1 ? weightLog.length : 0, loggedDays: logged };
  }, [mealsByDay, weightLog]);

  function addMeal(m) {
    const dk = tab === "diary" ? diaryDay : today;
    setMealsByDay((s) => ({ ...s, [dk]: [...(s[dk] || []), m] }));
    closeSheet();
  }
  function deleteMeal(id, day) {
    const dk = day || diaryDay;
    setMealsByDay((s) => ({ ...s, [dk]: (s[dk] || []).filter((x) => x.id !== id) }));
  }
  function addActivity(a) { const dk = tab === "diary" ? diaryDay : today; setActivityByDay((s) => ({ ...s, [dk]: [...(s[dk] || []), a] })); closeSheet(); }
  function deleteActivity(id, day) { const dk = day || diaryDay; setActivityByDay((s) => ({ ...s, [dk]: (s[dk] || []).filter((x) => x.id !== id) })); }
  function addWeight(w) {
    setWeightLog((l) => [...l.filter((x) => x.date !== w.date), w].sort((a, b) => a.date.localeCompare(b.date)));
    setProfile((p) => ({ ...p, weight: w.kg }));
    closeSheet();
  }

  function openSheet(mode = null) { if (mode === null) setPendingMeal(null); setSheetMode(mode); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); setTimeout(() => { setSheetMode(null); setPendingMeal(null); }, 280); }

  function go(dest) {
    if (dest === "insight") setTab("insight");
    else if (dest === "weight") openSheet("weight");
    else if (dest === "addsheet-ai") openSheet("ai");
    else if (dest === "diary") setTab("diary");
  }
  function logFor(mealType) { setPendingMeal(mealType); openSheet("database"); }

  /* scaling */
  const scalerRef = useRef();
  useEffect(() => {
    function fit() {
      const el = scalerRef.current; if (!el) return;
      const m = 24;
      const s = Math.min((window.innerWidth - m) / 393, (window.innerHeight - m) / 852);
      el.style.transform = `translate(-50%, -50%) scale(${Math.min(s, 1.15)})`;
    }
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, []);

  if (!onboarded) {
    return (
      <div className="phone-scaler" ref={scalerRef}>
        <div className="phone"><Onboarding units={units} setUnits={setUnits}
          onDone={(p, g) => { setProfile(p); setGoals(g); setOnboarded(true); setTab("dashboard"); }} /></div>
      </div>
    );
  }

  const TABS = [
    { k: "dashboard", label: "Dashboard", icon: I.home },
    { k: "diary", label: "Diary", icon: I.diary },
    { k: "insight", label: "Insight", icon: I.insight },
    { k: "account", label: "Account", icon: I.account },
  ];
  const ink = "var(--ink)";

  return (
    <div className="phone-scaler" ref={scalerRef}>
      <div className="phone">
        <div className="screen">
          <div className="island"></div>
          <div className="statusbar"><span className="time">9:41</span><StatusIcons ink={ink} /></div>

          <div className="view" key={tab}>
            {tab === "dashboard" && <Dashboard profile={profile} goals={goals} meals={todayMeals} totals={todayTotals}
              water={todayWater} setWater={(n) => setWaterByDay((s) => ({ ...s, [today]: n }))}
              activity={todayActivity} weightLog={weightLog} streak={streak} units={units}
              foodIdea={DEFAULT_IDEA} onOpenAdd={() => openSheet()} go={go} showToast={showToast} onOpenChat={openChat} />}
            {tab === "diary" && <Diary day={diaryDay} setDay={setDiaryDay} meals={diaryMeals} goals={goals}
              totals={diaryTotals} onDelete={(id) => deleteMeal(id, diaryDay)} onLogFor={logFor} units={units} markedDays={new Set(streak.loggedDays)}
              activities={activityByDay[diaryDay] || []} onLogActivity={() => openSheet("activity")} onDeleteActivity={(id) => deleteActivity(id, diaryDay)} />}
            {tab === "insight" && <Insight mealsByDay={mealsByDay} goals={goals} profile={profile} weightLog={weightLog}
              waterByDay={waterByDay} activityByDay={activityByDay} units={units} health={health} />}
            {tab === "account" && <Account profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals}
              units={units} setUnits={setUnits} theme={theme} setTheme={setTheme} showToast={showToast} onOpenChat={openChat} health={health} setHealth={setHealth} />}
          </div>

          {/* tab bar */}
          <div className="tabbar">
            {TABS.slice(0, 2).map((t) => (
              <button key={t.k} className={"tabbtn" + (tab === t.k ? " on" : "")} onClick={() => setTab(t.k)}>{t.icon()}<span>{t.label}</span></button>
            ))}
            <div className="fab-slot"><button className={"fab" + (sheetOpen ? " open" : "")} onClick={() => sheetOpen ? closeSheet() : openSheet()}>{I.plus()}</button></div>
            {TABS.slice(2).map((t) => (
              <button key={t.k} className={"tabbtn" + (tab === t.k ? " on" : "")} onClick={() => setTab(t.k)}>{t.icon()}<span>{t.label}</span></button>
            ))}
          </div>

          <AddSheet open={sheetOpen} mode={sheetMode} setMode={setSheetMode} onClose={closeSheet}
            onAddMeal={addMeal} onAddActivity={addActivity} onAddWeight={addWeight}
            units={units} profile={profile} weightLog={weightLog} recents={recents} showToast={showToast} defaultMeal={pendingMeal} />

          <MeowChat open={chatOpen} onClose={() => setChatOpen(false)} seed={chatSeed} profile={profile} goals={goals} />

          {toastNode}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("stage")).render(<App />);
