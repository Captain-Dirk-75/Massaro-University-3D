import * as THREE from 'three';

// ── Mood knobs ──
export const POOL_DEEP_COLOR = new THREE.Color(0x2a4a58);
export const POOL_SHALLOW_COLOR = new THREE.Color(0x4a7a8a);
export const POOL_SUN_REFLECT = new THREE.Color(0xffd8a8);
export const RIPPLE_SPEED = 0.85;
export const RIPPLE_HEIGHT = 0.035;

const waterVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float wave = sin(pos.x * 1.1 + uTime * 1.3) * 0.5
               + sin(pos.y * 0.9 + uTime * 0.95) * 0.4
               + sin((pos.x + pos.y) * 0.7 + uTime * 0.6) * 0.3;
    pos.z += wave * ${RIPPLE_HEIGHT.toFixed(4)};
    vWave = wave;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterFragmentShader = /* glsl */ `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSunColor;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWave;

  void main() {
    float fresnel = pow(1.0 - abs(vWave) * 0.6, 2.0);
    vec3 waterColor = mix(uDeepColor, uShallowColor, fresnel * 0.6 + 0.2);

    float shimmer = sin(vUv.x * 40.0 + uTime * 2.0) * sin(vUv.y * 35.0 + uTime * 1.5);
    waterColor += uSunColor * shimmer * 0.04;

    float alpha = 0.88;
    gl_FragColor = vec4(waterColor, alpha);
  }
`;

function createStoneRim(width, depth, thickness, height) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc8b8a4,
    roughness: 0.9,
  });

  const longSide = new THREE.Mesh(
    new THREE.BoxGeometry(width + thickness * 2, height, thickness),
    mat,
  );
  longSide.castShadow = true;
  longSide.receiveShadow = true;

  const shortSide = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, height, depth),
    mat,
  );
  shortSide.castShadow = true;
  shortSide.receiveShadow = true;

  const hw = width / 2 + thickness / 2;
  const hd = depth / 2 + thickness / 2;

  const north = longSide.clone();
  north.position.set(0, height / 2, -hd);
  group.add(north);

  const south = longSide.clone();
  south.position.set(0, height / 2, hd);
  group.add(south);

  const west = shortSide.clone();
  west.position.set(-hw, height / 2, 0);
  group.add(west);

  const east = shortSide.clone();
  east.position.set(hw, height / 2, 0);
  group.add(east);

  return group;
}

export function buildWaterFeature(area) {
  const feature = new THREE.Group();
  feature.position.set(area.position.x, area.position.y, area.position.z);
  feature.userData.campusAreaId = area.id;

  const poolWidth = 10;
  const poolDepth = 14;

  feature.add(createStoneRim(poolWidth, poolDepth, 0.55, 0.28));

  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeepColor: { value: POOL_DEEP_COLOR },
      uShallowColor: { value: POOL_SHALLOW_COLOR },
      uSunColor: { value: POOL_SUN_REFLECT },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(poolWidth, poolDepth, 48, 64),
    waterMaterial,
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.18;
  feature.add(water);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 0.6, 10),
    new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.85 }),
  );
  pedestal.position.set(0, 0.45, 0);
  pedestal.castShadow = true;
  feature.add(pedestal);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.5, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: 0xc0b0a0, roughness: 0.8 }),
  );
  bowl.position.set(0, 0.82, 0);
  bowl.castShadow = true;
  feature.add(bowl);

  return { group: feature, waterMaterial };
}