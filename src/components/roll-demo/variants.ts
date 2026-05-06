// Roll-demo variant configs + shared GLSL.
// See /home/murnanedaniel/.claude/plans/in-general-every-scene-velvety-kitten.md

export type VariantId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

export type VariantConfig = {
  id: VariantId;
  label: string;
  notes: string;
  R: number;
  centerShift: number;   // 0 = no shift, 1 = tube stays at y=0
  tightenR: number;      // 1 = no tightening, <1 = R shrinks to (baseR * tightenR) at progress=1
  endFade: number;       // 1 = full fade-out over last 10% of progress, 0 = no fade
  cameraPos: [number, number, number];
  cameraLookAt: [number, number, number];
  fov: number;
  subdivisions: [number, number];
  texture: "solid" | "checker";
  shading: "angle" | "lambert";
  vertSrc: string;
  fragSrc: string;
};

// ── shared GLSL ────────────────────────────────────────────────────────────────

const vertCommon = (R: number, centerShift: number, tightenR: number) => /* glsl */ `
  uniform float u_progress;
  varying vec2  v_uv;
  varying vec3  v_worldPos;
  varying float v_angle;
  varying float v_fade;

  void main() {
    float halfH = 0.5;
    float baseR = ${R.toFixed(5)};
    float TWO_PI = 6.28318530718;

    // R tightens toward end of animation
    float R = baseR * mix(1.0, ${tightenR.toFixed(4)}, smoothstep(0.55, 1.0, u_progress));

    // Roll front sweeps from below the bottom edge to above the top edge
    // plus one full circumference so the topmost vertex completes one turn by progress=1.
    float startY = -halfH;
    float endY   =  halfH + TWO_PI * baseR;
    float frontY = mix(startY, endY, u_progress);

    // Shift the mesh down so the tube stays centered in view as frontY climbs.
    // centerShift = 0 → never shift (plane scrolls off top naturally).
    // centerShift = 1 → tube stays pinned at y=0 in view.
    float shift = -${centerShift.toFixed(4)} * max(0.0, frontY);

    vec3 pos = position;
    float dy = frontY - pos.y;

    v_angle = 0.0;
    if (dy > 0.0) {
      float angle = dy / R;
      v_angle = angle;
      pos.z -= R * (1.0 - cos(angle));
      pos.y  = frontY - R * sin(angle);
    }
    pos.y += shift;

    v_fade = 1.0;
    v_uv = uv;
    v_worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragAngleShade = /* glsl */ `
  uniform float u_progress;
  #ifdef USE_TEXTURE
    uniform sampler2D u_map;
  #endif
  #ifdef USE_ENDFADE
    uniform float u_endFadeAmt;
  #endif
  varying vec2 v_uv;
  varying vec3 v_worldPos;
  varying float v_angle;

  void main() {
    vec3 base = vec3(0.965, 0.945, 0.906);
    #ifdef USE_TEXTURE
      base = texture2D(u_map, v_uv).rgb;
    #endif
    float shade = 1.0 - smoothstep(0.0, 3.14159265 * 1.5, v_angle) * 0.82;
    float alpha = 1.0;
    #ifdef USE_ENDFADE
      alpha = 1.0 - smoothstep(0.88, 1.0, u_progress) * u_endFadeAmt;
    #endif
    gl_FragColor = vec4(base * shade, alpha);
  }
`;

// Per-fragment normals via dFdx/dFdy on world position + Lambert.
const fragLambert = /* glsl */ `
  uniform float u_progress;
  #ifdef USE_TEXTURE
    uniform sampler2D u_map;
  #endif
  #ifdef USE_ENDFADE
    uniform float u_endFadeAmt;
  #endif
  varying vec2 v_uv;
  varying vec3 v_worldPos;
  varying float v_angle;

  void main() {
    vec3 base = vec3(0.965, 0.945, 0.906);
    #ifdef USE_TEXTURE
      base = texture2D(u_map, v_uv).rgb;
    #endif

    vec3 N = normalize(cross(dFdx(v_worldPos), dFdy(v_worldPos)));
    if (N.z < 0.0) N = -N;

    vec3 L = normalize(vec3(0.3, 0.7, 0.85));
    float lambert = max(0.22, dot(N, L));
    float inside = smoothstep(3.14159265, 6.28318530, v_angle) * 0.35;

    vec3 col = base * lambert * (1.0 - inside);
    float alpha = 1.0;
    #ifdef USE_ENDFADE
      alpha = 1.0 - smoothstep(0.88, 1.0, u_progress) * u_endFadeAmt;
    #endif
    gl_FragColor = vec4(col, alpha);
  }
