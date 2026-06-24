import { useState, useRef } from "react";

const GOALS = [
  { label: "🎓 باك", val: "اجتياز شهادة البكالوريا" },
  { label: "📚 جامعة", val: "النجاح في الجامعة" },
  { label: "🚀 مشروع", val: "إطلاق مشروع شخصي" },
  { label: "🌍 لغة", val: "تعلم لغة جديدة" },
  { label: "💪 عادات", val: "بناء عادات صحية" },
  { label: "💼 عمل", val: "إيجاد عمل أو وظيفة" },
  { label: "💻 تقنية", val: "تطوير مهارة تقنية" },
  { label: "✍️ كتابة", val: "كتابة كتاب أو محتوى" },
];

const PROBLEMS = [
  { label: "😵 متشتت", val: "التشتت وعدم التركيز" },
  { label: "⏳ نأجل بزاف", val: "التسويف والتأجيل المستمر" },
  { label: "🕐 نضيع الوقت", val: "إضاعة الوقت بدون فائدة" },
  { label: "🤷 ما نعرفش منين نبدا", val: "عدم معرفة نقطة البداية" },
  { label: "🔥 نفقد الحماس بسرعة", val: "فقدان الحماس والاستمرارية" },
];

const stepColors = ["#4facfe", "#a18dfe", "#43e97b"];

function sanitizeJSON(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let str = match[0];
  str = str.replace(/[\x00-\x1F\x7F]/g, " ");
  try { return JSON.parse(str); } catch {
    str = str.replace(/,\s*([}\]])/g, "$1");
    try { return JSON.parse(str); } catch { return null; }
  }
}

