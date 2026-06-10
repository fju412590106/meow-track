/* meow_pro.jsx — Meow Track for Professional (coach marketplace) + Meow AI chatbot */

/* ============================================================
   Professionals data
   ============================================================ */
const DIETITIANS = [
  { id: "d1", name: "Dr. Maya Chen", emoji: "👩🏻‍⚕️", bg: "var(--carbs-wash)", title: "Registered Dietitian · RD", exp: 9, rating: 4.9, reviews: 320, price: "$45", tags: ["Weight loss", "Metabolic health", "PCOS"], goals: ["lose", "maintain"], blurb: "Evidence-based meal plans for sustainable fat loss." },
  { id: "d2", name: "Liam Foster", emoji: "👨🏼‍⚕️", bg: "var(--protein-wash)", title: "Sports Dietitian · RDN", exp: 7, rating: 4.8, reviews: 214, price: "$40", tags: ["Muscle gain", "Performance", "High protein"], goals: ["gain", "maintain"], blurb: "Fuels training and lean-mass goals with smart macros." },
  { id: "d3", name: "Aisha Rahman", emoji: "👩🏽‍⚕️", bg: "var(--yellow-wash)", title: "Registered Dietitian · RD", exp: 6, rating: 4.9, reviews: 188, price: "$38", tags: ["Plant-based", "Gut health", "Diabetes"], goals: ["lose", "maintain", "gain"], blurb: "Gentle, whole-food nutrition that's easy to stick to." },
];
const HEALTH_COACHES = [
  { id: "h1", name: "Sofia Martinez", emoji: "🧑🏻‍🏫", bg: "var(--accent-wash)", title: "Certified Health Coach", exp: 5, rating: 4.9, reviews: 256, price: "$30", tags: ["Habit building", "Mindful eating"], goals: ["lose", "maintain"], blurb: "Helps you reach your perfect health weight, one habit at a time." },
  { id: "h2", name: "James Park", emoji: "🧑🏼‍🏫", bg: "var(--water-wash)", title: "Health & Wellness Coach · NBC-HWC", exp: 8, rating: 4.8, reviews: 174, price: "$35", tags: ["Accountability", "Stress", "Sleep"], goals: ["lose", "maintain", "gain"], blurb: "Weekly check-ins that keep your goal on track." },
  { id: "h3", name: "Nora Bright", emoji: "👩🏼‍🏫", bg: "var(--carbs-wash)", title: "Metabolic Health Coach", exp: 6, rating: 4.7, reviews: 143, price: "$33", tags: ["Metabolism", "Hormones"], goals: ["lose", "maintain"], blurb: "Optimises metabolism for steady, lasting results." },
];
const TRAINERS = [
  { id: "t1", name: "Marcus Lee", emoji: "🏋🏽‍♂️", bg: "var(--protein-wash)", title: "Certified Personal Trainer · CPT", exp: 10, rating: 5.0, reviews: 402, price: "$42", tags: ["Strength", "Hypertrophy", "Home workout"], goals: ["gain", "maintain"], blurb: "Custom strength routines for any equipment level." },
  { id: "t2", name: "Elena Rossi", emoji: "🤸🏼‍♀️", bg: "var(--accent-wash)", title: "Fat-loss Coach · CPT", exp: 6, rating: 4.8, reviews: 231, price: "$36", tags: ["HIIT", "Conditioning", "Fat loss"], goals: ["lose"], blurb: "High-energy plans that torch calories fast." },
  { id: "t3", name: "Dev Kapoor", emoji: "🧘🏽‍♂️", bg: "var(--yellow-wash)", title: "Mobility & Beginner Coach", exp: 5, rating: 4.9, reviews: 167, price: "$28", tags: ["Beginner", "Mobility", "Low impact"], goals: ["lose", "maintain", "gain"], blurb: "Build a workout habit gently, without injury." },
];
const PRO_CATS = [
  { k: "diet", label: "Dietitians", list: DIETITIANS, icon: I.fork },
  { k: "coach", label: "Health coaches", list: HEALTH_COACHES, icon: I.heart },
  { k: "train", label: "Trainers", list: TRAINERS, icon: I.dumbbell },
];

function perfectWeightRange(heightCm, units) {
  const h = (heightCm || 0) / 100; const lo = 18.5 * h * h, hi = 24.9 * h * h;
  if (!h) return "—";
  return units === "imperial" ? `${Math.round(kgToLb(lo))}–${Math.round(kgToLb(hi))} lb` : `${Math.round(lo)}–${Math.round(hi)} kg`;
}

