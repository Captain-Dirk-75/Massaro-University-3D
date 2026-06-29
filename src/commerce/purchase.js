import { getItemById, getTierById } from '../content/catalog.js';

/**
 * ── SWAP THESE FOR A REAL PAYMENT BACKEND LATER ──
 * UI and state call only these two functions for transactions.
 */

/**
 * Simulated individual purchase. Replace internals with Stripe/etc.
 */
export async function purchaseItem(itemId) {
  const item = getItemById(itemId);
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

/**
 * Simulated tier subscription. Replace internals with Stripe/etc.
 */
export async function subscribeToTier(tierId, period) {
  const tier = getTierById(tierId);
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