import { useState, useEffect } from "react";
import Studio from "./pages/Studio";
import "./App.css";

const API = "http://localhost:8000";
const SESSION_KEY = "studymind_session_id";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [error, setError]         = useState(null);
  const [retrying, setRetrying]   = useState(false);

  const initSession = async (forceNew = false) => {
    setError(null);
    setRetrying(true);

    try {
      // 1. Health check — confirm backend is alive
      const health = await fetch(`${API}/health`).catch(() => null);
      if (!health || !health.ok) {
        throw new Error(
          "Backend is not running on port 8000.\nStart it with: uvicorn main:app --reload"
        );
      }

      // 2. Reuse existing session if still valid (survives page refresh + server restart)
      const saved = !forceNew && localStorage.getItem(SESSION_KEY);
      if (saved) {
        // Verify session still exists on backend (backend persists sessions.json)
        const check = await fetch(`${API}/session/${saved}/docs`);
        if (check.ok) {
          setSessionId(saved);
          setRetrying(false);
          return;
        }
        // Session not found on backend — create a new one
        localStorage.removeItem(SESSION_KEY);
      }

      // 3. Create new session
      const res = await fetch(`${API}/session/create`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenant_id: "default", department: "general" }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      localStorage.setItem(SESSION_KEY, data.session_id);  // persist across refreshes
      setSessionId(data.session_id);

    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => { initSession(); }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!sessionId && !error) {
    return (
      <div className="init-screen">
        <div className="init-spinner" />
        <p>{retrying ? "Connecting to backend..." : "Initializing session..."}</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="init-screen">
        <div className="init-error">
          <span className="init-error-icon">⚠️</span>
          <h2>Could not connect</h2>
          <pre className="init-error-msg">{error}</pre>
          <div className="init-error-actions">
            <button onClick={() => initSession(false)} disabled={retrying} className="init-retry-btn">
              {retrying ? "Retrying..." : "Retry"}
            </button>
            <button onClick={() => initSession(true)} disabled={retrying} className="init-new-btn">
              New Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── App ────────────────────────────────────────────────────────────────────
  return <Studio sessionId={sessionId} />;
}