# Virtual World

**Aether** — an explorable virtual world built as a React web experience.

Wander six connected districts: Tidecove, Ember Grove, Glass Spire, Mirror Archive, Skyward Reach, and Quiet Hollow.

## App

```bash
cd world
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).

## Deployment

Intended live URL after renaming the GitHub repository:

**https://bchun93.github.io/virtual-world/**

Pushes to `main` rebuild and deploy via `.github/workflows/deploy.yml` (GitHub Pages).

### Rename this repository

This project previously lived at `short-term-rental-business`. Rename it on GitHub:

```bash
gh repo rename virtual-world --repo bchun93/short-term-rental-business
```

Or in GitHub: **Settings → General → Repository name → `virtual-world`**.

After renaming, update your local remote if needed:

```bash
git remote set-url origin https://github.com/bchun93/virtual-world.git
```

See [DEPLOY.md](./DEPLOY.md) for Pages setup details.
