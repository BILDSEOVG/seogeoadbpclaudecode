import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keywordVorschlaege, kernbegriff } from '../assets/keywords.js';
import { analysiere } from '../assets/analyze.js';
import { REGEL_NACH_ID, KEYWORD_KATEGORIEN } from '../assets/rules.js';
import { SCHWACH, STARK } from './fixtures.js';

test('jeder Vorschlag ist vollständig und verweist auf eine echte Regel', () => {
  const r = analysiere(SCHWACH, 'Schankanlagenreinigung Hamburg');
  const v = keywordVorschlaege(SCHWACH, 'Schankanlagenreinigung Hamburg', r.entitaet);
  assert.ok(v.length > 0);
  for (const k of v) {
    assert.ok(k.keyword && k.begruendung && k.platzierung && k.herkunft, JSON.stringify(k));
    assert.ok(REGEL_NACH_ID[k.regel_id], `unbekannte Regel ${k.regel_id}`);
    assert.ok(KEYWORD_KATEGORIEN[k.kategorie], `unbekannte Kategorie ${k.kategorie}`);
  }
});

test('wiederholt kein Prompt-Muster, das schon im Text steht', () => {
  const jahr = new Date().getFullYear();
  const text = `Was kostet Schankanlagenreinigung ${jahr}? Schankanlagenreinigung ist eine Pflicht in Hamburg.`;
  const v = keywordVorschlaege(text, 'Schankanlagenreinigung', 'schankanlagenreinigung');
  const muster = v.filter((k) => k.kategorie === 'frage').map((k) => k.keyword.toLowerCase());
  assert.ok(!muster.includes(`schankanlagenreinigung ${jahr}`));
  assert.ok(!muster.some((m) => m.startsWith('was kostet schankanlagenreinigung')));
});

test('markiert jeden Vorschlag als neu oder bereits vorhanden', () => {
  const v = keywordVorschlaege('Die Anlage wird gereinigt.', 'Wartung Anlage', 'anlage');
  assert.ok(v.length > 0);
  for (const k of v) assert.equal(typeof k.bereits_vorhanden, 'boolean', k.keyword);
});

test('schlägt keine Phrase aus reinen Zahlen vor', () => {
  const v = keywordVorschlaege('Die Anlage kostet 250 Euro im Jahr 2026 laut Verband.', 'Wartung', 'anlage');
  for (const k of v) assert.ok(!/^\d+\s+\d+$/.test(k.keyword), k.keyword);
});

test('meldet Begriffe der Zielfrage, die im Text fehlen', () => {
  const v = keywordVorschlaege('Wir reinigen Anlagen.', 'Schankanlagenreinigung Kosten', null);
  const fehlend = v.filter((k) => k.herkunft.includes('Zielfrage')).map((k) => k.keyword);
  assert.ok(fehlend.includes('kosten'), JSON.stringify(fehlend));
});

test('fordert Ortsbezug nur, wenn keiner da ist', () => {
  const ohne = keywordVorschlaege('Die Anlage wird gereinigt.', 'Reinigung', 'anlage');
  const mit = keywordVorschlaege('Die Anlage in Hamburg wird gereinigt.', 'Reinigung', 'anlage');
  assert.ok(ohne.some((k) => k.kategorie === 'lokal'));
  assert.ok(!mit.some((k) => k.kategorie === 'lokal'));
});

test('erfindet keine Zahlen oder Quellen', () => {
  const v = keywordVorschlaege(STARK, 'Schankanlage', 'schankanlage');
  const jahr = String(new Date().getFullYear());
  for (const k of v) {
    const zahlen = (k.keyword.match(/\d+/g) ?? []).filter((z) => z !== jahr);
    assert.equal(zahlen.length, 0, `Vorschlag erfindet eine Zahl: ${k.keyword}`);
  }
});

// --- Regressionen aus der Sichtprüfung der Oberfläche ---

test('setzt nicht die ganze Zielfrage in die Prompt-Vorlagen', () => {
  const ziel = 'Wie oft muss eine Schankanlage gereinigt werden?';
  const v = keywordVorschlaege('Die Anlage wird gereinigt.', ziel, 'schankanlage');
  for (const k of v.filter((x) => x.kategorie === 'frage')) {
    assert.ok(!k.keyword.includes('Wie oft muss eine'),
      `Vorlage enthält die ganze Frage: ${k.keyword}`);
    assert.ok(k.keyword.split(/\s+/).length <= 5, `Vorschlag zu lang: ${k.keyword}`);
  }
});

test('Kernbegriff: ganze Frage wird zur Hauptentität verkürzt', () => {
  assert.equal(kernbegriff('Wie oft muss eine Schankanlage gereinigt werden?', 'schankanlage'), 'schankanlage');
  assert.equal(kernbegriff('Schankanlagenreinigung Hamburg', null), 'Schankanlagenreinigung Hamburg');
  assert.equal(kernbegriff('Wie funktioniert das genau?', null), 'funktioniert');
});

test('meldet gebeugte Formen nicht als fehlend', () => {
  const v = keywordVorschlaege('Wir reinigen Schankanlagen jede Woche.', 'Schankanlage Reinigung', 'schankanlage');
  const fehlend = v.filter((k) => k.herkunft.includes('Zielfrage')).map((k) => k.keyword);
  assert.ok(!fehlend.includes('schankanlage'),
    `„Schankanlagen" steht im Text, „schankanlage" darf nicht als fehlend gelten: ${JSON.stringify(fehlend)}`);
});

test('schlägt keine kurzen Füllwörter als Keyword vor', () => {
  const v = keywordVorschlaege('Die Anlage wird gereinigt.', 'Wie oft und wie gut?', 'anlage');
  for (const k of v.filter((x) => x.herkunft.includes('Zielfrage'))) {
    assert.ok(k.keyword.length >= 5, `zu kurz: ${k.keyword}`);
  }
});

test('schlägt keine Werbefloskel als Long-Tail vor — das widerspräche D2', () => {
  const text = 'Wir sind der beste Anbieter im Markt. Unsere perfekte Lösung überzeugt viele Betriebe seit Jahren.';
  const v = keywordVorschlaege(text, 'Reinigung', 'lösung');
  for (const k of v) {
    assert.ok(!/\b(beste|perfekte)\b/i.test(k.keyword), `Werbefloskel vorgeschlagen: ${k.keyword}`);
  }
});

test('schreibt die Entität in Vorschlägen groß — deutsche Nomen', () => {
  const v = keywordVorschlaege('Wir reinigen Schankanlagen.', 'Schankanlage Reinigung', 'schankanlagen');
  for (const k of v.filter((x) => ['frage', 'entitaet', 'lokal'].includes(x.kategorie))) {
    assert.ok(!/\bschankanlagen\b/.test(k.keyword), `kleingeschrieben: ${k.keyword}`);
  }
});
