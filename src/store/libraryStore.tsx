import React, { createContext, useContext, useEffect, useState } from 'react';
import { parseCSV, buildLookupMap, type ArtistRecord, STORAGE_KEY } from '../lib/csvParser';

interface LibraryState {
  records: ArtistRecord[];
  lookupMap: Map<string, ArtistRecord>;
  csvFilename: string;
  loadFromText: (text: string, filename: string) => void;
  clearLibrary: () => void;
  error: string | null;
}

const LibraryContext = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<ArtistRecord[]>([]);
  const [lookupMap, setLookupMap] = useState<Map<string, ArtistRecord>>(new Map());
  const [csvFilename, setCsvFilename] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { records: r, filename } = JSON.parse(saved) as { records: ArtistRecord[]; filename: string };
        setRecords(r);
        setLookupMap(buildLookupMap(r));
        setCsvFilename(filename);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function loadFromText(text: string, filename: string) {
    try {
      setError(null);
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError('No valid records found. Check your CSV columns.');
        return;
      }
      setRecords(parsed);
      setLookupMap(buildLookupMap(parsed));
      setCsvFilename(filename);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: parsed, filename }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse CSV');
    }
  }

  function clearLibrary() {
    setRecords([]);
    setLookupMap(new Map());
    setCsvFilename('');
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <LibraryContext.Provider value={{ records, lookupMap, csvFilename, loadFromText, clearLibrary, error }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
