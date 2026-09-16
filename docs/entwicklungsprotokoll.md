# Entwicklungsprotokoll

**16. September 2026** · Repository `bildseovg/seogeoadbpclaudecode` · Branch `claude/kind-turing-cj4vid`

Was an diesem Tag entschieden, gebaut und wieder verworfen wurde — und warum.

---

## 1. Ausgangslage

Gewünscht war ein Werkzeug, das deutschsprachige Texte für generative Engines
(ChatGPT, Perplexity, Google AI Overviews, Claude) analysiert und umformatiert.
Vier Ausgaben: den geänderten Text, eine Liste der Änderungen mit Begründung,
Keyword-Vorschläge mit Begründung, und einen Hinweis, wenn entscheidende
Informationen fehlen.

Das Repository war leer.

## 2. Ablauf

| Schritt | Ergebnis |
|---------|----------|
| Externe Recherche | Evidenzbasis aus vier Quellen, siehe Abschnitt 7 |
| Spec-Prompt | `prompts/spec-kickoff.md` und `geo-rules.md` |
| Phase 1 | `spec.md` — Anforderungen ohne Technik |
| Phase 2 | `tasks.md` — 25 Aufgaben, Technikentscheidungen, Kostenmodell |
| Druckfassung | `docs/projektplan.html`, auch als Artifact veröffentlicht |
| **Architekturwechsel** | GitHub Pages statt Server, kein Sprachmodell |
| Version 1 | Lauffähige statische Seite, 46 Tests |

## 3. Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Regelwerk als eigene Datei `geo-rules.md` | Der SEO-Verantwortliche pflegt die Logik, ohne Code anzufassen |
| Jede Regel trägt eine Evidenzstärke | Die Studienwerte sind Laborwerte. Ohne diese Kennzeichnung entsteht Scheinsicherheit gegenüber Kunden |
| Das Werkzeug ergänzt keine Belege | Die drei stärksten Regeln verlangen Quellen, Zahlen und Zitate. Ein Werkzeug, das sie automatisch „erfüllt", erfindet sie |
| Deterministische Schicht statt Modellaufruf für alles Zählbare | Was Code zählen kann, soll Code zählen |
| Ein Zod-Schema für Antwortformat und Prüfung *(für Version 2)* | Kein doppelter Vertrag |

## 4. Der Architekturwechsel

Nachmittags kam die Vorgabe: GitHub Pages statt eigenem Hosting, und die
externen Aufrufe sollen zunächst entfallen. Das ist kein Detail, sondern
verändert die Statik des Entwurfs.

**Was daran hängt:** GitHub Pages liefert nur Dateien aus. Es gibt keine
serverseitige Route, die einen API-Schlüssel halten könnte. Ein Schlüssel im
ausgelieferten JavaScript einer öffentlichen Seite ist offen einsehbar.
Damit fallen auch Rate-Limit, Tages-Kostendeckel und Bot-Schutz weg, weil sie
serverseitig durchgesetzt werden müssten.

**Die Entscheidung:** Version 1 spricht mit keinem fremden Dienst. Damit gibt
es nichts zu missbrauchen und nichts zu schützen.

| Anforderung | Vorher | In Version 1 |
|-------------|--------|--------------|
| Sätze umformulieren | Modellaufruf | **entfällt** — ohne Sprachmodell nicht seriös machbar |
| Live-Websuche für Entitäten | Brave, 24-h-Cache | **entfällt** |
| KS-1 bis KS-3 Missbrauchsschutz | serverseitig | **gegenstandslos** — kein Server, keine Kosten |
| DS-1 bis DS-3 Datenschutz | Zusage | **strukturell erfüllt** — der Text verlässt den Browser nicht |
| Analyse, Score, Lücken, Keywords | Modell + Code | **vollständig im Code** |

**Was das ehrlich kostet:** Das Ausgabefeld heißt jetzt „Umstrukturierte
Fassung", nicht „Optimierter Text". Es teilt zu lange Absätze an Satzgrenzen
und vereinheitlicht Leerraum. Mehr ist ohne Sprachmodell nicht möglich, ohne
den Sinn zu riskieren. Ein Test prüft deshalb, dass durch die Umstrukturierung
kein Wort verloren geht und keines hinzukommt.

