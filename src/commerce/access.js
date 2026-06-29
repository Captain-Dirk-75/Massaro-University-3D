import { getTierById } from '../content/catalog.js';

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
  const tier = getTierById(activeTierId);
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