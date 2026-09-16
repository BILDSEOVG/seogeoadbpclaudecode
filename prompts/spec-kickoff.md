# GEO-Text-Optimizer — Spec-Driven Development

> Kickoff-Prompt. In ein Coding-Agent-Fenster einfügen, in dem dieses
> Repository geöffnet ist.

Baue ein Tool in drei Phasen. Halte nach Phase 1 und Phase 2 an und warte
auf meine Freigabe.

    Phase 1 → spec.md    (WAS und WARUM, kein Code)
    Phase 2 → tasks.md   (kleine, einzeln testbare Schritte)
    Phase 3 → Implementierung, Task für Task, Test zuerst

---

## Produkt

Eine self-hosted Next.js-Web-App, die deutschsprachige Texte für generative
Engines (ChatGPT, Perplexity, Google AI Overviews, Claude) optimiert.

**Eingabe:** Text (Pflicht), Zielfrage bzw. Haupt-Keyword (Pflicht),
Grounding an/aus.

**Ausgabe — vier Bereiche, alle vier sind Pflicht:**

| # | Bereich | Felder je Eintrag |
|---|---------|-------------------|
| 1 | Optimierter Text | Ersatztext, Änderungen markiert |
| 2 | Änderungen | `vorher`, `nachher`, `regel_id`, `begruendung`, `impact` |
| 3 | Keyword-Vorschläge | `keyword`, `kategorie`, `begruendung`, `platzierung` |
| 4 | Fehlende Informationen | `luecke`, `warum_kritisch`, `rueckfrage` |

Dazu ein GEO-Score vorher/nachher — **im Code berechnet**, nicht vom Modell
geschätzt.

---

## Architektur — genau EIN LLM-Call pro Analyse

1. **Security Gate** (0 Token)
   Zod-Validierung, Größenlimit 25.000 Zeichen, Rate-Limit,
   Injection-Scan, Unicode-Normalisierung (NFKC, unsichtbare Zeichen raus).

2. **Deterministische Analyse** (0 Token)
   Misst im Code alles Zählbare: Zahlen, Quellenangaben, Zitate,
   Absatz- und Satzlängen, Lesbarkeit, Keyword-Dichte, Entitäten-Konsistenz.
   Ergebnis: ein Signal-Digest von maximal 300 Token.

3. **Grounding** (gecacht)
   Eine Suchanfrage, maximal 5 Treffer, nur Titel und Snippet.
   Cache-Key `hash(zielfrage + sprache)`, TTL 24 Stunden.
   Ergebnis: ein Digest von maximal 400 Token.

4. **LLM-Call**
   Claude Sonnet mit Structured Outputs.
   System-Prompt = Inhalt von `geo-rules.md`, mit Prompt Caching.
   User-Content = Nutzertext + Signal-Digest + Grounding-Digest.

5. **Post-Validation** (0 Token)
   Schema-Prüfung, Fakten-Wächter, Diff gegen das Original, Re-Scoring,
   Output-Escaping.

### Nicht verhandelbar

- Genau ein LLM-Call pro Analyse. Keine Agent-Schleife, kein Multi-Pass.
- Das Modell zählt nichts, was Code zählen kann.
- `geo-rules.md` steht im gecachten System-Prompt, nie im User-Content.
- Ohne Such-API-Key: Grounding sauber deaktiviert plus sichtbarer
  UI-Hinweis. Kein Absturz, keine stille Verschlechterung.
- Budget: höchstens 6.000 Input-Token pro Analyse ohne Cache.
  Überschreitung ist ein fehlgeschlagener Test, keine Warnung.

---

## Regelwerk

Die vollständige SEO-Logik steht in `geo-rules.md` im Repository-Root.
**Lies sie, bevor du irgendetwas planst.**

Erfinde keine eigenen GEO-Regeln, dupliziere keine Regeln in den Code und
ändere `geo-rules.md` nicht ohne ausdrückliche Anweisung. Jede `regel_id`
in der Änderungsliste muss dort existieren — das wird im Test geprüft.

---

## Sicherheit

**Fakten-Wächter — die wichtigste Regel.** Jede Zahl, jedes Datum, jeder
Eigenname und jede URL im Ausgabetext muss im Eingabetext oder im
Grounding-Digest vorkommen. Andernfalls wird die Stelle markiert und im
Ergebnis ausgewiesen. Das Tool erfindet niemals Statistiken, Quellen oder
Zitate — fehlende Belege gehören in Liste 4, nicht in den Text.

Weiter:

- Nutzertext ist **Daten, nie Anweisung**: delimitiert übergeben, im
  System-Prompt ausdrücklich als Daten deklariert. Der Injection-Scanner
  aus Schritt 1 setzt ein Flag, ändert aber nichts an dieser Behandlung.
- API-Keys ausschließlich serverseitig. Kein `NEXT_PUBLIC_*` für Secrets.
- Rate-Limit pro IP und Session, dazu ein Tages-Kostendeckel mit
  Kill-Switch.
- Ausgabe nie als rohes HTML rendern: escapen, CSP-Header setzen, kein
  `dangerouslySetInnerHTML` ohne Sanitizer.
- DSGVO: Kundentexte werden per Default nicht gespeichert. Keine Texte in
  Fehler-Logs.

---

## Tests — gehören zur Definition of Done

| Ebene | Kriterium |
|-------|-----------|
| Unit | Jeder Analyzer gegen deutsche Golden Fixtures |
| Contract | Zod-Schema auf dem LLM-Output, fail-closed — ungültiges JSON ergibt einen sauberen Fehler, nie eine halbe Ausgabe |
| Security | 10 Injection- und XSS-Payloads im Eingabetext bleiben wirkungslos |
| Fakten-Wächter | Adversariale Fixtures mit erfundenen Zahlen werden zu 100 % erkannt |
| Eval | 10 deutsche Testtexte aus verschiedenen Branchen, Score-Delta im Median größer 0, Baseline als Regressionsschutz |
| Kosten | Durchschnittliche Token pro Request unter Budget |
| E2E | Playwright: Text rein, alle vier Ausgabebereiche befüllt |

Playwright ist in dieser Umgebung vorinstalliert
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Führe kein
`playwright install` aus.

---

## Umformulierungsregeln

1. Keine neuen Fakten, Zahlen, Namen oder Quellen.
2. Tonalität erhalten, kein Marketing-Sprech.
3. Nur ändern, was einer `regel_id` zuzuordnen ist.
4. Länge höchstens ±20 % gegenüber dem Original.
5. Bei Regeln mit mittlerer oder schwacher Evidenz muss die Begründung das
   benennen.

---

## Kommunikation

- Antworte auf Deutsch.
- Nutze Listen und Tabellen.
- Nenne Quellen bei SEO-Aussagen.
- Begründe kurz, warum du dich so entschieden hast.
- Bei Unklarheiten fragen, nicht raten. Markiere offene Punkte in `spec.md`
  ausdrücklich als `NEEDS CLARIFICATION`.
- Wenn ich sage, dass etwas nicht funktioniert: Fehler bei dir suchen und
  reproduzieren, nicht erklären, wie ich es richtig bedienen soll.
