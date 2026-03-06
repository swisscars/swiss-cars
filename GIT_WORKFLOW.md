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

## Salvarea modificărilor pe un branch nou (când nu vrei să pui direct pe dev)

Dacă ai lucrat pe `dev` și îți dai seama că vrei să pui munca pe o ramură separată pentru a o testa, a rezolva conflicte sau a face un PR (Pull Request):

```bash
# 1. Ascunde temporar modificările tale
git stash

# 2. Descarcă ultimele actualizări (dacă lucrezi în echipă sau ai modificat din altă parte)
git checkout dev
git pull origin dev

# 3. Creează un branch nou și mută-te pe el (ex: feature-nou)
git checkout -b feature-nou

# 4. Adu modificările tale înapoi pe noul branch
git stash pop

# ATENȚIE: Dacă ai conflicte la stash pop (ex: "Merge conflict in..."), 
# rezolvă-le în editor, apoi:
git add .
git commit --author="Numele Tau <email@tau.ro>" -m "feat: Descrierea modificărilor"

# 5. Trimite noul branch pe GitHub
git push -u origin feature-nou

# 6. Dacă vrei să combini noul branch direct în dev:
git checkout dev
git merge feature-nou
git push origin dev
```

## Remote

- **GitHub:** `https://github.com/adry999/swiss-cars`
- **Branch dev:** `dev` (lucru curent)
- **Branch producție:** `main` (Vercel)

## Important

- `.env.local` este exclus automat prin `.gitignore` — nu va fi niciodată commitat
- Rulează comenzile din directorul de root al git-ului (unde se află folderul `.git`).
