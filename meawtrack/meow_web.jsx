/* meow_web.jsx — desktop / laptop website shell (reuses all leaf comps) */

function LaptopFrame({ children, profile }) {
  const ref = useRef();
  useEffect(() => {
    function fit() {
      const el = ref.current; if (!el) return;
      const s = Math.min((window.innerWidth - 40) / 1310, (window.innerHeight - 40) / 800, 1);
      el.style.transform = `translate(-50%, -50%) scale(${s})`;
    }
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="laptop-scaler" ref={ref}>
      <div className="laptop">
        <div className="laptop-screen">
          <div className="laptop-cam"></div>
          <div className="browser">
            <div className="browser-bar">
              <div className="lights"><i></i><i></i><i></i></div>
              <div className="b-tabs"><div className="b-tab"><span className="fav">🐱</span> Meow Track</div></div>
              <div className="b-address">{I.shield()} app.meowtrack.com</div>
              <div className="b-actions">{I.plus()}{I.history()}</div>
            </div>
            <div className="browser-body">{children}</div>
          </div>
        </div>
        <div className="laptop-base"></div>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, onAdd, onAskAI, profile, units, setUnits, theme, setTheme }) {
  const NAV = [
    { k: "dashboard", label: "Dashboard", icon: I.home },
    { k: "diary", label: "Diary", icon: I.diary },
    { k: "insight", label: "Insight", icon: I.insight },
    { k: "account", label: "Account", icon: I.account },
  ];
  return (
    <div className="web-side">
      <div className="web-brand">
        <div className="logo">🐱</div>
        <div><div className="bn">Meow Track</div><div className="bs">Eat smart, feel great</div></div>
      </div>
      <button className="btn btn-primary web-add" onClick={onAdd}>{I.plus()} Log food</button>
      <div className="web-nav">
        {NAV.map((n) => (
          <button key={n.k} className={tab === n.k ? "on" : ""} onClick={() => setTab(n.k)}>{n.icon()}<span>{n.label}</span></button>
        ))}
        <button onClick={onAskAI}>{I.sparkle()}<span>Ask Meow AI</span></button>
      </div>
      <div className="web-side-foot">
        <div className="web-toggles">
          <div className="seg">
            <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>{I.sun()}</button>
            <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>{I.moon()}</button>
          </div>
          <div className="seg">
            <button className={units === "metric" ? "on" : ""} onClick={() => setUnits("metric")}>kg</button>
            <button className={units === "imperial" ? "on" : ""} onClick={() => setUnits("imperial")}>lb</button>
          </div>
        </div>
        <div className="web-profile" onClick={() => setTab("account")}>
          <div className="av">🐱</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pn">{profile.name}</div>
            <div className="ps">{profile.appleHealth ? "Health connected" : "Free plan"}</div>
          </div>
          {I.chevR({ width: 16, height: 16, style: { color: "var(--muted)" } })}
        </div>
      </div>
    </div>
  );
}

function TopBar({ title, date, streak, onAskAI, children }) {
  return (
    <div className="web-topbar">
      <div>
        <div className="tt">{title}</div>
        {date && <div className="td">{date}</div>}
      </div>
      <div className="actions">
        {streak != null && <span className="streak-chip">🔥 {streak} day{streak === 1 ? "" : "s"}</span>}
        {children}
        <button className="go-prem" onClick={onAskAI}>{I.sparkle()} Ask Meow AI</button>
      </div>
    </div>
  );
}

Object.assign(window, { LaptopFrame, Sidebar, TopBar });
