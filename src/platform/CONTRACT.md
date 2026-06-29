# Platform Data Contract

This document describes the async methods exposed by `src/platform/index.js` and the WordPress-shaped objects they return. The **local adapter** implements this contract today using `src/content/*.js` seed files and `localStorage`. The **WordPress adapter** (stub) will satisfy the same contract via REST API calls through a server-side proxy.

**Swap point:** change `ACTIVE_ADAPTER` in `src/platform/config.js` from `'local'` to `'wordpress'`.

---

## Methods

### `bootstrapPlatform()`

Loads catalog, tiers, campus areas, and content-type labels into the in-memory runtime cache. Call once at startup before building the world.

**Future WordPress:** parallel fetches to multiple REST endpoints.

---

### `getCurrentUser()` → `User`

Returns the signed-in player's profile, session stats, and commerce fields.

**Future WordPress:** `GET /wp-json/massaro/v1/me` — maps to WP User + user meta.

```js
{
  id: 'current',           // WP: user.id (number)
  slug: 'current',         // WP: user.slug
  profile: {
    display_name: string,  // WP: user.name or meta.display_name
    body_preset: string,   // WP: user meta mu_body_preset
    color_id: string,      // WP: user meta mu_color_id
  },
  meta: {
    total_time_on_campus: number,      // WP: user meta mu_campus_time
    owned_item_slugs: string[],        // WP: user meta mu_owned_items (JSON)
    active_tier_slug: string,          // WP: membership plugin tier slug
    subscription_period: 'monthly' | 'yearly' | null,
  },
}
```

---

### `saveCurrentUser(state)` → `User`

Persists the full player state object (internal app shape). Returns the saved user contract.

**Future WordPress:** `POST /wp-json/massaro/v1/me` — updates user meta fields.

---

### `clearCurrentUser()`

Removes all stored player data (reset profile).

**Future WordPress:** proxy endpoint to clear user meta / entitlements.

---

### `getMembershipTiers()` → `MembershipTier[]`

**Future WordPress:** Membership plugin (e.g. MemberPress, Paid Memberships Pro) REST exposure or custom CPT `massaro_tier`.

```js
{
  id: string,            // WP: post ID as string
  slug: string,          // WP: post_name — 'guest' | 'member' | 'patron'
  name: string,          // WP: post_title
  meta: {
    monthly_price: number,
    yearly_price: number,
    perks: string[],
    unlock_types: string[],       // content types this tier unlocks
    unlock_item_slugs: string[],  // specific catalog item slugs
  },
}
```

---

### `getCatalogItems()` → `CatalogItem[]`

**Future WordPress:** Custom post type `massaro_catalog_item` (or separate CPTs per type) via `GET /wp-json/wp/v2/massaro_catalog_item`.

```js
{
  id: string,
  slug: string,                    // stable key — e.g. 'course-stillness'
  type: 'massaro_catalog_item',
  status: 'publish',
  title: { rendered: string },     // WP: title.rendered
  excerpt: { rendered: string },   // WP: excerpt.rendered (description)
  meta: {
    content_type: 'course' | 'class' | 'appointment' | 'experience',
    individual_price: number,
    buyable_individually: boolean,
    included_tier_slugs: string[],
  },
}
```

---

### `getCampusAreas()` → `CampusArea[]`

**Future WordPress:** Custom post type `massaro_campus_area` via `GET /wp-json/wp/v2/massaro_campus_area`.

```js
{
  id: string,
  slug: string,
  type: 'massaro_campus_area',
  status: 'publish',
  title: { rendered: string },     // area display name
  meta: {
    area_type: string,             // 'library' | 'hall' | 'garden' | 'lounge'
    position: { x, y, z },
    footprint: { width, depth },
    access: 'open' | { requiresTier: string } | { requiresItem: string },
    locked_message: string | null,
    build: string | null,          // builder template id
    entrance: string | null,       // 'north' | 'south' | 'east' | 'west'
  },
}
```

---

### `getEntitlements()` → `Entitlements`

Current owned items and active membership. Subset of user meta, convenient for access checks.

**Future WordPress:** `GET /wp-json/massaro/v1/entitlements` — derived from orders + membership plugin.

```js
{
  owned_item_slugs: string[],
  active_tier_slug: string,
  subscription_period: 'monthly' | 'yearly' | null,
}
```

---

### `recordPurchase(itemId)` → `Entitlements`

Records a simulated (local) or real (future) individual purchase.

**Future WordPress:** `POST /wp-json/massaro/v1/orders` — WooCommerce or custom orders table.

---

### `recordSubscription(tierId, billing)` → `Entitlements`

Records a simulated (local) or real (future) tier subscription. `billing` is `'monthly'` or `'yearly'`.

**Future WordPress:** `POST /wp-json/massaro/v1/subscriptions` — membership plugin webhook/REST.

---

## Runtime cache (sync, post-bootstrap)

After `bootstrapPlatform()`, the app reads normalized data synchronously via:

- `getCachedCatalogItems()` / `findCatalogItemById(id)`
- `getCachedTiers()` / `findTierById(id)`
- `getCachedCampusAreas()` / `findCampusAreaById(id)`
- `getCachedContentTypes()`

These exist for per-frame access checks and UI rendering. They are populated from the contract objects via `src/platform/mappers.js`.

---

## What maps to WordPress later

| Contract method | WordPress source |
|-----------------|------------------|
| `getCurrentUser` / `saveCurrentUser` | Users + user meta |
| `getCatalogItems` | CPT `massaro_catalog_item` |
| `getMembershipTiers` | Membership plugin or CPT `massaro_tier` |
| `getCampusAreas` | CPT `massaro_campus_area` |
| `getEntitlements` | User meta + membership plugin + orders |
| `recordPurchase` | WooCommerce / custom orders REST |
| `recordSubscription` | Membership plugin REST |