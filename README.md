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

The app is live at **https://bchun93.github.io/short-term-rental-business/**

Repository: **https://github.com/bchun93/short-term-rental-business**

Pushes to `main` automatically rebuild and deploy via `.github/workflows/deploy.yml` (GitHub Pages).

The repo is **public** (required for GitHub Pages on the free plan). See [DEPLOY.md](./DEPLOY.md) for setup details.

## Partner access

Share the live URL with your partner. Task progress is currently saved in each browser via `localStorage`. For shared sync across devices, add a backend (Supabase recommended) as a follow-up.
