# Deployment auf Raspberry Pi

## Voraussetzungen

- Raspberry Pi 4 oder 5 (4 GB RAM empfohlen)
- Raspberry Pi OS **64-bit** (Bookworm)
- Supabase-Konto (kostenlos unter [supabase.com](https://supabase.com))

---

## Schnellstart — 2 Befehle

```bash
# 1. docker-compose.yml herunterladen
curl -fsSL https://raw.githubusercontent.com/nicolasasauer/belegscanner-web/main/docker-compose.yml -o docker-compose.yml

# 2. Starten
docker compose up -d
```

Dann **http://RASPBERRY-PI-IP:3000** öffnen → Setup-Wizard erscheint automatisch.

---

## Setup-Wizard (Web UI)

Beim ersten Start wird der Setup-Wizard angezeigt:

1. **Supabase URL** + **Anon Key** eingeben
   → Werte im [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API
2. **KI-Provider** wählen (optional, für automatische Belegscan-Erkennung)
3. „Einrichtung abschließen" klicken

Die Einstellungen werden in `./data/config.json` gespeichert und überleben Container-Neustarts.

---

## Mit Ollama (lokale KI, keine Cloud nötig)

```bash
# Mit Ollama-Container starten
docker compose --profile ai up -d

# Einmalig das llava-Modell laden (~4 GB)
docker exec belegscanner-ollama ollama pull llava
```

Im Setup-Wizard dann:
- **Anbieter**: Ollama
- **Modell**: `llava`
- **URL**: `http://ollama:11434`

**Empfohlene Modelle:**

| Modell | Größe | Geschwindigkeit |
|--------|-------|-----------------|
| `llava:7b` | 4 GB | gut |
| `moondream` | 1.7 GB | sehr schnell |

---

## Mit Tailscale (sicherer Fernzugriff von überall)

```bash
# Tailscale auf dem Pi installieren
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Deine Tailscale-IP
tailscale ip -4
```

App dann erreichbar unter `http://100.x.x.x:3000` — von jedem Gerät im Tailscale-Netzwerk.

---

## Häufige Befehle

```bash
make up           # Starten (ohne Ollama)
make up-ai        # Starten (mit Ollama)
make down         # Stoppen
make restart      # Nur Web-App neu starten
make logs         # Live-Logs
make update       # Neuestes Image holen und neu starten
make pull-llava   # llava-Modell laden
make status       # Was läuft gerade?
make help         # Alle Befehle anzeigen
```

---

## Vollständiges Pi-Setup (einmaliges Setup-Script)

```bash
git clone https://github.com/nicolasasauer/belegscanner-web.git
cd belegscanner-web
chmod +x scripts/setup-pi.sh && ./scripts/setup-pi.sh
make up
```

---

## Troubleshooting

**Setup-Wizard erscheint nicht:**
```bash
# Container-Logs prüfen
make logs
# Browser-Cache leeren oder anderen Browser versuchen
```

**Supabase-Verbindung schlägt fehl:**
- URL muss mit `https://` beginnen und auf `.supabase.co` enden
- Anon Key = `anon public` (nicht `service_role`!)

**Nach Neustart nicht erreichbar:**
```bash
docker ps -a   # läuft der Container?
docker compose up -d   # falls nicht
```

**Einstellungen zurücksetzen:**
```bash
rm -f data/config.json
make restart
# → Setup-Wizard erscheint erneut
```

**Image manuell bauen (statt GHCR):**
```bash
make build
make up
```
