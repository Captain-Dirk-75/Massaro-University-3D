# AI agent guide — Massaro University 3D

Instructions for any AI agent (Cursor, Grok, Copilot, etc.) working in this repository.

## Before you start

1. Read [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current phase, completed work, and known issues.
2. Run `npm run build` after substantive changes — build must pass.
3. Do **not** add API keys, backend calls, or external 3D assets unless explicitly requested.

## Architecture rules

- **Data:** all reads/writes go through `src/platform/index.js` — never import `src/content/*` or `src/state/persistence.js` outside the local adapter.
- **Payments:** simulated only via `src/commerce/checkout.js` → `platform.recordPurchase` / `recordSubscription`.
- **Live AI:** only `src/guide/getGuideReply.js` — stub offline today; API key lives on a **backend**, never in this repo.
- **WordPress later:** change `ACTIVE_ADAPTER` in `src/platform/config.js` and implement `src/platform/adapters/wordpress.js`.

## Edit these files for content (not logic)

| What | File |
|------|------|
| Courses, tiers, prices | `src/content/catalog.js` |
| Campus areas & gates | `src/content/campus.js` |
| Platform API contract | `src/platform/CONTRACT.md` |

## After every task — required sync

When you finish a task, **always**:

1. **Update** [PROJECT_STATUS.md](./PROJECT_STATUS.md):
   - Set **Last updated** date
   - Add a line under **Recent changes** describing what you did
   - Fix **Known issues** if you resolved any
2. **Commit** with a clear message, e.g. `Add patron garden gate` or `Fix Sage Grove C key conflict`
3. **Push** to `origin master` (or `main`):

   ```bash
   git add -A
   git commit -m "Your message"
   git push origin master
   ```

4. Confirm **GitHub Actions** CI is green on the latest commit (check Actions tab or `gh run list`).

## Checking progress & errors

| Check | How |
|-------|-----|
| Build errors | `npm run build` locally, or GitHub Actions workflow **CI** |
| Git history | `git log --oneline -15` |
| Current feature state | [PROJECT_STATUS.md](./PROJECT_STATUS.md) |
| Open CI failures | `gh run list --limit 5` or repo → Actions |

## Do not commit

- `node_modules/`, `dist/`, `mcps/`, `terminals/` (already in `.gitignore`)
- Secrets, `.env` files with keys

## Default branch

`master` — push here unless the user specifies otherwise.