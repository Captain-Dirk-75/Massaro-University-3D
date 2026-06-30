# Project status

**Last updated:** 2026-06-30 (library: +20% service desk, moved 4m toward pond)
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

- 2026-06-30 — Library moved 4 m south (z:-44, toward pond) so north interior stays inside world bounds; service desk +20% (`LIBRARY_SERVICE_DESK_SIZE`); stone approach/plaza paths + bird perches updated
- 2026-06-30 — Library reachability + desk: pass `currentY` into `getFloorY` (fixes upper floor / stair landing snap); half-round light-brown service desk between stairs; removed old reception + rear hall bookshelves blocking north path; extended floor-1 gallery pads + railing gaps
- 2026-06-30 — Library playtest fixes: removed portico deck/steps/door arch blocking entrance; reception moved to rear hall; side-room doorways moved to z=-7 (rear, clear of stairs); removed hall tables at stair feet; fixed upper-floor snap on stair tops (hall void only falls through); partition colliders `all`; upper landing floor pads
- 2026-06-30 — Library staircase replaced + entrance cleared: removed the central split-and-return stair; added TWO symmetric straight side staircases (foyer-style) hugging the west/east hall walls, each a single straight flight from the front floor 0 up to the rear gallery walkway, with sloped banisters and straight-run floor handling (new `buildStraightStair` + `straightStairs` option, not the split handler); reception desk moved front-right, fully clear of the door and walk-in path; hall void opened to the south for a taller foyer; chandeliers kept over the void only (never over the walkable gallery)
- 2026-06-30 — Library interior rebuilt to a clean spec on the proven createCompoundBuilding system: entrance fully clear (stair foot moved 4.5 m back off the door centreline); deepened to 20 m for a grand double-height hall; free-standing split staircase rises centrally and splits to a gallery ring with railings; tall chandeliers (~4.6 m clearance) + 3 m wall sconces so the player never meets a lamp; logical bays (hall + 2 ground reading rooms + gallery + upper reading room + gated upper archive) via real per-floor doorways; fixed collider-level classification so ground-floor interior walls/furniture actually collide; gated archive kept data-driven & live
- 2026-06-29 — Library interior redesign: double-height hall, grand split staircase, gallery railings, chandelier/sconce lighting, logical room layout; ground masked inside footprints; facade deck pulled clear of doorway
- 2026-06-29 — Library interior walkability: reception desk moved off entry path; stairs repositioned clear of east wall; partition colliders use Pavilion-style `all` level
- 2026-06-29 — Fix library structural regression: facade is decoration-only layer; walls/windows/door/colliders restored; 4 columns frame doorway
- 2026-06-29 — Library moved north (z:-48) clear of pond; classical portico facade (columns, pediment, steps) via reusable classicalFacade.js
- 2026-06-29 — Stage 2a: unified-world Gothic library via createCompoundBuilding (multi-room, 2 floors, stairs, member-gated archive); library unhooked from scene-swap
- 2026-06-29 — createBuilding interior ceiling + library-style hanging lights; roof stays visible (no hide-on-enter)
- 2026-06-29 — Fix createBuilding doorway colliders (floor-touching segments only); exclude building footprints from tree/rock/bush scatter
- 2026-06-29 — Stage 1 unified-world Glass Pavilion: createBuilding() with real holes, alpha glass, walk-in
- 2026-06-29 — Replace cubemap windows with reusable stylized glass (src/world/materials/glass.js)
- 2026-06-29 — Shared cubemap windows with world-space parallax; glass entrance inside and out
- 2026-06-29 — Flip library window UV slices so left/right panes align with panorama
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