import { useState, useRef } from "react";
import "./UploadZone.css";

export default function UploadZone({ onUpload, uploading, compact = false }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
    e.target.value = "";
  };

  if (compact) {
    return (
      <div className="upload-compact">
        <button
          className="upload-compact-btn"
          onClick={() => inputRef.current.click()}
          disabled={uploading}
        >
          {uploading ? (
            <span className="uploading-spinner" />
          ) : (
            <span>+ Add source</span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div
      className={`upload-zone ${dragging ? "upload-zone--dragging" : ""} ${uploading ? "upload-zone--uploading" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {uploading ? (
        <div className="upload-loading">
          <div className="upload-spinner" />
          <p>Processing document...</p>
        </div>
      ) : (
        <div className="upload-content">
          <div className="upload-icon-wrap">
            <span className="upload-icon">↑</span>
          </div>
          <p className="upload-title">Drop your study material here</p>
          <p className="upload-sub">PDF or TXT files · Click or drag to upload</p>
        </div>
      )}
    </div>
  );
}
