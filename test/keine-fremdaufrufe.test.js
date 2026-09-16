import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// Die Seite ist öffentlich und richtet sich an ein deutsches Publikum.
// Jeder Aufruf an einen fremden Host überträgt die IP des Besuchers ohne
// Einwilligung — genau das Muster, das 2022 vor dem LG München abgemahnt
// wurde (Az. 3 O 17493/20). Diese Prüfung hält die Seite frei davon.

const DATEIEN = [
  'index.html',
  'assets/style.css',
  'assets/fonts.css',
  'docs/projektplan.html',
  ...readdirSync(new URL('../assets', import.meta.url))
    .filter((f) => f.endsWith('.js'))
    .map((f) => `assets/${f}`),
];

const lies = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('keine Datei lädt eine Ressource von einem fremden Host', () => {
  for (const datei of DATEIEN) {
    const inhalt = lies(datei);
    const treffer = [...inhalt.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)]
      .map((m) => m[1])
      // Verweise im Fließtext sind Links, die der Leser selbst anklickt —
      // sie laden nichts beim Seitenaufruf.
      .filter((u) => !/^https?:\/\/(arxiv\.org|nrlc\.ai|www\.lumar\.io|blckalpaca\.at)/.test(u));
    assert.deepEqual(treffer, [], `${datei} lädt von fremden Hosts: ${treffer.join(', ')}`);
  }
});

test('keine CSS-Datei importiert oder lädt von einem fremden Host', () => {
  for (const datei of DATEIEN.filter((d) => d.endsWith('.css'))) {
    const inhalt = lies(datei);
    assert.ok(!/@import\s+url\(\s*["']?https?:/i.test(inhalt), `${datei} nutzt @import auf einen fremden Host`);
    const urls = [...inhalt.matchAll(/url\(\s*["']?(https?:\/\/[^"')]+)/gi)].map((m) => m[1]);
    assert.deepEqual(urls, [], `${datei} lädt: ${urls.join(', ')}`);
  }
});

test('kein Skript baut zur Laufzeit eine Verbindung auf', () => {
  for (const datei of DATEIEN.filter((d) => d.endsWith('.js'))) {
    const inhalt = lies(datei);
    for (const verboten of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'navigator.sendBeacon', 'EventSource']) {
      assert.ok(!inhalt.includes(verboten),
        `${datei} nutzt ${verboten} — Version 1 spricht mit keinem Dienst`);
    }
  }
});

test('alle in fonts.css genannten Schriftdateien liegen im Repository', () => {
  const css = lies('assets/fonts.css');
  const pfade = [...css.matchAll(/url\('\.\/fonts\/([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(pfade.length >= 6, 'zu wenige Schriftschnitte eingebunden');
  const vorhanden = new Set(readdirSync(new URL('../assets/fonts', import.meta.url)));
  for (const p of pfade) assert.ok(vorhanden.has(p), `fehlt: assets/fonts/${p}`);
});
