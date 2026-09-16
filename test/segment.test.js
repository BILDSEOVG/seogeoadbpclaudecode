import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absaetze, saetze, woerter, inhaltswoerter } from '../assets/segment.js';

test('Absätze trennen an Leerzeilen und normalisieren Leerraum', () => {
  assert.deepEqual(absaetze('Eins.\n\n  Zwei   drei.  \n\n\nVier.'), ['Eins.', 'Zwei drei.', 'Vier.']);
  assert.deepEqual(absaetze('Ein Absatz\nmit Umbruch.'), ['Ein Absatz\nmit Umbruch.']);
});

test('Sätze: einfacher Fall', () => {
  assert.deepEqual(saetze('Erster Satz. Zweiter Satz! Dritter?'),
    ['Erster Satz.', 'Zweiter Satz!', 'Dritter?']);
});

test('Sätze: Abkürzungen zerreißen nicht', () => {
  assert.deepEqual(saetze('Wir reinigen Anlagen, z. B. in Hamburg. Danach folgt die Prüfung.'),
    ['Wir reinigen Anlagen, z. B. in Hamburg.', 'Danach folgt die Prüfung.']);
  assert.equal(saetze('Dr. Meier prüft die Anlage. Sie ist dicht.').length, 2);
  assert.equal(saetze('Die Kosten liegen bei ca. 200 Euro pro Jahr.').length, 1);
});

test('Sätze: Ordinal- und Dezimalzahlen zerreißen nicht', () => {
  assert.equal(saetze('Am 1. Januar 2026 startet die Pflicht.').length, 1);
  assert.equal(saetze('Der Druck liegt bei 3.5 bar im Betrieb.').length, 1);
});

test('Sätze: Auslassungspunkte sind kein Satzende', () => {
  assert.equal(saetze('Er zögerte ... dann sprach er weiter.').length, 1);
});

test('Wörter: Bindestrich-Komposita sind ein Wort', () => {
  assert.deepEqual(woerter('Schankanlagen-Reinigung in Hamburg'), ['Schankanlagen-Reinigung', 'in', 'Hamburg']);
});

test('Inhaltswörter filtern Stoppwörter', () => {
  assert.deepEqual(inhaltswoerter('Die Reinigung ist für uns wichtig'), ['reinigung', 'wichtig']);
});
