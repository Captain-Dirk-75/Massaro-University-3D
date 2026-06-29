/**
 * Platform layer — single data-access boundary for the entire app.
 * Nothing outside src/platform/ should read localStorage or static content files.
 */
import { ACTIVE_ADAPTER } from './config.js';
import * as localAdapter from './adapters/local.js';
import * as wordpressAdapter from './adapters/wordpress.js';
import {
  catalogItemFromContract,
  tierFromContract,
  campusAreaFromContract,
  interiorFromContract,
  userFromContract,
  userToContract,
  entitlementsToCommerce,
} from './mappers.js';
import {
  setPlatformCache,
  getCachedCatalogItems,
  getCachedTiers,
  getCachedCampusAreas,
  getCachedContentTypes,
  findCatalogItemById,
  findTierById,
  findCampusAreaById,
  getCachedInteriors,
  findInteriorById,
  findInteriorByBuildingId,
} from './cache.js';

const adapter = ACTIVE_ADAPTER === 'wordpress' ? wordpressAdapter : localAdapter;

export {
  getCachedCatalogItems,
  getCachedTiers,
  getCachedCampusAreas,
  getCachedContentTypes,
  findCatalogItemById,
  findTierById,
  findCampusAreaById,
  getCachedInteriors,
  findInteriorById,
  findInteriorByBuildingId,
};

/**
 * Load catalog, tiers, campus areas into the runtime cache.
 * Call once at app startup before building the world or UI.
 */
export async function bootstrapPlatform() {
  const [tierContracts, itemContracts, areaContracts, interiorContracts, contentTypes] =
    await Promise.all([
      adapter.getMembershipTiers(),
      adapter.getCatalogItems(),
      adapter.getCampusAreas(),
      adapter.getInteriors?.() ?? Promise.resolve([]),
      adapter.getContentTypes(),
    ]);

  setPlatformCache({
    items: itemContracts.map(catalogItemFromContract),
    tiers: tierContracts.map(tierFromContract),
    areas: areaContracts.map(campusAreaFromContract),
    interiorList: interiorContracts.map(interiorFromContract),
    types: contentTypes,
  });
}

export async function getCurrentUser() {
  const contract = await adapter.getCurrentUser();
  return userFromContract(contract);
}

export async function saveCurrentUser(state) {
  const contract = await adapter.saveCurrentUser(state);
  return userFromContract(contract);
}

export async function clearCurrentUser() {
  await adapter.clearCurrentUser();
}

export async function getMembershipTiers() {
  const contracts = await adapter.getMembershipTiers();
  return contracts;
}

export async function getCatalogItems() {
  const contracts = await adapter.getCatalogItems();
  return contracts;
}

export async function getCampusAreas() {
  const contracts = await adapter.getCampusAreas();
  return contracts;
}

export async function getEntitlements() {
  return adapter.getEntitlements();
}

export async function recordPurchase(itemId) {
  const entitlements = await adapter.recordPurchase(itemId);
  return entitlements;
}

export async function recordSubscription(tierId, billing) {
  const entitlements = await adapter.recordSubscription(tierId, billing);
  return entitlements;
}

export function applyEntitlementsToState(state, entitlements) {
  Object.assign(state.commerce, entitlementsToCommerce(entitlements));
}