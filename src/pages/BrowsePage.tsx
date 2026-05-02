import { useState, useMemo } from 'react';
import { useLibrary } from '../store/libraryStore';
import { normalizeArtist } from '../lib/csvParser';

export default function BrowsePage() {
  const { records } = useLibrary();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = normalizeArtist(search);
    return records.filter(r =>
      normalizeArtist(r.artist).includes(q) ||
      r.genre.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  // Group by genre for nice display
  const genreColors: Record<string, string> = {};
  const palette = [
    '#f0a500', '#e05252', '#52a0e0', '#52e07c',
    '#c552e0', '#e0a052', '#52e0d8', '#e07c52',
    '#8452e0', '#52e052',
  ];
  let colorIdx = 0;
  records.forEach(r => {
    if (!genreColors[r.genre]) {
      genreColors[r.genre] = palette[colorIdx % palette.length];
      colorIdx++;
    }
  });

  return (
    <div className="browse-page">
      <div className="browse-header">
        <input
          id="browse-search-input"
          type="text"
          className="browse-search"
          placeholder="Search artist or genre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <span className="browse-count">{filtered.length} artists</span>
      </div>

      {records.length === 0 ? (
        <div className="browse-empty">
          <div className="browse-empty-icon">💿</div>
          <p>No library loaded.</p>
          <p>Upload your CSV in <strong>Settings</strong>.</p>
        </div>
      ) : (
        <div className="artist-list">
          {filtered.map((record, i) => (
            <div key={i} className="artist-row" id={`artist-row-${i}`}>
              <div className="artist-row-name">{record.artist}</div>
              <div
                className="artist-row-genre"
                style={{ background: genreColors[record.genre] + '22', color: genreColors[record.genre], borderColor: genreColors[record.genre] + '55' }}
              >
                {record.genre}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="browse-no-results">No results for "{search}"</div>
          )}
        </div>
      )}
    </div>
  );
}
