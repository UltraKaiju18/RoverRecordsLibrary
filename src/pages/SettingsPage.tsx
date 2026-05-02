import { useRef, useState } from 'react';
import { useLibrary } from '../store/libraryStore';
import { ARTIST_COLUMN, GENRE_COLUMN } from '../lib/csvParser';

export default function SettingsPage() {
  const { records, csvFilename, loadFromText, clearLibrary, error } = useLibrary();
  const [dragging, setDragging] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      loadFromText(text, file.name);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    };
    reader.readAsText(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFile(file);
    }
  }

  async function loadSampleData() {
    const res = await fetch('/RoverRecordsLibrary/sample-library.csv');
    const text = await res.text();
    loadFromText(text, 'sample-library.csv');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="settings-page">
      <h2 className="settings-title">Library Settings</h2>

      {/* Column info */}
      <div className="settings-card">
        <div className="settings-card-title">📋 Expected CSV Columns</div>
        <div className="column-info">
          <div className="column-pill artist-col">
            <span className="col-label">Artist</span>
            <code>{ARTIST_COLUMN}</code>
          </div>
          <div className="column-pill genre-col">
            <span className="col-label">Genre</span>
            <code>{GENRE_COLUMN}</code>
          </div>
        </div>
        <p className="settings-note">
          Your Discogs export CSV must contain these exact column headers. Other columns are ignored.
        </p>
      </div>

      {/* Upload area */}
      <div className="settings-card">
        <div className="settings-card-title">📂 Upload CSV</div>
        <div
          id="drop-zone"
          className={`drop-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="drop-icon">📁</div>
          <div className="drop-text">
            {dragging ? 'Drop it!' : 'Tap to select or drag & drop'}
          </div>
          <div className="drop-subtext">CSV files only</div>
        </div>
        <input
          ref={fileInputRef}
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />

        {error && (
          <div className="settings-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="settings-success">
            ✅ Library loaded successfully!
          </div>
        )}
      </div>

      {/* Current library status */}
      {records.length > 0 && (
        <div className="settings-card">
          <div className="settings-card-title">✅ Current Library</div>
          <div className="library-stats">
            <div className="stat">
              <span className="stat-value">{records.length}</span>
              <span className="stat-label">Artists</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {new Set(records.map(r => r.genre)).size}
              </span>
              <span className="stat-label">Genres</span>
            </div>
          </div>
          {csvFilename && <p className="settings-filename">📄 {csvFilename}</p>}
          <div className="preview-list">
            {records.slice(0, 5).map((r, i) => (
              <div key={i} className="preview-row">
                <span className="preview-artist">{r.artist}</span>
                <span className="preview-genre">{r.genre}</span>
              </div>
            ))}
            {records.length > 5 && (
              <p className="preview-more">…and {records.length - 5} more</p>
            )}
          </div>
          <button id="clear-library-btn" className="btn-danger" onClick={clearLibrary}>
            🗑 Clear Library
          </button>
        </div>
      )}

      {/* Load sample data */}
      {records.length === 0 && (
        <div className="settings-card">
          <div className="settings-card-title">🎵 Try Sample Data</div>
          <p className="settings-note">Load a sample library to try the app before uploading your own CSV.</p>
          <button id="load-sample-btn" className="btn-secondary" onClick={loadSampleData}>
            Load Sample Library
          </button>
        </div>
      )}
    </div>
  );
}
