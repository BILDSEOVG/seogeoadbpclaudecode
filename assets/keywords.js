// Keyword-Vorschläge, ausschließlich aus Text, Zielfrage und Regelwerk abgeleitet.
// Ohne externe Daten gibt es keine Suchvolumina — jeder Vorschlag nennt deshalb
// offen seine Herkunft, damit niemand ihn für eine Volumen-Recherche hält.

import { absaetze, saetze, woerter, normalisiere, inhaltswoerter, enthaeltStamm, STOPP } from './segment.js';

// Begriffe, die Regel D2 anmahnt. Sie als Keyword vorzuschlagen wäre ein
// Widerspruch in sich.
const WERBEFLOSKELN = /\b(beste[rsnm]?|größte[rn]?|schnellste[rn]?|günstigste[rn]?|führende[rn]?|einzigartige?[rn]?|perfekte?[rn]?|optimale?[rn]?|erstklassige?|premium|unschlagbar|hervorragende?|exzellente?)\b/i;

const HERKUNFT = {
  zielfrage: 'fehlt im Text, steht aber in der Zielfrage',
  muster: 'Prompt-Muster, das Retrieval auslöst',
  entitaet: 'vervollständigt die Hauptentität',
  text: 'kommt im Text nur einmal vor',
};

/** Mehrwortphrasen aus benachbarten Inhaltswörtern eines Satzes. */
function phrasen(text) {
  const zaehler = new Map();
  for (const absatz of absaetze(text)) {
    for (const satz of saetze(absatz)) {
      const tokens = woerter(satz);
      for (let i = 0; i < tokens.length - 1; i++) {
        const a = normalisiere(tokens[i]);
        const b = normalisiere(tokens[i + 1]);
        if (a.length < 4 || b.length < 4) continue;
        if (STOPP.has(a) || STOPP.has(b)) continue;
        // Reine Zahlen tragen keine Phrase — „Reinigung 2026" ist kein Long-Tail
        if (/^\d+$/.test(a) || /^\d+$/.test(b)) continue;
        const p = `${tokens[i]} ${tokens[i + 1]}`;
        zaehler.set(p, (zaehler.get(p) ?? 0) + 1);
      }
    }
  }
  return zaehler;
}

