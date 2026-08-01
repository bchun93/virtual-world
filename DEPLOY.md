# Deploy Virtual World

## One-time GitHub login

```bash
export PATH="$HOME/.local/bin:$PATH"
gh auth login --hostname github.com --git-protocol https --web
```

## Rename the repository (if still named short-term-rental-business)

```bash
gh repo rename virtual-world --repo bchun93/short-term-rental-business
git remote set-url origin https://github.com/bchun93/virtual-world.git
```

## Create repo, push, and deploy

From the project root:

```bash
./scripts/setup-github.sh
```

This script will:

1. Create a **public** repo named `virtual-world` (if needed)
2. Push `main`
3. Enable GitHub Pages (GitHub Actions source)
4. Print your repo URL and live site URL

## Watch the first deployment

```bash
export PATH="$HOME/.local/bin:$PATH"
gh run watch --repo bchun93/virtual-world
```

The live site will be:

`https://bchun93.github.io/virtual-world/`

**GitHub Pages on the free plan requires a public repository.** If Pages deploy fails on a private repo:

```bash
gh repo edit bchun93/virtual-world --visibility public --accept-visibility-change-consequences
gh api --method POST /repos/bchun93/virtual-world/pages -f build_type=workflow
gh workflow run "Deploy to GitHub Pages" --repo bchun93/virtual-world
```
