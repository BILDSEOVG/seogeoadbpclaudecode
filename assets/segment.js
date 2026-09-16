// Deutsche Text-Segmentierung. Reine Funktionen, keine Seiteneffekte.

// Abkürzungen, nach denen ein Punkt KEIN Satzende ist.
const ABK = [
  'z','zz','bzw','ca','ggf','inkl','exkl','evtl','usw','etc','vgl','bspw','bzgl',
  'dh','ua','uvm','sog','max','min','Nr','Abs','Art','Bsp','Abb','Tab','Kap',
  'Dr','Prof','Dipl','Ing','Hr','Fr','St','Str','Tel','Mio','Mrd','Tsd','Jh','Jhd',
  'ff','Aufl','Bd','Hrsg','Pkt','Mio','engl','dt','lat','ital','franz',
];
const ABK_SET = new Set(ABK.map((a) => a.toLowerCase()));

/** Absätze: an Leerzeilen getrennt, Leerraum normalisiert. */
export function absaetze(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n+/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Sätze eines Absatzes. Berücksichtigt Abkürzungen, Ordinalzahlen und
 * Dezimalzahlen, damit „z. B." und „1. Januar" nicht zerrissen werden.
 */
export function saetze(absatz) {
  const t = absatz.replace(/\s+/g, ' ').trim();
  if (!t) return [];

  const out = [];
  let start = 0;

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c !== '.' && c !== '!' && c !== '?') continue;

    // Ellipse als Einheit behandeln
    if (c === '.' && t.slice(i, i + 3) === '...') { i += 2; continue; }

    const rest = t.slice(i + 1);
    const m = /^["»«')\]]*\s+/.exec(rest);
    if (!m) continue; // kein Leerraum danach: kein Satzende

    if (c === '.') {
      // Wort direkt vor dem Punkt
      const davor = /([A-Za-zÄÖÜäöüß]+)$/.exec(t.slice(start, i));
      if (davor && ABK_SET.has(davor[1].toLowerCase())) continue;

      // Dezimalzahl 3.5 oder Ordinalzahl „1. Januar"
      if (/\d$/.test(t.slice(0, i))) {
        const nach = rest.slice(m[0].length);
        if (/^\d/.test(nach) || /^[A-ZÄÖÜ][a-zäöüß]/.test(nach) === false) continue;
        if (/^(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|Platz|Quartal|Halbjahr|Auflage)\b/.test(nach)) continue;
      }

      // Einzelner Großbuchstabe: Initiale wie „A. Müller"
      if (/(^|\s)[A-ZÄÖÜ]$/.test(t.slice(start, i))) continue;
    }

    const ende = i + 1 + m[0].length;
    const satz = t.slice(start, i + 1 + m[0].trimEnd().length).trim();
    if (satz) out.push(satz);
    start = ende;
  }

  const letzter = t.slice(start).trim();
  if (letzter) out.push(letzter);
  return out;
}

/** Wörter. Bindestrich-Komposita zählen als ein Wort. */
export function woerter(text) {
  return text.match(/[A-Za-zÄÖÜäöüßáéíóúàèç0-9]+(?:[-'][A-Za-zÄÖÜäöüß0-9]+)*/g) ?? [];
}

export function wortzahl(text) {
  return woerter(text).length;
}

/** Kleingeschrieben und ohne Satzzeichen, für Vergleiche. */
export function normalisiere(text) {
  return text.normalize('NFKC').toLowerCase();
}

// Sehr häufige deutsche Funktionswörter. Für Inhaltswort-Vergleiche.
export const STOPP = new Set(`
aber alle allem allen aller alles als also am an andere anderem anderen anderer anderes
auch auf aus bei beim bin bis bist da damit dann das dass dem den denn der des dessen
dich die dies diese diesem diesen dieser dieses dir doch dort du durch ein eine einem
einen einer eines er es etwas euch für gegen gibt hab habe haben hat hatte hier hin
ich ihr ihre ihrem ihren ihrer im in ist ja jede jedem jeden jeder jedes jetzt kann
kein keine können mehr mein mich mir mit muss müssen nach nicht nichts noch nun nur
ob oder ohne schon sehr sein seine seinem seinen seiner sich sie sind so solche soll
sollen sondern sonst über um und uns unser unsere unter vom von vor war waren was
wenn werden wie wir wird wirst wo wurde wurden zu zum zur zwischen
weil dass damit obwohl während sowie falls indem nachdem bevor seit außerdem
jedoch allerdings deshalb daher somit zudem ebenso dabei dafür dazu darauf
sowohl weder immer oft meist viele viel wenig ganz eher etwa rund bereits
können könnte sollte müsste muss müssen musste werde wollen möchte lassen machen geben gehen
`.trim().split(/\s+/));

/** Inhaltswörter: ohne Stoppwörter, ohne sehr kurze Tokens. */
export function inhaltswoerter(text) {
  return woerter(normalisiere(text)).filter((w) => w.length > 2 && !STOPP.has(w));
}

/**
 * Grober Stammvergleich fürs Deutsche. Zwei Wörter gelten als dasselbe,
 * wenn eines das andere als Präfix enthält und der Längenunterschied eine
 * Beugung sein kann (-e, -n, -en, -s, -es, -er).
 */
export function gleicherStamm(a, b) {
  if (a === b) return true;
  const [kurz, lang] = a.length <= b.length ? [a, b] : [b, a];
  if (kurz.length < 4) return false;
  return lang.startsWith(kurz) && lang.length - kurz.length <= 3;
}

/** Steht ein Begriff — auch gebeugt — in der Wortliste? */
export function enthaeltStamm(woerterListe, begriff) {
  return woerterListe.some((w) => gleicherStamm(w, begriff));
}