/** Erster Buchstabe groß. Alles Weitere bleibt, wie es ist. */
export function grossAnfang(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Kurzer Kernbegriff für die Prompt-Vorlagen: die Hauptentität, sonst das
 * längste Inhaltswort der Zielfrage, sonst die Zielfrage selbst.
 */
export function kernbegriff(zielfrage, entitaet) {
  const ziel = (zielfrage ?? '').trim();
  const kurz = ziel && woerter(ziel).length <= 3 && !ziel.endsWith('?');
  if (kurz) return ziel;
  if (entitaet) return entitaet;
  const inhalt = inhaltswoerter(ziel).sort((a, b) => b.length - a.length);
  return inhalt[0] ?? ziel;
}

/**
 * @returns {Array<{keyword:string,kategorie:string,begruendung:string,platzierung:string,regel_id:string,herkunft:string}>}
 */
export function keywordVorschlaege(text, zielfrage = '', entitaet = null) {
  const vorschlaege = [];
  const textNorm = normalisiere(text);
  const vorhanden = new Set(inhaltswoerter(text));
  const jahr = new Date().getFullYear();

  // 1 — Begriffe der Zielfrage, die im Text fehlen
  const vorhandenListe = [...vorhanden];
  for (const w of new Set(inhaltswoerter(zielfrage))) {
    // Kurze Füllwörter taugen nicht als Keyword, und „Schankanlage" gilt als
    // vorhanden, wenn im Text „Schankanlagen" steht.
    if (w.length >= 5 && !enthaeltStamm(vorhandenListe, w)) {
      vorschlaege.push({
        keyword: w,
        kategorie: 'semantisch',
        regel_id: 'B1',
        herkunft: HERKUNFT.zielfrage,
        begruendung: 'Der Begriff steht in deiner Zielfrage, taucht im Text aber nicht auf. Eine Passage, die die Frage nicht mit ihren eigenen Worten beantwortet, wird dafür seltener als Quelle gewählt.',
        platzierung: 'in den ersten beiden Sätzen',
      });
    }
  }

  // 2 — Prompt-Muster, die nachweislich Retrieval auslösen.
  // Eine ganze Frage als Vorlage einzusetzen ergibt Unsinn wie
  // „Was kostet Wie oft muss eine Anlage gereinigt werden?". Deshalb wird
  // immer ein kurzer Kernbegriff verwendet.
  // Die Hauptentität kommt kleingeschrieben aus der Analyse. Im Deutschen
  // sind Nomen groß — ein Vorschlag „Was kostet schankanlagen" liest sich
  // wie ein Tippfehler.
  const basis = grossAnfang(kernbegriff(zielfrage, entitaet));
  if (basis) {
    const muster = [
      { kw: `${basis} ${jahr}`, regel: 'D1', grund: `Prompts mit Jahreszahl lösen bei ChatGPT und Perplexity zuverlässig eine Suche aus. Ohne Jahresbezug im Text gilt er schnell als veraltet.`, wo: 'in der Einleitung oder einer Überschrift' },
      { kw: `Was kostet ${basis}`, regel: 'A2', grund: 'Preisbezogene Prompts lösen Retrieval aus. Eine Passage mit konkreter Zahl wird dann bevorzugt zitiert.', wo: 'als eigene Zwischenüberschrift mit Antwortabsatz' },
      { kw: `${basis} vs `, regel: 'C2', grund: 'Vergleichsprompts („X vs Y") lösen Retrieval aus. Den Vergleichspartner musst du selbst wählen — er muss fachlich stimmen.', wo: 'als eigener Abschnitt' },
      { kw: `Wie funktioniert ${basis}`, regel: 'B1', grund: 'Erklärprompts sind das häufigste Muster. Ein Absatz, der genau so beginnt, ist direkt entnehmbar.', wo: 'als Frage-Überschrift' },
    ];
    for (const m of muster) {
      if (textNorm.includes(normalisiere(m.kw))) continue;
      vorschlaege.push({
        keyword: m.kw.trim(), kategorie: 'frage', regel_id: m.regel,
        herkunft: HERKUNFT.muster, begruendung: m.grund, platzierung: m.wo,
      });
    }
  }

  // 3 — Entität vervollständigen
  if (entitaet) {
    const hatOrt = /\b(in|aus|bei|für)\s+[A-ZÄÖÜ][a-zäöüß]{2,}/.test(text);
    if (!hatOrt) {
      vorschlaege.push({
        keyword: `${grossAnfang(entitaet)} + Ort`, kategorie: 'lokal', regel_id: 'C1',
        herkunft: HERKUNFT.entitaet,
        begruendung: 'Der Text nennt kein Einzugsgebiet. Ohne Ortsbezug kann eine Engine die Entität nicht von gleichnamigen Anbietern unterscheiden.',
        platzierung: 'im ersten Absatz, zusammen mit der Leistung',
      });
    }
    if (!new RegExp(`${entitaet}\\w*\\s+(ist|sind|bezeichnet|bedeutet)`, 'i').test(textNorm)) {
      vorschlaege.push({
        keyword: `${grossAnfang(entitaet)} ist ein …`, kategorie: 'entitaet', regel_id: 'C1',
        herkunft: HERKUNFT.entitaet,
        begruendung: 'Ein Definitionssatz liefert die kürzeste zitierfähige Aussage über deine Hauptentität. Genau solche Sätze übernehmen Engines wörtlich.',
        platzierung: 'als zweiter Satz',
      });
    }
  }

  // 4 — Phrasen, die im Text nur einmal vorkommen
  const zielBegriffe = new Set(inhaltswoerter(zielfrage));
  const einmalig = [...phrasen(text).entries()]
    .filter(([, n]) => n === 1)
    .map(([p]) => p)
    // Phrasen rund um die Zielfrage decken bereits A4 und C2 ab
    .filter((p) => !woerter(normalisiere(p)).some((w) => zielBegriffe.has(w)))
    .filter((p) => !WERBEFLOSKELN.test(p))
    .slice(0, 4);
  for (const p of einmalig) {
    vorschlaege.push({
      keyword: p, kategorie: 'long_tail', regel_id: 'B4',
      herkunft: HERKUNFT.text,
      begruendung: 'Die Phrase kommt genau einmal vor. Wenn sie fachlich zentral ist, sollte sie in mehreren Absätzen auftauchen, damit einzelne Passagen sie mittragen.',
      platzierung: 'zusätzlich in einem weiteren Absatz',
    });
  }

  // FR-4: Der Leser muss sehen, ob ein Vorschlag neu ist oder einen
  // vorhandenen Begriff stärken soll. Ohne diese Angabe wirkt jeder
  // Vorschlag wie eine Ergänzung, auch wenn er längst im Text steht.
  return vorschlaege.map((v) => ({
    ...v,
    bereits_vorhanden: textNorm.includes(normalisiere(v.keyword.replace(/\s*…$/, '').trim())),
  }));
}

export { HERKUNFT };
