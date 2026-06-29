import { findCatalogItemById, findTierById } from '../platform/index.js';

const TIER_RANK = { guest: 0, member: 1, patron: 2 };

/**
 * Single access check — used everywhere content gating is needed.
 */
export function hasAccess(item, state) {
  if (!item) return false;

  const commerce = state.commerce ?? {};
  const ownedIds = commerce.ownedItemIds ?? [];

  if (ownedIds.includes(item.id)) {
    return true;
  }

  const activeTierId = commerce.activeTierId ?? 'guest';
  const tier = findTierById(activeTierId);
  if (!tier) return false;

  if (tier.unlockItemIds?.includes(item.id)) {
    return true;
  }

  if (
    tier.unlockTypes?.includes(item.type) &&
    item.includedInTiers?.includes(activeTierId)
  ) {
    return true;
  }

  return false;
}

export function getAccessLabel(item, state) {
  if (!hasAccess(item, state)) return 'locked';

  const ownedIds = state.commerce?.ownedItemIds ?? [];
  if (ownedIds.includes(item.id)) return 'owned';

  return 'entitled';
}

/**
 * Campus area access — reuses hasAccess for item gates, tier rank for tier gates.
 */
export function hasAreaAccess(area, state) {
  if (!area) return false;
  if (area.access === 'open') return true;

  if (typeof area.access !== 'object') return false;

  if (area.access.requiresTier) {
    const active = state.commerce?.activeTierId ?? 'guest';
    const required = area.access.requiresTier;
    return (TIER_RANK[active] ?? 0) >= (TIER_RANK[required] ?? 99);
  }

  if (area.access.requiresItem) {
    const item = findCatalogItemById(area.access.requiresItem);
    return hasAccess(item, state);
  }

  return false;
}

export function getAreaLockedMessage(area) {
  if (area.lockedMessage) return area.lockedMessage;

  if (area.access?.requiresTier) {
    const tier = findTierById(area.access.requiresTier);
    return `${area.name} opens to ${tier?.name ?? area.access.requiresTier} members.`;
  }

  if (area.access.requiresItem) {
    const item = findCatalogItemById(area.access.requiresItem);
    return `${area.name} opens to those who hold ${item?.title ?? 'the required offering'}.`;
  }

  return `${area.name} is not open to you yet.`;
}