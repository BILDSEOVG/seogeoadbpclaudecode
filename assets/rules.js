// Regelwerk als Daten. Spiegelt geo-rules.md.
// Wer hier etwas ändert, ändert das Verhalten des Werkzeugs.
// test/rules.test.js prüft, dass die IDs mit geo-rules.md übereinstimmen.

export const DIMENSIONEN = {
  A: 'Zitierfähigkeit',
  B: 'Extrahierbarkeit',
  C: 'Entitäten',
  D: 'Vertrauen',
};

export const REGELN = [
  {
    id: 'A1', dim: 'A', evidenz: 'stark',
    titel: 'Quellen explizit nennen',
    warum: 'Belegte Aussagen werden deutlich häufiger zitiert. In der Princeton-Studie bis zu 34 Prozent mehr Sichtbarkeit.',
    autofix: false,
  },
  {
    id: 'A2', dim: 'A', evidenz: 'stark',
    titel: 'Konkrete Zahlen und Statistiken',
    warum: 'Zahlen machen eine Passage zitierfähig. Stärkster Einzelhebel nach Quellenangaben, rund 32 Prozent.',
    autofix: false,
  },
  {
    id: 'A3', dim: 'A', evidenz: 'stark',
    titel: 'Zitate von Autoritäten',
    warum: 'Ein wörtliches Zitat mit Urheber liefert eine fertige, übernehmbare Aussage. Rund 30 Prozent.',
    autofix: false,
  },
  {
    id: 'A4', dim: 'A', evidenz: 'stark',
    titel: 'Keyword-Stuffing entfernen',
    warum: 'Gehäufte Wiederholung des Keywords senkt die Zitierwahrscheinlichkeit um rund 10 Prozent. Der klassische SEO-Reflex schadet hier.',
    autofix: false,
  },
  {
    id: 'B1', dim: 'B', evidenz: 'stark',
    titel: 'Antwort zuerst',
    warum: 'Engines bewerten einzelne Passagen. Steht die Antwort nicht in den ersten Sätzen, wird der Abschnitt seltener als Antwort gewählt.',
    autofix: false,
  },
  {
    id: 'B2', dim: 'B', evidenz: 'mittel',
    titel: 'Selbsttragende Absätze',
    warum: 'Ein Absatz muss ohne Kontext zitierbar sein. Etwa 40 bis 110 Wörter, ein Gedanke.',
    autofix: true,
  },
  {
    id: 'B3', dim: 'B', evidenz: 'stark',
    titel: 'Überschriften, Listen, Tabellen',
    warum: 'Semantische Struktur gehört zu den stärksten Faktoren der GEO-16-Auswertung über 1.702 Zitationen.',
    autofix: false,
  },
  {
    id: 'B4', dim: 'B', evidenz: 'mittel',
    titel: 'Kernentität je Absatz nennen',
    warum: 'Pronomenketten verlieren beim Zerschneiden in Passagen ihren Bezug. Jeder Absatz sollte die Entität selbst nennen.',
    autofix: false,
  },
  {
    id: 'C1', dim: 'C', evidenz: 'mittel',
    titel: 'Hauptentität eindeutig benennen',
    warum: 'Engines arbeiten entitätsbasiert. Marke, Kategorie und gegebenenfalls Ort müssen eindeutig im Text stehen.',
    autofix: false,
  },
  {
    id: 'C2', dim: 'C', evidenz: 'stark',
    titel: 'Synonyme statt Exact-Match-Wiederholung',
    warum: 'Varianten stärken das semantische Umfeld. Wörtliche Wiederholung tut das nicht und kippt schnell in A4.',
    autofix: false,
  },
  {
    id: 'D1', dim: 'D', evidenz: 'stark',
    titel: 'Aktualität sichtbar machen',
    warum: 'Freshness ist einer der stärksten Faktoren in GEO-16. Eine Jahreszahl im Text macht den Stand überprüfbar.',
    autofix: false,
  },
  {
    id: 'D2', dim: 'D', evidenz: 'mittel',
    titel: 'Konkret statt Superlativ',
    warum: 'Unbelegte Superlative sind für eine Engine wertlos, weil sie nichts Nachprüfbares transportieren.',
    autofix: false,
  },
];

export const REGEL_NACH_ID = Object.fromEntries(REGELN.map((r) => [r.id, r]));

export const KEYWORD_KATEGORIEN = {
  entitaet: 'Entität',
  long_tail: 'Long-Tail',
  frage: 'Frageformulierung',
  semantisch: 'Semantisch verwandt',
  lokal: 'Lokal',
};
