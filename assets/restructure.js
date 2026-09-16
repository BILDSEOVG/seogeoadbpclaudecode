// Sichere Umformungen. Ändert Struktur, niemals Aussagen.
// Was hier nicht automatisch geht, landet als Empfehlung in der Änderungsliste.

import { absaetze, saetze, wortzahl } from './segment.js';

const MAX_WORT = 110;
const ZIEL_WORT = 85;

/** Teilt einen zu langen Absatz an Satzgrenzen in Blöcke von etwa 40 bis 110 Wörtern. */
function teile(absatz) {
  const s = saetze(absatz);
  if (s.length < 2) return [absatz];

  const bloecke = [];
  let aktuell = [];
  let n = 0;
  for (const satz of s) {
    const m = wortzahl(satz);
    if (n > 0 && n + m > ZIEL_WORT) {
      bloecke.push(aktuell.join(' '));
      aktuell = [];
      n = 0;
    }
    aktuell.push(satz);
    n += m;
  }
  if (aktuell.length) {
    // Winziger Rest wird an den vorherigen Block gehängt
    if (n < 25 && bloecke.length) bloecke[bloecke.length - 1] += ' ' + aktuell.join(' ');
    else bloecke.push(aktuell.join(' '));
  }
  return bloecke;
}

/**
 * @returns {{text:string, aenderungen:Array}}
 */
export function umstrukturiere(text) {
  const aenderungen = [];
  const roh = (text ?? '').normalize('NFKC').replace(/[​-‏‪-‮⁠﻿]/g, '');

  if (/[ \t]{2,}|[ \t]+$/m.test(roh)) {
    aenderungen.push({
      regel_id: 'B2', typ: 'automatisch',
      vorher: 'mehrfache Leerzeichen und Leerraum am Zeilenende',
      nachher: 'vereinheitlicht',
      begruendung: 'Uneinheitlicher Leerraum verschiebt beim Zerschneiden in Passagen die Grenzen und erzeugt leere Chunks.',
      impact: 'niedrig',
    });
  }

  const abs = absaetze(roh);
  const neu = [];
  abs.forEach((p, i) => {
    const n = wortzahl(p);
    if (n <= MAX_WORT) { neu.push(p); return; }
    const teile_ = teile(p);
    if (teile_.length < 2) { neu.push(p); return; }
    neu.push(...teile_);
    aenderungen.push({
      regel_id: 'B2', typ: 'automatisch',
      vorher: `Absatz ${i + 1} mit ${n} Wörtern`,
      nachher: `${teile_.length} Absätze mit ${teile_.map(wortzahl).join(', ')} Wörtern`,
      begruendung: 'Ein Absatz muss ohne Kontext zitierbar sein. Über etwa 110 Wörter enthält er mehrere Gedanken, und die Engine zitiert dann eher eine fremde, kürzere Passage.',
      impact: 'mittel',
    });
  });

  return { text: neu.join('\n\n'), aenderungen };
}

/** Empfehlungen, die nicht automatisch umsetzbar sind — aus den Befunden abgeleitet. */
export function empfehlungen(befunde, entitaet) {
  const out = [];
  const b = Object.fromEntries(befunde.map((x) => [x.regel_id, x]));

  if (b.D2?.anzahl > 0) {
    for (const s of b.D2.stellen.slice(0, 5)) {
      out.push({
        regel_id: 'D2', typ: 'empfehlung',
        vorher: s.text, nachher: 'durch eine nachprüfbare Angabe ersetzen',
        begruendung: 'Ein unbelegter Superlativ transportiert für eine Engine keine Information. Eine Zahl oder ein Beleg an derselben Stelle ist zitierfähig.',
        impact: 'mittel',
      });
    }
  }
  if (b.A4?.anzahl > 0) {
    for (const s of b.A4.stellen.slice(0, 3)) {
      out.push({
        regel_id: 'A4', typ: 'empfehlung',
        vorher: s.text, nachher: `„${s.wort}" im Satz durch eine Variante ersetzen`,
        begruendung: 'Dreifache Nennung desselben Begriffs in einem Satz ist das Muster, das in der Messung 10 Prozent gekostet hat.',
        impact: 'hoch',
      });
    }
  }
  if (b.B3 && b.B3.punkte < 60) {
    out.push({
      regel_id: 'B3', typ: 'empfehlung',
      vorher: b.B3.messwert, nachher: 'Zwischenüberschriften als Fragen einziehen',
      begruendung: 'Semantische Struktur ist einer der stärksten Faktoren. Die Formulierung der Überschriften gehört dir — das Werkzeug erfindet sie nicht.',
      impact: 'hoch',
    });
  }
  if (b.B4?.anzahl > 0 && entitaet) {
    out.push({
      regel_id: 'B4', typ: 'empfehlung',
      vorher: `${b.B4.anzahl} Absatz/Absätze ohne „${entitaet}"`,
      nachher: 'Pronomen durch den Namen der Sache ersetzen',
      begruendung: 'Wird der Absatz einzeln als Passage gezogen, fehlt sonst der Bezug und er wird nicht zugeordnet.',
      impact: 'mittel',
    });
  }
  if (b.B1 && b.B1.punkte < 60) {
    out.push({
      regel_id: 'B1', typ: 'empfehlung',
      vorher: b.B1.messwert, nachher: 'Antwortsatz an den Anfang stellen',
      begruendung: 'Die ersten ein bis drei Sätze entscheiden, ob die Passage als Antwort taugt.',
      impact: 'hoch',
    });
  }
  return out;
}
