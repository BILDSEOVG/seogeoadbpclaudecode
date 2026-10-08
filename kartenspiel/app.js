import { KARTEN, WERTE } from './karten.js';
import { zufall, neuesSpiel, spieleRunde, computerWahl, gewinner } from './spiel.js';
import { pruefeDatei, speichern, allesLaden, allesLoeschen } from './bilder.js';

const $ = (id) => document.getElementById(id);
const IDS = new Set(KARTEN.map((k) => k.id));
const bildUrls = new Map(); // id → blob:-URL

let zustand;
let phase;      // 'wahl' | 'pcwahl' | 'aufgedeckt' | 'ende'
let letztes;    // Ergebnis der letzten Runde

function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text != null) e.textContent = text; // nie innerHTML mit Daten
  return e;
}

function initialen(name) {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function karteZeichnen(ziel, karte, { verdeckt = false, waehlbar = false, markiert = null } = {}) {
  ziel.replaceChildren();
  ziel.classList.toggle('verdeckt', verdeckt);
  if (!karte) { ziel.append(el('p', 'leer', '—')); return; }
  if (verdeckt) { ziel.append(el('div', 'ruecken', '?')); return; }

  const kopf = el('div', 'karten-kopf');
  kopf.append(el('span', 'kid', karte.id), el('span', 'gruppe', karte.gruppe));
  const bild = el('div', 'bild');
  const url = bildUrls.get(karte.id);
  if (url) {
    const img = el('img');
    img.src = url;
    img.alt = karte.name;
    bild.append(img);
  } else {
    bild.append(el('span', 'platzhalter', initialen(karte.name)));
  }
  const name = el('h3', 'name', karte.name);

  const liste = el('div', 'werte');
  for (const w of WERTE) {
    const zeile = el(waehlbar ? 'button' : 'div', 'wert');
    if (waehlbar) {
      zeile.type = 'button';
      zeile.addEventListener('click', () => waehlen(w.id));
    }
    if (markiert === w.id) zeile.classList.add('markiert');
    zeile.append(el('span', null, w.name), el('strong', null, String(karte.werte[w.id])));
    liste.append(zeile);
  }
  ziel.append(kopf, bild, name, liste);
}

function wertName(id) { return WERTE.find((w) => w.id === id).name; }

function zeichnen() {
  $('anzahl-du').textContent = zustand.du.length;
  $('anzahl-pc').textContent = zustand.computer.length;
  $('anzahl-topf').textContent = zustand.topf.length;
  const knopf = $('weiter');
  knopf.hidden = false;

  if (phase === 'wahl') {
    karteZeichnen($('karte-du'), zustand.du[0], { waehlbar: true });
    karteZeichnen($('karte-pc'), zustand.computer[0], { verdeckt: true });
    $('meldung').textContent = 'Du bist dran: Tippe auf einen Wert deiner Karte.';
    knopf.hidden = true;
  } else if (phase === 'pcwahl') {
    karteZeichnen($('karte-du'), zustand.du[0]);
    karteZeichnen($('karte-pc'), zustand.computer[0], { verdeckt: true });
    $('meldung').textContent = 'Der Computer ist dran.';
    knopf.textContent = 'Computer wählen lassen';
  } else if (phase === 'aufgedeckt') {
    const { sieger, wertId, deine, seine, a, b } = letztes;
    karteZeichnen($('karte-du'), deine, { markiert: wertId });
    karteZeichnen($('karte-pc'), seine, { markiert: wertId });
    const text = sieger === 'du' ? 'Du gewinnst die Runde!'
      : sieger === 'computer' ? 'Der Computer gewinnt die Runde.'
      : 'Unentschieden — die Karten kommen in den Topf.';
    $('meldung').textContent = `${wertName(wertId)}: ${a} gegen ${b}. ${text}`;
    knopf.textContent = 'Weiter';
  } else if (phase === 'ende') {
    const g = gewinner(zustand);
    $('meldung').textContent = g === 'du' ? `Gewonnen nach ${zustand.runde} Runden! 🎉`
      : g === 'computer' ? `Verloren nach ${zustand.runde} Runden.`
      : 'Unentschieden.';
    knopf.textContent = 'Nochmal spielen';
  }
}

function waehlen(wertId) {
  if (phase !== 'wahl' && phase !== 'pcwahl') return;
  const r = spieleRunde(zustand, wertId);
  zustand = r.zustand;
  letztes = r.ergebnis;
  phase = 'aufgedeckt';
  zeichnen();
}

function weiter() {
  if (phase === 'pcwahl') {
    waehlen(computerWahl(zustand.computer[0], KARTEN, WERTE));
  } else if (phase === 'aufgedeckt') {
    phase = gewinner(zustand) ? 'ende' : zustand.amZug === 'du' ? 'wahl' : 'pcwahl';
    zeichnen();
  } else if (phase === 'ende') {
    start();
  }
}

function start() {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  zustand = neuesSpiel(KARTEN, zufall(seed));
  phase = 'wahl';
  zeichnen();
}

// --- Bilder ---------------------------------------------------------------

function bildSetzen(id, blob) {
  if (bildUrls.has(id)) URL.revokeObjectURL(bildUrls.get(id));
  bildUrls.set(id, URL.createObjectURL(blob));
}

function bildStatus(extra = '') {
  $('bild-status').textContent = `${bildUrls.size} von ${KARTEN.length} Bildern geladen. ${extra}`.trim();
}

async function bilderWaehlen(ev) {
  const fehler = [];
  let ok = 0;
  let nurSitzung = false;
  for (const datei of ev.target.files) {
    const p = pruefeDatei(datei, IDS);
    if (p.fehler) { fehler.push(p.fehler); continue; }
    bildSetzen(p.id, datei);
    if (!(await speichern(p.id, datei))) nurSitzung = true;
    ok++;
  }
  ev.target.value = '';
  bildStatus([
    ok ? `${ok} neu.` : '',
    nurSitzung ? 'Speichern im Browser nicht möglich — Bilder gelten bis zum Neuladen.' : '',
    fehler.length ? `Übersprungen: ${fehler.join('; ')}` : '',
  ].filter(Boolean).join(' '));
  zeichnen();
}

async function bilderLoeschen() {
  for (const url of bildUrls.values()) URL.revokeObjectURL(url);
  bildUrls.clear();
  await allesLoeschen();
  bildStatus('Alle entfernt.');
  zeichnen();
}

function kartenliste() {
  const ul = $('kartenliste');
  for (const k of KARTEN) ul.append(el('li', null, `${k.id} · ${k.name}`));
}

$('weiter').addEventListener('click', weiter);
$('neu').addEventListener('click', start);
$('bild-wahl').addEventListener('change', bilderWaehlen);
$('bilder-loeschen').addEventListener('click', bilderLoeschen);

kartenliste();
start();
allesLaden().then((map) => {
  for (const [id, blob] of map) if (IDS.has(id)) bildSetzen(id, blob);
  bildStatus();
  zeichnen();
});
