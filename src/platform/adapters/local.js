/**
 * Local adapter — reads seed data files and localStorage.
 * ONLY this file may import src/content/* and src/state/persistence.js.
 */
import { ITEMS, TIERS, CONTENT_TYPES } from '../../content/catalog.js';
import { CAMPUS_AREAS } from '../../content/campus.js';
import { DEFAULT_PLAYER_STATE } from '../../state/defaults.js';
import { load, save, clear } from '../../state/persistence.js';
import {
  catalogItemToContract,
  tierToContract,
  campusAreaToContract,
  userToContract,
  userFromContract,
  entitlementsFromUserContract,
} from '../mappers.js';

export async function getMembershipTiers() {
  return TIERS.map(tierToContract);
}

export async function getCatalogItems() {
  return ITEMS.map(catalogItemToContract);
}

export async function getContentTypes() {
  return structuredClone(CONTENT_TYPES);
}

export async function getCampusAreas() {
  return CAMPUS_AREAS.map(campusAreaToContract);
}

export async function getCurrentUser() {
  const stored = await load();
  const state = stored ?? structuredClone(DEFAULT_PLAYER_STATE);
  return userToContract(state);
}

export async function saveCurrentUser(state) {
  await save(state);
  return userToContract(state);
}

export async function clearCurrentUser() {
  await clear();
}

export async function getEntitlements() {
  const user = await getCurrentUser();
  return entitlementsFromUserContract(user);
}

export async function recordPurchase(itemId) {
  const stored = (await load()) ?? structuredClone(DEFAULT_PLAYER_STATE);
  if (!stored.commerce.ownedItemIds.includes(itemId)) {
    stored.commerce.ownedItemIds.push(itemId);
  }
  await save(stored);
  return entitlementsFromUserContract(userToContract(stored));
}

export async function recordSubscription(tierId, billing) {
  const stored = (await load()) ?? structuredClone(DEFAULT_PLAYER_STATE);
  stored.commerce.activeTierId = tierId;
  stored.commerce.subscriptionPeriod = billing;
  await save(stored);
  return entitlementsFromUserContract(userToContract(stored));
}

export async function loadUserState() {
  const user = await getCurrentUser();
  return userFromContract(user);
}