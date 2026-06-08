#!/bin/bash
# ══════════════════════════════════════════════════════════════════
#  Belegscanner Web — Raspberry Pi Setup Script
#  Läuft auf: Raspberry Pi 4/5 mit Raspberry Pi OS (64-bit)
#  Aufruf: curl -fsSL https://raw.githubusercontent.com/DEIN-REPO/main/scripts/setup-pi.sh | bash
#  Oder lokal: chmod +x scripts/setup-pi.sh && ./scripts/setup-pi.sh
# ══════════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Belegscanner Web — Pi Setup            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. System-Update ───────────────────────────────────────────────
info "System wird aktualisiert..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
success "System aktuell"

# ── 2. Docker installieren ─────────────────────────────────────────
if command -v docker &> /dev/null; then
  success "Docker bereits installiert ($(docker --version))"
else
  info "Docker wird installiert..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  success "Docker installiert — bitte abmelden & neu anmelden für Gruppe"
fi

# ── 3. make installieren ───────────────────────────────────────────
if command -v make &> /dev/null; then
  success "make bereits installiert"
else
  info "make wird installiert..."
  sudo apt-get install -y -qq make
  success "make installiert"
fi

# ── 4. Tailscale (optional) ────────────────────────────────────────
echo ""
read -p "Tailscale installieren für sicheren Remote-Zugriff? (j/n): " INSTALL_TAILSCALE
if [[ "$INSTALL_TAILSCALE" =~ ^[Jj]$ ]]; then
  if command -v tailscale &> /dev/null; then
    success "Tailscale bereits installiert"
  else
    info "Tailscale wird installiert..."
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up
    success "Tailscale installiert & gestartet"
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "unbekannt")
    info "Tailscale IP: $TAILSCALE_IP"
  fi
fi

# ── 5. .env.docker einrichten ──────────────────────────────────────
echo ""
if [ ! -f .env.docker ]; then
  if [ -f .env.docker.example ]; then
    cp .env.docker.example .env.docker
    warn "WICHTIG: .env.docker wurde erstellt — bitte Supabase-Werte eintragen!"
    warn "  Öffne: nano .env.docker"
    warn "  Trage NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY ein"
  else
    error ".env.docker.example nicht gefunden — bist du im richtigen Ordner?"
  fi
else
  success ".env.docker existiert bereits"
fi

# ── 6. Zusammenfassung ─────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo " Setup fertig! Nächste Schritte:"
echo "══════════════════════════════════════════════"
echo ""
echo " 1. .env.docker bearbeiten:"
echo "    nano .env.docker"
echo ""
echo " 2. App starten (ohne KI):"
echo "    make up"
echo ""
echo " 2. App + Ollama starten (mit lokaler KI):"
echo "    make up-ai"
echo "    make pull-llava    # einmalig, ~4GB"
echo ""
echo " 3. Im Browser öffnen:"
PI_IP=$(hostname -I | awk '{print $1}')
echo "    http://$PI_IP:3000"
echo ""
if command -v tailscale &> /dev/null; then
  TS_IP=$(tailscale ip -4 2>/dev/null || echo "")
  if [ -n "$TS_IP" ]; then
    echo "    http://$TS_IP:3000  (via Tailscale, überall erreichbar)"
  fi
fi
echo ""
echo " Hilfe:"
echo "    make help"
echo ""
