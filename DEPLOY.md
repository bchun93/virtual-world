# Deploy Virtual World

## One-time GitHub login

```bash
export PATH="$HOME/.local/bin:$PATH"
gh auth login --hostname github.com --git-protocol https --web
```

## Push and enable Pages

From the project root:

```bash
./scripts/setup-github.sh
```

Or manually:

```bash
git push -u origin main
gh api --method POST /repos/bchun93/virtual-world/pages -f build_type=workflow
```

## Watch the first deployment

```bash
gh run watch --repo bchun93/virtual-world
```

Live site:

`https://bchun93.github.io/virtual-world/`

**GitHub Pages on the free plan requires a public repository.** If Pages deploy fails on a private repo:

```bash
gh repo edit bchun93/virtual-world --visibility public --accept-visibility-change-consequences
gh api --method POST /repos/bchun93/virtual-world/pages -f build_type=workflow
gh workflow run "Deploy to GitHub Pages" --repo bchun93/virtual-world
```
