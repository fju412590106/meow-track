/* meow_health.jsx — device & app sync (Apple Health, Apple Watch, Google Fit, Strava, Samsung Health) */

/* Brand tiles + the live activity each source reports for "today" (the prototype's fixed day). */
const HEALTH_PROVIDERS = [
  {
    k: "apple", name: "Apple Health", platform: "iPhone", bg: "#000000", fg: "#FFFFFF",
    glyph: (s) => I.apple({ width: s || 24, height: s || 24 }),
    sub: "Steps, workouts, heart rate & energy",
    scopes: ["Steps & distance", "Workouts", "Active energy", "Heart rate", "Sleep"],
    kcal: 412, steps: 8432,
    metrics: [{ e: "👟", k: "Steps", v: "8,432" }, { e: "🔥", k: "Active energy", v: "412 kcal" }, { e: "⏱️", k: "Exercise", v: "38 min" }, { e: "❤️", k: "Resting HR", v: "62 bpm" }],
    real: false, note: "Apple Health is on-device only — real sync needs the Meow Track iOS app with HealthKit.",
  },
  {
    k: "watch", name: "Apple Watch", platform: "watchOS", bg: "#1d1d1f", fg: "#FFFFFF",
    glyph: (s) => I.watch({ width: s || 24, height: s || 24 }),
    sub: "Live activity rings & heart rate",
    scopes: ["Activity rings", "Workouts", "Heart rate", "Stand hours"],
    kcal: 540, steps: 9120,
    metrics: [{ e: "🔥", k: "Move", v: "540 / 600 kcal" }, { e: "🟢", k: "Exercise", v: "42 / 30 min" }, { e: "🧍", k: "Stand", v: "11 / 12 h" }, { e: "❤️", k: "Avg HR", v: "78 bpm" }],
    real: false, note: "Apple Watch syncs through Apple Health on iOS — available in the native app.",
  },
  {
    k: "googlefit", name: "Google Fit", platform: "Android / Web", bg: "#FFFFFF", fg: "#4285F4", bordered: true,
    glyph: (s) => I.google({ width: s ? s - 2 : 22, height: s ? s - 2 : 22 }),
    sub: "Activity, heart points & weight",
    scopes: ["Activity & steps", "Heart Points", "Workouts", "Weight"],
    kcal: 365, steps: 7180,
    metrics: [{ e: "👟", k: "Steps", v: "7,180" }, { e: "💙", k: "Heart Points", v: "42" }, { e: "🔥", k: "Calories", v: "365 kcal" }, { e: "⏱️", k: "Move min", v: "51 min" }],
    real: true, oauth: "https://accounts.google.com/o/oauth2/v2/auth", note: "Google Fit uses OAuth — a live connection requires server-side token exchange.",
  },
  {
    k: "strava", name: "Strava", platform: "iOS / Android / Web", bg: "#FC4C02", fg: "#FFFFFF",
    glyph: (s) => I.bolt({ width: s || 22, height: s || 22 }),
    sub: "Runs, rides & workouts",
    scopes: ["Activities", "Workouts", "Distance & pace"],
    kcal: 612, steps: 0,
    metrics: [{ e: "🏃", k: "Morning Run", v: "6.2 km" }, { e: "⏱️", k: "Moving time", v: "34 min" }, { e: "🔥", k: "Calories", v: "612 kcal" }, { e: "⚡", k: "Pace", v: "5:29 /km" }],
    real: true, oauth: "https://www.strava.com/oauth/authorize", note: "Strava uses OAuth 2.0 — a live connection requires server-side token exchange.",
  },
  {
    k: "samsung", name: "Samsung Health", platform: "Galaxy", bg: "#1428A0", fg: "#FFFFFF",
    glyph: (s) => I.heart({ width: s || 22, height: s || 22 }),
    sub: "Steps, exercise, sleep & heart rate",
    scopes: ["Steps", "Exercise", "Heart rate", "Sleep"],
    kcal: 430, steps: 9260,
    metrics: [{ e: "👟", k: "Steps", v: "9,260" }, { e: "🔥", k: "Active", v: "430 kcal" }, { e: "⏱️", k: "Active time", v: "47 min" }, { e: "😴", k: "Sleep", v: "7h 12m" }],
    real: false, note: "Samsung Health is Android-native — real sync needs the Meow Track Android app via Health Connect.",
  },
];
const PROV = Object.fromEntries(HEALTH_PROVIDERS.map((p) => [p.k, p]));

