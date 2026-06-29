/**
 * In-memory runtime cache — populated by bootstrapPlatform().
 * App modules read sync data here after init (never from static files).
 */

let catalogItems = [];
let tiers = [];
let campusAreas = [];
let contentTypes = {};

export function setPlatformCache({ items, tiers: tierList, areas, types }) {
  catalogItems = items;
  tiers = tierList;
  campusAreas = areas;
  contentTypes = types;
}

export function getCachedCatalogItems() {
  return catalogItems;
}

export function getCachedTiers() {
  return tiers;
}

export function getCachedCampusAreas() {
  return campusAreas;
}

export function getCachedContentTypes() {
  return contentTypes;
}

export function findCatalogItemById(id) {
  return catalogItems.find((item) => item.id === id) ?? null;
}

export function findTierById(id) {
  return tiers.find((tier) => tier.id === id) ?? null;
}

export function findCampusAreaById(id) {
  return campusAreas.find((area) => area.id === id) ?? null;
}