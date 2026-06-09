# Belegscanner Web

Selfhosted Beleg-Scanner für den Raspberry Pi (oder jeden anderen Linux-Server).  
Läuft komplett lokal — kein Cloud-Konto, kein Supabase, kein externes Abo nötig.

## Features

- 📷 Foto-Upload oder Kamera-Input (Mobile)
- 🤖 KI-gestützte OCR: Betrag, Datum, Händler + Artikel automatisch extrahieren
- 🏷️ Artikel-Kategorisierung (Lebensmittel, Kosmetik, Haushalt, …)
- 📊 Statistiken & Charts (Ausgaben pro Monat/Kategorie)
- 📤 Export als JSON oder CSV
- 🔒 Lokale Auth (E-Mail + Passwort, kein Cloud-Service)
- 🗄️ SQLite-Datenbank (eine Datei im Docker Volume)
- 🖼️ Bilder lokal gespeichert (kein S3, kein Supabase Storage)

---

## Schnellstart — Raspberry Pi (empfohlen)

```bash
# 1. Repository klonen (nur docker-compose.yml wird gebraucht)
git clone https://github.com/nicolasasauer/belegscanner_web.git
cd belegscanner_web

# 2. (Optional) Eigenen Auth-Secret setzen — empfohlen für Sicherheit
echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env

# 3. Container starten (Image wird automatisch von GHCR gezogen)
docker compose up -d

# 4. Browser öffnen → http://<raspberry-pi-ip>:3000
#    → Setup-Wizard öffnet sich automatisch
#    → E-Mail + Passwort für deinen Account eingeben
#    → KI-Provider konfigurieren (optional)
#    → Fertig!
```

Das war's. Kein .env.local, kein Supabase, kein API-Key Pflicht.

---

## Mit lokalem KI (Ollama, empfohlen für Pi)

```bash
# Ollama-Container mitстарten:
docker compose --profile ai up -d

# Vision-Modell laden (einmalig, ~4 GB):
docker exec belegscanner-ollama ollama pull llava

# Im Setup-Wizard:
# Provider: Ollama
# Base URL: http://ollama:11434   ← funktioniert im Docker-Netzwerk
```

---

## Datenspeicherung

Alle Daten liegen im `./data/`-Verzeichnis neben der `docker-compose.yml`:

```
data/
  receipts.db      ← SQLite-Datenbank (Belege, Nutzerkonten)
  uploads/         ← Belegfotos
  config.json      ← KI-Einstellungen (Provider, Modell, Key)
```

**Backup** — einfach den `data/`-Ordner kopieren.

---

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) — der Setup-Wizard führt dich durch die Einrichtung.

### Mit lokalem Docker-Build testen

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

---

## KI-Provider

Wähle im Setup-Wizard einen der folgenden Anbieter:

| Provider | Typ | Empfehlung |
|----------|-----|------------|
| **Ollama** | Lokal | ✅ Für Pi — kostenlos, kein API-Key |
| **LM Studio** | Lokal | PC/Mac — grafische Oberfläche |
| **Claude** (Anthropic) | Cloud | Genaueste OCR, kostenpflichtig |
| **Mistral** | Cloud | Vision via Pixtral |
| **Gemini** (Google) | Cloud | Großzügiges Free-Tier |

Den Provider kannst du jederzeit im Setup-Wizard unter `/setup` ändern.

---

## Docker Image

Das Image wird bei jedem Push zu `main` automatisch gebaut (GitHub Actions) und auf GHCR veröffentlicht:

| Tag | Beschreibung |
|-----|-------------|
| `latest` | Letzter stabiler Build (`main`) |
| `main` | Branch `main` |
| `develop` | Vorschau-Branch |
| `v1.0.0` | Release-Tag |

Unterstützte Architekturen: **linux/amd64** + **linux/arm64** (Raspberry Pi 4/5)

---

## docker-compose.yml — Wichtige Optionen

```yaml
environment:
  AUTH_SECRET: ${AUTH_SECRET:-...}   # Override via .env-Datei neben docker-compose.yml
  PORT: 3000                          # Anderen Port: PORT=8080 docker compose up -d
```

---

## Tech Stack

- **Next.js 14** + TypeScript
- **SQLite** (better-sqlite3) + Drizzle ORM
- **NextAuth.js v5** (Credentials-Provider)
- **Tailwind CSS** + Radix UI + Recharts
- **KI:** Ollama / LM Studio / Claude / Mistral / Gemini

---

## Projektstruktur

```
app/
  api/
    auth/          NextAuth-Handler + Registrierung
    ocr/           OCR-Endpunkt (Bild → JSON)
    receipts/      CRUD-API
    upload/        Bild-Upload (→ data/uploads/)
    uploads/       Bild-Serve-Endpunkt
    setup/         Setup-Status + Einrichtung
  dashboard/       Dashboard, Belegliste, Einstellungen
  login/           Login-Seite
  setup/           Setup-Wizard
auth.ts            NextAuth-Konfiguration
lib/
  db/
    schema.ts      Drizzle-Schema (users, receipts)
    index.ts       SQLite-Verbindung + Tabellenerstellung
  services/
    ai.ts          Multi-Provider KI-Service
    receipts.ts    Drizzle CRUD
    stats.ts       Statistiken
  config/
    runtime.ts     AI-Config (liest/schreibt data/config.json)
types/
  index.ts         TypeScript-Typen
```
