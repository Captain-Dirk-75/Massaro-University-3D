import { findCatalogItemById, findTierById } from '../platform/index.js';

function formatCampusTime(seconds) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  return 'a little while';
}

/**
 * Build personalization context from the central player state.
 */
export function buildGuideContext(playerState) {
  const { profile, commerce, session } = playerState;
  const tier = findTierById(commerce.activeTierId ?? 'guest');

  const ownedItems = (commerce.ownedItemIds ?? [])
    .map((id) => findCatalogItemById(id))
    .filter(Boolean)
    .map((item) => ({ id: item.id, title: item.title, type: item.type }));

  return {
    name: profile.displayName || 'Visitor',
    tierId: commerce.activeTierId ?? 'guest',
    tierName: tier?.name ?? 'Guest',
    subscriptionPeriod: commerce.subscriptionPeriod,
    ownedItems,
    ownedItemTitles: ownedItems.map((item) => item.title),
    campusTimeLabel: formatCampusTime(session.totalTimeOnCampus ?? 0),
    campusTimeSeconds: session.totalTimeOnCampus ?? 0,
    isGuest: (commerce.activeTierId ?? 'guest') === 'guest',
    isMember: commerce.activeTierId === 'member',
    isPatron: commerce.activeTierId === 'patron',
  };
}