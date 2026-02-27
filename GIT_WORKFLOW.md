# Git Workflow — SwissCars

## Setup

Repository-ul git este inițializat în directorul **părinte**:
```
SwissCars/          ← git root (aici rulezi toate comenzile git)
└── swiss-next/     ← codul proiectului
```

## Branches

| Branch | Scop |
|--------|------|
| `dev`  | Dezvoltare zilnică — aici lucrezi |
| `main` | Producție — Vercel deployează din main |

> Pe Vercel: **Settings → Git → Production Branch → main**

## Workflow zilnic (pe dev)

```bash
# 1. Mergi în directorul cu git
cd "/Users/ady/Documents/1 Websites/SwissCars"

# 2. Asigură-te că ești pe dev
git checkout dev

# 3. Vezi ce fișiere s-au modificat
git status

# 4. Adaugă toate modificările din proiect
git add swiss-next/

# Sau adaugă un fișier specific
git add swiss-next/components/home/Hero.tsx

# 5. Fă commit
git commit -m "Descriere scurtă a modificării"

# 6. Trimite pe GitHub
git push origin dev
```

## Deploy în producție (dev → main)

```bash
cd "/Users/ady/Documents/1 Websites/SwissCars"

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
git checkout -- swiss-next/cale/catre/fisier.tsx

# Scoate un fișier din staging (după git add, înainte de commit)
git reset swiss-next/cale/catre/fisier.tsx
```

## Remote

- **GitHub:** https://github.com/adry999/swiss-cars
- **Branch dev:** `dev` (lucru curent)
- **Branch producție:** `main` (Vercel)

## Important

- `.env.local` este exclus automat prin `.gitignore` — nu va fi niciodată commitat
- Rulează întotdeauna comenzile git din `SwissCars/`, nu din `swiss-next/`