/* Aggregate today's synced activity. Uses the strongest single source for the
   calorie budget so connecting several devices doesn't double-count. */
function syncedActivity(health) {
  const on = HEALTH_PROVIDERS.filter((p) => health && health[p.k]);
  const kcal = on.length ? Math.max(...on.map((p) => p.kcal)) : 0;
  const steps = on.length ? Math.max(...on.map((p) => p.steps || 0)) : 0;
  return { kcal, steps, items: on };
}
const anyConnected = (health) => HEALTH_PROVIDERS.some((p) => health && health[p.k]);

function agoLabel(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + " min ago";
  const h = Math.floor(m / 60); if (h < 24) return h + " h ago";
  return Math.floor(h / 24) + " d ago";
}

function ProvTile({ p, size = 46 }) {
  return (
    <div className="prov-tile" style={{ width: size, height: size, background: p.bg, color: p.fg, border: p.bordered ? "1px solid var(--line-2)" : "none" }}>
      {p.glyph(Math.round(size * 0.5))}
    </div>
  );
}

/* ---------- Connect (OAuth-style permission) flow ---------- */
function ConnectFlow({ provider, onAllow, onCancel }) {
  const p = provider;
  const [phase, setPhase] = useState("ask"); // ask | auth
  function allow() {
    setPhase("auth");
    setTimeout(() => onAllow(), 1500);
  }
  return (
    <div className="connect-screen pop">
      <div className="connect-card">
        <div className="connect-brand">
          <ProvTile p={p} size={64} />
          <div className="connect-link">{I.link({ width: 16, height: 16 })}</div>
          <div className="prov-tile" style={{ width: 64, height: 64, background: "linear-gradient(135deg,var(--accent),var(--yellow))", color: "#fff", fontSize: 30 }}>🐱</div>
        </div>
        {phase === "ask" ? (
          <>
            <h3 style={{ textAlign: "center", fontSize: 20, marginTop: 4 }}>Connect {p.name}</h3>
            <p style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--ink-soft)", margin: "8px 0 18px", lineHeight: 1.5 }}>“{p.name}” will share this data with Meow&nbsp;Track:</p>
            <div className="scope-list">
              {p.scopes.map((s) => (
                <div className="scope-row" key={s}><span className="scope-check">{I.check({ width: 13, height: 13 })}</span>{s}</div>
              ))}
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={allow}>{I.shield({ width: 18, height: 18 })} Allow access</button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={onCancel}>Cancel</button>
            <div className="connect-note">{I.info({ width: 14, height: 14 })}<span>{p.note}</span></div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "30px 0 14px" }}>
            <div className="spin" style={{ width: 34, height: 34, margin: "0 auto 16px" }}></div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Connecting to {p.name}…</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginTop: 6 }}>Authorising &amp; pulling your latest activity</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Integrations hub ---------- */
function Integrations({ health, setHealth, showToast }) {
  const [connecting, setConnecting] = useState(null);

  function disconnect(k) { setHealth((h) => { const n = { ...h }; delete n[k]; return n; }); showToast(PROV[k].name + " disconnected"); }
  function onAllow(k) { setHealth((h) => ({ ...h, [k]: Date.now() })); setConnecting(null); showToast(PROV[k].name + " connected ✓"); }

  if (connecting) return <ConnectFlow provider={PROV[connecting]} onAllow={() => onAllow(connecting)} onCancel={() => setConnecting(null)} />;

  return (
    <div className="stack">
      <div className="banner info">{I.link({ style: { color: "#2C7BB0" } })}Connect a device or app to sync activity automatically. Calories burned flow into your daily budget.</div>
      <div className="acct-card">
        {HEALTH_PROVIDERS.map((p) => {
          const on = !!health[p.k];
          return (
            <div key={p.k} className="acct-row" style={{ cursor: "default", alignItems: "center" }}>
              <ProvTile p={p} size={40} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5, display: "flex", alignItems: "center", gap: 7 }}>{p.name}{on && <span className="pill good" style={{ fontSize: 10, padding: "2px 8px" }}>Synced {agoLabel(health[p.k])}</span>}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", marginTop: 1 }}>{on ? p.sub : p.platform}</div>
              </span>
              {on
                ? <button className="btn btn-sm btn-ghost" onClick={() => disconnect(p.k)}>Disconnect</button>
                : <button className="btn btn-sm btn-primary" onClick={() => setConnecting(p.k)}>Connect</button>}
            </div>
          );
        })}
      </div>
      <div className="banner warn">{I.info()}<span><b>Real-world sync:</b> Apple Health, Apple Watch &amp; Samsung Health are device-native and connect through the Meow Track mobile app; Google Fit &amp; Strava connect over OAuth. This preview shows a live demo of the synced data.</span></div>
      <div className="banner info">{I.shield({ style: { color: "#2C7BB0" } })}Meow Track only reads the data you allow and never shares it.</div>
    </div>
  );
}

