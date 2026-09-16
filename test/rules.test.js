import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REGELN, REGEL_NACH_ID, KEYWORD_KATEGORIEN } from '../assets/rules.js';
import { RUECKFRAGEN } from '../assets/luecken.js';

const MD = readFileSync(new URL('../geo-rules.md', import.meta.url), 'utf8');

test('rules.js und geo-rules.md führen dieselben Regel-IDs', () => {
  const imMd = [...MD.matchAll(/^\|\s*([ABCD]\d)\s*\|/gm)].map((m) => m[1]).sort();
  const imCode = REGELN.map((r) => r.id).sort();
  assert.deepEqual(imCode, imMd,
    'Regelwerk und Code sind auseinandergelaufen — geo-rules.md ist die Quelle');
});

test('jede Regel hat Evidenzstärke aus dem erlaubten Satz', () => {
  for (const r of REGELN) assert.ok(['stark', 'mittel', 'schwach'].includes(r.evidenz), r.id);
});

test('jede Regel hat eine Begründung, die etwas erklärt', () => {
  for (const r of REGELN) assert.ok(r.warum.length > 40, `${r.id} begründet zu dünn`);
});

test('jede Rückfrage verweist auf eine existierende Regel', () => {
  for (const id of Object.keys(RUECKFRAGEN)) assert.ok(REGEL_NACH_ID[id], `${id} kennt das Regelwerk nicht`);
});

test('Keyword-Kategorien sind vollständig', () => {
  assert.deepEqual(Object.keys(KEYWORD_KATEGORIEN).sort(),
    ['entitaet', 'frage', 'lokal', 'long_tail', 'semantisch']);
});
