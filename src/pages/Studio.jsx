import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import UploadZone from "../components/UploadZone";
import ChatPanel from "../components/ChatPanel";
import FlashcardPanel from "../components/FlashcardPanel";
import MCQPanel from "../components/MCQPanel";
import SummaryPanel from "../components/SummaryPanel";
import { StudyProvider } from "../context/StudyContext";
import "./Studio.css";

const API  = "http://localhost:8000";
const TABS = ["chat", "summary", "flashcards", "mcq"];

export default function Studio({ sessionId }) {
  const [activeTab,  setActiveTab]  = useState("chat");
  const [documents,  setDocuments]  = useState([]);
  const [uploading,  setUploading]  = useState(false);
  const [docsLoaded, setDocsLoaded] = useState(false); // prevents flash of "no sources"

  // ── On mount: restore doc list from backend (survives page refresh) ────────
  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API}/session/${sessionId}/docs`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.documents?.length) setDocuments(data.documents);
      })
      .catch(() => {})
      .finally(() => setDocsLoaded(true));
  }, [sessionId]);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${API}/upload?session_id=${sessionId}`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || "Upload failed"); return; }
      setDocuments(data.documents);
    } catch {
      alert("Could not connect to backend. Is it running on port 8000?");
    } finally {
      setUploading(false);
    }
  };

  const hasDocuments = documents.length > 0;

  // Don't flash "no sources" while we're loading from backend
  if (!docsLoaded) {
    return (
      <div className="studio-root">
        <div className="bg-blobs">
          <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
        </div>
        <div className="init-screen"><div className="init-spinner" /><p>Restoring session...</p></div>
      </div>
    );
  }

  return (
    <StudyProvider>
      <div className="studio-root">
        <div className="bg-blobs">
          <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
        </div>

        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} documents={documents} tabs={TABS} sessionId={sessionId} onDocDeleted={(doc) => setDocuments((prev) => prev.filter((d) => d !== doc))} />

        <main className="studio-main">
          <header className="studio-header glass">
            <div className="header-brand">
              <span className="header-logo">S</span>
              <span className="header-title">StudyMind</span>
            </div>
            <div className="header-status">
              {hasDocuments ? (
                <span className="status-badge status-ready">
                  <span className="status-dot" />
                  {documents.length} source{documents.length > 1 ? "s" : ""} loaded
                </span>
              ) : (
                <span className="status-badge status-empty">No sources</span>
              )}
            </div>
          </header>

          {!hasDocuments ? (
            <div className="studio-welcome fade-up">
              <h1 className="welcome-title">Your AI Study Partner</h1>
              <p className="welcome-sub">
                Upload your notes or PDFs and start asking questions, generating flashcards, MCQs, and summaries.
              </p>
              <UploadZone onUpload={handleUpload} uploading={uploading} />
            </div>
          ) : (
            <div className="studio-workspace fade-up">
              <UploadZone onUpload={handleUpload} uploading={uploading} compact />

              {/* All panels always mounted — display toggled via CSS so state never dies */}
              <div className="workspace-panel">
                <div style={{ display: activeTab === "chat"       ? "flex"  : "none", height: "100%" }}>
                  <ChatPanel sessionId={sessionId} />
                </div>
                <div style={{ display: activeTab === "summary"    ? "block" : "none" }}>
                  <SummaryPanel sessionId={sessionId} />
                </div>
                <div style={{ display: activeTab === "flashcards" ? "block" : "none" }}>
                  <FlashcardPanel sessionId={sessionId} />
                </div>
                <div style={{ display: activeTab === "mcq"        ? "block" : "none" }}>
                  <MCQPanel sessionId={sessionId} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </StudyProvider>
  );
}