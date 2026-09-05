# TheroIncrementalTD

A mathematical tower-defense game with incremental progression, Greek-letter
towers, and a falling-powder side activity.

[Play TheroIncrementalTD](https://sethrimer3.github.io/TheroIncrementalTD/)

## Development

Run `npm ci`, then `npm run dev` for the browser development server.
Run `npm run desktop` to build and open the Electron version.
See [ELECTRON.md](ELECTRON.md) for desktop launchers and troubleshooting.

## Validation and deployment

- `npm test` checks startup files and recursive imports.
- `npm run build` compiles TypeScript, validates the migration roadmap, and builds `dist/`.
- `npm run lint` checks source code with ESLint.

GitHub Pages deploys `dist/` through `.github/workflows/deploy-pages.yml` on
pushes to `main`. The repository's Pages source must be **GitHub Actions**.

Existing browser-storage keys are retained for save and preference compatibility.
