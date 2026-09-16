// Deterministische GEO-Analyse. Läuft vollständig im Browser, ohne Netzwerk.
// Jede Prüfung liefert einen Befund mit Regel-ID, Punktwert und Fundstellen.

import { absaetze, saetze, woerter, wortzahl, normalisiere, inhaltswoerter, gleicherStamm, STOPP } from './segment.js';
import { REGELN, REGEL_NACH_ID, DIMENSIONEN } from './rules.js';

// ---------- Muster ----------

// Deutsche Komposita: „Bundesverband" enthält „verband" ohne Wortgrenze davor.
// Kompositafähige Stämme bekommen deshalb einen freien Präfix.
const QUELLEN_EXAKT = String.raw`laut|gemäß|zufolge|nach Angaben|nach Auskunft|Quelle|DIN|ISO|EN\s?\d`;
const QUELLEN_STAMM = String.raw`verb(?:and|ände)|institut|amt|norm|verordnung|richtlinie|gesetz|studie|untersuchung|erhebung|umfrage|statistik|bericht|kammer|behörde|ministerium|herstellerangabe`;
const QUELLEN_MUSTER = new RegExp(
  String.raw`\b(?:${QUELLEN_EXAKT})\b|\b[A-Za-zÄÖÜäöüß-]*(?:${QUELLEN_STAMM})[a-zäöüß]{0,4}\b`,
  'gi',
);
const URL_MUSTER = /\bhttps?:\/\/[^\s)]+|\bwww\.[^\s)]+/gi;

const ZAHL_MUSTER = /\b\d+(?:[.,]\d+)?\s*(?:%|Prozent|€|EUR|Euro|Cent|Grad|°C?|Jahre?n?|Monate?n?|Wochen?|Tage?n?|Stunden?|Minuten?|Sekunden?|km|cm|mm|m²|m³|kg|Gramm|g\b|Liter|l\b|ml|bar|Watt|kWh|Mal|x|Stück|Personen|Kunden|Mitarbeiter)/gi;
const ZAHL_ROH = /(?<![\w.,])\d{2,}(?:[.,]\d+)?(?![\w])/g;

const ZITAT_MUSTER = /[„»"]([^"«»„]{12,})["«"]/g;
const ZITAT_VERB = /\b(sagt|sagte|erklärt|erklärte|betont|betonte|berichtet|berichtete|so\s+[A-ZÄÖÜ]\w+|laut\s+[A-ZÄÖÜ]\w+)\b/i;

