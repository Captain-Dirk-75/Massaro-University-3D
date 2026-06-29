/**
 * ── EDIT REAL MASSARO CONTENT HERE (local mode seed data) ──
 * Consumed only by src/platform/adapters/local.js — the rest of the app
 * reads catalog data via src/platform/.
 * All sellable items and membership tiers live in this file.
 * Prices below are PLACEHOLDER examples — replace with real pricing.
 */

export const CONTENT_TYPES = {
  course: { label: 'Self-Paced Courses', order: 1 },
  class: { label: 'Live Classes & Sessions', order: 2 },
  appointment: { label: '1-on-1 Appointments', order: 3 },
  experience: { label: 'Premium Experiences & Events', order: 4 },
};

export const TIERS = [
  {
    id: 'guest',
    name: 'Guest',
    monthlyPrice: 0,
    yearlyPrice: 0,
    perks: [
      'Walk the campus freely',
      'Access free introductory content',
    ],
    unlockTypes: [],
    unlockItemIds: ['course-welcome'],
  },
  {
    id: 'member',
    name: 'Member',
    monthlyPrice: 19,
    yearlyPrice: 190,
    perks: [
      'All self-paced courses',
      'Live group sessions',
      'Member campus events',
    ],
    unlockTypes: ['course', 'class'],
    unlockItemIds: ['appointment-intro'],
  },
  {
    id: 'patron',
    name: 'Patron',
    monthlyPrice: 49,
    yearlyPrice: 490,
    perks: [
      'Everything in Member',
      '1-on-1 teacher appointments',
      'Premium experiences & retreats',
      'Early access to new content',
    ],
    unlockTypes: ['course', 'class', 'appointment', 'experience'],
    unlockItemIds: [],
  },
];

export const ITEMS = [
  {
    id: 'course-welcome',
    type: 'course',
    title: 'Welcome to Massaro',
    description:
      'A gentle introduction to the university — its spirit, its rhythm, and how to begin.',
    individualPrice: 0,
    buyableIndividually: false,
    includedInTiers: ['guest', 'member', 'patron'],
  },
  {
    id: 'course-stillness',
    type: 'course',
    title: 'Foundations of Stillness',
    description:
      'A self-paced journey into breath, posture, and quiet presence. Four modules at your own pace.',
    individualPrice: 49,
    buyableIndividually: true,
    includedInTiers: ['member', 'patron'],
  },
  {
    id: 'course-walking',
    type: 'course',
    title: 'Walking Meditation',
    description:
      'Learn to carry calm into movement — a practical course for daily walking practice.',
    individualPrice: 29,
    buyableIndividually: true,
    includedInTiers: ['member', 'patron'],
  },
  {
    id: 'class-morning',
    type: 'class',
    title: 'Morning Gather',
    description:
      'A live group session at dawn — shared practice, brief teaching, and community silence.',
    individualPrice: 15,
    buyableIndividually: true,
    includedInTiers: ['member', 'patron'],
  },
  {
    id: 'class-evening',
    type: 'class',
    title: 'Evening Circle',
    description:
      'An intimate live session as the light fades — reflection, dialogue, and closing meditation.',
    individualPrice: 20,
    buyableIndividually: true,
    includedInTiers: ['patron'],
  },
  {
    id: 'appointment-intro',
    type: 'appointment',
    title: 'Intro Consultation',
    description:
      'A one-on-one meeting with a teacher to orient your path and answer your questions.',
    individualPrice: 60,
    buyableIndividually: true,
    includedInTiers: ['member', 'patron'],
  },
  {
    id: 'appointment-guidance',
    type: 'appointment',
    title: 'Personal Guidance Session',
    description:
      'A deeper 1-on-1 appointment for ongoing practice support and personalised direction.',
    individualPrice: 120,
    buyableIndividually: true,
    includedInTiers: ['patron'],
  },
  {
    id: 'experience-twilight',
    type: 'experience',
    title: 'Campus Twilight Tour',
    description:
      'A guided evening walk through the grounds — architecture, nature, and quiet ceremony.',
    individualPrice: 25,
    buyableIndividually: true,
    includedInTiers: ['member', 'patron'],
  },
  {
    id: 'experience-solstice',
    type: 'experience',
    title: 'Solstice Retreat',
    description:
      'A premium seasonal gathering — full-day immersion, shared meal, and sunset vigil.',
    individualPrice: 350,
    buyableIndividually: true,
    includedInTiers: ['patron'],
  },
];

export function getItemById(id) {
  return ITEMS.find((item) => item.id === id) ?? null;
}

export function getTierById(id) {
  return TIERS.find((tier) => tier.id === id) ?? null;
}

export function getItemsByType(type) {
  return ITEMS.filter((item) => item.type === type);
}