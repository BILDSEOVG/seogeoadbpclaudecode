# Aufgabenliste: GEO-Text-Optimizer

Phase 2 · abgeleitet aus `spec.md` · Stand 2026-09

Reihenfolge ist Abhängigkeitsreihenfolge. Aufgaben mit `∥` in derselben
Gruppe können parallel bearbeitet werden. Jede Aufgabe gilt als fertig,
wenn ihr Akzeptanzkriterium als automatischer Test grün läuft.

---

## Technikentscheidungen

Diese Festlegungen gehören bewusst hierher und nicht in `spec.md`.

| Bereich | Entscheidung | Begründung |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | Serverseitige Route als einzige Stelle mit Schlüsselzugriff |
| Modell | `claude-sonnet-5` | Vom Auftraggeber gewählt; 2 $/Mio. Eingabe, 10 $/Mio. Ausgabe |
| Aufruf | `client.messages.parse()` mit `output_config.format` | Erzwingt das Antwortschema serverseitig, spart eigene Parser-Logik |
| Schema | Zod, geteilt zwischen Antwortformat und Prüfung | Ein Schema, zwei Zwecke — kein doppelter Vertrag |
| Denkmodus | `thinking: { type: "adaptive" }` | Einziger Ein-Modus bei Sonnet 5; `budget_tokens` wird mit Fehler 400 abgelehnt |
| Caching | `cache_control: { type: "ephemeral" }` auf dem Regelwerk | Wirkt erst ab 1.024 Token Präfix — siehe T-16 |
| Suche | Eigene Schnittstelle, Brave als erste Umsetzung | Austauschbar, kostenloses Kontingent, kein Zwang zur Kreditkarte |
| Tests | Vitest für Einheiten, Playwright für E2E | Playwright ist in der Umgebung vorinstalliert |

### Kostenmodell (Grundlage für T-24)

| Position | Menge | Kosten |
|---|---|---|
| Eingabe: Text an der Grenze + Regelwerk + Digests | ~10.700 Token | ~0,021 € |
| Ausgabe: umgeschriebener Text + drei Listen | ~10.300 Token | ~0,103 € |
| **Summe je Maximal-Analyse** | | **~0,12 €** |

Die Ausgabe ist der Kostentreiber. Wer sparen will, begrenzt die Ausgabe,
nicht den Systemprompt.

---

## Gruppe 0 — Fundament

| ID | Aufgabe | Akzeptanz |
|---|---|---|
| T-01 | Projektgerüst: Next.js, TypeScript, Vitest, Playwright, Linting | `npm test` und `npm run build` laufen grün mit einem Platzhaltertest |
| T-02 | Zentrale Konfiguration liest alle Grenzwerte und Schlüssel aus Umgebungsvariablen | Test schlägt fehl, wenn ein Geheimnis unter `NEXT_PUBLIC_*` steht |
| T-03 | Regelwerk-Parser für `geo-rules.md` | 12 Regel-IDs und 5 Keyword-Kategorien erkannt; unbekannte ID wird abgelehnt (FR-7) |

## Gruppe 1 — Deterministische Analyse ∥

Kein Netzwerk, kein Modell. Vollständig ohne Schlüssel testbar.

| ID | Aufgabe | Akzeptanz |
|---|---|---|
| T-04 | Textnormalisierung (NFKC, unsichtbare Zeichen entfernen) und deutsche Satz-/Absatzsegmentierung | Golden Fixtures, inklusive Abkürzungen wie „z. B." und „Dr." |
| T-05 ∥ | Analyzer Belege: Zahlen, Prozentwerte, Zeitangaben, Quellenmuster, Zitate | Regeln A1–A3 werden auf Testtexten korrekt erkannt |
| T-06 ∥ | Analyzer Struktur: Überschriften, Listen, Absatzlängen, Antwort-zuerst | Regeln B1–B3 |
| T-07 ∥ | Analyzer Entitäten: Keyword-Dichte und Stapelung, Entität je Absatz, Synonymnutzung | Regeln A4, B4, C1, C2 |
| T-08 ∥ | Analyzer Vertrauen: Jahreszahl und Datum, unbelegte Superlative | Regeln D1, D2 |
| T-09 | GEO-Score aus T-05 bis T-08, je Dimension A–D plus Gesamtwert | Gleicher Text ergibt denselben Wert bei zehn Durchläufen (Q-4) |
| T-10 | Signal-Digest aus der Analyse | Gemessen mit `messages.count_tokens`: höchstens 300 Token |

## Gruppe 2 — Sicherheit ∥

Ebenfalls ohne Schlüssel testbar. Bewusst vor der Modellanbindung.

