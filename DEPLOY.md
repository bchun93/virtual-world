# Deploy STR Business Hub

## One-time GitHub login

```bash
export PATH="$HOME/.local/bin:$PATH"
gh auth login --hostname github.com --git-protocol https --web
```

Follow the browser/device prompt to authorize GitHub CLI.

## Create repo, push, and deploy

From the project root:

```bash
./scripts/setup-github.sh
```

This script will:

1. Create a **private** repo named `short-term-rental-business`
2. Push `main`
3. Enable GitHub Pages (GitHub Actions source)
4. Print your repo URL and live site URL

## Watch the first deployment

```bash
export PATH="$HOME/.local/bin:$PATH"
gh run watch --repo YOUR_GITHUB_USERNAME/short-term-rental-business
```

The live site will be:

`https://YOUR_GITHUB_USERNAME.github.io/short-term-rental-business/`

## After deployment

Share that URL with your partner. The app loads in any browser.

**Note:** Task progress is saved per browser via `localStorage`. You and your partner will not see each other's checkboxes until a shared backend (e.g. Supabase) is added.

## Manual fallback

If the script fails, run these steps:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd /Users/brianchun/Projects/short-term-rental-business

gh repo create short-term-rental-business --private --source=. --remote=origin \
  --description "Short-term rental business project management hub"

git push -u origin main

gh api -X PUT "/repos/$(gh api user -q .login)/short-term-rental-business/pages" \
  -f build_type=workflow
```
