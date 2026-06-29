import * as THREE from 'three';

// ── Exterior glass (facades, seen from campus) ──
export const EXTERIOR_GLASS_COLOR = 0xb8d4e8;
export const EXTERIOR_GLASS_EMISSIVE = 0xffe8c8;
export const EXTERIOR_GLASS_EMISSIVE_INTENSITY = 0.42;
export const EXTERIOR_GLASS_OPACITY = 0.72;
export const EXTERIOR_GLASS_ROUGHNESS = 0.14;
export const EXTERIOR_GLASS_METALNESS = 0.08;

// ── Interior glass (daylight gradient panes) ──
export const INTERIOR_SKY_TOP = '#9ec8e8';
export const INTERIOR_SKY_MID = '#c8dff0';
export const INTERIOR_HORIZON_WARM = '#f8e8c8';
export const INTERIOR_GLASS_EMISSIVE = 0xfff0d8;
export const INTERIOR_GLASS_EMISSIVE_INTENSITY = 0.38;
export const INTERIOR_GLASS_OPACITY = 0.92;

let interiorDaylightTexture = null;

function getInteriorDaylightTexture() {
  if (interiorDaylightTexture) return interiorDaylightTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, INTERIOR_SKY_TOP);
  gradient.addColorStop(0.5, INTERIOR_SKY_MID);
  gradient.addColorStop(1, INTERIOR_HORIZON_WARM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 256);

  interiorDaylightTexture = new THREE.CanvasTexture(canvas);
  interiorDaylightTexture.colorSpace = THREE.SRGBColorSpace;
  return interiorDaylightTexture;
}

/**
 * Soft glowing facade glass — lit-from-within look, stable from every angle.
 */
export function createExteriorGlass(_opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: EXTERIOR_GLASS_COLOR,
    emissive: EXTERIOR_GLASS_EMISSIVE,
    emissiveIntensity: EXTERIOR_GLASS_EMISSIVE_INTENSITY,
    roughness: EXTERIOR_GLASS_ROUGHNESS,
    metalness: EXTERIOR_GLASS_METALNESS,
    transparent: true,
    opacity: EXTERIOR_GLASS_OPACITY,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/**
 * Bright daylight pane — warm horizon gradient, no outdoor scene capture.
 */
export function createInteriorGlass(_opts = {}) {
  const map = getInteriorDaylightTexture();
  return new THREE.MeshStandardMaterial({
    map,
    emissive: INTERIOR_GLASS_EMISSIVE,
    emissiveIntensity: INTERIOR_GLASS_EMISSIVE_INTENSITY,
    emissiveMap: map,
    roughness: 0.2,
    metalness: 0.02,
    transparent: true,
    opacity: INTERIOR_GLASS_OPACITY,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}