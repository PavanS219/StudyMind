import { useState, useRef, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import "./ChatPanel.css";

export default function ChatPanel({ sessionId }) {
  const { messages, setMessages } = useStudy();
  const [input,   setInput]       = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuestion = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("http://localhost:8000/ask", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ session_id: sessionId, question: q }),
      });
      const data = await res.json();
      const answer = res.ok ? data.answer : (data.detail || "Something went wrong.");
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Could not reach the backend.", error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuestion(); }
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg--${msg.role} ${msg.error ? "chat-msg--error" : ""}`} style={{ animationDelay: `${i * 0.04}s` }}>
            {msg.role === "assistant" && <span className="msg-avatar">S</span>}
            <div className="msg-bubble">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg chat-msg--assistant">
            <span className="msg-avatar">S</span>
            <div className="msg-bubble typing-indicator"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-wrap glass">
        <textarea className="chat-input" placeholder="Ask a question about your documents..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} />
        <button className="chat-send-btn" onClick={sendQuestion} disabled={loading || !input.trim()}>
          {loading ? <span className="send-spinner" /> : "↑"}
        </button>
      </div>
    </div>
  );
}