# Project status

**Last updated:** 2026-06-29 (two-story classical library)
**Repository:** [Massaro-University-3D](https://github.com/Captain-Dirk-75/Massaro-University-3D)  
**Default branch:** `master`

## Current phase

Foundation complete through **Phase 5** (platform data layer). App runs fully offline in the browser with localStorage persistence.

## Completed features

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Walkable 3D quad, library, lighting, post-processing | Done |
| 2 | Avatar customize + save profile + persistence | Done |
| 3 | Commerce catalog, Sanctuary store, tier/item gating | Done |
| 4 | Sage Grove guide (offline, personalized) | Done |
| 5 | Data-driven campus + zone gates | Done |
| 5b | Platform layer (`src/platform/`) for future WordPress | Done |

## Recent changes

- 2026-06-29 — Fix library deck slab overlap on stairwell; window UV panorama + pixel-ratio RT pass
- 2026-06-29 — Library windows: per-wall panorama slices (visible + continuous outdoor view)
- 2026-06-29 — Library windows: shared cubemap (one outdoor view); stairwell cut-out fixes ceiling clip
- 2026-06-29 — Two-story classical library interior: 8.4m height, gallery upper floor, fixed windows + stairs
- 2026-06-29 — Library interior: visible exit doorway, live window views (outdoor RT), walkable second-floor mezzanine
- 2026-06-29 — Fix library approach: collision gap at portico, flipped exterior stairs, horizontal E-prompt distance
- 2026-06-29 — Walkable building interiors: data-driven scene swap, library furnished interior (E to enter/exit)
- 2026-06-29 — Added first-person collision against trees, buildings, rocks, kiosk, guide, and campus bounds
- 2026-06-29 — Fixed floating canopies (base alignment + trunk overlap); branch tip foliage clusters
- 2026-06-29 — Fixed black screen: sampleRange() typo crashed bootstrap; geometry merge compatibility
- 2026-06-29 — Tree variation pass: 5 archetypes (round/tall/wide/slender/mature), wider colour/branch/canopy ranges
- 2026-06-29 — ~50% detail pass: tree branches/leaves, brick walls, clouds, birds; fixed bare trunks (per-tree crown groups)
- 2026-06-29 — Fixed stationary air motes: world animations now run each frame; motes orbit gently
- 2026-06-29 — Fixed floating tree canopies (trunk base on ground, canopy meets trunk top)
- 2026-06-29 — Procedural campus visuals: instanced trees, extruded architecture, noise ground, rocks, tuned lighting/fog/bloom
- 2026-06-29 — Sanctuary memberships moved to top; tiers side-by-side with included items listed
- 2026-06-29 — Fixed C key opening customize while typing in Sage Grove chat
- 2026-06-29 — Fixed avatar colour swatches + added Save profile button
- 2026-06-29 — Platform data layer + WordPress-shaped contract
- 2026-06-29 — Connected repo to GitHub; added CI, AGENTS.md, PROJECT_STATUS.md

## Known issues

- None tracked — run `npm run build` to verify after changes.

## Next likely work (not started)

- Headless WordPress backend + `ACTIVE_ADAPTER = 'wordpress'`
- Real payment processor behind checkout seam
- Live AI for Sage Grove via backend proxy
- Replace placeholder geometry with art-directed assets

## Health check commands

```bash
npm install
npm run build    # must exit 0
npm run dev      # manual smoke test
```

## CI

GitHub Actions workflow `.github/workflows/ci.yml` runs `npm ci` + `npm run build` on push/PR to `master`.