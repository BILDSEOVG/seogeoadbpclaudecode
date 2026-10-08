// 32 Karten, 8 Gruppen à 4 — klassischer Quartett-Aufbau (A1 … H4).
// Die Werte sind erfunden und dienen nur dem Spiel.
// Bilder liegen bewusst NICHT im Repository (Urheberrecht Disney):
// Jede Spielerin lädt sie lokal im Browser, Dateiname = Karten-ID (z. B. A1.jpg).

export const WERTE = [
  { id: 'witz', name: 'Witz' },
  { id: 'laut', name: 'Lautstärke' },
  { id: 'chaos', name: 'Chaos' },
  { id: 'charme', name: 'Charme' },
  { id: 'musik', name: 'Musikalität' },
];

export const GRUPPEN = {
  A: 'Hauptbesetzung',
  B: 'Electric Mayhem',
  C: 'Theater-Crew',
  D: 'Balkon & Bühnenrand',
  E: 'Labor & Explosionen',
  F: 'Tierische Freunde',
  G: 'Monster & Riesen',
  H: 'Bunte Mischung',
};

// [id, Name, Witz, Lautstärke, Chaos, Charme, Musikalität]
const ROH = [
  ['A1', 'Kermit', 72, 45, 30, 88, 70],
  ['A2', 'Miss Piggy', 55, 90, 65, 95, 68],
  ['A3', 'Fozzie Bär', 85, 60, 50, 74, 35],
  ['A4', 'Gonzo', 68, 58, 92, 66, 30],
  ['B1', 'Dr. Teeth', 60, 70, 55, 82, 94],
  ['B2', 'Floyd Pepper', 64, 50, 40, 70, 88],
  ['B3', 'Janice', 58, 35, 25, 80, 85],
  ['B4', 'Animal', 30, 99, 98, 45, 90],
  ['C1', 'Scooter', 40, 42, 28, 64, 38],
  ['C2', 'Rowlf', 75, 38, 18, 86, 96],
  ['C3', 'Pops', 45, 30, 15, 60, 20],
  ['C4', 'Beauregard', 50, 25, 45, 58, 22],
  ['D1', 'Statler', 92, 66, 35, 40, 28],
  ['D2', 'Waldorf', 93, 64, 36, 41, 27],
  ['D3', 'Sam Eagle', 20, 75, 22, 35, 40],
  ['D4', 'Uncle Deadly', 48, 40, 52, 62, 55],
  ['E1', 'Dr. Bunsen Honeydew', 55, 40, 80, 55, 18],
  ['E2', 'Beaker', 62, 85, 88, 78, 45],
  ['E3', 'Der Koch', 80, 78, 85, 72, 50],
  ['E4', 'Crazy Harry', 52, 95, 97, 38, 24],
  ['F1', 'Rizzo', 78, 55, 60, 68, 42],
  ['F2', 'Pepe', 82, 68, 62, 76, 48],
  ['F3', 'Camilla', 35, 52, 30, 70, 32],
  ['F4', 'Robin', 42, 22, 12, 92, 60],
  ['G1', 'Sweetums', 38, 88, 70, 65, 30],
  ['G2', 'Thog', 30, 80, 66, 60, 25],
  ['G3', 'Bobo', 46, 62, 48, 57, 24],
  ['G4', 'Big Mean Carl', 34, 92, 84, 26, 15],
  ['H1', 'Walter', 50, 32, 20, 84, 52],
  ['H2', 'Lew Zealand', 66, 48, 74, 50, 20],
  ['H3', 'Mahna Mahna', 70, 60, 58, 72, 92],
  ['H4', 'Clifford', 60, 54, 35, 69, 66],
];

export const KARTEN = ROH.map(([id, name, ...zahlen]) => ({
  id,
  name,
  gruppe: GRUPPEN[id[0]],
  werte: Object.fromEntries(WERTE.map((w, i) => [w.id, zahlen[i]])),
}));
