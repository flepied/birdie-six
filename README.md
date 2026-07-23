# Birdie Six

Birdie Six is a mobile-first Progressive Web App for playing a golf Chouette with three or four players.

The application supports:

- six points per hole;
- the standard `4–2–0` scoring for three players;
- the `3–2–1–0` scoring variant for four players;
- net scores calculated from player handicaps;
- relative hole scores calculated by subtracting the lowest net score;
- relative final totals calculated by subtracting the lowest cumulative total;
- the official L’Aigle course card from Le Golf National;
- manual local saves and JSON import/export;
- offline use after installation as a PWA;
- GitHub Pages deployment through GitHub Actions.

## Development

Requirements: Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Run the test suite and production build with:

```bash
npm test
npm run build
```

## GitHub Pages

The deployment workflow is located at `.github/workflows/deploy.yml`. Every push to `main` builds and deploys the application to:

```text
https://flepied.github.io/birdie-six/
```

The Vite base path and PWA assets are configured for the repository path `/birdie-six/`.

## Dependency updates

Dependabot is configured in `.github/dependabot.yml` to check npm dependencies and GitHub Actions weekly. Actions in the deployment workflow are pinned to immutable commit SHAs; Dependabot can propose updated SHA pins while preserving that security policy.

## Project conventions

See `AGENTS.md`. Source code and technical identifiers are written in English, while user-facing strings are written in French.
