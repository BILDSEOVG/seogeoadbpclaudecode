// Fehlende Informationen als Rückfrage an den Autor.
// Das Werkzeug erfindet nichts — es fragt.

const RUECKFRAGEN = {
  A1: {
    luecke: 'Keine Quelle genannt',
    warum: 'Quellenangaben sind der stärkste gemessene Hebel für Zitierfähigkeit, bis zu 34 Prozent.',
    frage: 'Auf welche Studie, Norm, Verordnung oder Herstellerangabe stützen sich die Aussagen im Text?',
  },
  A2: {
    luecke: 'Keine oder zu wenige konkrete Zahlen',
    warum: 'Zahlen machen eine Passage zitierfähig. Zweitstärkster Hebel, rund 32 Prozent.',
    frage: 'Welche Zahlen kannst du belegen — Preise, Zeiträume, Mengen, Intervalle, Messwerte?',
  },
  A3: {
    luecke: 'Kein Zitat mit Urheber',
    warum: 'Ein wörtliches Zitat liefert eine fertige, übernehmbare Aussage. Rund 30 Prozent.',
    frage: 'Gibt es eine Stimme aus dem Unternehmen oder der Branche, die du wörtlich zitieren kannst?',
  },
  A4: {
    luecke: 'Keyword wirkt gehäuft',
    warum: 'Gehäufte Wiederholung senkt die Zitierwahrscheinlichkeit um rund 10 Prozent.',
    frage: 'Welche Synonyme und Varianten passen fachlich, um die Wiederholungen zu ersetzen?',
  },
  B1: {
    luecke: 'Zielfrage wird nicht zuerst beantwortet',
    warum: 'Engines bewerten Passagen. Steht die Antwort nicht vorn, wird der Abschnitt seltener gewählt.',
    frage: 'Was ist die Antwort auf deine Zielfrage in einem einzigen Satz?',
  },
  B3: {
    luecke: 'Zu wenig Struktur',
    warum: 'Semantische Struktur gehört zu den stärksten Faktoren der GEO-16-Auswertung.',
    frage: 'Welche zwei bis vier Fragen beantwortet der Text? Die geben die Zwischenüberschriften.',
  },
  B4: {
    luecke: 'Absätze ohne Nennung der Hauptentität',
    warum: 'Beim Zerschneiden in Passagen verlieren Pronomen ihren Bezug.',
    frage: 'In welchen Absätzen kannst du das Pronomen durch den Namen der Sache ersetzen?',
  },
  C1: {
    luecke: 'Hauptentität nicht eindeutig',
    warum: 'Engines arbeiten entitätsbasiert und müssen Marke, Leistung und Ort zuordnen können.',
    frage: 'Um welche Marke, welche Leistung und welches Einzugsgebiet geht es genau?',
  },
  D1: {
    luecke: 'Kein Datum, keine Jahreszahl',
    warum: 'Aktualität ist einer der stärksten Faktoren in GEO-16.',
    frage: 'Auf welchen Stand bezieht sich der Text?',
  },
  D2: {
    luecke: 'Unbelegte Superlative',
    warum: 'Unbelegte Behauptungen transportieren nichts Nachprüfbares und werden selten zitiert.',
    frage: 'Womit lassen sich die Aussagen belegen — oder welche konkrete Zahl tritt an ihre Stelle?',
  },
};

/** Schwelle, ab der ein Befund als Lücke gilt. */
export const SCHWELLE = 50;

export function luecken(befunde) {
  return befunde
    .filter((b) => b.punkte < SCHWELLE && RUECKFRAGEN[b.regel_id])
    .sort((a, b) => a.punkte - b.punkte)
    .map((b) => ({
      regel_id: b.regel_id,
      luecke: RUECKFRAGEN[b.regel_id].luecke,
      warum_kritisch: RUECKFRAGEN[b.regel_id].warum,
      rueckfrage: RUECKFRAGEN[b.regel_id].frage,
      befund: b.messwert,
      punkte: b.punkte,
      evidenz: b.evidenz,
    }));
}

export { RUECKFRAGEN };
