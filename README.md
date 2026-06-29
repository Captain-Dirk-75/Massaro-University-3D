# Massaro University 3D

Web-native 3D learning campus for [massaro.university](https://massaro.university) — built with **Vite**, **Three.js**, and plain JavaScript ES modules.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`). Click to enter, **WASD** to walk, mouse to look.

## Stack

- Vite (build + dev server)
- Three.js (npm)
- Vanilla JS — no TypeScript, no game engine

## Project structure

```
src/
  core/        Scene, renderer, camera, render loop
  controls/    First-person movement, world interaction
  world/       Ground, lighting, campus builders, gates
  ui/          HUD, customize panel, store, guide chat
  state/       Runtime app state + defaults
  avatar/      Placeholder avatar + preview
  commerce/    Access checks, checkout seam
  content/     Seed catalog + campus data (local adapter only)
  guide/       Sage Grove offline guide + AI seam
  platform/    Data-access boundary (local / WordPress stub)
  post/        Bloom + warm colour grading
  main.js      Entry point
```

## Key docs for AI agents

| File | Purpose |
|------|---------|
| [AGENTS.md](./AGENTS.md) | How agents should work in this repo |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Current features, phases, last task |
| [src/platform/CONTRACT.md](./src/platform/CONTRACT.md) | WordPress-shaped data API contract |

## Verify the build

```bash
npm run build
```

CI runs the same check on every push to `master` / `main`.

## Data & persistence

- **Local mode (active):** `src/platform/adapters/local.js` reads `src/content/*` + `localStorage`
- **WordPress (future):** swap `ACTIVE_ADAPTER` in `src/platform/config.js`
- **No API keys** in this browser codebase

## License

Private project — all rights reserved unless otherwise specified by the owner.