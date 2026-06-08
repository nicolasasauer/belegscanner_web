# Belegscanner Web

Web-Version der Belegscanner App — läuft auf Desktop + Mobile im Browser.

## Features

- Foto-Upload oder Kamera-Input
- KI-gestützte OCR: Beleg-Daten + Artikel-Liste automatisch extrahieren
- Artikel-Kategorisierung (Lebensmittel, Kosmetik, Haushalt, …)
- 5 KI-Provider: Ollama, LM Studio (lokal), Claude, Mistral, Gemini (Cloud)
- Statistiken & Charts
- Export als JSON oder CSV
- Supabase-Sync (PostgreSQL + Auth + Storage)
- Responsive Design

---

## Schnellstart

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen einrichten

```bash
cp .env.local.example .env.local
```

Datei öffnen und ausfüllen (siehe Abschnitt „KI-Provider konfigurieren").

### 3. App starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

---

## Docker Deployment

Das offizielle Docker Image wird automatisch bei jedem Push zu `main` gebaut und zu GHCR gepusht. Es unterstützt **linux/amd64** und **linux/arm64** (Raspberry Pi).

### Image holen & starten

```bash
# 1. Image pullen
docker pull ghcr.io/nicolasasauer/belegscanner-web:latest

# 2. Umgebungsvariablen konfigurieren
cp .env.docker.example .env.docker
nano .env.docker   # Supabase-Werte + KI-Provider eintragen

# 3. Starten
docker compose up -d
```

App läuft auf [http://localhost:3000](http://localhost:3000).

Vollständige Anleitung (Raspberry Pi, Ollama, Tailscale): [DEPLOY.md](DEPLOY.md)

### Verfügbare Image-Tags

| Tag | Beschreibung |
|-----|-------------|
| `latest` | Letzter stabiler Build von `main` |
| `main` | Branch `main` |
| `develop` | Branch `develop` (Vorschau) |
| `v1.0.0` | Bestimmte Release-Version |
| `pr-123` | Pull Request Build (zum Testen) |

---

## KI-Provider konfigurieren

Wähle **einen** der folgenden Provider und trage ihn in `.env.local` ein:

### Option A — Ollama (lokal, empfohlen)

Kostenlos, läuft komplett lokal, keine API-Key nötig.

**1. Ollama installieren:**
```
https://ollama.com/download
```

**2. Vision-Modell herunterladen** (wähle eines):
```bash
ollama pull llava              # Standard, gut für OCR
ollama pull llama3.2-vision    # Neuer, genauer
ollama pull moondream          # Klein & schnell
```

**3. `.env.local` konfigurieren:**
```env
AI_PROVIDER=ollama
AI_MODEL=llava
```

Ollama startet automatisch im Hintergrund. Fertig.

---

### Option B — LM Studio (lokal)

Kostenlos, grafische Oberfläche, OpenAI-kompatibel.

**1. LM Studio installieren:**
```
https://lmstudio.ai
```

**2. Modell laden:**
- Unter „Discover" ein Vision-Modell suchen (z. B. LLaVA)
- Modell herunterladen und laden

**3. Local Server starten:**
- Tab „Local Server" öffnen
- „Start Server" klicken (Port 1234)

**4. `.env.local` konfigurieren:**
```env
AI_PROVIDER=lmstudio
AI_MODEL=loaded-model
```

---

### Option C — Anthropic Claude (Cloud)

Sehr genaue Vision + OCR. Kostenpflichtig (günstiges Haiku-Modell empfohlen).

**1. API-Key holen:**
```
https://console.anthropic.com
```

**2. `.env.local` konfigurieren:**
```env
AI_PROVIDER=claude
AI_MODEL=claude-haiku-4-5-20251001
AI_API_KEY=sk-ant-...
```

---

### Option D — Mistral AI (Cloud)

Vision via Pixtral-Modell.

**1. API-Key holen:**
```
https://console.mistral.ai
```

**2. `.env.local` konfigurieren:**
```env
AI_PROVIDER=mistral
AI_MODEL=pixtral-12b-2409
AI_API_KEY=...
```

---

### Option E — Google Gemini (Cloud)

Großzügiges Free-Tier, sehr schnell.

**1. API-Key holen:**
```
https://aistudio.google.com/app/apikey
```

**2. `.env.local` konfigurieren:**
```env
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
AI_API_KEY=AIza...
```

---

## Supabase einrichten

**1. Projekt anlegen:**
```
https://supabase.com/dashboard
```

**2. SQL ausführen** (Supabase → SQL Editor):
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_items_column.sql
```

**3. `.env.local` ausfüllen:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## KI-Status prüfen

Nach dem Start: Dashboard → Einstellungen → „Status prüfen"

Zeigt welcher Provider aktiv ist und ob die Verbindung funktioniert.

---

## Tech Stack

- Next.js 14 + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS + Radix UI
- KI: Ollama / LM Studio / Claude / Mistral / Gemini

---

## Projektstruktur

```
app/
  api/
    ocr/           OCR-Endpunkt (Bild → strukturierte Daten)
    categorize/    Artikel-Kategorisierung
    ai-status/     Provider-Statuscheck
  dashboard/
    receipts/      Belegliste + Detailansicht
    settings/      KI-Einstellungen
lib/
  services/
    ai.ts          Multi-Provider KI-Service
    receipts.ts    Supabase CRUD
  utils/
    categories.ts      Beleg-Kategorien
    item-categories.ts Artikel-Kategorien
types/
  index.ts         TypeScript-Typen
supabase/
  migrations/      SQL-Migrationen
```
