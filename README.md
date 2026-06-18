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

Deployment uses **GitHub Pages** via `.github/workflows/deploy.yml`. Pushes to `main` build and publish the hub automatically.

### Finish setup (one-time)

1. Authenticate GitHub CLI: `gh auth login --hostname github.com --git-protocol https --web`
2. Run: `./scripts/setup-github.sh`

See [DEPLOY.md](./DEPLOY.md) for full instructions.

After setup, your live site will be:

`https://YOUR_GITHUB_USERNAME.github.io/short-term-rental-business/`

## Partner access

Share the live URL with your partner. Task progress is currently saved in each browser via `localStorage`. For shared sync across devices, add a backend (Supabase recommended) as a follow-up.
