import { useState } from "react";
import { useStudy } from "../context/StudyContext";
import "./PanelShared.css";
import "./FlashcardPanel.css";

export default function FlashcardPanel({ sessionId }) {
  const { cards, setCards, flipped, setFlipped, numCards, setNumCards } = useStudy();
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setCards([]);
    setFlipped({});
    try {
      const res  = await fetch("http://localhost:8000/flashcards", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ session_id: sessionId, num_cards: numCards }),
      });
      const data = await res.json();
      if (res.ok) setCards(data.flashcards);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (i) => setFlipped((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="panel-wrap">
      <div className="panel-header">
        <h2 className="panel-title">Flashcards</h2>
        <p className="panel-sub">Click a card to reveal the answer.</p>
      </div>
      <div className="panel-controls">
        <select className="panel-input panel-select" value={numCards} onChange={(e) => setNumCards(Number(e.target.value))}>
          {[5, 8, 10, 15].map((n) => <option key={n} value={n}>{n} cards</option>)}
        </select>
        <button className="panel-btn" onClick={generate} disabled={loading}>
          {loading ? <span className="btn-spinner" /> : "Generate"}
        </button>
      </div>
      {cards.length > 0 && (
        <div className="card-grid fade-up">
          {cards.map((card, i) => (
            <div key={i} className={`flashcard ${flipped[i] ? "flashcard--flipped" : ""}`} onClick={() => toggleFlip(i)}>
              <div className="flashcard-inner">
                <div className="flashcard-front"><span className="card-label">Q</span><p>{card.question}</p></div>
                <div className="flashcard-back"><span className="card-label card-label--ans">A</span><p>{card.answer}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}