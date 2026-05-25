import { useState } from "react";
import { useStudy } from "../context/StudyContext";
import "./PanelShared.css";
import "./SummaryPanel.css";

const LENGTH_OPTIONS = [
  { label: "Short",  value: "short",  words: "~150 words" },
  { label: "Medium", value: "medium", words: "~300 words" },
  { label: "Long",   value: "long",   words: "~600 words" },
];

// Renders **bold** and bullet lines from raw LLM markdown text
function FormattedSummary({ text }) {
  return (
    <div className="summary-body">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="summary-spacer" />;

        // Parse inline **bold**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        );

        // Detect heading lines (start with * **text**)
        const isHeading = /^\*?\s*\*\*/.test(line);
        // Detect bullet lines
        const isBullet  = /^\s*[+\-•]/.test(line);

        if (isHeading) return <p key={i} className="summary-heading">{parts}</p>;
        if (isBullet)  return <p key={i} className="summary-bullet">{parts}</p>;
        return              <p key={i} className="summary-line">{parts}</p>;
      })}
    </div>
  );
}

export default function SummaryPanel({ sessionId }) {
  const { summaryTopic, setSummaryTopic, summaryResult, setSummaryResult } = useStudy();
  const [loading, setLoading] = useState(false);
  const [length,  setLength]  = useState("medium");

  const generate = async () => {
    setLoading(true);
    setSummaryResult("");
    try {
      const res  = await fetch("http://localhost:8000/summarize", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          session_id: sessionId,
          topic:      summaryTopic || null,
          length,
        }),
      });
      const data = await res.json();
      setSummaryResult(res.ok ? data.summary : (data.detail || "Error generating summary."));
    } catch {
      setSummaryResult("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-wrap">
      <div className="panel-header">
        <h2 className="panel-title">Summary</h2>
        <p className="panel-sub">Get a structured summary of your uploaded material.</p>
      </div>

      <div className="panel-controls">
        <input
          className="panel-input"
          placeholder="Optional: focus topic (e.g. 'screen design history')"
          value={summaryTopic}
          onChange={(e) => setSummaryTopic(e.target.value)}
        />

        {/* Length selector */}
        <div className="length-tabs">
          {LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`length-tab ${length === opt.value ? "length-tab--active" : ""}`}
              onClick={() => setLength(opt.value)}
              title={opt.words}
            >
              {opt.label}
              <span className="length-words">{opt.words}</span>
            </button>
          ))}
        </div>

        <button className="panel-btn" onClick={generate} disabled={loading}>
          {loading ? <span className="btn-spinner" /> : "Generate"}
        </button>
      </div>

      {/* Scrollable result — flex: 1 + min-height: 0 is the key fix */}
      {summaryResult && (
        <div className="panel-result fade-up">
          <FormattedSummary text={summaryResult} />
        </div>
      )}
    </div>
  );
}