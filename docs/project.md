# Technologie-Radar

## Kontext

Der Technologie-Radar ist ein Werkzeug für Technologie-Management in Unternehmen, Produkt-Teams oder für Software-Architekten. Technologien werden in Quadranten (Techniques, Tools, Platforms, Languages & Frameworks) kategorisiert und nach Reifegrad in Ringen (Assess, Trial, Adopt, Hold) eingeordnet.

In diesem Projekt wird ein Technologie-Radar entwickelt, bestehend aus:

- Technologie-Radar-Administration: CTOs und Tech-Leads verwalten Technologien.
- Technologie-Radar-Viewer: Mitarbeiter sehen veröffentlichte Technologien.

## Fachliche Anforderungen

- **Technologie erfassen (Must)**: CTO kann Technologien mit Pflichtfeldern (Name, Kategorie, Ring, Beschreibung) anlegen.
- **Technologien anzeigen (Must)**: Mitarbeiter sehen veröffentlichte Technologien, strukturiert nach Kategorien und Reifegrad.
- **Entwürfe & Publikation (Should)**: Technologien können als Entwürfe gespeichert und später veröffentlicht werden.
- **Technologie ändern (Should)**: CTOs können Name, Kategorie und Beschreibung bearbeiten.
- **Einordnung ändern (Should)**: CTOs können Ring und Begründung anpassen.
- **Anmeldung Admin (Could)**: Login für CTOs/Tech-Leads mit Passwortschutz.
- **Anmeldung Viewer (Could)**: Optionaler Login für Mitarbeiter.

Dies sind die Ziele aus dem Projektbeschrieb und mein Ziel ist es, all dies umzusetzen. Je nachdem wie schnell ich vorwärts komme, wäre die Implementation von WebSockets für Live-Updates sicherlich noch interessant.

## Qualitätsanforderungen

- Mobile-First-Design, optimiert für Desktop, Tablet und Smartphone.
- Ladezeit < 1 s bei 4G (Chrome Network-Throttling Fast 4G).
- Logging aller Admin-Anmeldungen.
- Unit- und Integration-Tests für Kernfunktionen.

## Technologie-Stack

- **Frontend**: Nuxt 4
- **UI**: Nuxt UI, Tailwind CSS (Responsive Design)
- **Backend/ORM**: Drizzle ORM
- **Datenbank**: PostgreSQL
- **Auth**: Custom mit Nuxt-Auth-Utils
- **Tests**: Vitest + Playwright

## Projekt-Ergebnisse

- Architekturdokumentation (arc42, Fokus Kapitel 4–10)
- Fazit & Reflexion (Retrospektive, Lessons Learned)
- Arbeitsjournal (Datum, Stunden, Tätigkeiten, Total)
- Softwareartefakte (Code im Git-Repository)