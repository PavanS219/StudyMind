import { useState } from "react";
import "./Sidebar.css";

const TAB_META = {
  chat:       { label: "Ask AI",     icon: "◎" },
  summary:    { label: "Summary",    icon: "≡" },
  flashcards: { label: "Flashcards", icon: "⊞" },
  mcq:        { label: "MCQ Quiz",   icon: "◈" },
};

export default function Sidebar({ activeTab, setActiveTab, documents, tabs, sessionId, onDocDeleted }) {
  const [deleting, setDeleting] = useState(null); // filename being deleted

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc}" and remove it from the knowledge base?`)) return;
    setDeleting(doc);
    try {
      const res = await fetch(
        `http://localhost:8000/delete-doc?session_id=${sessionId}&filename=${encodeURIComponent(doc)}`,
        { method: "DELETE" }
      );
      if (res.ok) onDocDeleted(doc);
      else {
        const d = await res.json();
        alert(d.detail || "Delete failed");
      }
    } catch {
      alert("Could not reach backend.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo">
        <span className="logo-mark">S</span>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => {
          const meta = TAB_META[tab];
          return (
            <button
              key={tab}
              className={`nav-btn ${activeTab === tab ? "nav-btn--active" : ""}`}
              onClick={() => setActiveTab(tab)}
              title={meta.label}
            >
              <span className="nav-icon">{meta.icon}</span>
              <span className="nav-label">{meta.label}</span>
            </button>
          );
        })}
      </nav>

      {documents.length > 0 && (
        <div className="sidebar-docs">
          <p className="docs-heading">Sources</p>
          {documents.map((doc, i) => (
            <div key={i} className="doc-item" title={doc}>
              <span className="doc-icon">{doc.endsWith(".pdf") ? "⬜" : "▭"}</span>
              <span className="doc-name">{doc}</span>
              <button
                className={`doc-delete-btn ${deleting === doc ? "doc-delete-btn--loading" : ""}`}
                onClick={() => handleDelete(doc)}
                disabled={deleting === doc}
                title={`Delete ${doc}`}
              >
                {deleting === doc ? "…" : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}