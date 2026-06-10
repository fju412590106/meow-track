/* AddMeal.jsx — add a meal manually or estimate from a photo via Claude vision */

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Downscale large photos so the data URL stays small for the vision call
function downscale(dataURL, max = 768) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (Math.max(w, h) > max) {
        const s = max / Math.max(w, h);
        w = Math.round(w * s); h = Math.round(h * s);
      }
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      res(cv.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => res(dataURL);
    img.src = dataURL;
  });
}

function AddMeal({ onAdd, showToast }) {
  const empty = { name: "", calories: "", protein: "", carbs: "", fat: "" };
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState(null);     // data URL (downscaled) kept with the meal
  const [analyzing, setAnalyzing] = useState(false);
  const [aiNote, setAiNote] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setAiError(null); setAiNote(null);
    const raw = await fileToDataURL(file);
    const small = await downscale(raw);
    setPhoto(small);
    estimate(small);
  }

  async function estimate(dataURL) {
    setAnalyzing(true); setAiError(null); setAiNote(null);
    try {
      const base64 = dataURL.split(",")[1];
      const media_type = (dataURL.match(/data:(.*?);/) || [])[1] || "image/jpeg";
      const reply = await window.claude.complete({
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type, data: base64 } },
            { type: "text", text:
              "You are a nutrition estimator. Identify the food in this photo and estimate the nutrition for the portion shown. " +
              "Respond ONLY with strict minified JSON, no prose, no code fences, in exactly this shape: " +
              '{"name":"short food name","calories":number,"protein":number,"carbs":number,"fat":number,"note":"one short sentence on assumptions"}. ' +
              "All macro values in grams, calories in kcal. If unsure, give your best single estimate." }
          ]
        }]
      });
      const json = JSON.parse((reply.match(/\{[\s\S]*\}/) || [reply])[0]);
      setForm((f) => ({
        ...f,
        name: json.name || f.name || "Estimated meal",
        calories: json.calories != null ? Math.round(json.calories) : f.calories,
        protein:  json.protein  != null ? Math.round(json.protein)  : f.protein,
        carbs:    json.carbs    != null ? Math.round(json.carbs)    : f.carbs,
        fat:      json.fat      != null ? Math.round(json.fat)      : f.fat,
      }));
      setAiNote(json.note || "Estimated from your photo — adjust if needed.");
      showToast("Estimated from photo");
    } catch (err) {
      setAiError("Couldn't estimate automatically. Enter the values manually below.");
    } finally {
      setAnalyzing(false);
    }
  }

  function clearPhoto() { setPhoto(null); setAiNote(null); setAiError(null); }

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) { showToast("Add a food name first"); return; }
    onAdd({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      name: form.name.trim(),
      calories: +form.calories || 0,
      protein: +form.protein || 0,
      carbs: +form.carbs || 0,
      fat: +form.fat || 0,
      photo: photo || null,
      ts: Date.now(),
    });
    setForm(empty); clearPhoto();
    showToast("Meal added");
  }

  const computedCals = (+form.protein||0)*4 + (+form.carbs||0)*4 + (+form.fat||0)*9;

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr", maxWidth: 640, margin: "0 auto" }}>
      {/* Photo estimate */}
      <div className="card card-pad pop">
        <div className="card-h">
          <h3>Snap it</h3>
          <span className="hint" style={{ display:"flex", alignItems:"center", gap:5, color:"var(--accent)" }}>
            {Icon.sparkle({style:{width:14,height:14}})} AI estimate
          </span>
        </div>

        {!photo ? (
          <div className={"drop" + (dragOver ? " over" : "")}
            onClick={() => fileRef.current.click()}
            onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={(e)=>{e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]);}}>
            <div className="ico">{Icon.camera()}</div>
            <h4>Add a photo of your meal</h4>
            <p>Tap to upload or drop an image — Claude estimates the calories &amp; macros</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              style={{ display: "none" }} onChange={(e)=>handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div>
            <div className="preview">
              <img src={photo} alt="meal" />
              <button className="x" onClick={clearPhoto} aria-label="remove">{Icon.x()}</button>
            </div>
            {analyzing && <div className="analyzing"><span className="spin"></span> Analyzing your meal…</div>}
            {aiNote && !analyzing && (
              <div className="ai-result" style={{ marginTop: 12 }}>
                <div className="row">{Icon.sparkle()} AI estimate</div>
                <p>{aiNote}</p>
              </div>
            )}
            {aiError && (
              <div className="banner warn" style={{ marginTop: 12 }}>{Icon.info()}{aiError}</div>
            )}
          </div>
        )}
      </div>

      {/* Manual / editable fields */}
      <form className="card card-pad pop pop-2" onSubmit={submit}>
        <div className="card-h">
          <h3>Meal details</h3>
          {photo && <span className="hint">from your photo · editable</span>}
        </div>

        <div className="field">
          <label>Food name</label>
          <input className="input" placeholder="e.g. Grilled chicken bowl"
            value={form.name} onChange={set("name")} />
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label><span className="dot" style={{ background:"var(--accent)" }}></span>Calories</label>
          <div className="input-wrap">
            <input className="input suffix-pad" type="number" inputMode="decimal" min="0" placeholder="0"
              value={form.calories} onChange={set("calories")} />
            <span className="suffix">kcal</span>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: 16 }}>
          {MACROS.map(m => (
            <div className="field" key={m.key}>
              <label><span className="dot" style={{ background:m.color }}></span>{m.label}</label>
              <div className="input-wrap">
                <input className="input suffix-pad" type="number" inputMode="decimal" min="0" placeholder="0"
                  value={form[m.key]} onChange={set(m.key)} />
                <span className="suffix">g</span>
              </div>
            </div>
          ))}
          <div className="field">
            <label>{Icon.info({style:{width:14,height:14}})} From macros</label>
            <div className="input" style={{ display:"flex", alignItems:"center", background:"var(--bg-2)", border:"none" }}>
              <b style={{ fontFamily:"var(--font-head)", marginRight:6 }}>{round(computedCals)}</b>
              <span style={{ color:"var(--muted)", fontSize:13 }}>kcal</span>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} type="submit">
          {Icon.plus()} Add to today
        </button>
      </form>
    </div>
  );
}

window.AddMeal = AddMeal;
