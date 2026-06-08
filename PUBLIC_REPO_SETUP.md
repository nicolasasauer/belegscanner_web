# Repo öffentlich machen — Checkliste

Damit das GitHub Actions Workflow automatisch Docker Images baut und zu GHCR pusht, braucht das Repository folgende Einstellungen.

---

## Schritt 1 — Repository public schalten

1. GitHub → Dein Repo → **Settings** → **General**
2. Ganz unten: **Danger Zone** → **Change repository visibility**
3. **Make public** wählen und bestätigen

> **Warum:** GHCR (GitHub Container Registry) erlaubt bei Public Repos das Pullen ohne Login. Bei privaten Repos müsste jeder Nutzer sich erst per `docker login ghcr.io` authentifizieren.

---

## Schritt 2 — GHCR Permissions prüfen

Der Workflow nutzt den automatischen `GITHUB_TOKEN` — kein manueller PAT nötig. Trotzdem einmalig prüfen:

1. GitHub → Repo → **Settings** → **Actions** → **General**
2. Unter **Workflow permissions**: `Read and write permissions` aktivieren
3. **Save**

Das erlaubt dem Workflow, Images zu GHCR zu pushen.

---

## Schritt 3 — Ersten Build triggern

```bash
# Entweder pushen:
git push origin main

# Oder manuell via GitHub UI:
# Actions → "Build & Push Docker Image" → "Run workflow"
```

Der erste Build dauert **5–10 Minuten** (Multi-Arch, kein Cache). Folgebuilds sind dank Layer-Cache deutlich schneller (~2–3 min).

---

## Schritt 4 — Image Package sichtbar schalten (optional)

Nach dem ersten Build erscheint das Package unter `github.com/nicolasasauer?tab=packages`.

Falls es nicht öffentlich sichtbar ist:

1. GitHub → Dein Profil → **Packages** → `belegscanner-web`
2. **Package settings** → **Change visibility** → **Public**

---

## Danach: Vollautomatisch

Ab jetzt passiert alles automatisch:

| Aktion | Ergebnis |
|--------|---------|
| `git push origin main` | Baut neues `latest` + `main` Image |
| `git push origin develop` | Baut `develop` Image |
| `git tag v1.2.0 && git push --tags` | Baut `v1.2.0` + `1.2` + `latest` Image |
| Pull Request öffnen | Baut Image zum Testen (kein Push) |

---

## Image auf dem Raspberry Pi aktualisieren

```bash
# Neuestes Image holen und starten
docker compose pull && docker compose up -d

# Oder mit make:
make update
```

---

## Troubleshooting

**Workflow schlägt fehl mit "permission denied":**
→ Schritt 2 (Workflow permissions) wiederholen

**Image ist `private` obwohl Repo `public`:**
→ Schritt 4 ausführen — Package-Sichtbarkeit ist unabhängig von Repo-Sichtbarkeit

**`docker pull` fragt nach Passwort:**
→ Image ist noch privat, oder Repo ist privat. Erst public schalten (Schritt 1).

**Erster Build schlägt fehl auf arm64:**
→ QEMU-Emulation ist manchmal langsam und timeouted. Workflow einfach nochmal triggern.
