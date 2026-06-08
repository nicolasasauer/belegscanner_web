.PHONY: up up-ai down restart logs build rebuild update pull-model clean help

# ── Starten ────────────────────────────────────────────────────────
up:          ## App starten (ohne Ollama)
	docker compose up -d
	@echo "✓ App läuft auf http://localhost:3000"

up-ai:       ## App + Ollama starten
	docker compose --profile ai up -d
	@echo "✓ App: http://localhost:3000  |  Ollama: http://localhost:11434"

# ── Stoppen ────────────────────────────────────────────────────────
down:        ## Alles stoppen
	docker compose --profile ai down

restart:     ## App neu starten
	docker compose restart web

# ── Logs ───────────────────────────────────────────────────────────
logs:        ## Live-Logs der App
	docker compose logs -f web

logs-all:    ## Live-Logs aller Services
	docker compose --profile ai logs -f

# ── Update ─────────────────────────────────────────────────────────
update:      ## Neuestes GHCR-Image holen und neu starten
	docker compose pull web
	docker compose up -d web
	@echo "✓ App auf neuestem Stand"

# ── Build ──────────────────────────────────────────────────────────
build:       ## Docker-Image lokal bauen
	docker compose build web

rebuild:     ## Image neu bauen (ohne Cache)
	docker compose build --no-cache web

# ── Ollama ─────────────────────────────────────────────────────────
pull-model:  ## Ollama-Modell herunterladen (Standard: llava)
	docker exec belegscanner-ollama ollama pull $(MODEL)
	@echo "✓ Modell '$(MODEL)' geladen"

pull-llava:  ## LLaVA Modell laden (gut für Belege, ~4GB)
	docker exec belegscanner-ollama ollama pull llava
	@echo "✓ llava geladen"

pull-llava-small: ## LLaVA 7B (kleiner, schneller, ~4GB)
	docker exec belegscanner-ollama ollama pull llava:7b

# ── Wartung ────────────────────────────────────────────────────────
clean:       ## Container + Images entfernen (Daten bleiben erhalten)
	docker compose --profile ai down --rmi local

clean-all:   ## ALLES entfernen inkl. Ollama-Modelle (Achtung: Modelle müssen neu geladen werden)
	docker compose --profile ai down -v --rmi local

status:      ## Status aller Container anzeigen
	docker compose --profile ai ps

# ── Setup ──────────────────────────────────────────────────────────
setup:       ## Erste Einrichtung (kopiert .env.docker.example)
	@if [ ! -f .env.docker ]; then \
		cp .env.docker.example .env.docker; \
		echo "✓ .env.docker erstellt — bitte Werte eintragen!"; \
	else \
		echo "✓ .env.docker existiert bereits"; \
	fi

help:        ## Diese Hilfe anzeigen
	@echo ""
	@echo "  Belegscanner Web — Docker Befehle"
	@echo "  ─────────────────────────────────"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-15s %s\n", $$1, $$2}'
	@echo ""

.DEFAULT_GOAL := help