`;

const fragSrc = (
  shading: "angle" | "lambert",
  texture: "solid" | "checker",
  endFade: number,
) => {
  const defines =
    (texture === "checker" ? "#define USE_TEXTURE\n" : "") +
    (endFade > 0 ? "#define USE_ENDFADE\n" : "");
  return defines + (shading === "lambert" ? fragLambert : fragAngleShade);
};

// ── variant configs ────────────────────────────────────────────────────────────

const makeVariant = (v: Omit<VariantConfig, "vertSrc" | "fragSrc">): VariantConfig => ({
  ...v,
  vertSrc: vertCommon(v.R, v.centerShift, v.tightenR),
  fragSrc: fragSrc(v.shading, v.texture, v.endFade),
});

export const VARIANTS: VariantConfig[] = [
  makeVariant({
    id: "A",
    label: "A · baseline",
    notes: "R=0.035, head-on, angle-shade (original)",
    R: 0.035, centerShift: 0, tightenR: 1, endFade: 0,
    cameraPos: [0, 0.05, 2.6], cameraLookAt: [0, 0, 0], fov: 38,
    subdivisions: [4, 120], texture: "solid", shading: "angle",
  }),
  makeVariant({
    id: "B",
    label: "B · bigger tube",
    notes: "R=0.12, head-on, angle-shade",
    R: 0.12, centerShift: 0, tightenR: 1, endFade: 0,
    cameraPos: [0, 0.05, 2.6], cameraLookAt: [0, 0, 0], fov: 38,
    subdivisions: [4, 120], texture: "solid", shading: "angle",
  }),
  makeVariant({
    id: "C",
    label: "C · sushi roll",
    notes: "R=0.25, head-on, angle-shade",
    R: 0.25, centerShift: 0, tightenR: 1, endFade: 0,
    cameraPos: [0, 0.05, 2.6], cameraLookAt: [0, 0, 0], fov: 38,
    subdivisions: [6, 160], texture: "solid", shading: "angle",
  }),
  makeVariant({
    id: "D",
    label: "D · Lambert",
    notes: "R=0.12, head-on, Lambert",
    R: 0.12, centerShift: 0, tightenR: 1, endFade: 0,
    cameraPos: [0, 0.05, 2.6], cameraLookAt: [0, 0, 0], fov: 38,
    subdivisions: [4, 120], texture: "solid", shading: "lambert",
  }),
  makeVariant({
    id: "E",
    label: "E · elevated + Lambert",
    notes: "R=0.12, elevated cam, Lambert",
    R: 0.12, centerShift: 0, tightenR: 1, endFade: 0,
    cameraPos: [0, 0.55, 2.3], cameraLookAt: [0, 0, 0], fov: 38,
    subdivisions: [4, 120], texture: "solid", shading: "lambert",
  }),
  makeVariant({
    id: "F",
    label: "F · checker + Lambert",
    notes: "R=0.12, elevated cam, Lambert, 8×200 checker",
    R: 0.12, centerShift: 0, tightenR: 1, endFade: 0,
    cameraPos: [0, 0.55, 2.3], cameraLookAt: [0, 0, 0], fov: 38,
    subdivisions: [8, 200], texture: "checker", shading: "lambert",
  }),

  // ── centered + tightening variants (the user's requested direction) ─────────
  makeVariant({
    id: "G",
    label: "G · centered sushi",
    notes: "R=0.25, centerShift=1, Lambert, elevated cam — tube stays pinned at y=0",
    R: 0.25, centerShift: 1, tightenR: 1, endFade: 0,
    cameraPos: [0, 0.35, 2.4], cameraLookAt: [0, 0, 0], fov: 40,
    subdivisions: [6, 180], texture: "solid", shading: "lambert",
  }),
  makeVariant({
    id: "H",
    label: "H · centered + tightening",
    notes: "G + R shrinks to 0.35× at the end",
    R: 0.25, centerShift: 1, tightenR: 0.35, endFade: 0,
    cameraPos: [0, 0.35, 2.4], cameraLookAt: [0, 0, 0], fov: 40,
    subdivisions: [6, 180], texture: "solid", shading: "lambert",
  }),
  makeVariant({
    id: "I",
    label: "I · centered + tight + fade",
    notes: "H + R shrinks to 0.15× + opacity fade over last 12%",
    R: 0.28, centerShift: 1, tightenR: 0.15, endFade: 1,
    cameraPos: [0, 0.35, 2.4], cameraLookAt: [0, 0, 0], fov: 40,
    subdivisions: [6, 200], texture: "solid", shading: "lambert",
  }),
];

export function variantById(id: VariantId): VariantConfig {
  const v = VARIANTS.find((v) => v.id === id);
  if (!v) throw new Error(`Unknown variant: ${id}`);
  return v;
}