const DATUM_MUSTER = /\b(?:19|20)\d{2}\b|\b\d{1,2}\.\s?(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\b|\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g;

const SUPERLATIVE = [
  'beste','bester','bestes','besten','bestem','größte','größten','grösste','schnellste','schnellsten',
  'günstigste','günstigsten','billigste','modernste','innovativste','beliebteste','meistverkaufte',
  'führend','führende','führender','führenden','marktführer','marktführend','marktführende',
  'einzigartig','einzigartige','einzigartiger','einzigartigen','revolutionär','revolutionäre',
  'perfekt','perfekte','perfekten','perfekter','optimal','optimale','optimalen','optimaler',
  'unschlagbar','unschlagbare','konkurrenzlos','unübertroffen','spitzenreiter','erstklassig',
  'erstklassige','hochwertigste','premium','weltbekannt','weltweit führend','absolut beste',
  'nummer 1','nr. 1','nr.1','branchenführer','hervorragend','hervorragende','exzellent','exzellente',
];
const SUPERLATIV_MUSTER = new RegExp(
  '(?:' + SUPERLATIVE.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
  'gi',
);
const AM_STEN_MUSTER = /\bam\s+\w{4,}sten\b/gi;

const UEBERSCHRIFT_MUSTER = /^\s{0,3}(#{1,6}\s+\S|\*\*[^*]{3,60}\*\*\s*$)/;
const LISTE_MUSTER = /^\s{0,3}(?:[-*•–]\s+\S|\d{1,2}[.)]\s+\S)/;
const TABELLE_MUSTER = /^\s*\|.*\|\s*$/;

// ---------- Hilfsfunktionen ----------

function treffer(text, muster) {
  return [...text.matchAll(muster)].map((m) => ({ text: m[0].trim(), index: m.index }));
}

/** Punkte aus einer Dichte je 100 Wörter, gedeckelt bei 100. */
function dichtePunkte(anzahl, woerterGesamt, zielProHundert) {
  if (woerterGesamt === 0) return 0;
  const dichte = (anzahl / woerterGesamt) * 100;
  return Math.max(0, Math.min(100, Math.round((dichte / zielProHundert) * 100)));
}

/**
 * Hauptentität heuristisch bestimmen: bevorzugt ein großgeschriebenes Wort,
 * das sowohl in der Zielfrage als auch häufig im Text vorkommt.
 */
export function hauptentitaet(text, zielfrage) {
  const zielWoerter = [...new Set(inhaltswoerter(zielfrage ?? ''))];
  const haeufigkeit = new Map();
  const nomen = new Set();

  for (const absatz of absaetze(text)) {
    for (const satz of saetze(absatz)) {
      const tokens = woerter(satz);
      tokens.forEach((w, i) => {
        // Satzanfang ist immer groß und taugt daher nicht als Signal.
        // Mitten im Satz ist Großschreibung im Deutschen dagegen ein
        // verlässlicher Hinweis auf ein Nomen.
        const grossMitten = i > 0 && /^[A-ZÄÖÜ]/.test(w);
        const norm = normalisiere(w);
        if (norm.length < 4 || STOPP.has(norm)) return;
        if (grossMitten) nomen.add(norm);
        const punkte = (grossMitten ? 2 : 0) + (zielWoerter.includes(norm) ? 3 : 0) + 1;
        haeufigkeit.set(norm, (haeufigkeit.get(norm) ?? 0) + punkte);
      });
    }
  }
  if (haeufigkeit.size === 0) return null;

  // Die Hauptentität muss zur Zielfrage gehören. Ohne diese Einschränkung
  // gewinnt jedes häufige Allerweltswort („Tage") gegen den eigentlichen
  // Gegenstand, der oft nur einmal genannt wird.
  let kandidaten = [...haeufigkeit.entries()];

  // Zielfrage-Bezug, gebeugte Formen eingeschlossen: im Text steht
  // „Schankanlagen", in der Zielfrage „Schankanlage".
  const ausZiel = kandidaten.filter(([w]) => zielWoerter.some((z) => gleicherStamm(w, z)));
  if (ausZiel.length) kandidaten = ausZiel;

  // Eine Entität ist ein Nomen. Ohne diesen Filter gewinnt ein häufiges
  // Partizip wie „gereinigt" und erzeugt Vorschläge wie „Was kostet gereinigt".
  const nurNomen = kandidaten.filter(([w]) => nomen.has(w));
  if (nurNomen.length) kandidaten = nurNomen;

  // Tiebreak: erst Punkte, dann Wortlänge. Ohne den zweiten Schlüssel
  // entschiede bei Gleichstand die Einfügereihenfolge.
  kandidaten.sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
  return kandidaten[0][0];
}

// ---------- Die zwölf Prüfungen ----------

function pruefeA1(ctx) {
  const funde = [...treffer(ctx.text, QUELLEN_MUSTER), ...treffer(ctx.text, URL_MUSTER)];
  return {
    regel_id: 'A1', anzahl: funde.length, stellen: funde.slice(0, 8),
    punkte: funde.length === 0 ? 0 : Math.min(100, 40 + funde.length * 20),
    messwert: `${funde.length} Quellenhinweis${funde.length === 1 ? '' : 'e'}`,
  };
}

function pruefeA2(ctx) {
  const mitEinheit = treffer(ctx.text, ZAHL_MUSTER);
  const roh = treffer(ctx.text, ZAHL_ROH).filter((t) => !/^(19|20)\d{2}$/.test(t.text));
  const anzahl = mitEinheit.length + roh.length;
  return {
    regel_id: 'A2', anzahl, stellen: [...mitEinheit, ...roh].slice(0, 8),
    punkte: dichtePunkte(anzahl, ctx.woerterGesamt, 1.5),
    messwert: `${anzahl} Zahlenangabe${anzahl === 1 ? '' : 'n'} auf ${ctx.woerterGesamt} Wörter`,
  };
}

function pruefeA3(ctx) {
  const zitate = treffer(ctx.text, ZITAT_MUSTER);
  const mitUrheber = zitate.filter((z) => {
    const umfeld = ctx.text.slice(Math.max(0, z.index - 90), z.index + z.text.length + 90);
    return ZITAT_VERB.test(umfeld);
  });
  return {
    regel_id: 'A3', anzahl: mitUrheber.length, stellen: mitUrheber.slice(0, 5),
    punkte: mitUrheber.length === 0 ? (zitate.length ? 30 : 0) : Math.min(100, 60 + mitUrheber.length * 20),
    messwert: mitUrheber.length
      ? `${mitUrheber.length} Zitat${mitUrheber.length === 1 ? '' : 'e'} mit Urheber`
      : zitate.length ? `${zitate.length} Anführung ohne erkennbaren Urheber` : 'kein Zitat',
  };
}

function pruefeA4(ctx) {
  if (!ctx.zielfrage) return { regel_id: 'A4', anzahl: 0, stellen: [], punkte: 100, messwert: 'keine Zielfrage angegeben' };
  const begriffe = inhaltswoerter(ctx.zielfrage);
  if (begriffe.length === 0) return { regel_id: 'A4', anzahl: 0, stellen: [], punkte: 100, messwert: 'Zielfrage ohne Inhaltswörter' };

  const textNorm = normalisiere(ctx.text);
  const alle = woerter(textNorm);
  let vorkommen = 0;
  for (const w of alle) if (begriffe.includes(w)) vorkommen++;
  const dichte = ctx.woerterGesamt ? (vorkommen / ctx.woerterGesamt) * 100 : 0;

  // Häufung: gleicher Begriff mehrfach im selben Satz
  const haeufungen = [];
  for (const absatz of ctx.absaetze) {
    for (const satz of saetze(absatz)) {
      const zaehler = new Map();
      for (const w of woerter(normalisiere(satz))) {
        if (begriffe.includes(w)) zaehler.set(w, (zaehler.get(w) ?? 0) + 1);
      }
      for (const [w, n] of zaehler) if (n >= 3) haeufungen.push({ text: satz.slice(0, 120), index: ctx.text.indexOf(satz), wort: w });
    }
  }

  const zuHoch = dichte > 4.5;
  return {
    regel_id: 'A4', anzahl: haeufungen.length, stellen: haeufungen.slice(0, 5),
    punkte: haeufungen.length > 0 ? 25 : zuHoch ? 55 : 100,
    messwert: `Begriffsdichte ${dichte.toFixed(1)} %${haeufungen.length ? `, ${haeufungen.length} Häufung im Satz` : ''}`,
  };
}

function pruefeB1(ctx) {
  if (!ctx.zielfrage) return { regel_id: 'B1', anzahl: 0, stellen: [], punkte: 50, messwert: 'ohne Zielfrage nicht prüfbar' };
  const ziel = new Set(inhaltswoerter(ctx.zielfrage));
  if (ziel.size === 0) return { regel_id: 'B1', anzahl: 0, stellen: [], punkte: 50, messwert: 'Zielfrage ohne Inhaltswörter' };

  const ersteSaetze = saetze(ctx.absaetze[0] ?? '').slice(0, 3);
  const vorhanden = new Set(inhaltswoerter(ersteSaetze.join(' ')));
  let getroffen = 0;
  for (const w of ziel) if (vorhanden.has(w)) getroffen++;
  const quote = getroffen / ziel.size;
  const beginntMitFrage = /\?\s*$/.test(ersteSaetze[0] ?? '');

  return {
    regel_id: 'B1', anzahl: getroffen, stellen: ersteSaetze[0] ? [{ text: ersteSaetze[0], index: 0 }] : [],
    punkte: Math.max(0, Math.round(quote * 100) - (beginntMitFrage ? 25 : 0)),
    messwert: `${getroffen} von ${ziel.size} Begriffen der Zielfrage in den ersten Sätzen`,
  };
}

function pruefeB2(ctx) {
  const zuLang = [], zuKurz = [];
  ctx.absaetze.forEach((p, i) => {
    const n = wortzahl(p);
    if (n > 110) zuLang.push({ text: `Absatz ${i + 1}: ${n} Wörter`, index: ctx.text.indexOf(p), nr: i + 1, n });
    else if (n < 25 && ctx.absaetze.length > 1) zuKurz.push({ text: `Absatz ${i + 1}: ${n} Wörter`, index: ctx.text.indexOf(p), nr: i + 1, n });
  });
  const problem = zuLang.length + zuKurz.length;
  const gesamt = ctx.absaetze.length || 1;
  return {
    regel_id: 'B2', anzahl: problem, stellen: [...zuLang, ...zuKurz].slice(0, 8),
    punkte: Math.round(((gesamt - problem) / gesamt) * 100),
    messwert: `${gesamt - problem} von ${gesamt} Absätzen im Zielbereich 25 bis 110 Wörter`,
  };
}

function pruefeB3(ctx) {
  const zeilen = ctx.text.split(/\n/);
  const ueberschriften = zeilen.filter((z) => UEBERSCHRIFT_MUSTER.test(z)).length;
  const listen = zeilen.filter((z) => LISTE_MUSTER.test(z)).length;
  const tabellen = zeilen.filter((z) => TABELLE_MUSTER.test(z)).length;
  const strukturen = ueberschriften + (listen >= 2 ? 1 : 0) + (tabellen >= 2 ? 1 : 0);
  const erwartet = Math.max(1, Math.floor(ctx.woerterGesamt / 250));
  return {
    regel_id: 'B3', anzahl: strukturen, stellen: [],
    punkte: Math.min(100, Math.round((strukturen / erwartet) * 100)),
    messwert: `${ueberschriften} Überschrift${ueberschriften === 1 ? '' : 'en'}, ${listen} Listenzeile${listen === 1 ? '' : 'n'}; empfohlen ab ${erwartet}`,
  };
}

function pruefeB4(ctx) {
  if (!ctx.entitaet) return { regel_id: 'B4', anzahl: 0, stellen: [], punkte: 50, messwert: 'keine Hauptentität erkannt' };
  const ohne = [];
  ctx.absaetze.forEach((p, i) => {
    if (!normalisiere(p).includes(ctx.entitaet)) ohne.push({ text: `Absatz ${i + 1} nennt „${ctx.entitaet}" nicht`, index: ctx.text.indexOf(p), nr: i + 1 });
  });
  const gesamt = ctx.absaetze.length || 1;
  return {
    regel_id: 'B4', anzahl: ohne.length, stellen: ohne.slice(0, 8),
    punkte: Math.round(((gesamt - ohne.length) / gesamt) * 100),
    messwert: `${gesamt - ohne.length} von ${gesamt} Absätzen nennen „${ctx.entitaet}"`,
  };
}

function pruefeC1(ctx) {
  const hatOrt = /\b(in|aus|bei|für)\s+[A-ZÄÖÜ][a-zäöüß]{2,}(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?\b/.test(ctx.text);
  const hatDefinition = new RegExp(`\\b${ctx.entitaet ? ctx.entitaet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '\\w+'}\\w*\\s+(ist|sind|bezeichnet|bedeutet)\\b`, 'i').test(normalisiere(ctx.text));
  let punkte = 0;
  if (ctx.entitaet) punkte += 45;
  if (hatOrt) punkte += 30;
  if (hatDefinition) punkte += 25;
  return {
    regel_id: 'C1', anzahl: ctx.entitaet ? 1 : 0, stellen: [],
    punkte: Math.min(100, punkte),
    messwert: ctx.entitaet
      ? `Hauptentität „${ctx.entitaet}"${hatOrt ? ', Ortsbezug vorhanden' : ', kein Ortsbezug'}${hatDefinition ? ', mit Definitionssatz' : ', ohne Definitionssatz'}`
      : 'keine Hauptentität erkennbar',
  };
}

function pruefeC2(ctx) {
  const inhalt = inhaltswoerter(ctx.text);
  if (inhalt.length < 20) return { regel_id: 'C2', anzahl: 0, stellen: [], punkte: 50, messwert: 'Text zu kurz für eine Aussage' };
  const verschieden = new Set(inhalt).size;
  const vielfalt = verschieden / inhalt.length;
  return {
    regel_id: 'C2', anzahl: verschieden, stellen: [],
    punkte: Math.max(0, Math.min(100, Math.round(((vielfalt - 0.3) / 0.35) * 100))),
    messwert: `${verschieden} verschiedene Inhaltswörter auf ${inhalt.length}, Vielfalt ${(vielfalt * 100).toFixed(0)} %`,
  };
}

function pruefeD1(ctx) {
  const funde = treffer(ctx.text, DATUM_MUSTER);
  const jahre = funde.map((f) => parseInt((f.text.match(/(19|20)\d{2}/) ?? [])[0] ?? '0', 10)).filter(Boolean);
  const neuestes = jahre.length ? Math.max(...jahre) : null;
  const jahrJetzt = new Date().getFullYear();
  let punkte = 0;
  if (funde.length) punkte = 60;
  if (neuestes && neuestes >= jahrJetzt - 1) punkte = 100;
  else if (neuestes && neuestes >= jahrJetzt - 3) punkte = 80;
  return {
    regel_id: 'D1', anzahl: funde.length, stellen: funde.slice(0, 5),
    punkte,
    messwert: funde.length ? `${funde.length} Datumsangabe${funde.length === 1 ? '' : 'n'}${neuestes ? `, neueste ${neuestes}` : ''}` : 'kein Datum, keine Jahreszahl',
  };
}

function pruefeD2(ctx) {
  const funde = [...treffer(ctx.text, SUPERLATIV_MUSTER), ...treffer(ctx.text, AM_STEN_MUSTER)];
  // Superlativ neben einer Zahl gilt als belegt
  const unbelegt = funde.filter((f) => {
    const umfeld = ctx.text.slice(Math.max(0, f.index - 80), f.index + f.text.length + 80);
    return !/\d/.test(umfeld);
  });
  return {
    regel_id: 'D2', anzahl: unbelegt.length, stellen: unbelegt.slice(0, 8),
    punkte: unbelegt.length === 0 ? 100 : Math.max(0, 100 - unbelegt.length * 25),
    messwert: unbelegt.length ? `${unbelegt.length} unbelegte${unbelegt.length === 1 ? 'r' : ''} Superlativ${unbelegt.length === 1 ? '' : 'e'}` : 'keine unbelegten Superlative',
  };
}

const PRUEFUNGEN = [pruefeA1, pruefeA2, pruefeA3, pruefeA4, pruefeB1, pruefeB2, pruefeB3, pruefeB4, pruefeC1, pruefeC2, pruefeD1, pruefeD2];

// ---------- Öffentliche Schnittstelle ----------

/**
 * Analysiert einen Text gegen das Regelwerk.
 * @param {string} text       Der zu prüfende Text.
 * @param {string} zielfrage  Zielfrage oder Haupt-Keyword.
 * @returns {{befunde:Array, score:{gesamt:number,dimensionen:Object}, entitaet:string|null, kennzahlen:Object}}
 */
export function analysiere(text, zielfrage = '') {
  const sauber = (text ?? '').normalize('NFKC').replace(/[​-‏‪-‮⁠﻿]/g, '');
  const abs = absaetze(sauber);
  const ctx = {
    text: sauber,
    zielfrage: (zielfrage ?? '').trim(),
    absaetze: abs,
    woerterGesamt: wortzahl(sauber),
    entitaet: hauptentitaet(sauber, zielfrage),
  };

  const befunde = PRUEFUNGEN.map((f) => {
    const b = f(ctx);
    const regel = REGEL_NACH_ID[b.regel_id];
    return { ...b, dim: regel.dim, titel: regel.titel, warum: regel.warum, evidenz: regel.evidenz, autofix: regel.autofix };
  });

  const dimensionen = {};
  for (const key of Object.keys(DIMENSIONEN)) {
    const teil = befunde.filter((b) => b.dim === key);
    dimensionen[key] = Math.round(teil.reduce((s, b) => s + b.punkte, 0) / teil.length);
  }
  const gesamt = Math.round(Object.values(dimensionen).reduce((a, b) => a + b, 0) / Object.keys(dimensionen).length);

  return {
    befunde,
    score: { gesamt, dimensionen },
    entitaet: ctx.entitaet,
    kennzahlen: {
      woerter: ctx.woerterGesamt,
      absaetze: abs.length,
      saetze: abs.reduce((s, p) => s + saetze(p).length, 0),
      zeichen: sauber.length,
    },
  };
}

export { REGELN, DIMENSIONEN };
