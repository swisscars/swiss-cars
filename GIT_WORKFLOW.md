# Git Workflow — SwissCars

## Setup

Repository-ul git este inițializat în directorul **curent** (sau părinte, în funcție de mapare):
```
swisscars md/          ← folderul părinte
└── swisscars-app/     ← codul proiectului (aici de obicei rulezi toate comenzile git dacă folderul e git root)
```

## Branches

| Branch | Scop |
|--------|------|
| `dev`  | Dezvoltare zilnică — aici lucrezi |
| `main` | Producție — Vercel deployează din main |

> Pe Vercel: **Settings → Git → Production Branch → main**

## Workflow zilnic (pe dev)

```bash
# 1. Asigură-te că ești pe dev
git checkout dev

# 2. Vezi ce fișiere s-au modificat
git status

# 3. Adaugă toate modificările din proiect
git add .

# Sau adaugă un fișier specific
git add components/home/Hero.tsx

# 4. Fă commit
git commit -m "Descriere scurtă a modificării"

# 5. Trimite pe GitHub
git push origin dev
```

## Deploy în producție (dev → main)

```bash
git checkout main
git merge dev
git push origin main

# Înapoi pe dev
git checkout dev
```

## Comenzi utile

```bash
# Vezi diferențele față de ultimul commit
git diff

# Istoricul commiturilor
git log --oneline

# Anulează modificările dintr-un fișier (înainte de git add)
git checkout -- cale/catre/fisier.tsx

# Scoate un fișier din staging (după git add, înainte de commit)
git reset cale/catre/fisier.tsx
```

## Remote

- **GitHub:** `https://github.com/adry999/swiss-cars`
- **Branch dev:** `dev` (lucru curent)
- **Branch producție:** `main` (Vercel)

## Important

- `.env.local` este exclus automat prin `.gitignore` — nu va fi niciodată commitat
- Rulează comenzile din directorul de root al git-ului (unde se află folderul `.git`).
