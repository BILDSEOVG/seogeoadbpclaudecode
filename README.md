# GEO-Text-Optimizer

Ein Tool, das deutschsprachige Texte für generative Engines (ChatGPT,
Perplexity, Google AI Overviews, Claude) analysiert und umformuliert.

**Live:** https://bildseovg.github.io/seogeoadbpclaudecode/

**Status:** Version 1 läuft. Rein deterministisch, ohne Server und ohne externe Dienste.

## Version 1 starten

Die Seite ist eine statische Datei ohne Abhängigkeiten:

```
python3 -m http.server 8000   # dann http://localhost:8000 öffnen
node --test test/*.test.js    # 50 Tests, kein npm install nötig
```

Für GitHub Pages: in den Repository-Einstellungen unter *Pages* als Quelle
den Branch wählen, der `index.html` enthält. Die Datei `.nojekyll` sorgt
dafür, dass der Ordner `assets/` ausgeliefert wird.

### Was Version 1 kann und was nicht

| Kann | Kann nicht |
|------|------------|
| Text gegen 12 Regeln prüfen und bewerten | Sätze umformulieren |
| Zu lange Absätze zitierfähig teilen | Belege ergänzen |
| Fehlende Belege als Rückfrage ausgeben | Suchvolumina liefern |
| Keywords aus Text, Zielfrage und Regelwerk ableiten | Wettbewerb prüfen |

Umformulieren braucht ein Sprachmodell und damit einen Server, der den
Schlüssel hält. Das ist Version 2.

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
| `docs/projektplan.html` | Druckbare Gesamtübersicht | abgeleitet |
| `docs/entwicklungsprotokoll.md` | Was wann warum entschieden wurde | abgeleitet |

`geo-rules.md` ist die einzige Quelle für SEO-Logik. Es wird zur Laufzeit als
System-Prompt geladen — eine Änderung dort ändert das Tool-Verhalten, ohne
dass Code angefasst wird.

## Nächster Schritt

Phase 3: Umsetzung entlang `tasks.md`, Aufgabe für Aufgabe, Test zuerst.
T-01 bis T-12 können sofort starten. Vor T-13 sind die vier offenen Punkte
aus Abschnitt 8 der Spezifikation zu beantworten — sie bestimmen, wo
Rate-Limit und Cache liegen.
