import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { KARTEN, WERTE, GRUPPEN } from '../kartenspiel/karten.js';
import { zufall, mischen, neuesSpiel, spieleRunde, computerWahl, gewinner, MAX_RUNDEN } from '../kartenspiel/spiel.js';
import { pruefeDatei, MAX_BYTES } from '../kartenspiel/bilder.js';

test('32 Karten, 8 Gruppen zu je 4, IDs A1 bis H4 eindeutig', () => {
  assert.equal(KARTEN.length, 32);
  const ids = KARTEN.map((k) => k.id);
  assert.equal(new Set(ids).size, 32);
  for (const g of Object.keys(GRUPPEN)) {
    assert.deepEqual(ids.filter((i) => i[0] === g), [1, 2, 3, 4].map((n) => g + n), g);
  }
});

test('jede Karte hat Namen und alle Werte als Ganzzahl 1–100', () => {
  for (const k of KARTEN) {
    assert.ok(k.name.trim().length > 0, k.id);
    for (const w of WERTE) {
      const v = k.werte[w.id];
      assert.ok(Number.isInteger(v) && v >= 1 && v <= 100, `${k.id}.${w.id} = ${v}`);
    }
  }
});

test('kein Wert ist sinnlos: jede Kategorie hat ein Spektrum', () => {
  for (const w of WERTE) {
    const v = KARTEN.map((k) => k.werte[w.id]);
    assert.ok(Math.max(...v) - Math.min(...v) >= 50, w.id);
  }
});

test('keine Karte ist in jedem Wert die stärkste (kein Freifahrtschein)', () => {
  for (const k of KARTEN) {
    const ueberall = WERTE.every((w) => KARTEN.every((o) => o === k || k.werte[w.id] > o.werte[w.id]));
    assert.ok(!ueberall, k.id);
  }
});

test('mischen verliert und verdoppelt keine Karte', () => {
  const m = mischen(KARTEN, zufall(1));
  assert.deepEqual(m.map((k) => k.id).sort(), KARTEN.map((k) => k.id).sort());
});

test('Austeilen: je 16 Karten, gleicher Startwert ergibt gleiches Spiel', () => {
  const a = neuesSpiel(KARTEN, zufall(42));
  const b = neuesSpiel(KARTEN, zufall(42));
  assert.equal(a.du.length, 16);
  assert.equal(a.computer.length, 16);
  assert.deepEqual(a.du.map((k) => k.id), b.du.map((k) => k.id));
});

test('höherer Wert gewinnt beide Karten und das Zugrecht', () => {
  const kermit = KARTEN.find((k) => k.id === 'A1');
  const animal = KARTEN.find((k) => k.id === 'B4');
  const z = { du: [kermit], computer: [animal, kermit], topf: [], amZug: 'du', runde: 0 };
  const { zustand, ergebnis } = spieleRunde(z, 'laut'); // 45 gegen 99
  assert.equal(ergebnis.sieger, 'computer');
  assert.equal(zustand.du.length, 0);
  assert.equal(zustand.computer.length, 3);
  assert.equal(zustand.amZug, 'computer');
  assert.equal(gewinner(zustand), 'computer');
});

test('Unentschieden: Karten in den Topf, Sieger der nächsten Runde nimmt alles', () => {
  const k = KARTEN.find((x) => x.id === 'A1');
  const stark = KARTEN.find((x) => x.id === 'B4');
  const schwach = KARTEN.find((x) => x.id === 'F4');
  let z = { du: [k, stark], computer: [k, schwach], topf: [], amZug: 'du', runde: 0 };
  z = spieleRunde(z, 'witz').zustand;
  assert.equal(z.topf.length, 2);
  assert.equal(z.amZug, 'du');
  z = spieleRunde(z, 'laut').zustand;
  assert.equal(z.topf.length, 0);
  assert.equal(z.du.length, 4);
  assert.equal(gewinner(z), 'du');
});

test('unbekannter Wert und Zug nach Spielende werfen einen Fehler', () => {
  const z = neuesSpiel(KARTEN, zufall(3));
  assert.throws(() => spieleRunde(z, '<script>'));
  assert.throws(() => spieleRunde({ ...z, du: [] }, 'witz'));
});

test('Computer wählt seinen relativ stärksten Wert', () => {
  const animal = KARTEN.find((k) => k.id === 'B4');
  assert.ok(['laut', 'chaos'].includes(computerWahl(animal, KARTEN, WERTE)));
  const rowlf = KARTEN.find((k) => k.id === 'C2');
  assert.equal(computerWahl(rowlf, KARTEN, WERTE), 'musik');
});

test('Simulation: 500 Spiele enden, Kartenzahl bleibt immer 32', () => {
  const siege = { du: 0, computer: 0, unentschieden: 0 };
  for (let s = 1; s <= 500; s++) {
    const rnd = zufall(s);
    let z = neuesSpiel(KARTEN, rnd);
    while (!gewinner(z)) {
      // „du“ spielt zufällig, der Computer mit seiner Strategie
      const wert = z.amZug === 'du'
        ? WERTE[Math.floor(rnd() * WERTE.length)].id
        : computerWahl(z.computer[0], KARTEN, WERTE);
      z = spieleRunde(z, wert).zustand;
      assert.equal(z.du.length + z.computer.length + z.topf.length, 32);
    }
    assert.ok(z.runde <= MAX_RUNDEN);
    siege[gewinner(z)]++;
  }
  // Klug wählen muss sich lohnen — sonst wäre das Spiel reines Glück.
  assert.ok(siege.computer > siege.du, JSON.stringify(siege));
});

test('Fairness: bei gleich klugen Spielern gewinnt keine Seite dauerhaft', () => {
  let du = 0;
  const N = 500;
  for (let s = 1; s <= N; s++) {
    let z = neuesSpiel(KARTEN, zufall(s));
    while (!gewinner(z)) {
      const karte = z.amZug === 'du' ? z.du[0] : z.computer[0];
      z = spieleRunde(z, computerWahl(karte, KARTEN, WERTE)).zustand;
    }
    if (gewinner(z) === 'du') du++;
  }
  // Nur das Austeilen entscheidet; Anteil muss nahe 50 % liegen.
  assert.ok(du / N > 0.35 && du / N < 0.65, `Du gewinnt ${du} von ${N}`);
});

test('Bild-Upload: nur passende Namen, Formate und Größen', () => {
  const ids = new Set(KARTEN.map((k) => k.id));
  const d = (name, type = 'image/jpeg', size = 1000) => ({ name, type, size });
  assert.deepEqual(pruefeDatei(d('A1.jpg'), ids), { id: 'A1' });
  assert.deepEqual(pruefeDatei(d('h4.PNG', 'image/png'), ids), { id: 'H4' });
  assert.ok(pruefeDatei(d('kermit.jpg'), ids).fehler);
  assert.ok(pruefeDatei(d('A5.jpg'), ids).fehler);
  assert.ok(pruefeDatei(d('A1.svg', 'image/svg+xml'), ids).fehler, 'SVG kann Skripte enthalten');
  assert.ok(pruefeDatei(d('A1.jpg', 'text/html'), ids).fehler);
  assert.ok(pruefeDatei(d('A1.jpg', 'image/jpeg', MAX_BYTES + 1), ids).fehler);
  assert.ok(pruefeDatei(d('../A1.jpg'), ids).fehler);
});

test('keine Muppets-Bilder im Repository (Urheberrecht)', () => {
  const dateien = readdirSync(new URL('../kartenspiel', import.meta.url), { recursive: true });
  const bilder = dateien.filter((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f));
  assert.deepEqual(bilder, []);
});
