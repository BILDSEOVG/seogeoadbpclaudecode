# GEO-Text-Optimizer

Ein Tool, das deutschsprachige Texte für generative Engines (ChatGPT,
Perplexity, Google AI Overviews, Claude) analysiert und umformuliert.

**Status:** Phase 2 abgeschlossen — `spec.md` und `tasks.md` liegen vor. Es existiert noch kein Code.

## Was das Tool können soll

Text und Zielfrage rein — vier Dinge raus:

1. Der optimierte Text
2. Jede Änderung mit Regel-ID und Begründung
3. Keyword-Vorschläge mit Begründung und Platzierung
4. Fehlende Informationen als Rückfrage an den Autor

## Warum GEO und nicht klassisches SEO

Die Princeton-Studie zu Generative Engine Optimization (KDD 2024) hat
gemessen, was die Zitierwahrscheinlichkeit in KI-Antworten verändert:

| Maßnahme | Effekt |
|----------|--------|
| Quellen nennen | bis +34 % |
| Statistiken ergänzen | +32 % |
| Zitate einbauen | +30 % |
| Keyword-Stuffing | −10 % |

Keyword-Dichte, der klassische SEO-Hebel, hatte praktisch keinen Einfluss.

## Dateien

| Datei | Zweck | Wer pflegt |
|-------|-------|-----------|
| `prompts/spec-kickoff.md` | Startprompt für die Entwicklung | Technik |
| `geo-rules.md` | Das SEO-Regelwerk mit Quellen und Evidenzstärke | SEO |
| `spec.md` | Anforderungen: WAS und WARUM, ohne Technik | gemeinsam |
| `tasks.md` | 25 Aufgaben mit Akzeptanzkriterien, Technikentscheidungen, Kostenmodell | Technik |
| `docs/projektplan.html` | Druckbare Gesamtübersicht aller vier Dokumente | abgeleitet |

`geo-rules.md` ist die einzige Quelle für SEO-Logik. Es wird zur Laufzeit als
System-Prompt geladen — eine Änderung dort ändert das Tool-Verhalten, ohne
dass Code angefasst wird.

## Nächster Schritt

Phase 3: Umsetzung entlang `tasks.md`, Aufgabe für Aufgabe, Test zuerst.
T-01 bis T-12 können sofort starten. Vor T-13 sind die vier offenen Punkte
aus Abschnitt 8 der Spezifikation zu beantworten — sie bestimmen, wo
Rate-Limit und Cache liegen.