## 5. Gefundene Fehler

### In den eigenen Planungsdokumenten

| Fehler | Korrektur |
|--------|-----------|
| KS-5 forderte höchstens 6.000 Input-Token, KS-4 erlaubte 25.000 Zeichen — im Deutschen bereits rund 8.300 Token. Die Grenzen widersprachen sich | KS-5 ist jetzt eine Kostenobergrenze von 0,15 € je Analyse, mit Rechengrundlage |
| Prompt Caching wurde als Hebel für das Token-Ziel dargestellt | Nachgerechnet spart es rund 2 % der Kosten. Der Treiber ist die Ausgabelänge, beim gewählten Modell das Fünffache der Eingabe |
| „Cloudflare Turnstile" stand in `spec.md`, die per Definition technikfrei ist | Ersetzt durch „Bot-Schutz (Captcha o. Ä.)" |

### Im Code — erst durch die Sichtprüfung der laufenden Seite gefunden

Keiner dieser fünf Fehler wäre durch die Tests allein aufgefallen. Sie zeigten
sich erst, als die Ausgabe im Browser gelesen wurde. Alle fünf sind jetzt
durch Regressionstests abgedeckt.

| Symptom | Ursache |
|---------|---------|
| „Bundesverband" wurde nicht als Quelle erkannt | Deutsche Komposita brechen die Wortgrenze: vor „verband" steht ein „s" |
| Hauptentität war „gereinigt" statt „Schankanlagen" | Häufigkeit schlug Wortart. Jetzt entscheidet Großschreibung mitten im Satz — im Deutschen ein verlässliches Nomen-Signal |
| „Schankanlage" galt als fehlend, obwohl „Schankanlagen" im Text stand | Beugung wurde nicht berücksichtigt |
| Vorschlag „Was kostet Wie oft muss eine Anlage gereinigt werden?" | Die ganze Zielfrage floss in die Prompt-Vorlagen statt eines Kernbegriffs |
| „beste Anbieter" wurde als Long-Tail vorgeschlagen | Widersprach direkt Regel D2, die unbelegte Superlative anmahnt |

Zusätzlich fehlte das Feld `bereits_vorhanden` aus FR-4 — ohne das wirkt jeder
Vorschlag wie eine Ergänzung, auch wenn er längst im Text steht.

## 5b. Nachtrag: Google Fonts entfernt

Nachdem die Seite über GitHub Pages öffentlich erreichbar war, fiel ein
Problem auf, das vorher folgenlos gewesen wäre: Die Seite lud ihre Schriften
von `fonts.googleapis.com` und `fonts.gstatic.com`. Damit geht die
IP-Adresse jedes Besuchers ohne Einwilligung an einen Dritten — genau das
Muster, das 2022 vor dem Landgericht München I abgemahnt wurde
(Az. 3 O 17493/20).

Zusätzlich war dadurch die Zusage im Seitenkopf — „keine Übertragung" —
selbst nicht ganz zutreffend.

**Behoben:** Die zwölf benötigten Schriftschnitte liegen jetzt unter
`assets/fonts/` im Repository, eingebunden über `assets/fonts.css`. Durch
`unicode-range` lädt ein deutschsprachiger Besucher nur die sechs
`latin`-Dateien, rund 180 KB. Im Browser gegengeprüft: null Aufrufe an
fremde Hosts.

Dieselbe Umstellung betrifft `docs/projektplan.html`, das über Pages
ebenfalls öffentlich erreichbar ist.

`test/keine-fremdaufrufe.test.js` hält den Zustand fest. Die Prüfung schlägt
fehl, sobald eine Datei wieder von einem fremden Host lädt, sobald eine
CSS-Datei `@import` auf eine fremde Adresse nutzt, oder sobald ein Skript
`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` oder `EventSource`
verwendet. Links im Fließtext sind ausgenommen — die klickt der Leser
selbst an, sie laden beim Seitenaufruf nichts.

