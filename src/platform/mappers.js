/**
 * Maps between WordPress-shaped contracts and the app's internal runtime shapes.
 * Only the platform layer imports this module.
 */

export function catalogItemToContract(item) {
  return {
    id: item.id,
    slug: item.id,
    type: 'massaro_catalog_item',
    status: 'publish',
    title: { rendered: item.title },
    excerpt: { rendered: item.description },
    meta: {
      content_type: item.type,
      individual_price: item.individualPrice,
      buyable_individually: item.buyableIndividually,
      included_tier_slugs: [...item.includedInTiers],
    },
  };
}

export function catalogItemFromContract(contract) {
  return {
    id: contract.slug,
    type: contract.meta.content_type,
    title: contract.title.rendered,
    description: contract.excerpt.rendered,
    individualPrice: contract.meta.individual_price,
    buyableIndividually: contract.meta.buyable_individually,
    includedInTiers: [...contract.meta.included_tier_slugs],
  };
}

export function tierToContract(tier) {
  return {
    id: tier.id,
    slug: tier.id,
    name: tier.name,
    meta: {
      monthly_price: tier.monthlyPrice,
      yearly_price: tier.yearlyPrice,
      perks: [...tier.perks],
      unlock_types: [...tier.unlockTypes],
      unlock_item_slugs: [...tier.unlockItemIds],
    },
  };
}

export function tierFromContract(contract) {
  return {
    id: contract.slug,
    name: contract.name,
    monthlyPrice: contract.meta.monthly_price,
    yearlyPrice: contract.meta.yearly_price,
    perks: [...contract.meta.perks],
    unlockTypes: [...contract.meta.unlock_types],
    unlockItemIds: [...contract.meta.unlock_item_slugs],
  };
}

export function campusAreaToContract(area) {
  return {
    id: area.id,
    slug: area.id,
    type: 'massaro_campus_area',
    status: 'publish',
    title: { rendered: area.name },
    meta: {
      area_type: area.type,
      position: { ...area.position },
      footprint: { ...area.footprint },
      access: area.access,
      locked_message: area.lockedMessage ?? null,
      build: area.build ?? null,
      entrance: area.entrance ?? null,
    },
  };
}

export function campusAreaFromContract(contract) {
  return {
    id: contract.slug,
    name: contract.title.rendered,
    type: contract.meta.area_type,
    position: { ...contract.meta.position },
    footprint: { ...contract.meta.footprint },
    access: contract.meta.access,
    lockedMessage: contract.meta.locked_message ?? undefined,
    build: contract.meta.build ?? null,
    entrance: contract.meta.entrance ?? undefined,
  };
}

export function userToContract(state) {
  return {
    id: 'current',
    slug: 'current',
    profile: {
      display_name: state.profile.displayName,
      body_preset: state.profile.bodyPreset,
      color_id: state.profile.colorId,
    },
    meta: {
      total_time_on_campus: state.session.totalTimeOnCampus,
      owned_item_slugs: [...state.commerce.ownedItemIds],
      active_tier_slug: state.commerce.activeTierId,
      subscription_period: state.commerce.subscriptionPeriod,
    },
  };
}

export function userFromContract(contract) {
  return {
    version: 1,
    profile: {
      displayName: contract.profile.display_name,
      bodyPreset: contract.profile.body_preset,
      colorId: contract.profile.color_id,
    },
    session: {
      totalTimeOnCampus: contract.meta.total_time_on_campus,
    },
    commerce: {
      ownedItemIds: [...contract.meta.owned_item_slugs],
      activeTierId: contract.meta.active_tier_slug,
      subscriptionPeriod: contract.meta.subscription_period,
    },
  };
}

export function entitlementsFromUserContract(contract) {
  return {
    owned_item_slugs: [...contract.meta.owned_item_slugs],
    active_tier_slug: contract.meta.active_tier_slug,
    subscription_period: contract.meta.subscription_period,
  };
}

export function interiorToContract(interior) {
  return {
    id: interior.id,
    slug: interior.id,
    type: 'massaro_interior',
    status: 'publish',
    title: { rendered: interior.name },
    meta: {
      building_id: interior.buildingId,
      entrance: interior.entrance,
      exit: interior.exit,
      spawn: interior.spawn,
      return_spawn: interior.returnSpawn,
      room: interior.room,
      build: interior.build,
      furniture: interior.furniture ?? {},
    },
  };
}

export function interiorFromContract(contract) {
  return {
    id: contract.slug,
    buildingId: contract.meta.building_id,
    name: contract.title.rendered,
    entrance: contract.meta.entrance,
    exit: contract.meta.exit,
    spawn: contract.meta.spawn,
    returnSpawn: contract.meta.return_spawn,
    room: contract.meta.room,
    build: contract.meta.build,
    furniture: contract.meta.furniture ?? {},
  };
}

export function entitlementsToCommerce(entitlements) {
  return {
    ownedItemIds: [...entitlements.owned_item_slugs],
    activeTierId: entitlements.active_tier_slug,
    subscriptionPeriod: entitlements.subscription_period,
  };
}