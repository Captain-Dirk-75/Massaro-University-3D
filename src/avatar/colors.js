export const AVATAR_COLORS = [
  { id: 'sage', label: 'Sage', hex: 0x6b8f6e },
  { id: 'slate', label: 'Slate', hex: 0x5a6a7a },
  { id: 'clay', label: 'Clay', hex: 0xa87858 },
  { id: 'dusk', label: 'Dusk', hex: 0x7a5a8a },
  { id: 'sand', label: 'Sand', hex: 0xc4a86a },
  { id: 'stone', label: 'Stone', hex: 0x8a9098 },
];

export function getColorById(id) {
  return AVATAR_COLORS.find((c) => c.id === id) ?? AVATAR_COLORS[0];
}