/* ---------- Activity logging (live synced view + manual) ---------- */
function ActivityLogging({ health, setHealth, showToast }) {
  const [syncing, setSyncing] = useState(false);
  const synced = syncedActivity(health);
  const connected = synced.items;

  function syncNow() {
    if (!connected.length) return;
    setSyncing(true);
    setTimeout(() => {
      setHealth((h) => { const n = { ...h }; connected.forEach((p) => { n[p.k] = Date.now(); }); return n; });
      setSyncing(false); showToast("Synced just now ✓");
    }, 1200);
  }

  return (
    <div className="stack">
      {connected.length > 0 ? (
        <>
          <div className="card flat" style={{ padding: 18 }}>
            <div className="between" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 17 }}>Today’s activity</h3>
              <button className="btn btn-sm btn-ghost" onClick={syncNow} disabled={syncing}>{syncing ? <><span className="spin" style={{ width: 14, height: 14 }}></span> Syncing</> : <>{I.history({ width: 15, height: 15 })} Sync now</>}</button>
            </div>
            <div className="act-stats">
              <div className="act-stat"><div className="as-v" style={{ color: "var(--accent)" }}>{synced.kcal}</div><div className="as-k">kcal burned</div></div>
              <div className="act-stat"><div className="as-v" style={{ color: "var(--teal)" }}>{synced.steps.toLocaleString()}</div><div className="as-k">steps</div></div>
              <div className="act-stat"><div className="as-v" style={{ color: "var(--protein)" }}>{connected.length}</div><div className="as-k">source{connected.length === 1 ? "" : "s"}</div></div>
            </div>
            <div className="banner good" style={{ marginTop: 14 }}>{I.check()}Calories burned are added to your daily budget automatically.</div>
          </div>

          {connected.map((p) => (
            <div key={p.k} className="card flat" style={{ padding: 16 }}>
              <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                <ProvTile p={p} size={38} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--carbs)" }}>Synced {agoLabel(health[p.k])}</div></div>
              </div>
              <div className="metric-grid">
                {p.metrics.map((m, i) => (
                  <div className="metric" key={i}><span className="me">{m.e}</span><div><div className="mk">{m.k}</div><div className="mv">{m.v}</div></div></div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="card flat" style={{ padding: 22, textAlign: "center" }}>
          <div style={{ fontSize: 38 }}>⌚</div>
          <h3 style={{ fontSize: 17, marginTop: 8 }}>No source connected</h3>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", margin: "8px 0 16px", lineHeight: 1.5 }}>Connect Apple Health, Apple Watch, Google Fit, Strava or Samsung Health to auto-sync your activity.</p>
        </div>
      )}

      <div className="acct-group" style={{ margin: "4px 2px 0" }}>Connect a source</div>
      <Integrations health={health} setHealth={setHealth} showToast={showToast} />

      <div className="acct-group" style={{ margin: "10px 2px 0" }}>Manual logging</div>
      <div className="banner info">{I.info({ style: { color: "#2C7BB0" } })}<span>Use <b>&nbsp;+ → Activity&nbsp;</b> to log a workout by hand anytime — it adds to the same daily budget.</span></div>
    </div>
  );
}

Object.assign(window, { HEALTH_PROVIDERS, PROV, syncedActivity, anyConnected, agoLabel, ProvTile, ConnectFlow, Integrations, ActivityLogging });
