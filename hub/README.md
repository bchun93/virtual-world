# STR Business Hub

Project management hub for your short-term rental business. Tracks all 223 consolidated action items across 18 phases, with progress, notes, and partner assignments saved in the browser.

## Quick start

```bash
cd hub
npm install
npm run sync-data   # regenerate JSON from ../consolidated-action-items.csv
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Features

- **Dashboard** — overall progress, recommended next phase, phase overview cards
- **Phases** — browse and work through Phase 0–17 in order
- **All Tasks** — search, filter by status/phase/assignee, update details
- **Task detail panel** — status, assignee (Partner A / B / Both), notes
- **Local persistence** — progress saved to `localStorage` in your browser

## Data

Action items live in `../consolidated-action-items.csv`. After editing the CSV, run:

```bash
npm run sync-data
```

## Build for production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.

## Notes for two partners

Progress is currently stored per browser. For shared sync across partners, the next step would be adding a backend (Supabase, Firebase, or a simple API) — say the word if you want that next.
