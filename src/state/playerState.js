/**
 * Persisted player identity + session — single source of truth.
 * Mutate via the helpers below; persistence.save() is called automatically.
 */
import { DEFAULT_PLAYER_STATE } from './defaults.js';
import { save } from './persistence.js';

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
}

export function updateProfile(changes) {
  Object.assign(playerState.profile, changes);
  persist();
}

export function addCampusTime(seconds) {
  playerState.session.totalTimeOnCampus += seconds;
}

export function persist() {
  save(playerState);
}

export function resetToDefaults() {
  const fresh = structuredClone(DEFAULT_PLAYER_STATE);
  Object.assign(playerState, fresh);
  persist();
  return playerState;
}