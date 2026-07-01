import {
  getCachedCatalogItems,
  getCachedTiers,
  getCachedContentTypes,
  findCatalogItemById,
  findTierById,
} from '../platform/index.js';
import { hasAccess, getAccessLabel } from '../commerce/access.js';
import { purchaseItem, subscribeToTier, cancelSubscription } from '../commerce/checkout.js';
import {
  playerState,
  recordItemPurchase,
  setSubscription,
} from '../state/playerState.js';

function formatPrice(amount) {
  if (amount <= 0) return 'Free';
  return `$${amount}`;
}

function tierLabel(tierId) {
  return findTierById(tierId)?.name ?? tierId;
}

function getTierIncludedItems(tier, catalogItems) {
  return catalogItems.filter((item) => {
    if (tier.unlockItemIds?.includes(item.id)) return true;
    return (
      tier.unlockTypes?.includes(item.type) &&
      item.includedInTiers?.includes(tier.id)
    );
  });
}

export function createStorePanel({ onOpenChange, onCommerceChange }) {
  const panel = document.createElement('div');
  panel.id = 'store-panel';
  panel.className = 'store-panel store-panel--hidden';
  panel.innerHTML = `
    <div class="store-panel__card">
      <header class="store-panel__header">
        <div>
          <h2>Course Sanctuary</h2>
          <p class="store-panel__subtitle">Catalog &amp; Memberships</p>
        </div>
        <button type="button" class="store-panel__close" aria-label="Close">×</button>
      </header>
      <div class="store-panel__body" id="store-body"></div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .store-panel {
      position: fixed;
      inset: 0;
      z-index: 25;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(18, 22, 26, 0.58);
      backdrop-filter: blur(5px);
      pointer-events: auto;
    }

    .store-panel--hidden { display: none; }

    .store-panel__card {
      width: min(920px, 96vw);
      max-height: 90vh;
      overflow-y: auto;
      padding: 1.2rem 1.3rem 1.4rem;
      border-radius: 12px;
      background: rgba(32, 38, 44, 0.97);
      color: #f5f0e8;
      box-shadow: 0 14px 44px rgba(0, 0, 0, 0.38);
      font-family: system-ui, -apple-system, sans-serif;
    }

    .store-panel__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .store-panel__header h2 {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .store-panel__subtitle {
      font-size: 0.78rem;
      color: #a09890;
      margin-top: 0.2rem;
    }

    .store-panel__close {
      border: none;
      background: transparent;
      color: #c8c0b4;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }

    .store-section {
      margin-bottom: 1.25rem;
    }

    .store-section__title {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #a8a098;
      margin-bottom: 0.55rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .store-item {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      justify-content: space-between;
      padding: 0.65rem 0.7rem;
      margin-bottom: 0.45rem;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .store-tier-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.65rem;
      margin-bottom: 0.5rem;
    }

    @media (max-width: 720px) {
      .store-tier-grid {
        grid-template-columns: 1fr;
      }
    }

    .store-tier-card {
      display: flex;
      flex-direction: column;
      padding: 0.75rem 0.7rem;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.08);
      min-height: 100%;
    }

    .store-tier-card--active {
      border-color: rgba(106, 140, 196, 0.45);
      background: rgba(106, 140, 196, 0.08);
    }

    .store-tier-card__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      margin-bottom: 0.45rem;
    }

    .store-tier-card__name {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .store-tier-card__prices {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      margin-bottom: 0.55rem;
    }

    .store-tier-card__includes-label {
      font-size: 0.68rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #989088;
      margin-bottom: 0.35rem;
    }

    .store-tier-card__includes {
      margin: 0 0 0.65rem;
      padding-left: 1rem;
      flex: 1;
      font-size: 0.72rem;
      color: #b0a898;
      line-height: 1.45;
    }

    .store-tier-card__includes li {
      margin-bottom: 0.2rem;
    }

    .store-tier-card__actions {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-top: auto;
    }

    .store-tier-card__actions .store-btn {
      width: 100%;
      text-align: center;
    }

    .store-tier-card--guest .store-tier-card__actions {
      margin-top: 0.5rem;
    }

    .store-tier-card__free {
      font-size: 0.78rem;
      color: #b8e8c0;
      text-align: center;
      padding: 0.35rem 0;
    }

    .store-item__info { flex: 1; min-width: 0; }

    .store-item__title {
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 0.2rem;
    }

    .store-item__desc {
      font-size: 0.76rem;
      color: #a8a098;
      line-height: 1.4;
    }

    .store-item__meta {
      font-size: 0.72rem;
      color: #8a9488;
      margin-top: 0.35rem;
    }

    .store-item__actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
      flex-shrink: 0;
    }

    .store-price {
      font-size: 0.82rem;
      color: #d8c8a8;
      white-space: nowrap;
    }

    .store-badge {
      font-size: 0.68rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: rgba(196, 168, 106, 0.2);
      color: #e8d8b0;
    }

    .store-badge--owned {
      background: rgba(106, 168, 120, 0.22);
      color: #b8e8c0;
    }

    .store-badge--active {
      background: rgba(106, 140, 196, 0.25);
      color: #c0d8f0;
    }

    .store-badge--locked {
      background: rgba(120, 100, 100, 0.2);
      color: #c0a8a8;
    }

    .store-btn {
      padding: 0.35rem 0.65rem;
      border-radius: 5px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(196, 168, 106, 0.15);
      color: #f5f0e8;
      font-size: 0.74rem;
      cursor: pointer;
      white-space: nowrap;
    }

    .store-btn:hover { background: rgba(196, 168, 106, 0.28); }

    .store-btn--secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #d8d0c4;
    }

    .store-btn--cancel {
      background: rgba(140, 90, 90, 0.18);
      border-color: rgba(200, 140, 140, 0.28);
      color: #e8c8c8;
    }

    .store-btn--cancel:hover {
      background: rgba(140, 90, 90, 0.32);
    }

    .store-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .store-detail {
      padding: 0.5rem 0;
    }

    .store-detail__back {
      margin-bottom: 0.75rem;
    }

    .store-detail__title {
      font-size: 1.05rem;
      margin-bottom: 0.5rem;
    }

    .store-detail__desc {
      font-size: 0.85rem;
      color: #b0a898;
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .store-detail__access {
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      margin-top: 0.5rem;
    }

    .store-detail__access--locked {
      background: rgba(80, 60, 60, 0.35);
      border: 1px solid rgba(200, 140, 140, 0.25);
      color: #e8c0c0;
    }

    .store-detail__access--granted {
      background: rgba(60, 90, 70, 0.35);
      border: 1px solid rgba(140, 200, 160, 0.25);
      color: #c8e8d0;
    }

    .store-confirm {
      padding: 0.75rem 0;
    }

    .store-confirm p {
      font-size: 0.88rem;
      color: #c8c0b4;
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .store-confirm__actions {
      display: flex;
      gap: 0.5rem;
    }

    .store-note {
      font-size: 0.7rem;
      color: #787068;
      font-style: italic;
      margin-top: 0.75rem;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(panel);

  const body = panel.querySelector('#store-body');
  let isOpen = false;
  let view = { mode: 'catalog' };

  function notifyCommerce() {
    onCommerceChange?.();
  }

  function setOpen(open) {
    isOpen = open;
    panel.classList.toggle('store-panel--hidden', !open);
    onOpenChange?.(open);

    if (open) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      view = { mode: 'catalog' };
      render();
    }
  }

  function renderCatalog() {
    const contentTypes = getCachedContentTypes();
    const catalogItems = getCachedCatalogItems();
    const tiers = getCachedTiers();
    const activeTier = findTierById(playerState.commerce.activeTierId);
    const typeKeys = Object.keys(contentTypes).sort(
      (a, b) => contentTypes[a].order - contentTypes[b].order,
    );

    let html = '';

    html += `<section class="store-section">
      <h3 class="store-section__title">Memberships</h3>`;

    if (activeTier) {
      html += `<p class="store-item__meta" style="margin-bottom:0.75rem">
        Active membership: <strong>${activeTier.name}</strong>
        ${playerState.commerce.subscriptionPeriod ? `(${playerState.commerce.subscriptionPeriod})` : ''}
      </p>`;
    }

    html += `<div class="store-tier-grid">`;

    for (const tier of tiers) {
      const isActive = playerState.commerce.activeTierId === tier.id;
      const includedItems = getTierIncludedItems(tier, catalogItems);
      const isGuest = tier.id === 'guest';

      html += `<div class="store-tier-card${isActive ? ' store-tier-card--active' : ''}${isGuest ? ' store-tier-card--guest' : ''}" data-tier-id="${tier.id}">
        <div class="store-tier-card__head">
          <span class="store-tier-card__name">${tier.name}</span>
          ${isActive ? '<span class="store-badge store-badge--active">Active</span>' : ''}
        </div>
        <div class="store-tier-card__prices">
          <span class="store-price">${formatPrice(tier.monthlyPrice)}/mo</span>
          <span class="store-price">${formatPrice(tier.yearlyPrice)}/yr</span>
        </div>
        <p class="store-tier-card__includes-label">Included content</p>
        <ul class="store-tier-card__includes">
          ${includedItems.length > 0
            ? includedItems.map((item) => `<li>${item.title}</li>`).join('')
            : '<li>No catalog items</li>'}
        </ul>
        <div class="store-tier-card__actions">`;

      if (isGuest) {
        if (isActive) {
          html += `<p class="store-tier-card__free">Free — no subscription needed</p>`;
        } else {
          html += `<button type="button" class="store-btn store-btn--cancel" data-return-guest>
              Return to Guest
            </button>`;
        }
      } else {
        html += `<button type="button" class="store-btn" data-subscribe-tier="${tier.id}" data-period="monthly"
            ${isActive && playerState.commerce.subscriptionPeriod === 'monthly' ? 'disabled' : ''}>
            Subscribe monthly
          </button>
          <button type="button" class="store-btn store-btn--secondary" data-subscribe-tier="${tier.id}" data-period="yearly"
            ${isActive && playerState.commerce.subscriptionPeriod === 'yearly' ? 'disabled' : ''}>
            Subscribe yearly
          </button>`;
      }

      html += `</div></div>`;
    }

    html += `</div></section>`;

    for (const typeKey of typeKeys) {
      const typeInfo = contentTypes[typeKey];
      const items = catalogItems.filter((item) => item.type === typeKey);
      if (items.length === 0) continue;

      html += `<section class="store-section">
        <h3 class="store-section__title">${typeInfo.label}</h3>`;

      for (const item of items) {
        const access = getAccessLabel(item, playerState);
        const entitled = hasAccess(item, playerState);
        const owned = playerState.commerce.ownedItemIds.includes(item.id);

        html += `<div class="store-item" data-item-id="${item.id}">
          <div class="store-item__info">
            <div class="store-item__title">${item.title}</div>
            <div class="store-item__desc">${item.description}</div>
            <div class="store-item__meta">
              Included with: ${item.includedInTiers.map(tierLabel).join(', ')}
            </div>
          </div>
          <div class="store-item__actions">
            <span class="store-price">${formatPrice(item.individualPrice)}</span>
            ${owned ? '<span class="store-badge store-badge--owned">Owned</span>' : ''}
            ${!owned && entitled ? '<span class="store-badge">Accessible</span>' : ''}
            ${!entitled ? '<span class="store-badge store-badge--locked">Locked</span>' : ''}
            <button type="button" class="store-btn store-btn--secondary" data-open-item="${item.id}">Open</button>
            ${item.buyableIndividually && !owned
              ? `<button type="button" class="store-btn" data-buy-item="${item.id}">Buy</button>`
              : ''}
          </div>
        </div>`;
      }

      html += `</section>`;
    }

    html += `<p class="store-note">Prices are placeholder examples — simulated purchases only.</p>`;

    body.innerHTML = html;
  }

  function renderItemDetail(itemId) {
    const item = findCatalogItemById(itemId);
    if (!item) {
      view = { mode: 'catalog' };
      renderCatalog();
      return;
    }

    const entitled = hasAccess(item, playerState);
    const owned = playerState.commerce.ownedItemIds.includes(item.id);

    body.innerHTML = `
      <div class="store-detail">
        <button type="button" class="store-btn store-btn--secondary store-detail__back" data-back-catalog>← Back to catalog</button>
        <h3 class="store-detail__title">${item.title}</h3>
        <p class="store-detail__desc">${item.description}</p>
        <p class="store-item__meta">Type: ${getCachedContentTypes()[item.type].label}</p>
        <p class="store-item__meta">Price: ${formatPrice(item.individualPrice)} · Included with: ${item.includedInTiers.map(tierLabel).join(', ')}</p>
        <div class="store-detail__access store-detail__access--${entitled ? 'granted' : 'locked'}">
          ${entitled
            ? `<strong>You have access</strong><br><span style="font-size:0.82rem;opacity:0.85">
                ${owned ? 'Purchased individually.' : `Unlocked via ${tierLabel(playerState.commerce.activeTierId)} membership.`}
                <br>Content delivery coming in a future phase.
              </span>`
            : `<strong>Locked</strong><br><span style="font-size:0.82rem;opacity:0.85">
                Purchase individually or subscribe to a membership that includes this content.
              </span>
              ${item.buyableIndividually
                ? `<br><button type="button" class="store-btn" style="margin-top:0.75rem" data-buy-item="${item.id}">Buy for ${formatPrice(item.individualPrice)}</button>`
                : ''}`}
        </div>
      </div>
    `;
  }

  function renderConfirmPurchase(itemId) {
    const item = findCatalogItemById(itemId);
    body.innerHTML = `
      <div class="store-confirm">
        <button type="button" class="store-btn store-btn--secondary store-detail__back" data-back-catalog>← Cancel</button>
        <p>Confirm simulated purchase of <strong>${item?.title}</strong> for <strong>${formatPrice(item?.individualPrice ?? 0)}</strong>?</p>
        <p class="store-note">No real payment is processed. This records the item as owned in your profile.</p>
        <div class="store-confirm__actions">
          <button type="button" class="store-btn" data-confirm-buy="${itemId}">Confirm purchase</button>
        </div>
      </div>
    `;
  }

  function renderConfirmSubscribe(tierId, period) {
    const tier = findTierById(tierId);
    const amount = period === 'monthly' ? tier?.monthlyPrice : tier?.yearlyPrice;
    body.innerHTML = `
      <div class="store-confirm">
        <button type="button" class="store-btn store-btn--secondary store-detail__back" data-back-catalog>← Cancel</button>
        <p>Confirm simulated <strong>${period}</strong> subscription to <strong>${tier?.name}</strong> for <strong>${formatPrice(amount ?? 0)}</strong>?</p>
        <p class="store-note">No real payment is processed. This activates the tier in your profile.</p>
        <div class="store-confirm__actions">
          <button type="button" class="store-btn" data-confirm-subscribe="${tierId}" data-period="${period}">Confirm subscribe</button>
        </div>
      </div>
    `;
  }

  function renderConfirmCancel() {
    const activeTier = findTierById(playerState.commerce.activeTierId);
    body.innerHTML = `
      <div class="store-confirm">
        <button type="button" class="store-btn store-btn--secondary store-detail__back" data-back-catalog>← Back</button>
        <p>Cancel your <strong>${activeTier?.name ?? 'paid'}</strong> membership and return to the free <strong>Guest</strong> tier?</p>
        <p class="store-note">Gated areas (Patron Garden, Upper Archive, and tier-only content) will lock immediately. Individually purchased items stay yours.</p>
        <div class="store-confirm__actions">
          <button type="button" class="store-btn store-btn--cancel" data-confirm-cancel>Confirm — return to Guest</button>
        </div>
      </div>
    `;
  }

  function render() {
    if (view.mode === 'catalog') renderCatalog();
    else if (view.mode === 'item') renderItemDetail(view.itemId);
    else if (view.mode === 'confirm-buy') renderConfirmPurchase(view.itemId);
    else if (view.mode === 'confirm-subscribe') renderConfirmSubscribe(view.tierId, view.period);
    else if (view.mode === 'confirm-cancel') renderConfirmCancel();
  }

  body.addEventListener('click', async (event) => {
    const target = event.target;

    if (target.matches('[data-back-catalog]')) {
      view = { mode: 'catalog' };
      render();
      return;
    }

    const openId = target.dataset?.openItem;
    if (openId) {
      view = { mode: 'item', itemId: openId };
      render();
      return;
    }

    const buyId = target.dataset?.buyItem;
    if (buyId) {
      view = { mode: 'confirm-buy', itemId: buyId };
      render();
      return;
    }

    const subscribeTier = target.dataset?.subscribeTier;
    const period = target.dataset?.period;
    if (subscribeTier && period) {
      view = { mode: 'confirm-subscribe', tierId: subscribeTier, period };
      render();
      return;
    }

    const confirmBuy = target.dataset?.confirmBuy;
    if (confirmBuy) {
      const result = await purchaseItem(confirmBuy);
      if (result.success) {
        await recordItemPurchase(result.itemId);
        notifyCommerce();
        view = { mode: 'item', itemId: result.itemId };
      } else {
        view = { mode: 'catalog' };
      }
      render();
      return;
    }

    if (target.matches('[data-return-guest]')) {
      view = { mode: 'confirm-cancel' };
      render();
      return;
    }

    const confirmSub = target.dataset?.confirmSubscribe;
    const subPeriod = target.dataset?.period;
    if (confirmSub && subPeriod) {
      const result = await subscribeToTier(confirmSub, subPeriod);
      if (result.success) {
        await setSubscription(result.tierId, result.period);
        notifyCommerce();
        view = { mode: 'catalog' };
      }
      render();
      return;
    }

    if (target.matches('[data-confirm-cancel]')) {
      const result = await cancelSubscription();
      if (result.success) {
        await setSubscription(result.tierId, result.period);
        notifyCommerce();
        view = { mode: 'catalog' };
      }
      render();
    }
  });

  panel.querySelector('.store-panel__close').addEventListener('click', () => {
    setOpen(false);
  });

  panel.addEventListener('click', (event) => {
    if (event.target === panel) setOpen(false);
  });

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    isOpen: () => isOpen,
    refresh: render,
  };
}