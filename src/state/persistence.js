/**
 * Storage adapter — swap this module when moving to a real backend.
 * Everything else talks to playerState + these three functions only.
 */
import { DEFAULT_PLAYER_STATE } from './defaults.js';

const STORAGE_KEY = 'massaro-university-player';

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Load saved state or return null if nothing valid is stored.
 */
export async function load() {
  const raw = readRaw();
  if (!raw || typeof raw !== 'object') return null;

  return {
    ...structuredClone(DEFAULT_PLAYER_STATE),
    ...raw,
    profile: {
      ...DEFAULT_PLAYER_STATE.profile,
      ...raw.profile,
    },
    session: {
      ...DEFAULT_PLAYER_STATE.session,
      ...raw.session,
    },
  };
}

/**
 * Persist the full player state object.
 */
export async function save(state) {
  writeRaw(structuredClone(state));
}

/**
 * Remove stored data entirely.
 */
export async function clear() {
  localStorage.removeItem(STORAGE_KEY);
}