export default function StartNow() {
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("");
  const [problem, setProblem] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [copied, setCopied] = useState(false);
  const planRef = useRef(null);

  async function generate() {
    setError("");
    if (!age || isNaN(Number(age)) || Number(age) < 10 || Number(age) > 80) {
      setError("من فضلك أدخل عمرك بشكل صحيح"); return;
    }
    if (!goal) { setError("اختر هدفك من الخيارات"); return; }
    if (!problem) { setError("اختر أكبر مشكلة تواجهك"); return; }

    setLoading(true);
    setPlan(null);

    const systemPrompt = `You are a personal coach. Respond ONLY with a valid JSON object. No markdown, no explanation. Use short Arabic sentences only. Never use quotes or apostrophes inside JSON values.`;

    const userPrompt = `Personalized plan for age ${age}, goal: ${goal}, biggest challenge: ${problem}.${details ? " Details: " + details.replace(/['"]/g, " ") : ""}

Return ONLY this exact JSON, nothing else:
{"day1_title":"title for first day","day1_task1":"first priority today","day1_task2":"second priority today","day1_task3":"third priority today","week1_hours":"how many hours per day in week 1","week1_focus":"what to focus on in week 1 30min task","week2":"week 2 plan one sentence","week3":"week 3 plan one sentence","week4":"week 4 and how to evaluate progress","forbidden":"one thing to avoid","tip":"one motivational tip about consistency not perfection"}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `خطأ ${res.status}`); }
      const data = await res.json();
      const raw = (data.content || []).map((b) => b.text || "").join("");
      const parsed = sanitizeJSON(raw);
      if (!parsed || !parsed.day1_title) throw new Error("تعذّر قراءة الخطة، حاول مرة ثانية");
      setPlan(parsed);
    } catch (e) {
      setError(e.message || "حصل خطأ غير متوقع");
    }
    setLoading(false);
  }

  function downloadPlan() {
    if (!plan) return;
    const text = `🚀 خارطة البداية
${"─".repeat(30)}
👤 العمر: ${age} سنة
🎯 الهدف: ${goal}
⚡ أكبر تحدي: ${problem}

━━━ اليوم الأول ━━━
${plan.day1_title}

حدد 3 أولويات:
1️⃣ ${plan.day1_task1}
2️⃣ ${plan.day1_task2}
3️⃣ ${plan.day1_task3}

━━━ الأسبوع الأول ━━━
⏰ ${plan.week1_hours}
🎯 30 دقيقة: ${plan.week1_focus}

━━━ الأسبوع الثاني ━━━
${plan.week2}

━━━ الأسبوع الثالث ━━━
${plan.week3}

━━━ الأسبوع الرابع ━━━
${plan.week4}

━━━ ممنوع ━━━
❌ ${plan.forbidden}

━━━ نصيحة ━━━
🎯 ${plan.tip}

${"─".repeat(30)}
🎯 ركز على الاستمرارية مشي الكمال.`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "خارطة-البداية.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  function copyPlan() {
    if (!plan) return;
    const text = `🚀 خارطة البداية\n👤 العمر: ${age} سنة\n🎯 الهدف: ${goal}\n\nاليوم الأول: ${plan.day1_title}\n1️⃣ ${plan.day1_task1}\n2️⃣ ${plan.day1_task2}\n3️⃣ ${plan.day1_task3}\n\nالأسبوع 1: ${plan.week1_hours} — ${plan.week1_focus}\nالأسبوع 2: ${plan.week2}\nالأسبوع 3: ${plan.week3}\nالأسبوع 4: ${plan.week4}\n\n❌ ممنوع: ${plan.forbidden}\n🎯 ${plan.tip}\n\n🎯 ركز على الاستمرارية مشي الكمال.`;

    // Method 1: modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    // Method 2: textarea trick — works in iframes and older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Method 3: show text to user to copy manually
      setCopied("manual");
      setTimeout(() => setCopied(false), 8000);
    }
    document.body.removeChild(ta);
  }

  const inp = { width: "100%", background: "#0d0f14", border: "1px solid #1f2330", borderRadius: ".6rem", color: "#eceef5", fontFamily: "inherit", fontSize: "1rem", padding: ".7rem 1rem", outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: ".68rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#888", marginBottom: ".6rem" };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", color: "#eceef5", fontFamily: "system-ui, sans-serif", direction: "rtl", padding: "2rem 1rem 3rem" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ display: "inline-block", fontSize: ".68rem", fontWeight: 700, letterSpacing: ".15em", color: "#f5a623", border: "1px solid #f5a62340", padding: ".3rem .9rem", borderRadius: "2rem", marginBottom: "1.2rem", background: "#f5a6230d" }}>
          ✦ START NOW
        </div>
        <h1 style={{ fontSize: "clamp(1.5rem,5vw,2.5rem)", fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
          🚀 من التشتت إلى{" "}<span style={{ color: "#f5a623" }}>أول خطوة</span>
          <br />
          <span style={{ fontSize: "clamp(1rem,3.5vw,1.6rem)", color: "#c8ccda", fontWeight: 400 }}>في أقل من دقيقة</span>
        </h1>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 520, margin: "0 auto", background: "#13161e", border: "1px solid #1f2330", borderRadius: "1.2rem", padding: "1.8rem" }}>

        {/* Age */}
        <div style={{ marginBottom: "1.2rem" }}>
          <label style={lbl}>عمرك</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="مثال: 20" min={10} max={80} style={inp} />
        </div>

        {/* Goal */}
        <div style={{ marginBottom: "1.2rem" }}>
          <label style={lbl}>هدفك الرئيسي</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
            {GOALS.map(g => (
              <button key={g.val} onClick={() => setGoal(g.val)} style={{
                fontSize: ".78rem", padding: ".35rem .8rem", borderRadius: "2rem",
                border: `1px solid ${goal === g.val ? "#f5a623" : "#1f2330"}`,
                cursor: "pointer", color: goal === g.val ? "#0d0f14" : "#c8ccda",
                background: goal === g.val ? "#f5a623" : "transparent",
                fontFamily: "inherit", fontWeight: goal === g.val ? 700 : 400,
              }}>{g.label}</button>
            ))}
          </div>
        </div>

        {/* Problem */}
        <div style={{ marginBottom: "1.2rem" }}>
          <label style={lbl}>أكبر مشكلة تواجهك؟</label>
          <div style={{ display: "flex", flexDirection: "column", gap: ".45rem" }}>
            {PROBLEMS.map(p => (
              <button key={p.val} onClick={() => setProblem(p.val)} style={{
                fontSize: ".88rem", padding: ".5rem 1rem", borderRadius: ".6rem", textAlign: "right",
                border: `1px solid ${problem === p.val ? "#f5a623" : "#1f2330"}`,
                cursor: "pointer", color: problem === p.val ? "#0d0f14" : "#c8ccda",
                background: problem === p.val ? "#f5a623" : "#0d0f14",
                fontFamily: "inherit", fontWeight: problem === p.val ? 700 : 400,
                display: "flex", alignItems: "center", gap: ".5rem",
              }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${problem === p.val ? "#0d0f14" : "#3a3f52"}`, background: problem === p.val ? "#0d0f14" : "transparent", flexShrink: 0, display: "inline-block" }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div style={{ marginBottom: "1.2rem" }}>
          <label style={lbl}>تفاصيل <span style={{ color: "#3a3f52", fontWeight: 400 }}>(اختياري)</span></label>
          <textarea value={details} onChange={e => setDetails(e.target.value)}
            placeholder="مثال: عندي 3 ساعات في اليوم، أبدأ من صفر..." rows={2}
            style={{ ...inp, resize: "none", lineHeight: 1.6, fontSize: ".9rem" }} />
        </div>

        {error && (
          <div style={{ background: "#2a1515", border: "1px solid #5a2020", borderRadius: ".6rem", padding: ".8rem 1rem", color: "#ff8080", fontSize: ".85rem", marginBottom: "1rem" }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={generate} disabled={loading} style={{
          width: "100%", padding: ".85rem", border: "none", borderRadius: ".7rem",
          background: loading ? "#6b4a0f" : "#f5a623", color: "#0d0f14",
          fontSize: "1rem", fontWeight: 700, fontFamily: "inherit",
          cursor: loading ? "not-allowed" : "pointer",
        }}>
          {loading ? "⏳ نحضر خطتك…" : "ابدأ الآن ←"}
        </button>
      </div>

      {/* Result */}
      {plan && (
        <div style={{ maxWidth: 520, margin: "2rem auto 0" }} ref={planRef}>

          {/* Plan card */}
          <div style={{ background: "#13161e", border: "1px solid #1f2330", borderRadius: "1.2rem", padding: "1.6rem", marginBottom: "1rem" }}>

            {/* Header */}
            <div style={{ borderBottom: "1px solid #1f2330", paddingBottom: "1rem", marginBottom: "1.2rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f5a623", marginBottom: ".5rem" }}>🚀 خارطة البداية</div>
              <div style={{ fontSize: ".85rem", color: "#c8ccda", lineHeight: 1.8 }}>
                <span>👤 العمر: <strong style={{ color: "#eceef5" }}>{age} سنة</strong></span><br />
                <span>🎯 الهدف: <strong style={{ color: "#eceef5" }}>{goal}</strong></span><br />
                <span>⚡ التحدي: <strong style={{ color: "#eceef5" }}>{problem}</strong></span>
              </div>
            </div>

            {/* Day 1 */}
            <div style={{ marginBottom: "1.2rem" }}>
              <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#4facfe", marginBottom: ".6rem" }}>
                ━━ اليوم الأول ━━
              </div>
              <div style={{ fontWeight: 600, fontSize: ".97rem", marginBottom: ".7rem", color: "#eceef5" }}>{plan.day1_title}</div>
              <div style={{ fontSize: ".78rem", color: "#888", marginBottom: ".5rem", fontWeight: 600, letterSpacing: ".05em" }}>حدد 3 أولويات:</div>
              {[plan.day1_task1, plan.day1_task2, plan.day1_task3].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: ".6rem", marginBottom: ".5rem" }}>
                  <span style={{ color: stepColors[i], fontWeight: 700, fontSize: ".9rem", flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: ".87rem", color: "#c8ccda", lineHeight: 1.55 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Week 1 */}
            <div style={{ marginBottom: "1.2rem", background: "#0d0f14", borderRadius: ".8rem", padding: "1rem", border: "1px solid #1f2330" }}>
              <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#a18dfe", marginBottom: ".7rem" }}>
                ━━ الأسبوع الأول ━━
              </div>
              <div style={{ fontSize: ".87rem", color: "#c8ccda", lineHeight: 1.7 }}>
                <div>⏰ <strong style={{ color: "#eceef5" }}>{plan.week1_hours}</strong></div>
                <div>🎯 30 دقيقة: {plan.week1_focus}</div>
              </div>
            </div>

            {/* Weeks 2-4 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".6rem", marginBottom: "1.2rem" }}>
              {[{ label: "الأسبوع 2", val: plan.week2 }, { label: "الأسبوع 3", val: plan.week3 }, { label: "الأسبوع 4", val: plan.week4 }].map((w, i) => (
                <div key={i} style={{ background: "#0d0f14", borderRadius: ".6rem", padding: ".8rem", border: "1px solid #1f2330" }}>
                  <div style={{ fontSize: ".58rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#3a3f52", marginBottom: ".4rem" }}>{w.label}</div>
                  <p style={{ fontSize: ".78rem", color: "#c8ccda", lineHeight: 1.5, margin: 0 }}>{w.val}</p>
                </div>
              ))}
            </div>

            {/* Forbidden + Tip */}
            <div style={{ background: "#1a0f0f", border: "1px solid #3a1515", borderRadius: ".7rem", padding: ".85rem 1rem", marginBottom: ".8rem" }}>
              <div style={{ fontSize: ".75rem", color: "#ff7070", fontWeight: 600, marginBottom: ".3rem" }}>ممنوع:</div>
              <div style={{ fontSize: ".85rem", color: "#ffaaaa" }}>❌ {plan.forbidden}</div>
            </div>

            <div style={{ background: "#0f1a0f", border: "1px solid #1a3a1a", borderRadius: ".7rem", padding: ".85rem 1rem" }}>
              <div style={{ fontSize: ".75rem", color: "#43e97b", fontWeight: 600, marginBottom: ".3rem" }}>نصيحة:</div>
              <div style={{ fontSize: ".85rem", color: "#aaffcc" }}>🎯 {plan.tip}</div>
            </div>
          </div>

          {/* Share buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem", marginBottom: "1rem" }}>
            <button onClick={copyPlan} style={{
              padding: ".75rem", border: "1px solid #1f2330", borderRadius: ".7rem",
              background: copied === true ? "#1a3a1a" : copied === "manual" ? "#1a1a0a" : "#13161e",
              color: copied === true ? "#43e97b" : copied === "manual" ? "#f5a623" : "#eceef5",
              fontFamily: "inherit", fontSize: ".85rem", fontWeight: 600, cursor: "pointer",
            }}>
              {copied === true ? "✅ تم النسخ!" : copied === "manual" ? "⚠️ جرب Ctrl+C" : "📸 انسخ وشارك"}
            </button>
            <button onClick={downloadPlan} style={{
              padding: ".75rem", border: "none", borderRadius: ".7rem",
              background: "#f5a623", color: "#0d0f14",
              fontFamily: "inherit", fontSize: ".85rem", fontWeight: 700, cursor: "pointer",
            }}>
              📥 حمّل خطتك
            </button>
          </div>

          <button onClick={() => { setPlan(null); setGoal(""); setAge(""); setDetails(""); setProblem(""); }} style={{
            display: "block", margin: "0 auto",
            background: "transparent", border: "1px solid #1f2330", borderRadius: ".6rem",
            color: "#888", fontFamily: "inherit", fontSize: ".82rem", padding: ".5rem 1.2rem", cursor: "pointer",
          }}>← جرب هدف آخر</button>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "2.5rem", fontSize: ".8rem", color: "#3a3f52", fontWeight: 500 }}>
        🎯 ركز على الاستمرارية مشي الكمال.
      </div>
    </div>
  );
}
