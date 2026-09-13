import React, { useState, useEffect, useRef } from "react";
import {
  Home, Clock, ListTodo, BookOpen, HelpCircle, Network, TrendingUp,
  MessageCircle, Calendar as CalendarIcon, LogOut, Plus, Check, X,
  Sparkles, ChevronRight, ChevronDown, Play, Pause, RotateCcw, Send,
  Trash2, Mail, Lock, ArrowRight, Loader2
} from "lucide-react";

/* ---------------------------------- THEME ---------------------------------- */

const C = {
  bg: "#FBF8FD",
  card: "#FFFFFF",
  ink: "#3D3450",
  inkSoft: "#8A7F9C",
  border: "#EEE6F7",
  lavender: "#C9B6E4",
  lavenderDeep: "#8A6FB8",
  lavenderSoft: "#EFE7FA",
};

const PALETTE = [
  { bg: "#EFE7FA", text: "#6B4FA0", dot: "#C9B6E4" }, // lavender
  { bg: "#FCE9F0", text: "#B85C82", dot: "#F3AFC9" }, // pink
  { bg: "#E3F7EE", text: "#3E9B76", dot: "#A3E3C4" }, // mint
  { bg: "#FEF6DD", text: "#B8922E", dot: "#F6DA8E" }, // butter
  { bg: "#E1F0FB", text: "#3E7FA0", dot: "#A9D6F2" }, // sky
  { bg: "#FBE3E3", text: "#C05C5C", dot: "#F0B4B4" }, // coral
];

const CLASS_OPTIONS = ["10th", "11th", "12th", "B.E.", "B.Tech", "B.Sc.", "Other"];

const SUBJECT_SUGGESTIONS = {
  "10th": ["Maths", "Science", "English", "Social Science", "Hindi"],
  "11th": ["Physics", "Chemistry", "Maths", "Biology", "English"],
  "12th": ["Physics", "Chemistry", "Maths", "Biology", "English"],
  "B.E.": ["Maths", "Electronics", "Python", "AI", "Physics"],
  "B.Tech": ["AI", "Python", "Electronics", "Maths", "Physics"],
  "B.Sc.": ["Physics", "Chemistry", "Biology", "Maths", "Python"],
  Other: ["Maths", "Science", "English"],
};

const NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "timer", label: "Timer", icon: Clock },
  { id: "todo", label: "To-Do", icon: ListTodo },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
  { id: "mindmap", label: "Mindmap", icon: Network },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
];

/* ---------------------------------- AI HELPER ---------------------------------- */

async function askClaude(userText, systemPrompt, maxTokens = 1200) {
  // Calls our own /api/claude serverless function, which holds the real
  // Anthropic API key server-side and forwards the request.
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI request failed");
  const text = (data.content || [])
    .map((b) => b.text || "")
    .join("\n")
    .trim();
  return text;
}

function extractJson(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  let s = start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  const slice = s >= 0 && end >= 0 ? cleaned.slice(s, end + 1) : cleaned;
  return JSON.parse(slice);
}

