import { useState } from "react";
import { useStudy } from "../context/StudyContext";
import "./PanelShared.css";
import "./MCQPanel.css";

export default function MCQPanel({ sessionId }) {
  const { mcqs, setMcqs, answers, setAnswers, revealed, setRevealed, numQ, setNumQ, mcqTopic, setMcqTopic } = useStudy();
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setMcqs([]);
    setAnswers({});
    setRevealed({});
    try {
      const res  = await fetch("http://localhost:8000/mcq", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ session_id: sessionId, num_questions: numQ, topic: mcqTopic || null }),
      });
      const data = await res.json();
      if (res.ok) setMcqs(data.mcqs);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qi, opt) => { if (!revealed[qi]) setAnswers((prev) => ({ ...prev, [qi]: opt[0] })); };
  const checkAnswer  = (qi)      => setRevealed((prev) => ({ ...prev, [qi]: true }));
  const score = Object.keys(revealed).filter((qi) => answers[qi] === mcqs[qi]?.correct).length;

  return (
    <div className="panel-wrap">
      <div className="panel-header">
        <h2 className="panel-title">MCQ Quiz</h2>
        <p className="panel-sub">Test yourself with auto-generated multiple choice questions.</p>
      </div>
      <div className="panel-controls">
        <input className="panel-input" placeholder="Optional: topic focus" value={mcqTopic} onChange={(e) => setMcqTopic(e.target.value)} />
        <select className="panel-input panel-select" value={numQ} onChange={(e) => setNumQ(Number(e.target.value))}>
          {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} questions</option>)}
        </select>
        <button className="panel-btn" onClick={generate} disabled={loading}>
          {loading ? <span className="btn-spinner" /> : "Generate"}
        </button>
      </div>
      {mcqs.length > 0 && (
        <div className="mcq-list fade-up">
          <div className="score-bar">
            <span className="score-label">Score: {score} / {Object.keys(revealed).length} answered</span>
          </div>
          {mcqs.map((q, qi) => (
            <div key={qi} className="mcq-card">
              <p className="mcq-question"><span className="mcq-num">{qi + 1}.</span> {q.question}</p>
              <div className="mcq-options">
                {q.options.map((opt, oi) => {
                  const letter = opt[0];
                  const isSelected = answers[qi] === letter;
                  const isCorrect  = q.correct === letter;
                  let state = "";
                  if (revealed[qi])      state = isCorrect ? "correct" : isSelected ? "wrong" : "";
                  else if (isSelected)   state = "selected";
                  return <button key={oi} className={`mcq-option mcq-option--${state}`} onClick={() => selectAnswer(qi, opt)}>{opt}</button>;
                })}
              </div>
              {!revealed[qi] && answers[qi] && <button className="check-btn" onClick={() => checkAnswer(qi)}>Check Answer</button>}
              {revealed[qi] && <p className="mcq-explanation">{q.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}