| ID | Aufgabe | Akzeptanz |
|---|---|---|
| T-11 ∥ | Injection-Scanner: Anweisungsmuster, Rollenmarker, Base64-Blöcke | 10 Angriffstexte erkannt **und** 10 harmlose Texte nicht markiert (FR-11) |
| T-12 ∥ | Fakten-Wächter: Zahlen, Daten, Eigennamen und URLs der Ausgabe gegen Eingabe und Grounding prüfen | Adversariale Fixtures zu 100 % erkannt (FR-8, US-5) |
| T-13 ∥ | Limit je IP, Tages-Kostendeckel, Kill-Switch | Elfter Aufruf wird abgewiesen; bei erreichtem Deckel kommt ein Hinweis, kein Fehler (KS-2, KS-3, KS-6) |
| T-14 ∥ | Bot-Schutz, serverseitig geprüft | Anfrage ohne gültigen Nachweis wird abgewiesen (KS-1) |

## Gruppe 3 — Externe Dienste

| ID | Aufgabe | Akzeptanz |
|---|---|---|
| T-15 | Such-Schnittstelle mit drei Umsetzungen: Brave, Leerlauf, Testdouble. 24-Stunden-Cache, höchstens 5 Treffer | Ohne Schlüssel greift die Leerlauf-Umsetzung, kein Fehler (FR-10). Zweiter Aufruf derselben Zielfrage löst keine Suche aus. Digest ≤ 400 Token |
| T-16 | Modell-Anbindung: ein Aufruf, `messages.parse()`, Regelwerk mit `cache_control`, Nutzung protokollieren | Zweiter Aufruf meldet `cache_read_input_tokens` größer null. **Bricht der Test ab, ist das Regelwerk unter 1.024 Token gerutscht und wird stillschweigend nicht mehr gecacht** |

## Gruppe 4 — Vertrag und Ablauf

| ID | Aufgabe | Akzeptanz |
|---|---|---|
| T-17 | Zod-Schema für Anfrage und Antwort; dasselbe Antwortschema speist `output_config.format` | Ungültige Anfrage wird abgewiesen; `parsed_output` ist leer bei Schemabruch, die Route liefert dann einen sauberen Fehler (FR-12) |
| T-18 | Route `/api/analyze` verkettet Sicherheitsprüfung, Analyse, Grounding, Modell, Nachprüfung | Integrationstest mit Testdouble statt Modell: alle vier Ausgabebereiche befüllt |
| T-19 | Nachprüfung: Regel-IDs, Fakten-Wächter, Diff gegen das Original, Neuberechnung des Scores, Längengrenze ±20 % | Erfundene Regel-ID wird verworfen; Text über der Längengrenze wird markiert (FR-7, US-6) |

## Gruppe 5 — Oberfläche

| ID | Aufgabe | Akzeptanz |
|---|---|---|
| T-20 | Eingabeformular und Ergebnisansicht mit allen vier Bereichen | Bedienbar bei 375 Pixel Breite (Q-3); Ausgabe wird escaped, kein rohes HTML |
| T-21 | Kopierfunktion, Hinweisleiste (Grounding aus, Injection erkannt, Deckel erreicht), Datenschutzhinweis | Jeder Hinweis erscheint in seinem Fall (FR-9, DS-4) |

## Gruppe 6 — Evaluation

| ID | Aufgabe | Akzeptanz |
|---|---|---|
| T-22 | Eval-Korpus: 10 deutsche Testtexte aus verschiedenen Branchen, Baseline gespeichert | Score-Delta im Median größer null; Abweichung nach unten bricht den Lauf |
| T-23 | E2E-Test mit Playwright | Text rein, alle vier Bereiche befüllt. Kein `playwright install` |
| T-24 | Kostentest gegen das Kostenmodell oben | Gemessene Kosten je Analyse unter 0,15 € (KS-5) |
| T-25 | CI-Arbeitsablauf bündelt alle Tests | Ein Befehl, ein Ergebnis |

---

## Offene Punkte aus der Spezifikation

Blockieren T-01 bis T-12. Müssen vor T-13 beantwortet sein, weil sie
bestimmen, wo Limit und Cache liegen.

| # | Frage | Wirkt auf |
|---|---|---|
| 1 | Hosting-Ziel | T-13, T-15 (Speicher für Limit und Cache) |
| 2 | Tagesbudget, angenommen 5 € ≈ 40 Maximal-Analysen | T-13, T-24 |
| 3 | Analysen je IP und Tag, angenommen 10 | T-13 |
| 4 | Eigene Domain | Auslieferung |
