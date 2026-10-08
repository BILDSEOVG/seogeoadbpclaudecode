// Lokale Bildablage im Browser (IndexedDB). Nichts verlässt das Gerät.
// Fällt IndexedDB aus (privates Fenster, gesperrt), gelten Bilder nur bis zum Neuladen.

export const MAX_BYTES = 5 * 1024 * 1024;
const TYPEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Prüft eine Datei, bevor sie gespeichert wird. Gibt { id } oder { fehler } zurück.
export function pruefeDatei(datei, gueltigeIds) {
  const m = /^([A-Ha-h][1-4])\.(jpe?g|png|webp|gif)$/i.exec(datei.name || '');
  if (!m) return { fehler: `${datei.name}: Name muss wie „A1.jpg“ aufgebaut sein` };
  const id = m[1].toUpperCase();
  if (!gueltigeIds.has(id)) return { fehler: `${datei.name}: keine Karte ${id}` };
  if (!TYPEN.includes(datei.type)) return { fehler: `${datei.name}: kein erlaubtes Bildformat` };
  if (datei.size > MAX_BYTES) return { fehler: `${datei.name}: größer als 5 MB` };
  return { id };
}

const DB = 'muppets-quartett';
const STORE = 'bilder';

function oeffnen() {
  return new Promise((ok, nein) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => ok(req.result);
      req.onerror = () => nein(req.error);
    } catch (e) { nein(e); }
  });
}

async function vorgang(modus, arbeit) {
  const db = await oeffnen();
  return new Promise((ok, nein) => {
    const tx = db.transaction(STORE, modus);
    const ergebnis = arbeit(tx.objectStore(STORE));
    tx.oncomplete = () => ok(ergebnis.result ?? ergebnis);
    tx.onerror = () => nein(tx.error);
  });
}

export async function allesLaden() {
  const map = new Map();
  try {
    const db = await oeffnen();
    await new Promise((ok, nein) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (c) { if (c.value instanceof Blob) map.set(c.key, c.value); c.continue(); }
      };
      tx.oncomplete = ok;
      tx.onerror = () => nein(tx.error);
    });
  } catch { /* ohne Speicher weiter */ }
  return map;
}

export async function speichern(id, blob) {
  try { await vorgang('readwrite', (s) => s.put(blob, id)); return true; } catch { return false; }
}

export async function allesLoeschen() {
  try { await vorgang('readwrite', (s) => s.clear()); } catch { /* nichts zu tun */ }
}
