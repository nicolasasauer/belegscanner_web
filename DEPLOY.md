# Deployment auf Raspberry Pi

## Voraussetzungen

- Raspberry Pi 4 oder 5 (4GB RAM empfohlen)
- Raspberry Pi OS **64-bit** (Bookworm)
- Supabase-Projekt (kostenlos unter [supabase.com](https://supabase.com))

---

## Schnellstart — 3 Befehle

```bash
# 1. Repository klonen
git clone https://github.com/DEIN-USER/belegscanner-web.git
cd belegscanner-web

# 2. Setup-Script ausführen (Docker + Tailscale)
chmod +x scripts/setup-pi.sh && ./scripts/setup-pi.sh

# 3. Starten
make up
```

Fertig. App läuft auf `http://RASPBERRY-PI-IP:3000`.

---

## Schritt für Schritt

### 1. Supabase-Werte holen

1. Öffne [supabase.com/dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt → **Project Settings** → **API**
3. Kopiere:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. .env.docker befüllen

```bash
cp .env.docker.example .env.docker
nano .env.docker
```

Mindestens diese zwei Zeilen ausfüllen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

### 3. App starten

```bash
make up        # Nur die Web-App
make up-ai     # Web-App + Ollama (lokale KI)
```

---

## Mit Ollama (lokale KI, keine Cloud nötig)

Ollama läuft als eigener Container. Die Modelle werden einmalig geladen (~4 GB).

```bash
# 1. Mit Ollama-Profil starten
make up-ai

# 2. Modell laden (einmalig, läuft im Hintergrund)
make pull-llava

# 3. In .env.docker einstellen
AI_PROVIDER=ollama
AI_MODEL=llava
AI_BASE_URL=http://ollama:11434
```

**Empfohlene Modelle für den Raspberry Pi:**

| Modell | Größe | Geschwindigkeit | Qualität |
|--------|-------|-----------------|---------|
| `llava:7b` | 4 GB | schnell | gut |
| `llava:13b` | 8 GB | langsam | besser |
| `moondream` | 1.7 GB | sehr schnell | ausreichend |

```bash
# Modell wechseln
make pull-model MODEL=moondream
```

---

## Mit Tailscale (sicherer Fernzugriff)

Tailscale gibt dem Pi eine feste IP-Adresse, die du von überall erreichst.

```bash
# Installation (wird auch vom setup-pi.sh angeboten)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Deine Tailscale-IP herausfinden
tailscale ip -4
```

Dann ist die App erreichbar unter `http://100.x.x.x:3000` — von überall auf der Welt, solange Tailscale läuft.

---

## Häufige Befehle

```bash
make up           # Starten (ohne Ollama)
make up-ai        # Starten (mit Ollama)
make down         # Stoppen
make restart      # Nur Web-App neu starten
make logs         # Live-Logs der App
make logs-all     # Logs aller Services
make status       # Was läuft gerade?
make rebuild      # Image neu bauen
make clean        # Aufräumen
make help         # Alle Befehle anzeigen
```

---

## Automatisch starten nach Pi-Neustart

Docker Compose startet automatisch neu dank `restart: unless-stopped` in der `docker-compose.yml`. Kein systemd-Service nötig.

```bash
# Test: Pi neu starten und prüfen ob App läuft
sudo reboot
# nach ~60s:
curl http://localhost:3000
```

---

## Troubleshooting

**App startet nicht:**
```bash
make logs          # Fehlermeldungen anzeigen
docker ps -a       # Container-Status prüfen
```

**Supabase-Fehler:**
```bash
# .env.docker prüfen
cat .env.docker | grep SUPABASE
```

**Ollama-Modell fehlt:**
```bash
make pull-llava    # Modell neu laden
docker exec belegscanner-ollama ollama list   # Geladene Modelle
```

**Port 3000 belegt:**
```bash
# In .env.docker: PORT=3001 setzen
make down && make up
```

**Image neu bauen nach Code-Änderungen:**
```bash
git pull
make rebuild
make up
```
