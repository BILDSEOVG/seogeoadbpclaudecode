# Spezifikation: GEO-Text-Optimizer

> **Stand 16.09.2026 — gilt für Version 2, nicht für die laufende Seite.**
>
> Version 1 läuft rein deterministisch auf GitHub Pages, ohne Server und ohne
> externe Dienste. Dieses Dokument beschreibt weiterhin die Zielarchitektur
> mit Sprachmodell und Websuche.
>
> | Abschnitt | In Version 1 |
> |---|---|
> | FR-1 bis FR-7, FR-11, FR-12 | umgesetzt, ohne Sprachmodell |
> | FR-8 Fakten-Wächter | gegenstandslos — es wird kein Text erzeugt |
> | FR-9 Kopieren | umgesetzt |
> | FR-10 Grounding-Abschaltung | gegenstandslos — es gibt kein Grounding |
> | KS-1 bis KS-6 Missbrauchsschutz | gegenstandslos — kein Server, keine Kosten |
> | DS-1 bis DS-3 Datenschutz | strukturell erfüllt — der Text verlässt den Browser nicht |
> | US-1 Umformulieren | **nicht umgesetzt** — braucht ein Sprachmodell |
>
> Ablauf und Begründung: [`docs/entwicklungsprotokoll.md`](docs/entwicklungsprotokoll.md)

Version 1.0 (Entwurf) · Phase 1 · kein Code

## 1. Zweck

Deutschsprachige Texte so umformulieren, dass generative Engines sie als
Quelle zitieren — und dem Autor nachvollziehbar zeigen, warum jede Änderung
vorgenommen wurde.

### Nicht-Ziele

| Nicht enthalten | Begründung |
|---|---|
| Texte von Grund auf schreiben | Das Tool optimiert vorhandene Texte, es erfindet keine |
| Belege recherchieren und einsetzen | Fehlende Zahlen und Quellen gehören zum Autor, nicht zum Modell |
| Rank-Tracking oder Sichtbarkeits-Monitoring | Eigenes Produkt, eigener Datenbedarf |
| Andere Sprachen als Deutsch | Regelwerk und Lesbarkeitsmaße sind auf Deutsch ausgelegt |
| CMS-Anbindung | Ausgabe wird kopiert, nicht publiziert |

## 2. Nutzer

SEO-Verantwortliche und Redakteure. Das Tool ist **öffentlich ohne Login**
erreichbar. Daraus folgt eine eigene Anforderungsgruppe für Missbrauchs- und
Kostenschutz (Abschnitt 5).

## 3. User Stories

### US-1 — Text optimieren

> **Given** ich habe einen deutschsprachigen Text und eine Zielfrage
> **When** ich die Analyse starte
> **Then** erhalte ich den optimierten Text, drei begründete Listen und einen
> GEO-Score vorher/nachher

Akzeptanz: Ergebnis in unter 30 Sekunden. Alle vier Ausgabebereiche sind
befüllt oder tragen einen ausdrücklichen Hinweis, warum sie leer sind.

### US-2 — Jede Änderung nachvollziehen

> **Given** die Analyse ist abgeschlossen
> **When** ich eine Änderung in der Änderungsliste ansehe
> **Then** sehe ich Vorher, Nachher, die Regel-ID, die Begründung und die
> Evidenzstärke dieser Regel

Akzeptanz: Keine Änderung ohne gültige `regel_id` aus `geo-rules.md`. Bei
Evidenz `mittel` oder `schwach` benennt die Begründung das.

### US-3 — Keyword-Vorschläge verstehen und einsetzen

> **Given** die Analyse ist abgeschlossen
> **When** ich die Keyword-Liste ansehe
> **Then** sehe ich je Vorschlag die Kategorie, die GEO-Begründung und an
> welcher Stelle im Text er hingehört

Akzeptanz: Jeder Vorschlag trägt genau eine Kategorie aus `geo-rules.md`.
Bereits im Text vorhandene Begriffe werden als solche gekennzeichnet statt
erneut vorgeschlagen.

### US-4 — Fehlende Informationen erkennen

> **Given** mein Text enthält keine Zahlen und keine Quellenangabe
> **When** die Analyse läuft
> **Then** erscheinen dafür Einträge in der Lücken-Liste mit konkreter
> Rückfrage an mich — **und der optimierte Text enthält keine erfundenen
> Zahlen oder Quellen**

Akzeptanz: Dies ist die wichtigste Anforderung der Spezifikation. Ein
Verstoß ist ein Fehler, keine Geschmacksfrage.

### US-5 — Erfundene Fakten werden sichtbar

> **Given** der optimierte Text enthält eine Zahl, einen Namen oder eine URL,
> die weder im Originaltext noch in den Suchergebnissen vorkommt
> **When** ich das Ergebnis ansehe
> **Then** ist diese Stelle deutlich markiert

Akzeptanz: Die Prüfung läuft automatisch, nicht auf Anforderung.

### US-6 — Struktur darf verbessert werden

> **Given** mein Text ist eine Wand aus Fließtext ohne Überschriften
> **When** die Analyse läuft
> **Then** darf das Tool Überschriften, Absatzgrenzen und Listen neu setzen,
> solange jede strukturelle Änderung einer Regel-ID zugeordnet ist

