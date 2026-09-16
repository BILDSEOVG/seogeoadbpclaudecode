# GEO-Regelwerk

> **Dieses Dokument gehört dem SEO-Verantwortlichen.** Es enthält keine Technik.
> Änderungen hier ändern das Verhalten des Tools, ohne dass Code angefasst wird.
>
> Version: 1.0 · Stand: 2026-09

## Wie das Regelwerk benutzt wird

Das Tool lädt diese Datei als System-Prompt (per Prompt Caching, daher ab dem
zweiten Aufruf nahezu kostenlos). Jede Änderung, die das Tool am Text vornimmt,
muss auf genau eine `regel_id` aus der Tabelle unten verweisen. Regeln, die hier
nicht stehen, darf das Tool nicht anwenden.

Die Spalte **Evidenz** ist verbindlich für die Begründungstexte: Bei `mittel`
oder `schwach` muss die Begründung im Tool das kenntlich machen. Keine
Scheinsicherheit.

---

## A — Zitierfähigkeit

Die stärkste Hebelgruppe. Generative Engines zitieren Inhalte, die selbst
belegt sind.

| ID | Regel | Prüfung | Effekt | Evidenz |
|----|-------|---------|--------|---------|
| A1 | Quellen explizit nennen | Enthält der Text benannte Quellen (Studie, Institution, Hersteller)? | bis +34 % | stark |
| A2 | Konkrete Zahlen und Statistiken | Enthält der Text Zahlen, Prozentwerte, Mengen, Zeiträume? | +32 % | stark |
| A3 | Zitate von Autoritäten | Enthält der Text ein wörtliches Zitat mit Urheber? | +30 % | stark |
| A4 | Keyword-Stuffing entfernen | Kommt das Haupt-Keyword unnatürlich häufig oder gestapelt vor? | −10 %, wenn drin | stark |

**Wichtig zu A1–A3:** Das Tool **ergänzt diese Belege nicht selbst**. Fehlen sie,
entsteht ein Eintrag in der Lücken-Liste mit einer Rückfrage an den Autor. Ein
Tool, das Statistiken erfindet, produziert Abmahnrisiko statt Sichtbarkeit.

---

## B — Extrahierbarkeit

Generative Engines bewerten einzelne Passagen, nicht ganze Seiten. Jeder Absatz
muss für sich allein zitierbar sein.

| ID | Regel | Prüfung | Evidenz |
|----|-------|---------|---------|
| B1 | Antwort zuerst | Beantworten die ersten 1–3 Sätze die Zielfrage direkt? | stark |
| B2 | Selbsttragende Absätze | Liegt jeder Absatz bei etwa 40–110 Wörtern und behandelt einen Gedanken? | mittel |
| B3 | Semantische Struktur | Gibt es Zwischenüberschriften (idealerweise als Frage), Listen oder Tabellen? | stark |
| B4 | Entität je Absatz | Wird die Kernentität pro Absatz benannt statt durch Pronomen ersetzt? | mittel |

---

## C — Entitäten

| ID | Regel | Prüfung | Evidenz |
|----|-------|---------|---------|
| C1 | Hauptentität eindeutig | Sind Marke, Kategorie und ggf. Ort klar benannt? | mittel |
| C2 | Synonyme statt Wiederholung | Werden Varianten und verwandte Begriffe genutzt statt Exact-Match-Wiederholung? | stark |

---

## D — Vertrauen

| ID | Regel | Prüfung | Evidenz |
|----|-------|---------|---------|
| D1 | Aktualität sichtbar | Enthält der Text eine Jahreszahl oder ein Datum? | stark |
| D2 | Konkret statt Superlativ | Werden unbelegte Superlative durch nachprüfbare Aussagen ersetzt? | mittel |

---

## Keyword-Kategorien

Vorschläge in Liste 3 tragen genau eine dieser Kategorien:

| Kategorie | Bedeutung |
|-----------|-----------|
| `entitaet` | Eindeutig benennbare Marke, Person, Ort, Produkt |
| `long_tail` | Mehrwortphrase mit konkreter Suchintention |
| `frage` | Frageformulierung, wie sie in Prompts vorkommt |
| `semantisch` | Thematisch verwandter Begriff, der das Umfeld stärkt |
| `lokal` | Ort, Region, Einzugsgebiet |

---

## Lücken-Erkennung

Ein Eintrag in Liste 4 entsteht, wenn eine dieser Grundlagen fehlt:

| Auslöser | Rückfrage an den Autor |
|----------|------------------------|
| Keine Zahl im Text (A2) | Welche konkreten Zahlen, Preise oder Zeiträume kannst du belegen? |
| Keine Quelle (A1) | Auf welche Studie, Norm oder Herstellerangabe stützt sich die Aussage? |
| Kein Zitat (A3) | Gibt es eine Stimme aus dem Unternehmen oder der Branche, die zitiert werden kann? |
| Kein Datum (D1) | Auf welchen Stand bezieht sich der Text? |
| Hauptentität unklar (C1) | Um welche Marke, Leistung und welches Einzugsgebiet geht es genau? |
| Zielfrage nicht beantwortet (B1) | Was ist die Ein-Satz-Antwort auf die Zielfrage? |
| Unbelegter Superlativ (D2) | Womit lässt sich die Aussage belegen? |

---

## Quellen

- [GEO: Generative Engine Optimization, KDD 2024](https://arxiv.org/abs/2311.09735) — Cite Sources +34 %, Statistics +32 %, Quotations +30 %, Keyword-Stuffing −10 %
- [AI Answer Engine Citation Behavior: GEO-16](https://nrlc.ai/en-us/insights/geo16-introduction/) — 1.702 Zitationen über 1.100 URLs; Freshness und semantische Struktur als stärkste Faktoren
- [Content Chunking & AI Extractability, Lumar](https://www.lumar.io/blog/best-practice/content-chunking-ai-extractability-geo-aeo-explainer/) — Bewertung auf Passagen-Ebene, Entitäten-Konsistenz
- [Princeton GEO Study — Methodik und Kritik](https://blckalpaca.at/en/knowledge-base/seo-geo/geo-generative-engine-optimization/the-princeton-geo-study-methodology-results-and-critique) — Einordnung der Limitierungen

### Einordnung der Zahlen

Die Prozentwerte in Gruppe A sind **Maximalwerte aus einer Laborstudie**
(2023/24, englischsprachig, wenige konkurrierende Quellen), kein Durchschnitt
und keine Garantie. Die Richtung — Autoritätssignale schlagen Keyword-Dichte —
ist durch GEO-16 unabhängig bestätigt, die exakten Werte sind es nicht.
Deshalb trägt jede Regel eine Evidenzstärke, und das Tool behauptet nie mehr,
als die Quelle hergibt.
