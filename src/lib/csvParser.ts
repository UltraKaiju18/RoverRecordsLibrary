// CSV column names from user's Discogs export
export const ARTIST_COLUMN = 'RoverRecord Artist';
export const GENRE_COLUMN = 'RoverRecord Bent Genre';
export const STORAGE_KEY = 'rover_records_library';

export interface ArtistRecord {
  artist: string;
  genre: string;
}

/**
 * Parse a CSV string and extract artist/genre pairs.
 * Handles quoted fields, commas inside quotes, and different line endings.
 */
export function parseCSV(csvText: string): ArtistRecord[] {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  // Parse header row to find column indices
  const headers = parseCSVLine(lines[0]);
  const artistIdx = headers.findIndex(h => h.trim() === ARTIST_COLUMN);
  const genreIdx = headers.findIndex(h => h.trim() === GENRE_COLUMN);

  if (artistIdx === -1 || genreIdx === -1) {
    throw new Error(
      `Could not find required columns.\n` +
      `Looking for: "${ARTIST_COLUMN}" and "${GENRE_COLUMN}"\n` +
      `Found: ${headers.map(h => `"${h}"`).join(', ')}`
    );
  }

  const records: ArtistRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    const artist = fields[artistIdx]?.trim();
    const genre = fields[genreIdx]?.trim();
    if (artist && genre) {
      records.push({ artist, genre });
    }
  }

  return records;
}

/**
 * Parse a single CSV line, respecting quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Build a lookup map from artist name → genre (normalized keys for matching).
 */
export function buildLookupMap(records: ArtistRecord[]): Map<string, ArtistRecord> {
  const map = new Map<string, ArtistRecord>();
  for (const record of records) {
    map.set(normalizeArtist(record.artist), record);
  }
  return map;
}

export function normalizeArtist(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/, '')   // strip leading "the"
    .replace(/[^a-z0-9\s]/g, '') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}
