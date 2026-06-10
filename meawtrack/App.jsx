/* App.jsx — root: tab nav + per-day state, mounts to #root */

function App() {
  const [tab, setTab] = useState("dash");
  const [goals, setGoals] = usePersisted("mt.goals", DEFAULT_GOALS);
  const [mealsByDay, setMealsByDay] = usePersisted("mt.meals", {});
  const [waterByDay, setWaterByDay] = usePersisted("mt.water", {});
  const [toastNode, showToast] = useToast();

  const day = todayKey();
  const meals = mealsByDay[day] || [];
  const water = waterByDay[day] || 0;

  const addMeal = (m) => {
    setMealsByDay((s) => ({ ...s, [day]: [...(s[day] || []), m] }));
    setTab("dash");
  };
  const deleteMeal = (id) =>
    setMealsByDay((s) => ({ ...s, [day]: (s[day] || []).filter((x) => x.id !== id) }));
  const setWater = (n) => setWaterByDay((s) => ({ ...s, [day]: n }));

  const TABS = [
    { k: "dash",  label: "Dashboard", icon: Icon.grid },
    { k: "add",   label: "Add Meal",  icon: Icon.plus },
    { k: "goals", label: "Goals",     icon: Icon.target },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">{Icon.flame()}</div>
          <div>
            <h1>MacroTrack</h1>
            <div className="sub">Calorie &amp; macro tracker</div>
          </div>
        </div>
        <div className="datechip">{Icon.cal()} {prettyDate()}</div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.k} className={"tab" + (tab === t.k ? " active" : "")} onClick={() => setTab(t.k)}>
            {t.icon()} <span className="lab">{t.label}</span>
          </button>
        ))}
      </nav>

      <main key={tab}>
        {tab === "dash" && (
          <Dashboard goals={goals} meals={meals} onDelete={deleteMeal}
            water={water} setWater={setWater} goToAdd={() => setTab("add")} />
        )}
        {tab === "add" && <AddMeal onAdd={addMeal} showToast={showToast} />}
        {tab === "goals" && <Goals goals={goals} setGoals={setGoals} showToast={showToast} />}
      </main>

      {toastNode}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
