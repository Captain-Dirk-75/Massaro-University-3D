/**
 * @deprecated Internal storage — only used by src/platform/adapters/local.js.
 * The rest of the app must use src/platform/index.js instead.
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
    commerce: {
      ...DEFAULT_PLAYER_STATE.commerce,
      ...raw.commerce,
      ownedItemIds: raw.commerce?.ownedItemIds ?? [],
    },
  };
}

export async function save(state) {
  writeRaw(structuredClone(state));
}

export async function clear() {
  localStorage.removeItem(STORAGE_KEY);
}