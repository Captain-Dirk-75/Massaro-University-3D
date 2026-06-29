/**
 * In-memory player state — runtime source of truth during a session.
 * Persistence and static data go through src/platform/ only.
 */
import { DEFAULT_PLAYER_STATE } from './defaults.js';
import {
  getCurrentUser,
  saveCurrentUser,
  clearCurrentUser,
  recordPurchase,
  recordSubscription,
  applyEntitlementsToState,
} from '../platform/index.js';

export { DEFAULT_PLAYER_STATE };

export const playerState = structuredClone(DEFAULT_PLAYER_STATE);

export function applyPlayerState(loaded) {
  Object.assign(playerState, structuredClone(DEFAULT_PLAYER_STATE), loaded);
  if (!playerState.profile) {
    playerState.profile = structuredClone(DEFAULT_PLAYER_STATE.profile);
  }
  if (!playerState.session) {
    playerState.session = structuredClone(DEFAULT_PLAYER_STATE.session);
  }
  if (!playerState.commerce) {
    playerState.commerce = structuredClone(DEFAULT_PLAYER_STATE.commerce);
  }
}

export async function updateProfile(changes) {
  Object.assign(playerState.profile, changes);
  await persist();
}

export function addCampusTime(seconds) {
  playerState.session.totalTimeOnCampus += seconds;
}

export async function recordItemPurchase(itemId) {
  const entitlements = await recordPurchase(itemId);
  applyEntitlementsToState(playerState, entitlements);
}

export async function setSubscription(tierId, period) {
  const entitlements = await recordSubscription(tierId, period);
  applyEntitlementsToState(playerState, entitlements);
}

export async function persist() {
  await saveCurrentUser(playerState);
}

export async function resetToDefaults() {
  await clearCurrentUser();
  const user = await getCurrentUser();
  applyPlayerState(user);
  return playerState;
}