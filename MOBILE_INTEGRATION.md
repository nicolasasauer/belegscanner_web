# Mobile Integration — Setup-Anleitung

Verbindet die **belegscanner_mobile** Android-App mit dem Web-Backend (Docker auf Raspberry Pi / Tailscale).

## Voraussetzungen

- Web-App läuft auf Docker (`docker-compose up -d`)  
- Tailscale auf dem Pi installiert und authentifiziert  
- Mobile-App auf Android-Gerät installiert (APK aus GitHub Releases)

---

## 1. Server-Konfiguration (Pi)

### Umgebungsvariablen setzen

In deiner `docker-compose.yml` oder `.env`:

```env
# Pflicht: Gemeinsamer Token zwischen Mobile-App und Server
MOBILE_API_TOKEN=dein-geheimes-token-min-32-zeichen

# Optional: User-ID für Mobile-Daten (sonst erster User in DB)
# MOBILE_USER_ID=<uuid-aus-der-datenbank>
```

Sicheres Token generieren (macOS/Linux):
```bash
openssl rand -hex 32
```

Nach Änderung Container neu starten:
```bash
docker compose restart app
```

### Health-Check verifizieren

```bash
curl https://<dein-tailscale-hostname>/api/health
# Erwartet: {"status":"ok","version":"1.0.0"}
```

---

## 2. Mobile-App konfigurieren

1. App öffnen → **Einstellungen**-Tab
2. Modus auf **Remote** umschalten
3. **Tailscale Hostname** eingeben: `<machine-name>.<tailnet>.ts.net`  
   _(ohne https:// — wird automatisch ergänzt)_
4. **Port**: Standard `443` (HTTPS via Tailscale MagicDNS)
5. **API Token**: Das Token aus `MOBILE_API_TOKEN`
6. **Speichern** tippen
7. Status-Chip sollte auf **Verbunden** wechseln

---

## 3. API-Endpunkte (Übersicht)

| Methode | Pfad                     | Beschreibung                        |
|---------|--------------------------|-------------------------------------|
| GET     | `/api/health`            | Health-Check (kein Auth)            |
| GET     | `/api/receipts`          | Alle Belege abrufen (paginiert)     |
| POST    | `/api/receipts`          | Neuen Beleg erstellen               |
| DELETE  | `/api/receipts/:id`      | Beleg löschen                       |
| POST    | `/api/receipts/sync`     | Batch-Sync vom Mobile               |
| POST    | `/api/receipts/upload`   | Bild hochladen + OCR                |

Alle Endpunkte (außer `/api/health`) erwarten:
```
Authorization: Bearer <MOBILE_API_TOKEN>
```

---

## 4. Sync-Mechanismus

Die Mobile-App synchronisiert **unsynced** Belege automatisch alle 5 Minuten (wenn Auto-Sync aktiv) oder manuell über den ⟳-Button in der Beleg-Liste.

**Sync-Flow:**
1. Mobile liest alle lokalen Belege mit `is_synced = 0`
2. POST `/api/receipts/sync` mit Batch
3. Server fügt neue Belege ein / aktualisiert ältere
4. Mobile markiert die Belege als synced

---

## 5. Fehlerbehebung

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Status "Fehler" in App | Server nicht erreichbar | Tailscale VPN aktiv? Pi online? Port korrekt? |
| 401 Unauthorized | Falsches Token | Token in App und Server-Env prüfen |
| 400 Bad Request bei Sync | Ungültiges Datum-Format | App-Update einspielen |
| Belege erscheinen nicht im Web | Auto-Sync deaktiviert | Manuell ⟳ tippen oder Auto-Sync einschalten |