Akzeptanz: Gesamtlänge höchstens ±20 % zum Original. Inhaltliche Aussagen
bleiben unverändert.

### US-7 — Betrieb bleibt bezahlbar *(Betreiber-Story)*

> **Given** das Tool ist öffentlich erreichbar
> **When** jemand es automatisiert oder massenhaft aufruft
> **Then** greifen Captcha, Limit pro IP und Tages-Kostendeckel — und beim
> Erreichen des Deckels sieht der Nutzer einen verständlichen Hinweis statt
> eines Absturzes

Akzeptanz: Die Kosten eines Tages sind nach oben begrenzt und diese Grenze
ist ohne Codeänderung anpassbar.

## 4. Funktionale Anforderungen

| ID | Anforderung |
|----|-------------|
| FR-1 | Eingabe: Text (Pflicht), Zielfrage (Pflicht), Grounding an/aus |
| FR-2 | Ausgabe: optimierter Text mit markierten Änderungen |
| FR-3 | Ausgabe: Änderungsliste mit `vorher`, `nachher`, `regel_id`, `begruendung`, `impact` |
| FR-4 | Ausgabe: Keyword-Liste mit `keyword`, `kategorie`, `begruendung`, `platzierung`, `bereits_vorhanden` |
| FR-5 | Ausgabe: Lücken-Liste mit `luecke`, `warum_kritisch`, `rueckfrage` |
| FR-6 | Ausgabe: GEO-Score vorher/nachher, im Code berechnet |
| FR-7 | Jede `regel_id` existiert in `geo-rules.md`, sonst wird die Änderung verworfen |
| FR-8 | Fakten-Wächter markiert Zahlen, Daten, Eigennamen und URLs ohne Beleg |
| FR-9 | Optimierten Text als Markdown in die Zwischenablage kopieren |
| FR-10 | Ohne Such-API-Schlüssel läuft das Tool mit deaktiviertem Grounding und sichtbarem Hinweis weiter |
| FR-11 | Erkannte Injection-Versuche im Eingabetext werden dem Nutzer als Hinweis angezeigt |
| FR-12 | Fehler erzeugen eine verständliche deutsche Meldung, nie eine halbe Ausgabe |

## 5. Missbrauchs- und Kostenschutz

Folgt aus dem öffentlichen Zugang.

| ID | Anforderung | Annahme (änderbar) |
|----|-------------|--------------------|
| KS-1 | Bot-Schutz vor der Analyse (Captcha o. Ä.) | Anbieter mit kostenlosem Kontingent |
| KS-2 | Limit pro IP | 10 Analysen pro Tag |
| KS-3 | Globaler Tages-Kostendeckel mit Kill-Switch | 5 € pro Tag |
| KS-4 | Maximale Textlänge | 25.000 Zeichen |
| KS-5 | Kostenobergrenze je Analyse | 0,15 € bei maximaler Textlänge |
| KS-6 | Bei erreichtem Deckel: verständlicher Hinweis, kein Fehler | — |

Die Werte in der rechten Spalte sind Vorschläge und per Konfiguration
änderbar, nicht im Code verdrahtet.

**Rechengrundlage zu KS-3 und KS-5:** Ein Text an der Längengrenze (25.000
Zeichen ≈ 8.300 Token im Deutschen) erzeugt zusammen mit Regelwerk und
Digests rund 10.700 Eingabe- und 10.300 Ausgabe-Token. Die Ausgabe ist beim
verwendeten Modell das Fünffache der Eingabe wert, sie bestimmt die Kosten.
Daraus folgen rund 0,12 € je Maximal-Analyse und rund 40 solcher Analysen
pro Tag beim angenommenen Deckel.

## 6. Datenschutz

| ID | Anforderung |
|----|-------------|
| DS-1 | Kundentexte werden nicht gespeichert |
| DS-2 | Keine Texte in Logs, auch nicht in Fehlerlogs |
| DS-3 | Keine Weitergabe an Dritte außer dem Modellanbieter und der Such-API |
| DS-4 | Datenschutzhinweis in der Oberfläche, da öffentlich zugänglich |

## 7. Qualität

| ID | Anforderung |
|----|-------------|
| Q-1 | Analyse dauert unter 30 Sekunden |
| Q-2 | Genau ein Modellaufruf pro Analyse |
| Q-3 | Oberfläche auf Mobilgeräten bedienbar |
| Q-4 | Gleicher Text und gleiche Zielfrage ergeben bei deaktiviertem Grounding einen stabilen Score |

## 8. Offene Punkte

| # | Frage | Status |
|---|-------|--------|
| 1 | Hosting-Ziel (Vercel, eigener Server, Container)? Bestimmt, wie Rate-Limit und Cache gespeichert werden | NEEDS CLARIFICATION |
| 2 | Tagesbudget in Euro — 5 € als Annahme gesetzt | NEEDS CLARIFICATION |
| 3 | Analysen pro IP und Tag — 10 als Annahme gesetzt | NEEDS CLARIFICATION |
| 4 | Eigene Domain gewünscht? | NEEDS CLARIFICATION |

Diese Punkte blockieren Phase 2 nicht. Sie werden vor Phase 3 beantwortet.