> **Hinweis zur Artifact-Fassung:** Die auf claude.ai veröffentlichte
> Fassung des Projektplans ist ein Schnappschuss von vorher und bindet dort
> weiterhin Google Fonts ein. Das ist auf claude.ai der vorgesehene Weg und
> betrifft die eigene Domain nicht. Wird sie neu veröffentlicht, müssen die
> Schriftdateien mitgegeben werden.

## 6. Stand

### Was läuft

- 46 Tests grün, ohne jede Abhängigkeit, über den Test-Runner von Node 22
- Die Seite wurde in einem echten Browser geprüft: alle vier Ausgabebereiche
  füllen sich, keine Konsolenfehler aus eigenem Code, kein waagerechter
  Überlauf bei 390 Pixel Breite
- Alles committet und auf den Standard-Branch gepusht

### Was noch aussteht

**GitHub Pages ist aktiv.** Die Seite läuft unter
`https://bildseovg.github.io/seogeoadbpclaudecode/`. Bestätigt wurde das vom
Auftraggeber, nicht aus dieser Umgebung heraus: Der Sandbox-Proxy blockiert
`github.io` vollständig, sowohl über curl als auch über WebFetch. Prüfungen
der Live-Seite brauchen daher fremde Augen oder einen Screenshot.

Was hier geprüft wurde, ist die Seite aus demselben Commit-Stand, lokal in
einem echten Chromium ausgeliefert.

### Dokumentations-Schuld

`spec.md` und `tasks.md` beschreiben weiterhin die Server-Variante mit
Sprachmodell und Websuche. Das ist kein Versehen: Sie bleiben die Vorlage für
Version 2. Beide tragen jetzt am Kopf einen Hinweis, welcher Teil in
Version 1 umgesetzt ist und welcher nicht.

## 7. Quellen

| Quelle | Beitrag |
|--------|---------|
| [GEO: Generative Engine Optimization, KDD 2024](https://arxiv.org/abs/2311.09735) | Die Effektwerte der Regelgruppe A, Keyword-Stuffing −10 % |
| [GEO-16 Framework](https://nrlc.ai/en-us/insights/geo16-introduction/) | 1.702 Zitationen über 1.100 URLs; Freshness und semantische Struktur als stärkste Faktoren |
| [Content Chunking & AI Extractability, Lumar](https://www.lumar.io/blog/best-practice/content-chunking-ai-extractability-geo-aeo-explainer/) | Bewertung auf Passagen-Ebene, Entitäten-Konsistenz |
| [Princeton GEO Study — Kritik](https://blckalpaca.at/en/knowledge-base/seo-geo/geo-generative-engine-optimization/the-princeton-geo-study-methodology-results-and-critique) | Einordnung der Limitierungen |

Die Prozentwerte der Gruppe A sind Maximalwerte aus einer Laborstudie von
2023/24, englischsprachig, mit wenigen konkurrierenden Quellen. Kein
Durchschnitt, keine Garantie. Die Richtung ist durch GEO-16 unabhängig
bestätigt, die exakten Werte sind es nicht.

## 8. Anmerkung zum Beispieltext

Der Demotext auf der Seite handelt von Schankanlagenreinigung. Diese Branche
wurde aus den in der Sitzung verbundenen WordPress-Servern abgeleitet
(`Schankanlagenservice_Hamburg_WordPress`, `Wordpress_Schankanlagen_Ahrenhold`)
— eine Annahme, keine Vorgabe. Der Text ist frei erfunden und enthält keine
Inhalte dieser Seiten. Er lässt sich in einer Zeile in `assets/app.js`
austauschen.

## 9. Nächste Schritte

| Priorität | Schritt |
|-----------|---------|
| 1 | Die Live-Seite mit echten Kundentexten gegenprüfen |
| 2 | Regelwerk fachlich gegenlesen — Gewichtung und Schwellen sind Annahmen |
| 3 | Version 2 planen: Umformulierung, damit ein Server mit Schlüssel und die Sperren aus `spec.md` |
