import { findCatalogItemById, findTierById } from '../platform/index.js';

/**
 * ── CHECKOUT SEAM — simulated today; payment processor replaces delay only ──
 * Recording ownership goes through src/platform/ (recordPurchase / recordSubscription).
 */

export async function purchaseItem(itemId) {
  const item = findCatalogItemById(itemId);
  if (!item) {
    return { success: false, error: 'Item not found.' };
  }
  if (!item.buyableIndividually) {
    return { success: false, error: 'This item is not sold individually.' };
  }
  if (item.individualPrice <= 0) {
    return { success: false, error: 'This item is free — no purchase needed.' };
  }

  await simulatePaymentDelay();

  return {
    success: true,
    itemId: item.id,
    amount: item.individualPrice,
    type: 'individual',
  };
}

export async function subscribeToTier(tierId, period) {
  const tier = findTierById(tierId);
  if (!tier) {
    return { success: false, error: 'Membership tier not found.' };
  }
  if (tierId === 'guest') {
    return { success: false, error: 'Guest access is already free.' };
  }
  if (period !== 'monthly' && period !== 'yearly') {
    return { success: false, error: 'Invalid subscription period.' };
  }

  const amount = period === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
  if (amount <= 0) {
    return { success: false, error: 'This tier has no paid plan.' };
  }

  await simulatePaymentDelay();

  return {
    success: true,
    tierId: tier.id,
    period,
    amount,
    type: 'subscription',
  };
}

function simulatePaymentDelay() {
  return new Promise((resolve) => setTimeout(resolve, 400));
}