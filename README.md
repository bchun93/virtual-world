# Short-Term Rental Business

Planning workspace and project management hub for building a short-term rental business with a partner.

## Contents

- `consolidated-action-items.md` — full phased checklist with comparison notes
- `consolidated-action-items.csv` — spreadsheet-friendly export
- `hub/` — React project management web app (223 action items across 18 phases)

## Web app

```bash
cd hub
npm install
npm run dev
```

After editing the CSV:

```bash
cd hub
npm run sync-data
```

## Deployment

The app deploys automatically to GitHub Pages when changes are pushed to `main`.

Live site: https://brianchun.github.io/short-term-rental-business/

## Partner access

Share the live URL with your partner. Task progress is currently saved in each browser via `localStorage`. For shared sync across devices, add a backend (Supabase recommended) as a follow-up.
