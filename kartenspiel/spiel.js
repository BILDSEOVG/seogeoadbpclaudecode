// Reine Spiellogik ohne DOM — damit sie mit node --test prüfbar ist.

// Kleiner deterministischer Zufallsgenerator (mulberry32), damit Tests
// reproduzierbar sind. Im Spiel wird ein zufälliger Startwert übergeben.
export function zufall(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mischen(liste, rnd) {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

export function neuesSpiel(karten, rnd) {
  const stapel = mischen(karten, rnd);
  const haelfte = stapel.length / 2;
  return {
    du: stapel.slice(0, haelfte),
    computer: stapel.slice(haelfte),
    topf: [],          // Karten aus Unentschieden
    amZug: 'du',
    runde: 0,
  };
}

// Computer wählt den Wert, der im Vergleich zu allen anderen Karten am
// stärksten ist (Rang statt Rohwert — 60 Musik ist schwächer als 60 Witz,
// wenn die meisten Karten mehr Musik haben). Kein Blick in deine Karte.
export function computerWahl(karte, alleKarten, werte) {
  let beste = werte[0].id;
  let besterAnteil = -1;
  for (const w of werte) {
    const geschlagen = alleKarten.filter((k) => k.werte[w.id] < karte.werte[w.id]).length;
    const anteil = geschlagen / (alleKarten.length - 1);
    if (anteil > besterAnteil) { besterAnteil = anteil; beste = w.id; }
  }
  return beste;
}

// Spielt eine Runde und gibt einen NEUEN Zustand plus Ergebnis zurück.
export function spieleRunde(zustand, wertId) {
  if (zustand.du.length === 0 || zustand.computer.length === 0) {
    throw new Error('Spiel ist bereits vorbei');
  }
  const [deine, ...restDu] = zustand.du;
  const [seine, ...restPc] = zustand.computer;
  if (!(wertId in deine.werte)) throw new Error(`Unbekannter Wert: ${wertId}`);

  const a = deine.werte[wertId];
  const b = seine.werte[wertId];
  const einsatz = [...zustand.topf, deine, seine];
  const sieger = a > b ? 'du' : b > a ? 'computer' : 'unentschieden';

  const neu = { ...zustand, du: restDu, computer: restPc, topf: [], runde: zustand.runde + 1 };
  if (sieger === 'du') neu.du = [...restDu, ...einsatz];
  else if (sieger === 'computer') neu.computer = [...restPc, ...einsatz];
  else neu.topf = einsatz;
  // Bei Unentschieden bleibt das Zugrecht, sonst geht es an den Sieger.
  if (sieger !== 'unentschieden') neu.amZug = sieger;

  return { zustand: neu, ergebnis: { sieger, wertId, deine, seine, a, b } };
}

export const MAX_RUNDEN = 300;

export function gewinner(zustand) {
  const du = zustand.du.length;
  const pc = zustand.computer.length;
  if (pc === 0 && du > 0) return 'du';
  if (du === 0 && pc > 0) return 'computer';
  if (du === 0 && pc === 0) return 'unentschieden';
  if (zustand.runde >= MAX_RUNDEN) return du > pc ? 'du' : pc > du ? 'computer' : 'unentschieden';
  return null;
}
