# WEBLAB HS25 - Technologie-Radar

Dies ist das Projekt für das Modul WEBLAB im HS25. Ziel ist es, einen Technologie-Radar zu entwickeln, der es ermöglicht, verschiedene Technologien zu kategorisieren und deren Entwicklung zu verfolgen.

## Tech-Stack

- **Frontend**: Nuxt 4 + Nuxt UI + Tailwind CSS
- **Backend**: Nuxt 4 / Nitro + REST-API
- **Datenbank**: PostgreSQL
- **Auth**: JWT
- **Testing**: Vitest + Playwright

## Setup

Das Projekt kann entweder manuell aufgesetzt/genutzt werden für DEV oder mittels Docker / Docker-Compose gebaut und als "PROD"-Version genutzt werden.

### 1. Dev

Für das DEV-Setup muss folgendes gemacht werden:
```bash
# Dependencies herunterladen
npm i

# .env anpassen
cp .env.example .env
vim .env # Gewünschte config (defaults funktionieren für DEV)

# DB-Starten
docker compose -f stack.local.yml -d

# DB-Migrieren / Schema erstellen
npm run db:migrate

# (Optional) Dummy Daten einfügen
npm run db:seed

# Applikation starten
npx nuxi dev
```

Die Applikation ist dann unter `http://localhost:3000` erreichbar.

### 2. Prod

Die Applikation kann auch via docker-compose gebaut und genutzt werden.

```bash
docker compose -f stack.deploy.yml up
```

Die Applikation ist dann unter `http://localhost:3000` erreichbar.

Es können auch andere ENV-Variablen mitgegeben werden als die standardmässig konfigurierten.

Falls ein DB-Seed ausgeführt werden soll, muss der `seed`-Service im `stack.deploy.yml` aktiviert werden.