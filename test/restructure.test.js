import { test } from 'node:test';
import assert from 'node:assert/strict';
import { umstrukturiere, empfehlungen } from '../assets/restructure.js';
import { analysiere } from '../assets/analyze.js';
import { absaetze, wortzahl, inhaltswoerter } from '../assets/segment.js';
import { REGEL_NACH_ID } from '../assets/rules.js';
import { SCHWACH, STARK, LANGER_ABSATZ, LEER } from './fixtures.js';

test('teilt zu lange Absätze an Satzgrenzen', () => {
  assert.equal(absaetze(LANGER_ABSATZ).length, 1);
  const r = umstrukturiere(LANGER_ABSATZ);
  const neu = absaetze(r.text);
  assert.ok(neu.length > 1, 'langer Absatz muss geteilt werden');
  for (const p of neu) assert.ok(wortzahl(p) <= 110, `Block zu lang: ${wortzahl(p)}`);
  assert.ok(r.aenderungen.some((a) => a.regel_id === 'B2'));
});

test('verändert keine Aussagen — kein Wort geht verloren oder kommt hinzu', () => {
  for (const text of [SCHWACH, STARK, LANGER_ABSATZ]) {
    const vorher = inhaltswoerter(text).sort();
    const nachher = inhaltswoerter(umstrukturiere(text).text).sort();
    assert.deepEqual(nachher, vorher, 'Umstrukturierung darf den Inhalt nicht ändern');
  }
});

test('lässt bereits gute Absätze unangetastet', () => {
  const r = umstrukturiere(STARK);
  assert.ok(!r.aenderungen.some((a) => a.vorher.includes('Absatz')));
});

test('jede Änderung trägt Regel-ID, Begründung und Wirkung', () => {
  const a = analysiere(SCHWACH, 'Schankanlagen');
  const alle = [...umstrukturiere(SCHWACH).aenderungen, ...empfehlungen(a.befunde, a.entitaet)];
  assert.ok(alle.length > 0);
  for (const x of alle) {
    assert.ok(REGEL_NACH_ID[x.regel_id], `unbekannte Regel ${x.regel_id}`);
    assert.ok(x.begruendung.length > 30, 'Begründung zu dünn');
    assert.ok(['hoch', 'mittel', 'niedrig'].includes(x.impact));
  }
});

test('leerer Text stürzt nicht ab', () => {
  assert.equal(umstrukturiere(LEER).text, '');
  assert.deepEqual(empfehlungen(analysiere(LEER, '').befunde, null).length >= 0, true);
});
