import { useState, useCallback, useRef } from 'react';
import { useLibrary } from '../store/libraryStore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { findBestMatch } from '../lib/fuzzyMatch';

type ResultState =
  | { type: 'idle' }
  | { type: 'found'; artist: string; genre: string }
  | { type: 'notfound'; query: string };

export default function ListenPage() {
  const { lookupMap, records } = useLibrary();
  const { speak } = useSpeechSynthesis();
  const [result, setResult] = useState<ResultState>({ type: 'idle' });
  const [typeQuery, setTypeQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuery = useCallback(
    (query: string) => {
      if (!query.trim() || records.length === 0) return;
      const match = findBestMatch(query, lookupMap);
      if (match) {
        setResult({ type: 'found', artist: match.record.artist, genre: match.record.genre });
        speak(`${match.record.artist}. Genre: ${match.record.genre}`);
      } else {
        setResult({ type: 'notfound', query });
        speak(`Artist not found: ${query}`);
      }
    },
    [lookupMap, records.length, speak]
  );

  const { status, interimTranscript, error, supported, startListening, stopListening } =
    useSpeechRecognition(handleQuery);

  const isListening = status === 'listening';

  function handleTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (typeQuery.trim()) {
      handleQuery(typeQuery.trim());
      setTypeQuery('');
    }
  }

  function handleMicClick() {
    if (isListening) {
      stopListening();
    } else {
      setResult({ type: 'idle' });
      startListening();
    }
  }

  const noLibrary = records.length === 0;

  return (
    <div className="listen-page">
      {noLibrary && (
        <div className="no-library-banner">
          <span>⚠️</span>
          <span>No library loaded. Go to <strong>Settings</strong> to upload your CSV.</span>
        </div>
      )}

      {/* Result Display */}
      <div className={`result-card ${result.type !== 'idle' ? 'visible' : ''}`}>
        {result.type === 'found' && (
          <>
            <div className="result-artist">{result.artist}</div>
            <div className="result-divider" />
            <div className="result-genre">{result.genre}</div>
          </>
        )}
        {result.type === 'notfound' && (
          <>
            <div className="result-notfound-icon">🔍</div>
            <div className="result-notfound-text">
              "{result.query}" not found in library
            </div>
          </>
        )}
        {result.type === 'idle' && (
          <div className="result-idle">
            <div className="vinyl-icon">🎵</div>
            <p>Say or type an artist name</p>
          </div>
        )}
      </div>

      {/* Interim transcript while speaking */}
      {interimTranscript && (
        <div className="interim-transcript">"{interimTranscript}..."</div>
      )}

      {/* Mic Button */}
      <div className="mic-section">
        <button
          id="mic-button"
          className={`mic-btn ${isListening ? 'listening' : ''} ${noLibrary ? 'disabled' : ''}`}
          onClick={handleMicClick}
          disabled={noLibrary}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="mic-icon">
            {isListening ? (
              <rect x="6" y="6" width="12" height="12" rx="2" />
            ) : (
              <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
          {isListening && <span className="pulse-ring" />}
          {isListening && <span className="pulse-ring delay" />}
        </button>
        <p className="mic-label">
          {isListening ? 'Listening… tap to stop' : supported ? 'Tap mic to speak' : 'Voice not available'}
        </p>
      </div>

      {/* Error from speech */}
      {error && <div className="speech-error">{error}</div>}

      {/* Type fallback */}
      <form className="type-search" onSubmit={handleTypeSubmit} id="type-search-form">
        <input
          ref={inputRef}
          id="artist-search-input"
          type="text"
          className="type-input"
          placeholder="Or type an artist name…"
          value={typeQuery}
          onChange={e => setTypeQuery(e.target.value)}
          disabled={noLibrary}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          id="search-submit-btn"
          type="submit"
          className="type-submit"
          disabled={noLibrary || !typeQuery.trim()}
        >
          Search
        </button>
      </form>
    </div>
  );
}
