import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analysiere, hauptentitaet } from '../assets/analyze.js';
import { REGELN } from '../assets/rules.js';
import { SCHWACH, STARK, LEER } from './fixtures.js';

const befund = (r, id) => r.befunde.find((b) => b.regel_id === id);

test('liefert für jede Regel genau einen Befund', () => {
  const r = analysiere(STARK, 'Schankanlagenreinigung Intervall');
  assert.equal(r.befunde.length, REGELN.length);
  assert.deepEqual(r.befunde.map((b) => b.regel_id).sort(), REGELN.map((x) => x.id).sort());
});

test('starker Text schneidet besser ab als schwacher', () => {
  const s = analysiere(SCHWACH, 'Schankanlagenreinigung');
  const g = analysiere(STARK, 'Schankanlagenreinigung');
  assert.ok(g.score.gesamt > s.score.gesamt,
    `stark ${g.score.gesamt} sollte über schwach ${s.score.gesamt} liegen`);
});

test('A1 erkennt Normen und Verbände als Quelle', () => {
  assert.ok(befund(analysiere(STARK, 'x'), 'A1').anzahl >= 2);
  assert.equal(befund(analysiere(SCHWACH, 'x'), 'A1').anzahl, 0);
});

test('A2 erkennt Zahlen mit Einheit', () => {
  assert.ok(befund(analysiere(STARK, 'x'), 'A2').anzahl >= 3);
  assert.equal(befund(analysiere(SCHWACH, 'x'), 'A2').anzahl, 0);
});

test('A3 verlangt einen Urheber zum Zitat', () => {
  assert.equal(befund(analysiere(STARK, 'x'), 'A3').anzahl, 1);
  const ohneUrheber = analysiere('Er sprach. „Das ist ein Zitat ohne jede Zuordnung."', 'x');
  assert.equal(befund(ohneUrheber, 'A3').punkte, 30);
});

test('A4 erkennt dreifache Nennung im selben Satz', () => {
  const r = analysiere(SCHWACH, 'Schankanlagen');
  assert.ok(befund(r, 'A4').anzahl >= 1, 'Häufung im Satz muss auffallen');
  assert.ok(befund(r, 'A4').punkte <= 25);
});

test('A4 meldet nichts ohne Zielfrage', () => {
  assert.equal(befund(analysiere(SCHWACH, ''), 'A4').punkte, 100);
});

test('B1 misst Überdeckung der Zielfrage in den ersten Sätzen', () => {
  const treffer = analysiere('Eine Schankanlage muss alle vierzehn Tage gereinigt werden. Mehr dazu unten.', 'Schankanlage Reinigung');
  const daneben = analysiere('Unser Unternehmen besteht seit vielen Jahren. Wir haben viele Kunden.', 'Schankanlage Reinigung');
  assert.ok(befund(treffer, 'B1').punkte > befund(daneben, 'B1').punkte);
});

test('D1 bewertet aktuelle Jahreszahl höher als gar keine', () => {
  const jahr = new Date().getFullYear();
  assert.equal(befund(analysiere(`Stand ${jahr}: Die Regel gilt.`, 'x'), 'D1').punkte, 100);
  assert.equal(befund(analysiere('Die Regel gilt.', 'x'), 'D1').punkte, 0);
});

test('D2 wertet Superlativ neben einer Zahl als belegt', () => {
  const unbelegt = analysiere('Wir sind der beste Anbieter der Region.', 'x');
  const belegt = analysiere('Mit 1.200 gereinigten Anlagen ist das der beste Wert im Vergleich.', 'x');
  assert.ok(befund(unbelegt, 'D2').anzahl > befund(belegt, 'D2').anzahl);
});

test('Score bleibt bei zehn Durchläufen identisch', () => {
  const werte = Array.from({ length: 10 }, () => analysiere(STARK, 'Schankanlagenreinigung').score.gesamt);
  assert.equal(new Set(werte).size, 1);
});

test('leerer Text stürzt nicht ab', () => {
  const r = analysiere(LEER, '');
  assert.equal(r.kennzahlen.woerter, 0);
  assert.ok(Number.isFinite(r.score.gesamt));
});

test('unsichtbare Steuerzeichen werden entfernt', () => {
  const r = analysiere('Text​mit﻿Zeichen und 2026.', 'x');
  assert.ok(!r.befunde.some((b) => JSON.stringify(b).includes('​')));
});

test('Hauptentität kommt aus Zielfrage und Text', () => {
  assert.equal(hauptentitaet(STARK, 'Schankanlage Reinigung'), 'schankanlage');
});

// --- Regression aus der Sichtprüfung ---

test('Hauptentität ist ein Nomen, kein Partizip', () => {
  const text = 'Wir reinigen Schankanlagen jede Woche. Die Anlage wird gereinigt und danach wird erneut gereinigt.';
  const e = hauptentitaet(text, 'Wie oft muss eine Schankanlage gereinigt werden?');
  assert.equal(e, 'schankanlagen',
    `„gereinigt" ist ein Partizip und darf nicht als Entität gewinnen, erhalten: ${e}`);
});

test('Hauptentität erkennt gebeugte Form aus der Zielfrage', () => {
  assert.equal(hauptentitaet('Wir reinigen Schankanlagen regelmäßig und gründlich.', 'Schankanlage'), 'schankanlagen');
});
