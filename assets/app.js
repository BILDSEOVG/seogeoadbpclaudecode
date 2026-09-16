// Oberfläche. Verdrahtet die reinen Module mit dem DOM.
// Kein Netzwerk, kein Schlüssel, keine Speicherung von Texten.

import { analysiere, DIMENSIONEN } from './analyze.js';
import { umstrukturiere, empfehlungen } from './restructure.js';
import { keywordVorschlaege } from './keywords.js';
import { luecken } from './luecken.js';
import { KEYWORD_KATEGORIEN } from './rules.js';

const $ = (id) => document.getElementById(id);

// Alles, was aus Nutzertext stammt, geht durch textContent — nie durch innerHTML.
function el(tag, klasse, text) {
  const n = document.createElement(tag);
  if (klasse) n.className = klasse;
  if (text !== undefined) n.textContent = text;
  return n;
}

const EV_KLASSE = { stark: 's', mittel: 'm', schwach: 'w' };

function scoreKlasse(p) {
  return p >= 70 ? 'gut' : p >= 40 ? 'mittel' : 'schwach';
}

function zeigeScore(score, kennzahlen) {
  const box = $('score');
  box.replaceChildren();

  const gesamt = el('div', `gesamt ${scoreKlasse(score.gesamt)}`);
  gesamt.append(el('span', 'zahl', String(score.gesamt)));
  gesamt.append(el('span', 'label', 'GEO-Score'));
  box.append(gesamt);

  const dims = el('div', 'dims');
  for (const [key, name] of Object.entries(DIMENSIONEN)) {
    const p = score.dimensionen[key];
    const d = el('div', 'dim');
    d.append(el('span', 'dim-key', key));
    d.append(el('span', 'dim-name', name));
    const bar = el('div', 'bar');
    const fill = el('div', `fill ${scoreKlasse(p)}`);
    fill.style.width = `${p}%`;
    bar.append(fill);
    d.append(bar);
    d.append(el('span', 'dim-wert', String(p)));
    dims.append(d);
  }
  box.append(dims);

  box.append(el('p', 'kennzahlen',
    `${kennzahlen.woerter} Wörter · ${kennzahlen.saetze} Sätze · ${kennzahlen.absaetze} Absätze`));
}

function zeigeBefunde(befunde) {
  const t = $('befunde');
  t.replaceChildren();
  for (const b of [...befunde].sort((x, y) => x.punkte - y.punkte)) {
    const tr = el('tr');
    tr.append(el('td', 'id', b.regel_id));
    const td = el('td');
    td.append(el('strong', null, b.titel));
    td.append(el('span', 'mess', b.messwert));
    tr.append(td);
    tr.append(el('td', `ev ${EV_KLASSE[b.evidenz]}`, b.evidenz));
    const pkt = el('td', 'punkte');
    pkt.append(el('span', `pill ${scoreKlasse(b.punkte)}`, String(b.punkte)));
    tr.append(pkt);
    t.append(tr);
  }
}

function zeigeAenderungen(liste) {
  const box = $('aenderungen');
  box.replaceChildren();
  $('aenderungen-zahl').textContent = String(liste.length);
  if (!liste.length) {
    box.append(el('p', 'leer', 'Keine Änderung nötig — die geprüften Strukturregeln sind erfüllt.'));
    return;
  }
  for (const a of liste) {
    const item = el('article', 'item');
    const kopf = el('div', 'item-kopf');
    kopf.append(el('span', 'id', a.regel_id));
    kopf.append(el('span', `typ ${a.typ}`, a.typ === 'automatisch' ? 'angewendet' : 'Empfehlung'));
    kopf.append(el('span', `impact ${a.impact}`, `Wirkung ${a.impact}`));
    item.append(kopf);
    const diff = el('div', 'diff');
    diff.append(el('span', 'vorher', a.vorher));
    diff.append(el('span', 'pfeil', '→'));
    diff.append(el('span', 'nachher', a.nachher));
    item.append(diff);
    item.append(el('p', 'warum', a.begruendung));
    box.append(item);
  }
}