/* ============================================================
   Professional hub
   ============================================================ */
function ProCard({ p, booked, onBook, onMessage }) {
  return (
    <div className="pro-card pop">
      <div className="pro-top">
        <div className="pro-av" style={{ background: p.bg }}>{p.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pro-name">{p.name}<span className="verified" title="Verified professional">{I.check({ width: 11, height: 11 })}</span></div>
          <div className="pro-title">{p.title}</div>
          <div className="pro-meta"><span className="star">★ {p.rating}</span><span>·</span><span>{p.reviews} reviews</span><span>·</span><span>{p.exp} yrs exp</span></div>
        </div>
        <div className="pro-price">{p.price}<small>/session</small></div>
      </div>
      <div className="pro-blurb">{p.blurb}</div>
      <div className="pro-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
      <div className="pro-actions">
        <button className={"btn btn-sm btn-block " + (booked ? "btn-ghost" : "btn-primary")} onClick={onBook} disabled={booked}>
          {booked ? <>{I.check({ width: 16, height: 16 })} Request sent</> : "Book session"}
        </button>
        <button className="btn btn-sm btn-line" onClick={onMessage}>{I.sparkle({ width: 15, height: 15 })} Ask Meow</button>
      </div>
    </div>
  );
}

function MeowPro({ profile, units, onOpenChat, showToast }) {
  const [catTab, setCatTab] = useState("diet");
  const [booked, setBooked] = useState({});
  const cat = PRO_CATS.find((c) => c.k === catTab);
  const recForGoal = { lose: "coach", gain: "train", maintain: "coach" }[profile.goalType];
  const list = [...cat.list].sort((a, b) => Number(b.goals.includes(profile.goalType)) - Number(a.goals.includes(profile.goalType)));

  function book(p) { setBooked((b) => ({ ...b, [p.id]: true })); showToast("Request sent to " + p.name.split(" ").slice(-1)[0] + " 🤝"); }

  return (
    <div className="stack">
      <div className="pro-intro pop">
        <div className="row" style={{ gap: 13, marginBottom: 16 }}>
          <span style={{ fontSize: 30 }}>🤝</span>
          <div><div className="pi-t">Work with a pro</div><div className="pi-s">Certified dietitians, health coaches &amp; trainers — matched to your goal.</div></div>
        </div>
        <div className="pro-stat">
          <div style={{ flex: 1 }}><div className="ps-k">Your perfect health weight</div><div className="ps-v">{perfectWeightRange(profile.height, units)}</div></div>
          <div className="ps-div"></div>
          <div><div className="ps-k">Current goal</div><div className="ps-v" style={{ textTransform: "capitalize" }}>{profile.goalType}</div></div>
        </div>
        <button className="btn btn-dark btn-block" style={{ marginTop: 14 }} onClick={() => onOpenChat("Based on my goal, which type of professional should I work with — a dietitian, a health coach, or a trainer?")}>{I.sparkle()} Ask Meow AI for a match</button>
      </div>

      <div className="seg">
        {PRO_CATS.map((c) => <button key={c.k} className={catTab === c.k ? "on" : ""} onClick={() => setCatTab(c.k)}>{c.label}</button>)}
      </div>

      {recForGoal === catTab && (
        <div className="rec-badge pop">{I.sparkle({ width: 14, height: 14 })} Recommended for your <b style={{ textTransform: "capitalize" }}>&nbsp;{profile.goalType}&nbsp;</b> goal</div>
      )}

      <div className="stack" style={{ gap: 14 }}>
        {list.map((p) => (
          <ProCard key={p.id} p={p} booked={!!booked[p.id]} onBook={() => book(p)}
            onMessage={() => onOpenChat(`I'm thinking of booking ${p.name}, a ${p.title}. What should I expect, and is that a good fit for my ${profile.goalType} goal?`)} />
        ))}
      </div>

      <div className="banner info" style={{ marginTop: 4 }}>{I.shield({ style: { color: "#2C7BB0" } })}All professionals are identity- and credential-verified by Meow Track.</div>
    </div>
  );
}

/* ============================================================
   Meow AI chatbot
   ============================================================ */
async function aiChat(history, profile, goals) {
  const sys = "You are Meow, the friendly in-app AI assistant for Meow Track, a calorie & nutrition tracking app. " +
    "You help with nutrition, healthy eating, meal ideas, calories & macros, weight goals, workouts and motivation. " +
    "Be warm, encouraging and practical. Use plain, everyday language and give specific, actionable advice with realistic numbers. " +
    "Keep replies short — 2 to 4 sentences, or a tight bullet list. An occasional light cat touch (a 🐾 now and then) is welcome but don't overdo it. " +
    "You are not a doctor: for medical concerns, gently suggest seeing a professional and mention that Meow Track can connect them with verified dietitians, health coaches and trainers in 'Meow Track for Professional'. " +
    "Reply in plain conversational text only — no markdown, asterisks, bold, or headings.";
  const ctx = profile ? `\n\n[User context] name: ${profile.name}; ${profile.sex}, age ${profile.age}; current weight ${round1(profile.weight)} kg; goal weight ${round1(profile.goalWeight)} kg (${profile.goalType}); daily target ${goals && goals.calories ? goals.calories + " kcal" : "not set"}, protein ${goals ? goals.protein : "?"} g.` : "";
  const convo = history.map((m) => (m.role === "user" ? "User: " : "Meow: ") + m.text).join("\n");
  const prompt = sys + ctx + "\n\nConversation so far:\n" + convo + "\n\nWrite Meow's next reply only (no 'Meow:' prefix):";
  const reply = await window.claude.complete(prompt);
  return (reply || "").trim().replace(/\*\*/g, "").replace(/^#{1,6}\s+/gm, "");
}

const CHAT_SUGGESTIONS = [
  "How much protein should I eat daily?",
  "Give me a 400 kcal lunch idea",
  "Is my sugar intake too high?",
  "A simple home workout for fat loss",
  "How can I hit my weight goal faster?",
];

function SendIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3.3 20.5l17.4-7.6c.8-.3.8-1.5 0-1.8L3.3 3.5a1 1 0 0 0-1.4 1.1l1.7 5.8c.1.4.4.6.8.7l8.6 1.4-8.6 1.4c-.4.1-.7.3-.8.7l-1.7 5.8a1 1 0 0 0 1.4 1.1z"/></svg>; }

function MeowChat({ open, onClose, seed, profile, goals }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef();
  const taRef = useRef();

  useEffect(() => { if (open && seed) { setInput(seed); setTimeout(() => taRef.current && taRef.current.focus(), 320); } }, [open, seed]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs, busy]);

  async function send(text) {
    const t = (text != null ? text : input).trim();
    if (!t || busy) return;
    const next = [...msgs, { role: "user", text: t }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const reply = await aiChat(next, profile, goals);
      setMsgs((m) => [...m, { role: "ai", text: reply || "Hmm, I couldn't think of an answer just then — try asking again? 🐾" }]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "I'm having trouble connecting right now. Please try again in a moment." }]);
    }
    setBusy(false);
  }

  return (
    <div className={"chat-overlay" + (open ? " show" : "")}>
      <div className="chat-head">
        <button className="iconbtn" onClick={onClose}>{I.back()}</button>
        <div className="chat-id">
          <div className="chat-av">🐱</div>
          <div><div className="cn">Meow AI</div><div className="cs">{busy ? "typing…" : "Nutrition & fitness assistant"}</div></div>
        </div>
        <button className="iconbtn" title="Clear chat" onClick={() => setMsgs([])}>{I.history()}</button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {msgs.length === 0 && (
          <div className="chat-welcome pop">
            <div className="cw-av">🐱</div>
            <h3>Hi {profile && profile.name ? profile.name : "there"}! I'm Meow 🐾</h3>
            <p>Ask me anything about your nutrition, meals, weight goal, or workouts.</p>
            <div className="chat-suggest">{CHAT_SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={"msg " + m.role}>
            {m.role === "ai" && <div className="msg-av">🐱</div>}
            <div className="bubble">{m.text}</div>
          </div>
        ))}
        {busy && <div className="msg ai"><div className="msg-av">🐱</div><div className="bubble typing"><span></span><span></span><span></span></div></div>}
      </div>

      <div className="chat-input-bar">
        <textarea ref={taRef} className="chat-input" rows={1} placeholder="Message Meow AI…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <button className="chat-send" onClick={() => send()} disabled={busy || !input.trim()}><SendIcon /></button>
      </div>
    </div>
  );
}

Object.assign(window, { MeowPro, MeowChat, ProCard, aiChat, perfectWeightRange, PRO_CATS });