function fmtSeconds(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/* ---------------------------------- SMALL UI PIECES ---------------------------------- */

function Sparkle({ size = 18, color = C.lavenderDeep }) {
  return <Sparkles size={size} color={color} strokeWidth={2} />;
}

function PillButton({ children, onClick, active, style, ...props }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.lavender : "#fff",
        color: active ? "#fff" : C.ink,
        border: `1.5px solid ${active ? C.lavender : C.border}`,
        borderRadius: 999,
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all .15s ease",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, style, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled
          ? "#E4DAF2"
          : "linear-gradient(135deg, #C9B6E4, #B497D6)",
        color: "#fff",
        border: "none",
        borderRadius: 14,
        padding: "12px 20px",
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: disabled ? "none" : "0 6px 16px rgba(180,151,214,0.35)",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 20,
        padding: 20,
        border: `1px solid ${C.border}`,
        boxShadow: "0 4px 18px rgba(150,120,190,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0, fontFamily: "'Quicksand', sans-serif" }}>
        {children}
      </h2>
      {sub && <p style={{ color: C.inkSoft, fontSize: 14, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 10px", color: C.inkSoft }}>
      <Sparkle size={26} />
      <p style={{ marginTop: 10, fontSize: 14 }}>{text}</p>
    </div>
  );
}

function SubjectPicker({ subjects, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {subjects.map((s) => {
        const pal = PALETTE[s.colorIdx % PALETTE.length];
        const active = value === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              border: `1.5px solid ${active ? pal.text : C.border}`,
              background: active ? pal.bg : "#fff",
              color: pal.text,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 99, background: pal.dot }} />
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- LOGIN ---------------------------------- */

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 20% 20%, #F5EEFC 0%, ${C.bg} 55%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: "0 auto 14px",
              borderRadius: 18,
              background: "linear-gradient(135deg,#C9B6E4,#F7C6D9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(180,151,214,0.4)",
            }}
          >
            <Sparkle size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 28, fontWeight: 700, color: C.ink, margin: 0 }}>
            sparkly
          </h1>
          <p style={{ color: C.inkSoft, fontSize: 14, marginTop: 4 }}>
            your soft little study companion
          </p>
        </div>

        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <PillButton active={mode === "signup"} onClick={() => setMode("signup")} style={{ flex: 1, textAlign: "center" }}>
              Sign up
            </PillButton>
            <PillButton active={mode === "login"} onClick={() => setMode("login")} style={{ flex: 1, textAlign: "center" }}>
              Log in
            </PillButton>
          </div>

          {mode === "signup" && (
            <input
              placeholder="What should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          )}
          <div style={{ position: "relative", marginTop: 10 }}>
            <Mail size={16} color={C.inkSoft} style={{ position: "absolute", left: 14, top: 14 }} />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 38, marginTop: 0 }}
            />
          </div>
          <div style={{ position: "relative", marginTop: 10 }}>
            <Lock size={16} color={C.inkSoft} style={{ position: "absolute", left: 14, top: 14 }} />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 38, marginTop: 0 }}
            />
          </div>

          <PrimaryButton
            style={{ width: "100%", marginTop: 16 }}
            onClick={() => onLogin(name || email.split("@")[0] || "friend")}
          >
            {mode === "signup" ? "Create my account" : "Log in"} <ArrowRight size={16} />
          </PrimaryButton>

          <p style={{ textAlign: "center", fontSize: 12, color: C.inkSoft, marginTop: 14 }}>
            {mode === "signup" ? "Already have an account? " : "New here? "}
            <span
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              style={{ color: C.lavenderDeep, fontWeight: 700, cursor: "pointer" }}
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </span>
          </p>
        </Card>
        <p style={{ textAlign: "center", fontSize: 11, color: C.inkSoft, marginTop: 16 }}>
          This is a prototype — no real account is created.
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1.5px solid ${C.border}`,
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  fontFamily: "'Nunito', sans-serif",
  color: C.ink,
  marginTop: 10,
};

/* ---------------------------------- ONBOARDING ---------------------------------- */

function Onboarding({ userName, onDone }) {
  const [step, setStep] = useState(1);
  const [klass, setKlass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [customSub, setCustomSub] = useState("");

  const suggestions = klass ? SUBJECT_SUGGESTIONS[klass] || [] : [];

  function toggleSubject(name) {
    setSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  function addCustom() {
    const v = customSub.trim();
    if (v && !subjects.includes(v)) {
      setSubjects((prev) => [...prev, v]);
      setCustomSub("");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20, justifyContent: "center" }}>
          {[1, 2].map((n) => (
            <div key={n} style={{ width: n === step ? 26 : 8, height: 8, borderRadius: 99, background: n <= step ? C.lavender : C.border, transition: "all .2s" }} />
          ))}
        </div>

        <Card>
          {step === 1 && (
            <>
              <SectionTitle sub={`Hey ${userName}! Let's set things up.`}>What are you studying for?</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {CLASS_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setKlass(c)}
                    style={{
                      padding: "16px 8px",
                      borderRadius: 14,
                      border: `2px solid ${klass === c ? C.lavender : C.border}`,
                      background: klass === c ? C.lavenderSoft : "#fff",
                      color: klass === c ? C.lavenderDeep : C.ink,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <PrimaryButton style={{ width: "100%", marginTop: 20 }} disabled={!klass} onClick={() => setStep(2)}>
                Continue <ArrowRight size={16} />
              </PrimaryButton>
            </>
          )}

          {step === 2 && (
            <>
              <SectionTitle sub="Pick a few to start — you can always add more later.">Choose your subjects</SectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {suggestions.map((s, i) => {
                  const pal = PALETTE[i % PALETTE.length];
                  const active = subjects.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSubject(s)}
                      style={{
                        padding: "9px 15px",
                        borderRadius: 999,
                        border: `1.5px solid ${active ? pal.text : C.border}`,
                        background: active ? pal.bg : "#fff",
                        color: active ? pal.text : C.ink,
                        fontWeight: 600,
                        fontSize: 13.5,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {active && <Check size={13} />}
                      {s}
                    </button>
                  );
                })}
                {subjects.filter((s) => !suggestions.includes(s)).map((s, i) => (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    style={{
                      padding: "9px 15px",
                      borderRadius: 999,
                      border: `1.5px solid ${PALETTE[(i + 3) % PALETTE.length].text}`,
                      background: PALETTE[(i + 3) % PALETTE.length].bg,
                      color: PALETTE[(i + 3) % PALETTE.length].text,
                      fontWeight: 600,
                      fontSize: 13.5,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Check size={13} />
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="Add a custom subject (e.g. AI, Python)"
                  value={customSub}
                  onChange={(e) => setCustomSub(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                />
                <button
                  onClick={addCustom}
                  style={{ border: `1.5px solid ${C.border}`, background: "#fff", borderRadius: 12, padding: "0 14px", cursor: "pointer" }}
                >
                  <Plus size={18} color={C.lavenderDeep} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <PillButton onClick={() => setStep(1)} style={{ flex: 1, textAlign: "center" }}>Back</PillButton>
                <PrimaryButton
                  style={{ flex: 2 }}
                  disabled={subjects.length === 0}
                  onClick={() => onDone({ klass, subjects })}
                >
                  Start using Sparkly <Sparkle size={15} color="#fff" />
                </PrimaryButton>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------- HOME ---------------------------------- */

function HomeTab({ userName, subjects, todos, sessions, streak, setTab }) {
  const totalToday = sessions
    .filter((s) => s.date === todayStr())
    .reduce((a, s) => a + s.seconds, 0);
  const upcoming = todos.filter((t) => !t.done).slice(0, 4);

  return (
    <div>
      <SectionTitle sub="Here's your little snapshot for today.">Hey {userName} ✨</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Card style={{ background: "linear-gradient(135deg,#EFE7FA,#FCE9F0)" }}>
          <p style={{ fontSize: 12, color: C.inkSoft, fontWeight: 700, margin: 0 }}>STUDIED TODAY</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: C.ink, margin: "6px 0 0" }}>{fmtSeconds(totalToday)}</p>
        </Card>
        <Card style={{ background: "linear-gradient(135deg,#FEF6DD,#E3F7EE)" }}>
          <p style={{ fontSize: 12, color: C.inkSoft, fontWeight: 700, margin: 0 }}>STREAK</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: C.ink, margin: "6px 0 0" }}>{streak} 🔥</p>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 700, color: C.ink, margin: 0 }}>Up next</p>
          <span onClick={() => setTab("todo")} style={{ fontSize: 12, color: C.lavenderDeep, fontWeight: 700, cursor: "pointer" }}>View all</span>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState text="Nothing on your list yet — add a to-do to get going." />
        ) : (
          upcoming.map((t) => {
            const subj = subjects.find((s) => s.id === t.subjectId);
            const pal = subj ? PALETTE[subj.colorIdx % PALETTE.length] : PALETTE[0];
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: pal.dot }} />
                <span style={{ fontSize: 14, color: C.ink, flex: 1 }}>{t.text}</span>
                {subj && <span style={{ fontSize: 11, color: pal.text, background: pal.bg, padding: "3px 8px", borderRadius: 99, fontWeight: 700 }}>{subj.name}</span>}
              </div>
            );
          })
        )}
      </Card>

      <Card>
        <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>Your subjects</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {subjects.map((s) => {
            const pal = PALETTE[s.colorIdx % PALETTE.length];
            return (
              <div key={s.id} style={{ padding: "8px 14px", borderRadius: 999, background: pal.bg, color: pal.text, fontWeight: 700, fontSize: 13 }}>
                {s.name}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- TIMER ---------------------------------- */

function TimerTab({ subjects, onLogSession }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function finish() {
    if (seconds > 0 && subjectId) onLogSession(subjectId, seconds);
    setSeconds(0);
    setRunning(false);
  }

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  const subj = subjects.find((x) => x.id === subjectId);
  const pal = subj ? PALETTE[subj.colorIdx % PALETTE.length] : PALETTE[0];

  return (
    <div>
      <SectionTitle sub="Pick a subject and press play — we'll keep count.">Study timer</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <SubjectPicker subjects={subjects} value={subjectId} onChange={setSubjectId} />
      </Card>

      <Card style={{ textAlign: "center", padding: 36 }}>
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            margin: "0 auto 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `conic-gradient(${pal.dot} ${(seconds % 60) * 6}deg, ${pal.bg} 0deg)`,
            transition: "background 1s linear",
          }}
        >
          <div style={{ width: 172, height: 172, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{h}:{m}:{s}</span>
            {subj && <span style={{ fontSize: 12, fontWeight: 700, color: pal.text, marginTop: 4 }}>{subj.name}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => setRunning((r) => !r)} style={roundBtn(C.lavender)}>
            {running ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" />}
          </button>
          <button onClick={() => { setSeconds(0); setRunning(false); }} style={roundBtn("#EFE7FA")}>
            <RotateCcw size={20} color={C.lavenderDeep} />
          </button>
          <button onClick={finish} style={roundBtn("#BFEAD5")}>
            <Check size={20} color="#3E9B76" />
          </button>
        </div>
        <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 14 }}>Tap check to save this session to {subj?.name || "a subject"}.</p>
      </Card>
    </div>
  );
}

function roundBtn(bg) {
  return {
    width: 54,
    height: 54,
    borderRadius: "50%",
    border: "none",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };
}

/* ---------------------------------- TODO ---------------------------------- */

function TodoTab({ subjects, todos, setTodos }) {
  const [text, setText] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [priority, setPriority] = useState("medium");
  const [recurring, setRecurring] = useState(false);

  function addTodo() {
    if (!text.trim()) return;
    setTodos((prev) => [
      { id: Date.now(), text: text.trim(), subjectId, priority, recurring, done: false, due: todayStr() },
      ...prev,
    ]);
    setText("");
  }

  function toggle(id) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function remove(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);
  const prColor = { high: "#C05C5C", medium: "#B8922E", low: "#3E9B76" };

  return (
    <div>
      <SectionTitle sub="Small tasks, checked off, one sparkle at a time.">To-do list</SectionTitle>

      <Card style={{ marginBottom: 16 }}>
        <input placeholder="What do you need to do?" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTodo()} style={{ ...inputStyle, marginTop: 0 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={selectStyle}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={selectStyle}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.inkSoft, cursor: "pointer" }}>
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Repeats weekly
          </label>
          <PrimaryButton onClick={addTodo} style={{ marginLeft: "auto", padding: "10px 16px" }}>
            <Plus size={16} /> Add
          </PrimaryButton>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>Active ({active.length})</p>
        {active.length === 0 && <EmptyState text="All clear! Add something above." />}
        {active.map((t) => {
          const subj = subjects.find((s) => s.id === t.subjectId);
          const pal = subj ? PALETTE[subj.colorIdx % PALETTE.length] : PALETTE[0];
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <button onClick={() => toggle(t.id)} style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${C.border}`, background: "#fff", cursor: "pointer", flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: C.ink, flex: 1 }}>{t.text}</span>
              {t.recurring && <span style={{ fontSize: 10, color: C.inkSoft }}>↻ weekly</span>}
              <span style={{ width: 8, height: 8, borderRadius: 99, background: prColor[t.priority] }} />
              {subj && <span style={{ fontSize: 11, color: pal.text, background: pal.bg, padding: "3px 8px", borderRadius: 99, fontWeight: 700 }}>{subj.name}</span>}
              <Trash2 size={15} color={C.inkSoft} style={{ cursor: "pointer" }} onClick={() => remove(t.id)} />
            </div>
          );
        })}
      </Card>

      {done.length > 0 && (
        <Card>
          <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>Done ({done.length})</p>
          {done.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <button onClick={() => toggle(t.id)} style={{ width: 22, height: 22, borderRadius: 7, border: "none", background: C.mintDot || "#BFEAD5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check size={14} color="#fff" />
              </button>
              <span style={{ fontSize: 14, color: C.inkSoft, textDecoration: "line-through", flex: 1 }}>{t.text}</span>
              <Trash2 size={15} color={C.inkSoft} style={{ cursor: "pointer" }} onClick={() => remove(t.id)} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

const selectStyle = {
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 13,
  color: C.ink,
  background: "#fff",
  fontFamily: "'Nunito', sans-serif",
};

/* ---------------------------------- NOTES ---------------------------------- */

function NotesRenderer({ content }) {
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  return (
    <div>
      {lines.map((line, i) => {
        const t = line.trim();
        if (t.startsWith("## ")) {
          return <h4 key={i} style={{ color: C.lavenderDeep, fontSize: 16, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>{t.replace("## ", "")}</h4>;
        }
        if (t.startsWith("# ")) {
          return <h3 key={i} style={{ color: C.ink, fontSize: 18, fontWeight: 800, marginTop: 18, marginBottom: 8 }}>{t.replace("# ", "")}</h3>;
        }
        if (t.startsWith("- ") || t.startsWith("* ")) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: C.lavender, marginTop: 2 }}>●</span>
              <span style={{ fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{t.replace(/^[-*]\s/, "")}</span>
            </div>
          );
        }
        return <p key={i} style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, marginBottom: 6 }}>{t}</p>;
      })}
    </div>
  );
}

function NotesTab({ subjects, notes, setNotes }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const subj = subjects.find((s) => s.id === subjectId);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const text = await askClaude(
        `Topic: "${topic}" (subject: ${subj?.name || "general"}). Create clear, well-organized study notes on this topic.`,
        "You are Sparkly, a friendly study assistant. Produce study notes using this exact format: a '# ' line for the main topic title, then several '## ' section headings, and under each, '- ' bullet points with the key facts, explained simply and precisely. No intro or closing remarks, no markdown other than # ## and -. Keep it thorough but scannable.",
        1400
      );
      const note = { id: Date.now(), subjectId, topic: topic.trim(), content: text, date: todayStr() };
      setNotes((prev) => [note, ...prev]);
      setViewing(note.id);
      setTopic("");
    } catch (e) {
      setError("Couldn't generate notes right now. Try again in a moment.");
    }
    setLoading(false);
  }

  const subjectNotes = notes.filter((n) => n.subjectId === subjectId);
  const activeNote = notes.find((n) => n.id === viewing);

  return (
    <div>
      <SectionTitle sub="Give it a topic, get tidy bullet-point notes.">AI notes</SectionTitle>

      <Card style={{ marginBottom: 16 }}>
        <SubjectPicker subjects={subjects} value={subjectId} onChange={(id) => { setSubjectId(id); setViewing(null); }} />
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input placeholder="e.g. Photosynthesis, Recursion, Thermodynamics..." value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
          <PrimaryButton onClick={generate} disabled={loading || !topic.trim()}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkle size={16} color="#fff" />}
            {loading ? "Writing..." : "Generate"}
          </PrimaryButton>
        </div>
        {error && <p style={{ color: "#C05C5C", fontSize: 13, marginTop: 8 }}>{error}</p>}
      </Card>

      {activeNote ? (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <button onClick={() => setViewing(null)} style={{ fontSize: 12, color: C.lavenderDeep, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>← All notes</button>
          </div>
          <NotesRenderer content={activeNote.content} />
        </Card>
      ) : (
        <Card>
          <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>Saved notes for {subj?.name}</p>
          {subjectNotes.length === 0 ? (
            <EmptyState text="No notes yet — generate your first one above." />
          ) : (
            subjectNotes.map((n) => (
              <div key={n.id} onClick={() => setViewing(n.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{n.topic}</span>
                <ChevronRight size={16} color={C.inkSoft} />
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------- QUIZ ---------------------------------- */

function QuizTab({ subjects, quizHistory, setQuizHistory }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const subj = subjects.find((s) => s.id === subjectId);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setSubmitted(false);
    setAnswers({});
    try {
      const text = await askClaude(
        `Topic: "${topic}" (subject: ${subj?.name || "general"}). Create a 5-question multiple choice quiz.`,
        `You are a quiz generator. Reply with ONLY valid JSON, no prose, no markdown fences, in exactly this shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}
Make exactly 5 questions, each with exactly 4 options, testing real understanding of the topic.`,
        1400
      );
      const parsed = extractJson(text);
      setQuiz({ topic: topic.trim(), subjectId, questions: parsed.questions });
    } catch (e) {
      setError("Couldn't build that quiz — try a slightly different topic.");
    }
    setLoading(false);
  }

  function pick(qIdx, optIdx) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  }

  function submit() {
    setSubmitted(true);
    const score = quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
    setQuizHistory((prev) => [{ id: Date.now(), subjectId: quiz.subjectId, topic: quiz.topic, score, total: quiz.questions.length, date: todayStr() }, ...prev]);
  }

  const score = quiz ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0) : 0;

  return (
    <div>
      <SectionTitle sub="Test yourself with a fresh quiz on any topic.">Quiz</SectionTitle>

      {!quiz && (
        <Card style={{ marginBottom: 16 }}>
          <SubjectPicker subjects={subjects} value={subjectId} onChange={setSubjectId} />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input placeholder="Topic for your quiz..." value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
            <PrimaryButton onClick={generate} disabled={loading || !topic.trim()}>
              {loading ? "Building..." : "Generate"} <Sparkle size={16} color="#fff" />
            </PrimaryButton>
          </div>
          {error && <p style={{ color: "#C05C5C", fontSize: 13, marginTop: 8 }}>{error}</p>}
        </Card>
      )}

      {quiz && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => setQuiz(null)} style={{ fontSize: 12, color: C.lavenderDeep, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>← New quiz</button>
            {submitted && <span style={{ fontWeight: 800, color: C.ink }}>{score}/{quiz.questions.length}</span>}
          </div>
          {quiz.questions.map((q, qi) => (
            <Card key={qi} style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 700, color: C.ink, marginBottom: 12 }}>{qi + 1}. {q.question}</p>
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                let bg = "#fff", border = C.border, txt = C.ink;
                if (submitted) {
                  if (oi === q.correctIndex) { bg = "#E3F7EE"; border = "#A3E3C4"; txt = "#3E9B76"; }
                  else if (chosen) { bg = "#FBE3E3"; border = "#F0B4B4"; txt = "#C05C5C"; }
                } else if (chosen) { bg = C.lavenderSoft; border = C.lavender; txt = C.lavenderDeep; }
                return (
                  <div key={oi} onClick={() => pick(qi, oi)} style={{ padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${border}`, background: bg, color: txt, marginBottom: 8, cursor: submitted ? "default" : "pointer", fontSize: 14, fontWeight: 600 }}>
                    {opt}
                  </div>
                );
              })}
              {submitted && <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 8, fontStyle: "italic" }}>{q.explanation}</p>}
            </Card>
          ))}
          {!submitted ? (
            <PrimaryButton style={{ width: "100%" }} disabled={Object.keys(answers).length < quiz.questions.length} onClick={submit}>
              Submit quiz
            </PrimaryButton>
          ) : (
            <p style={{ textAlign: "center", color: C.inkSoft, fontSize: 13 }}>Saved to your quiz history ✨</p>
          )}
        </>
      )}

      {!quiz && quizHistory.length > 0 && (
        <Card>
          <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>Recent quizzes</p>
          {quizHistory.slice(0, 6).map((h) => {
            const s = subjects.find((x) => x.id === h.subjectId);
            const pal = s ? PALETTE[s.colorIdx % PALETTE.length] : PALETTE[0];
            return (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.ink }}>{h.topic}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: pal.text, background: pal.bg, padding: "3px 9px", borderRadius: 99 }}>{h.score}/{h.total}</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------- MINDMAP ---------------------------------- */

function MindNode({ node, depth, colorIdx }) {
  const [open, setOpen] = useState(depth < 2);
  const pal = PALETTE[colorIdx % PALETTE.length];
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 20 }}>
      <div
        onClick={() => hasChildren && setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: pal.bg,
          color: pal.text,
          padding: depth === 0 ? "12px 18px" : "8px 14px",
          borderRadius: 12,
          fontWeight: depth === 0 ? 800 : 600,
          fontSize: depth === 0 ? 16 : 13.5,
          marginBottom: 8,
          marginTop: depth === 0 ? 0 : 4,
          cursor: hasChildren ? "pointer" : "default",
          width: "fit-content",
          maxWidth: "100%",
        }}
      >
        {hasChildren && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        {node.label}
      </div>
      {open && hasChildren && (
        <div style={{ borderLeft: `2px dashed ${pal.dot}`, paddingLeft: 4 }}>
          {node.children.map((c, i) => (
            <MindNode key={i} node={c} depth={depth + 1} colorIdx={colorIdx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function MindmapTab({ subjects }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tree, setTree] = useState(null);
  const subj = subjects.find((s) => s.id === subjectId);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const text = await askClaude(
        `Topic: "${topic}" (subject: ${subj?.name || "general"}). Build a mindmap breaking it into its main branches and sub-points.`,
        `Reply with ONLY valid JSON, no prose, no markdown fences, in exactly this shape:
{"label":"Main Topic","children":[{"label":"Branch","children":[{"label":"Sub-point","children":[]}]}]}
Use 3-5 main branches, each with 2-4 sub-points. Keep labels short (under 6 words). Max depth 3.`,
        1200
      );
      const parsed = extractJson(text);
      setTree(parsed);
    } catch (e) {
      setError("Couldn't map that topic — try rephrasing it.");
    }
    setLoading(false);
  }

  return (
    <div>
      <SectionTitle sub="See how the pieces of a topic connect.">Mindmap</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <SubjectPicker subjects={subjects} value={subjectId} onChange={setSubjectId} />
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input placeholder="Topic to map out..." value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
          <PrimaryButton onClick={generate} disabled={loading || !topic.trim()}>
            {loading ? "Mapping..." : "Generate"} <Sparkle size={16} color="#fff" />
          </PrimaryButton>
        </div>
        {error && <p style={{ color: "#C05C5C", fontSize: 13, marginTop: 8 }}>{error}</p>}
      </Card>

      <Card>
        {!tree ? <EmptyState text="Your mindmap will branch out here." /> : <MindNode node={tree} depth={0} colorIdx={subj ? subj.colorIdx : 0} />}
      </Card>
    </div>
  );
}

/* ---------------------------------- PROGRESS ---------------------------------- */

function ProgressTab({ subjects, sessions, quizHistory, todos }) {
  const totals = subjects.map((s) => ({
    subject: s,
    seconds: sessions.filter((x) => x.subjectId === s.id).reduce((a, x) => a + x.seconds, 0),
  }));
  const maxSec = Math.max(1, ...totals.map((t) => t.seconds));
  const totalHours = totals.reduce((a, t) => a + t.seconds, 0);
  const quizzesTaken = quizHistory.length;
  const avgScore = quizzesTaken ? Math.round((quizHistory.reduce((a, q) => a + q.score / q.total, 0) / quizzesTaken) * 100) : 0;
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div>
      <SectionTitle sub="A gentle look at how far you've come.">Progress</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total time", value: fmtSeconds(totalHours), bg: "#EFE7FA" },
          { label: "Quizzes", value: `${quizzesTaken}`, bg: "#FCE9F0" },
          { label: "Avg score", value: `${avgScore}%`, bg: "#E3F7EE" },
        ].map((s) => (
          <Card key={s.label} style={{ background: s.bg, textAlign: "center", padding: 14 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: C.inkSoft, marginTop: 4, fontWeight: 700 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 14px" }}>Time by subject</p>
        {totals.every((t) => t.seconds === 0) ? (
          <EmptyState text="Log a study session to see this fill up." />
        ) : (
          totals.map((t) => {
            const pal = PALETTE[t.subject.colorIdx % PALETTE.length];
            return (
              <div key={t.subject.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: C.ink }}>{t.subject.name}</span>
                  <span style={{ color: C.inkSoft }}>{fmtSeconds(t.seconds)}</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: pal.bg, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(t.seconds / maxSec) * 100}%`, background: pal.dot, borderRadius: 99, transition: "width .3s" }} />
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Card>
        <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>This week's wins</p>
        <p style={{ fontSize: 13, color: C.inkSoft }}>{doneCount} tasks completed · {sessions.length} study sessions logged · {quizzesTaken} quizzes taken</p>
      </Card>
    </div>
  );
}

/* ---------------------------------- CHAT ---------------------------------- */

function ChatTab({ subjects }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your Sparkly study buddy 💫 Ask me to explain something, quiz you verbally, or help plan your session." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const historyText = next.map((m) => `${m.role === "user" ? "Student" : "Sparkly"}: ${m.text}`).join("\n");
      const subjectList = subjects.map((s) => s.name).join(", ");
      const reply = await askClaude(
        historyText + "\nSparkly:",
        `You are Sparkly, a warm, encouraging AI study buddy inside a study app. The student is studying: ${subjectList || "various subjects"}. Explain things clearly and simply, keep answers focused and not too long, and be supportive without being over the top. You may use light emoji occasionally, sparingly.`,
        800
      );
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Hmm, I couldn't respond just now — try again?" }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <SectionTitle sub="Your always-on study buddy.">Ask Sparkly</SectionTitle>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "4px 2px", marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div
              style={{
                maxWidth: "78%",
                padding: "10px 15px",
                borderRadius: 16,
                borderBottomRightRadius: m.role === "user" ? 4 : 16,
                borderBottomLeftRadius: m.role === "user" ? 16 : 4,
                background: m.role === "user" ? "linear-gradient(135deg,#C9B6E4,#B497D6)" : "#fff",
                color: m.role === "user" ? "#fff" : C.ink,
                border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "10px 15px" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: 99, background: C.lavender, animation: `bounce 1s ${i * 0.15}s infinite` }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="Ask anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
        <button onClick={send} disabled={loading} style={{ ...roundBtn(C.lavender), width: 46, height: 46 }}>
          <Send size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- CALENDAR ---------------------------------- */

function CalendarTab({ subjects, todos, events, setEvents }) {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(todayStr());
  const [newEvent, setNewEvent] = useState("");

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = cursor.toLocaleString("default", { month: "long" });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function itemsFor(dstr) {
    const t = todos.filter((x) => x.due === dstr);
    const e = events.filter((x) => x.date === dstr);
    return [...t.map((x) => ({ ...x, kind: "todo" })), ...e.map((x) => ({ ...x, kind: "event", text: x.title }))];
  }

  function addEvent() {
    if (!newEvent.trim()) return;
    setEvents((prev) => [...prev, { id: Date.now(), date: selected, title: newEvent.trim() }]);
    setNewEvent("");
  }

  const selectedItems = itemsFor(selected);

  return (
    <div>
      <SectionTitle sub="See your to-dos and sessions laid out.">Calendar</SectionTitle>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={{ ...roundBtn("#EFE7FA"), width: 34, height: 34 }}>
            <ChevronRight size={16} color={C.lavenderDeep} style={{ transform: "rotate(180deg)" }} />
          </button>
          <p style={{ fontWeight: 800, color: C.ink, fontSize: 16 }}>{monthName} {year}</p>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={{ ...roundBtn("#EFE7FA"), width: 34, height: 34 }}>
            <ChevronRight size={16} color={C.lavenderDeep} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, color: C.inkSoft, fontWeight: 700 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const dstr = dateStr(d);
            const items = itemsFor(dstr);
            const isSelected = dstr === selected;
            const isToday = dstr === todayStr();
            return (
              <div
                key={i}
                onClick={() => setSelected(dstr)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: isSelected ? C.lavender : isToday ? C.lavenderSoft : "transparent",
                  color: isSelected ? "#fff" : C.ink,
                  fontWeight: isToday ? 800 : 500,
                  fontSize: 13,
                  position: "relative",
                }}
              >
                {d}
                {items.length > 0 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                    {items.slice(0, 3).map((it, k) => {
                      const s = subjects.find((sub) => sub.id === it.subjectId);
                      const pal = s ? PALETTE[s.colorIdx % PALETTE.length] : { dot: isSelected ? "#fff" : C.lavender };
                      return <span key={k} style={{ width: 4, height: 4, borderRadius: 99, background: pal.dot }} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <p style={{ fontWeight: 700, color: C.ink, marginBottom: 10 }}>
          {new Date(selected + "T00:00:00").toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        {selectedItems.length === 0 ? (
          <EmptyState text="Nothing scheduled — add something below." />
        ) : (
          selectedItems.map((it) => {
            const s = subjects.find((sub) => sub.id === it.subjectId);
            const pal = s ? PALETTE[s.colorIdx % PALETTE.length] : PALETTE[0];
            return (
              <div key={it.kind + it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: pal.dot }} />
                <span style={{ fontSize: 14, color: C.ink }}>{it.text}</span>
                {it.kind === "event" && <span style={{ fontSize: 10, color: C.inkSoft, marginLeft: "auto" }}>event</span>}
              </div>
            );
          })
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input placeholder="Add an event or exam..." value={newEvent} onChange={(e) => setNewEvent(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEvent()} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
          <button onClick={addEvent} style={{ ...roundBtn(C.lavender), width: 40, height: 40 }}>
            <Plus size={17} color="#fff" />
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- SHELL ---------------------------------- */

export default function Sparkly() {
  const [screen, setScreen] = useState("login");
  const [userName, setUserName] = useState("");
  const [klass, setKlass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [tab, setTab] = useState("home");

  const [todos, setTodos] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [streak] = useState(3);

  function handleLogin(name) {
    setUserName(name);
    setScreen("onboarding");
  }

  function handleOnboardingDone({ klass, subjects: subNames }) {
    setKlass(klass);
    setSubjects(subNames.map((name, i) => ({ id: `subj-${i}-${Date.now()}`, name, colorIdx: i })));
    setScreen("app");
  }

  function logSession(subjectId, seconds) {
    setSessions((prev) => [...prev, { subjectId, seconds, date: todayStr() }]);
  }

  if (screen === "login") return <LoginScreen onLogin={handleLogin} />;
  if (screen === "onboarding") return <Onboarding userName={userName} onDone={handleOnboardingDone} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Nunito', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Nunito', sans-serif; box-sizing: border-box; }
        input, select, button { font-family: 'Nunito', sans-serif; }
        input:focus, select:focus { border-color: ${C.lavender} !important; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-4px);opacity:1} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
      `}</style>

      {/* Desktop sidebar */}
      <div className="desktop-nav" style={{ width: 220, borderRight: `1px solid ${C.border}`, padding: "24px 14px", display: "none", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px 26px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#C9B6E4,#F7C6D9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkle size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: C.ink }}>sparkly</span>
        </div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                border: "none",
                background: active ? C.lavenderSoft : "transparent",
                color: active ? C.lavenderDeep : C.inkSoft,
                fontWeight: active ? 700 : 600,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 3,
                textAlign: "left",
              }}
            >
              <Icon size={17} /> {n.label}
            </button>
          );
        })}
        <div style={{ marginTop: "auto", padding: "10px 14px", fontSize: 12, color: C.inkSoft }}>
          {userName} · {klass}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "24px 18px 100px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
        {tab === "home" && <HomeTab userName={userName} subjects={subjects} todos={todos} sessions={sessions} streak={streak} setTab={setTab} />}
        {tab === "timer" && <TimerTab subjects={subjects} onLogSession={logSession} />}
        {tab === "todo" && <TodoTab subjects={subjects} todos={todos} setTodos={setTodos} />}
        {tab === "notes" && <NotesTab subjects={subjects} notes={notes} setNotes={setNotes} />}
        {tab === "quiz" && <QuizTab subjects={subjects} quizHistory={quizHistory} setQuizHistory={setQuizHistory} />}
        {tab === "mindmap" && <MindmapTab subjects={subjects} />}
        {tab === "progress" && <ProgressTab subjects={subjects} sessions={sessions} quizHistory={quizHistory} todos={todos} />}
        {tab === "chat" && <ChatTab subjects={subjects} />}
        {tab === "calendar" && <CalendarTab subjects={subjects} todos={todos} events={events} setEvents={setEvents} />}
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: `1px solid ${C.border}`, display: "flex", overflowX: "auto", padding: "8px 4px", zIndex: 10 }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              style={{
                flex: "1 0 auto",
                minWidth: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                background: "none",
                border: "none",
                color: active ? C.lavenderDeep : C.inkSoft,
                cursor: "pointer",
                padding: "4px 6px",
              }}
            >
              <Icon size={19} />
              <span style={{ fontSize: 9.5, fontWeight: 700 }}>{n.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        @media (min-width: 860px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
