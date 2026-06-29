/**
 * WordPress adapter — STUB ONLY. Not active. No network calls. No API keys.
 *
 * TODO: Implement each method with fetch() against your headless WordPress REST API.
 * The API key / application password must live on a server-side proxy — NEVER in
 * this browser bundle.
 */

export async function getMembershipTiers() {
  // TODO: GET /wp-json/massaro/v1/membership-tiers
  throw new Error('WordPress adapter is not implemented.');
}

export async function getCatalogItems() {
  // TODO: GET /wp-json/wp/v2/massaro_catalog_item?per_page=100
  throw new Error('WordPress adapter is not implemented.');
}

export async function getContentTypes() {
  // TODO: GET /wp-json/massaro/v1/content-types
  throw new Error('WordPress adapter is not implemented.');
}

export async function getCampusAreas() {
  // TODO: GET /wp-json/wp/v2/massaro_campus_area?per_page=100
  throw new Error('WordPress adapter is not implemented.');
}

export async function getCurrentUser() {
  // TODO: GET /wp-json/massaro/v1/me (authenticated session or JWT via proxy)
  throw new Error('WordPress adapter is not implemented.');
}

export async function saveCurrentUser(_state) {
  // TODO: POST /wp-json/massaro/v1/me
  throw new Error('WordPress adapter is not implemented.');
}

export async function clearCurrentUser() {
  // TODO: DELETE /wp-json/massaro/v1/me/meta or reset endpoint
  throw new Error('WordPress adapter is not implemented.');
}

export async function getEntitlements() {
  // TODO: GET /wp-json/massaro/v1/entitlements
  throw new Error('WordPress adapter is not implemented.');
}

export async function recordPurchase(_itemId) {
  // TODO: POST /wp-json/massaro/v1/orders (individual purchase)
  throw new Error('WordPress adapter is not implemented.');
}

export async function recordSubscription(_tierId, _billing) {
  // TODO: POST /wp-json/massaro/v1/subscriptions
  throw new Error('WordPress adapter is not implemented.');
}

export async function loadUserState() {
  const user = await getCurrentUser();
  return user;
}