function zeigeKeywords(liste) {
  const box = $('keywords');
  box.replaceChildren();
  $('keywords-zahl').textContent = String(liste.length);
  if (!liste.length) {
    box.append(el('p', 'leer', 'Keine Vorschläge — gib eine Zielfrage an, dann wird mehr ableitbar.'));
    return;
  }
  for (const k of liste) {
    const item = el('article', 'item');
    const kopf = el('div', 'item-kopf');
    kopf.append(el('span', 'kw', k.keyword));
    kopf.append(el('span', 'kat', KEYWORD_KATEGORIEN[k.kategorie]));
    if (k.bereits_vorhanden) kopf.append(el('span', 'vorhanden', 'steht schon im Text'));
    kopf.append(el('span', 'id', k.regel_id));
    item.append(kopf);
    item.append(el('p', 'warum', k.begruendung));
    const wo = el('p', 'wo');
    wo.append(el('b', null, 'Platzierung: '));
    wo.append(document.createTextNode(k.platzierung));
    wo.append(el('span', 'herkunft', k.herkunft));
    item.append(wo);
    box.append(item);
  }
}

function zeigeLuecken(liste) {
  const box = $('luecken');
  box.replaceChildren();
  $('luecken-zahl').textContent = String(liste.length);
  if (!liste.length) {
    box.append(el('p', 'leer', 'Keine kritische Lücke gefunden. Die Grundlagen für Zitierfähigkeit sind vorhanden.'));
    return;
  }
  for (const l of liste) {
    const item = el('article', 'item luecke');
    const kopf = el('div', 'item-kopf');
    kopf.append(el('span', 'id', l.regel_id));
    kopf.append(el('strong', null, l.luecke));
    kopf.append(el('span', `ev ${EV_KLASSE[l.evidenz]}`, l.evidenz));
    item.append(kopf);
    item.append(el('p', 'warum', l.warum_kritisch));
    const frage = el('p', 'frage');
    frage.append(el('b', null, 'An dich: '));
    frage.append(document.createTextNode(l.rueckfrage));
    item.append(frage);
    box.append(item);
  }
}

function lauf() {
  const text = $('eingabe').value;
  const ziel = $('zielfrage').value;

  if (!text.trim()) {
    $('hinweis').textContent = 'Bitte zuerst einen Text einfügen.';
    $('hinweis').hidden = false;
    return;
  }
  $('hinweis').hidden = true;

  const a = analysiere(text, ziel);
  const um = umstrukturiere(text);
  const emp = empfehlungen(a.befunde, a.entitaet);
  const kw = keywordVorschlaege(text, ziel, a.entitaet);
  const lk = luecken(a.befunde);

  zeigeScore(a.score, a.kennzahlen);
  zeigeBefunde(a.befunde);
  $('ausgabe').value = um.text;
  zeigeAenderungen([...um.aenderungen, ...emp]);
  zeigeKeywords(kw);
  zeigeLuecken(lk);

  $('entitaet').textContent = a.entitaet ? `Erkannte Hauptentität: „${a.entitaet}"` : 'Keine Hauptentität erkennbar';
  $('ergebnis').hidden = false;
  $('ergebnis').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function kopiere() {
  const knopf = $('kopieren');
  navigator.clipboard.writeText($('ausgabe').value).then(
    () => { knopf.textContent = 'Kopiert'; setTimeout(() => { knopf.textContent = 'Fassung kopieren'; }, 1600); },
    () => { knopf.textContent = 'Kopieren fehlgeschlagen'; },
  );
}

$('analysieren').addEventListener('click', lauf);
$('kopieren').addEventListener('click', kopiere);
$('beispiel').addEventListener('click', () => {
  $('zielfrage').value = 'Wie oft muss eine Schankanlage gereinigt werden?';
  $('eingabe').value = `Wir sind der beste Anbieter für Schankanlagenreinigung und einzigartig am Markt. Unsere Reinigung ist perfekt. Wir reinigen Schankanlagen, weil Schankanlagen regelmäßig gereinigt werden müssen und Schankanlagen sonst verkeimen. Das Bier leidet darunter und die Gäste merken es sofort am Geschmack. Sie können sich vollständig auf uns verlassen, denn wir arbeiten seit vielen Jahren in diesem Bereich und kennen jede Anlage. Unsere Mitarbeiter sind geschult und kommen zu Terminen, die Ihnen passen. Auch am Wochenende sind wir für Sie im Einsatz. Die Anfahrt übernehmen wir im gesamten Umland ohne zusätzliche Berechnung für Sie. Nach jedem Termin erhalten Sie ein Protokoll, das den Ablauf und die verwendeten Mittel dokumentiert. So haben Sie jederzeit einen Nachweis für Ihre Unterlagen und für eine mögliche Kontrolle. Rufen Sie uns an, wir beraten Sie gern und unverbindlich zu allen Fragen rund um Ihre Anlage und deren Reinigung.`;
  lauf();
});

// Beim Laden mit dem Beispiel starten, damit sichtbar ist, was das Werkzeug tut.
$('beispiel').click();
