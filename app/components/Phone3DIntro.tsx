"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const INTRO_MS = 3600;
const BASE_FOV = 30;
const CAMERA_Z = 13.263;
// One world unit is 110.44 CSS pixels, so the body always lines up with the 432x776 DOM product.
const PHONE_WIDTH = 3.91;
const PHONE_HEIGHT = 7.02;
const BAND_DEPTH = 0.62; // 9.3mm at true iPhone 4 proportions
// The aperture is measured at the glass plane, not at the phone origin. These
// dimensions project to the DOM screen's exact 386 x 601 CSS-pixel rectangle.
const SCREEN_WIDTH = 3.41485;
const SCREEN_HEIGHT = 5.3169;
const GLASS_WIDTH = 3.8;
const GLASS_HEIGHT = 6.91;
const GLASS_RADIUS = 0.46;
const GLASS_Z = BAND_DEPTH / 2 - 0.01; // both glass plates sit just inside the steel chamfer
// Keep the live DOM display on the same physical plane as the cover glass.
// The small offset avoids z-fighting without turning the display into a second,
// visibly displaced plane during the three-quarter view.
const SCREEN_COMPOSITE_Z = GLASS_Z + 0.004;
const FUJI_CASE_ART = "/media/cases/red-fuji-case.jpg";

function smoothstep5(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

type PhonePose = {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  x: number;
  y: number;
  z: number;
  scale: number;
};

// One continuous take, ad style: the phone drifts in showing its glass back,
// sweeps through the steel-band profile, and decelerates into a dead-on hero
// frame with zero velocity — no bounce, no cut.
function poseAt(progress: number): PhonePose {
  const eased = smoothstep5(progress);
  const lift = Math.sin(eased * Math.PI);
  return {
    rotateY: THREE.MathUtils.lerp(Math.PI * 0.93, 0, eased),
    rotateX: THREE.MathUtils.lerp(-0.095, 0, eased),
    rotateZ: THREE.MathUtils.lerp(0.024, 0, eased),
    x: THREE.MathUtils.lerp(-0.52, 0, eased),
    y: THREE.MathUtils.lerp(-0.16, 0, eased) + lift * 0.05,
    z: THREE.MathUtils.lerp(-1.15, 0, eased),
    scale: THREE.MathUtils.lerp(0.9, 1, eased),
  };
}

function traceRoundedRect<T extends THREE.Path>(path: T, width: number, height: number, radius: number): T {
  const x = width / 2;
  const y = height / 2;
  path.moveTo(-x + radius, -y);
  path.lineTo(x - radius, -y);
  path.absarc(x - radius, -y + radius, radius, -Math.PI / 2, 0, false);
  path.lineTo(x, y - radius);
  path.absarc(x - radius, y - radius, radius, 0, Math.PI / 2, false);
  path.lineTo(-x + radius, y);
  path.absarc(-x + radius, y - radius, radius, Math.PI / 2, Math.PI, false);
  path.lineTo(-x, -y + radius);
  path.absarc(-x + radius, -y + radius, radius, Math.PI, Math.PI * 1.5, false);
  path.closePath();
  return path;
}

function roundedFrameGeometry(outerWidth: number, outerHeight: number, outerRadius: number, wall: number, depth: number) {
  const shape = traceRoundedRect(new THREE.Shape(), outerWidth, outerHeight, outerRadius);
  shape.holes.push(traceRoundedRect(new THREE.Path(), outerWidth - wall * 2, outerHeight - wall * 2, Math.max(0.012, outerRadius - wall)));
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 28 });
}

// A machined button is not a flat cylinder: its rim rolls into the side wall
// and the exposed face has a barely crowned profile. A lathed cross-section
// gives that small piece the same soft, finger-safe finish as the steel band.
function machinedButtonGeometry(radius: number, depth: number) {
  const halfDepth = depth / 2;
  return new THREE.LatheGeometry([
    new THREE.Vector2(0, -halfDepth),
    new THREE.Vector2(radius * 0.76, -halfDepth),
    new THREE.Vector2(radius * 0.91, -halfDepth * 0.84),
    new THREE.Vector2(radius * 0.985, -halfDepth * 0.48),
    new THREE.Vector2(radius, 0),
    new THREE.Vector2(radius * 0.975, halfDepth * 0.46),
    new THREE.Vector2(radius * 0.9, halfDepth * 0.78),
    new THREE.Vector2(radius * 0.72, halfDepth),
    new THREE.Vector2(0, halfDepth),
  ], 72);
}

// ExtrudeGeometry builds a wall around both the outside of a ring and the
// inside of its hole. The latter cannot exist in this composite: the live DOM
// display sits behind a transparent WebGL aperture, so the camera would see
// that inner steel wall as a wide vertical bar near profile. Strip only faces
// whose normals point back toward the ring centre; caps, chamfers and every
// outward-facing part of the stainless band remain untouched.
function withoutInwardFaces(source: THREE.BufferGeometry) {
  const positions = source.getAttribute("position");
  const normals = source.getAttribute("normal");
  const keptVertices: number[] = [];

  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    let centreX = 0;
    let centreY = 0;
    let normalX = 0;
    let normalY = 0;
    for (let corner = 0; corner < 3; corner += 1) {
      const index = vertex + corner;
      centreX += positions.getX(index);
      centreY += positions.getY(index);
      normalX += normals.getX(index);
      normalY += normals.getY(index);
    }
    const pointsInward = normalX * centreX + normalY * centreY < -0.0001;
    if (!pointsInward) keptVertices.push(vertex, vertex + 1, vertex + 2);
  }

  const geometry = new THREE.BufferGeometry();
  Object.entries(source.attributes).forEach(([name, attribute]) => {
    const values = new Float32Array(keptVertices.length * attribute.itemSize);
    const sourceValues = attribute.array as ArrayLike<number>;
    keptVertices.forEach((vertex, outputVertex) => {
      for (let component = 0; component < attribute.itemSize; component += 1) {
        values[outputVertex * attribute.itemSize + component] = sourceValues[vertex * attribute.itemSize + component];
      }
    });
    geometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
  });
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

// A minimal virtual studio: long gradient softboxes on a near-black dome.
// PMREM turns the emissive planes into the elegant streak reflections that
// read as product-spot lighting on the steel chamfers and the glass.
function createStudioEnvironment(): { studio: THREE.Scene; dispose: () => void } {
  const studio = new THREE.Scene();
  const owned: Array<{ dispose: () => void }> = [];

  let glow: THREE.Texture | null = null;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 6, 64, 64, 64);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.4, "#cdd1d5");
    gradient.addColorStop(0.75, "#43464a");
    gradient.addColorStop(1, "#000000");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    glow = new THREE.CanvasTexture(canvas);
    owned.push(glow);
  }

  // Metals live entirely off the environment, so the dome carries a mid-gray
  // base: the band reads as graduated steel everywhere, never a silhouette.
  const dome = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 16), new THREE.MeshBasicMaterial({ color: 0x3d434a, side: THREE.BackSide }));
  studio.add(dome);
  owned.push(dome.geometry, dome.material);

  const softbox = (width: number, height: number, color: number, intensity: number, position: [number, number, number]) => {
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, map: glow ?? undefined });
    material.color.multiplyScalar(intensity);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
    owned.push(panel.geometry, material);
  };
  softbox(16, 20, 0xffffff, 1.7, [-8, 4, 7]);      // key: huge soft panel, upper left
  softbox(10, 14, 0xf4f7fa, 0.6, [3, 0.5, 10]);    // gentle off-axis frontal fill for the rim at rest
  softbox(2.5, 16, 0xcfe4ff, 4, [7, 1, -5.5]);     // rim: cool narrow strip behind right
  softbox(18, 3, 0xffffff, 2.4, [0, 9, 2]);        // top: long strip for the chamfer streak
  softbox(12, 3, 0xffe9da, 1.2, [0, -9, 3]);       // low warm bounce

  return {
    studio,
    dispose: () => owned.forEach((resource) => resource.dispose()),
  };
}

function createSpeakerMeshTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 40;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#08090b";
  context.fillRect(0, 0, 160, 40);
  context.fillStyle = "#1c1f22";
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 19; column += 1) {
      context.beginPath();
      context.arc(8 + column * 8 + (row % 2) * 4, 10 + row * 10, 2.1, 0, Math.PI * 2);
      context.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBackMarkTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '500 55px "Helvetica Neue", Helvetica, Arial, sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(204, 210, 215, 0.72)";
  context.fillText("TIAN", canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function Phone3DIntro({ productRef }: { productRef: RefObject<HTMLDivElement | null> }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const product = productRef.current;
    const stage = host?.parentElement;
    if (!host || !product || !stage) return;

    const params = new URLSearchParams(window.location.search);
    const showFujiCase = params.get("case") !== "bare";
    const inspectionValue = params.get("introFrame");
    const requestedInspection = process.env.NODE_ENV === "production" || inspectionValue === null ? null : Number(inspectionValue);
    const inspectionMs = requestedInspection !== null && Number.isFinite(requestedInspection)
      ? Math.max(0, Math.min(INTRO_MS, requestedInspection))
      : null;
    const introRequestedForDocument = document.documentElement.dataset.phoneIntro === "pending";
    if (window.matchMedia("(max-width: 560px), (prefers-reduced-motion: reduce)").matches || (!introRequestedForDocument && inspectionMs === null)) {
      document.documentElement.classList.remove("phone-intro-pending");
      return;
    }
    // Consume the request once per document. A hard refresh creates a new
    // document and requests the intro again; client-side project navigation
    // reuses this document, so returning to Fun does not replay it.
    delete document.documentElement.dataset.phoneIntro;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      document.documentElement.classList.remove("phone-intro-pending");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.01;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // A neutral studio environment gives the steel and glass their Apple-spot reflections.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const { studio, dispose: disposeStudio } = createStudioEnvironment();
    const environment = pmrem.fromScene(studio, 0.035);
    disposeStudio();
    scene.environment = environment.texture;

    const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 100);
    camera.position.set(0, 0, CAMERA_Z);

    const phone = new THREE.Group();
    scene.add(phone);

    const ownedTextures: THREE.Texture[] = [];
    let modelActive = true;
    let caseTextureReady = !showFujiCase;
    let startIntro: (() => void) | null = null;

    // Brushed steel: anisotropy stretches the streak highlights along the band,
    // a whisper of clearcoat keeps the chamfers crisp over the brushing.
    const steel = new THREE.MeshPhysicalMaterial({
      color: 0x9da3a8,
      metalness: 1,
      roughness: 0.3,
      anisotropy: 0.34,
      clearcoat: 0.32,
      clearcoatRoughness: 0.24,
      envMapIntensity: 0.84,
    });
    const steelButton = new THREE.MeshPhysicalMaterial({
      color: 0xa8adb1,
      metalness: 1,
      roughness: 0.3,
      clearcoat: 0.28,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.86,
    });
    // The iPhone 4 rear is not a luminous black panel. It is a chemically
    // strengthened cover glass over an opaque black print/substrate. Keep the
    // body colour in an unlit backing layer, then let this very thin dielectric
    // coat carry only the moving studio reflection.
    const backSubstrate = new THREE.MeshBasicMaterial({ color: 0x010203 });
    const backCoverGlass = new THREE.MeshPhysicalMaterial({
      color: 0x010203,
      metalness: 0,
      roughness: 0.1,
      ior: 1.52,
      reflectivity: 0.5,
      specularIntensity: 0.82,
      specularColor: new THREE.Color(0xdce5ec),
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      envMapIntensity: 0.64,
    });
    // The front bezel stays optically black in both the static Next build and
    // the live Vite build. Highlights belong to the clear screen layer and the
    // stainless rim; letting PMREM light this broad face made it read as gray.
    const frontGlass = new THREE.MeshBasicMaterial({ color: 0x010203 });
    const matteBlack = new THREE.MeshStandardMaterial({ color: 0x040506, metalness: 0.1, roughness: 0.42 });
    const glassEdge = new THREE.MeshStandardMaterial({ color: 0x05070a, metalness: 0.1, roughness: 0.6 });
    const breakPlastic = new THREE.MeshStandardMaterial({ color: 0x141619, metalness: 0.05, roughness: 0.52 });
    const glyphMetal = new THREE.MeshStandardMaterial({ color: 0x74787c, metalness: 0.6, roughness: 0.35 });
    const lensGlass = new THREE.MeshPhysicalMaterial({ color: 0x0a1420, metalness: 0.2, roughness: 0.06, clearcoat: 1 });

    // --- Stainless band -----------------------------------------------------
    // A single extruded rounded-rect ring with chamfered edges: flat side wall,
    // two polished bevels — the iPhone 4's signature silhouette.
    const bandShape = traceRoundedRect(new THREE.Shape(), PHONE_WIDTH - 0.04, PHONE_HEIGHT - 0.04, 0.505);
    bandShape.holes.push(traceRoundedRect(new THREE.Path(), PHONE_WIDTH - 0.18, PHONE_HEIGHT - 0.18, 0.44));
    const rawBandGeometry = new THREE.ExtrudeGeometry(bandShape, {
      depth: BAND_DEPTH - 0.084,
      bevelEnabled: true,
      bevelThickness: 0.064,
      bevelSize: 0.038,
      bevelSegments: 10,
      curveSegments: 72,
    });
    const bandGeometry = withoutInwardFaces(rawBandGeometry);
    rawBandGeometry.dispose();
    bandGeometry.translate(0, 0, -(BAND_DEPTH - 0.084) / 2);
    phone.add(new THREE.Mesh(bandGeometry, steel));

    // Antenna break lines, GSM layout: one up top, two low on the sides.
    const breakTop = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.13, 0.55, 2, 0.012), breakPlastic);
    breakTop.position.set(-0.6, PHONE_HEIGHT / 2 - 0.055, 0);
    phone.add(breakTop);
    let farSideAntennaGap: THREE.Mesh | null = null;
    [-1, 1].forEach((side) => {
      const gap = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.04, 0.55, 2, 0.012), breakPlastic);
      gap.position.set(side * (PHONE_WIDTH / 2 - 0.06), -2.66, 0);
      if (side > 0) farSideAntennaGap = gap;
      phone.add(gap);
    });

    // --- Front glass --------------------------------------------------------
    // A zero-depth rounded glass face masks the live Retina display. The phone
    // plane beneath it now carries the same wallpaper for the full animation,
    // so oblique views never expose a differently lit internal surface.
    const faceShape = traceRoundedRect(new THREE.Shape(), GLASS_WIDTH, GLASS_HEIGHT, GLASS_RADIUS);
    faceShape.holes.push(traceRoundedRect(new THREE.Path(), SCREEN_WIDTH, SCREEN_HEIGHT, 0.05));
    const frontGlassGeometry = new THREE.ShapeGeometry(faceShape, 52);
    const frontGlassMesh = new THREE.Mesh(frontGlassGeometry, frontGlass);
    frontGlassMesh.position.z = GLASS_Z;
    phone.add(frontGlassMesh);
    // The aperture remains physically empty. The synchronized live DOM screen
    // sits beneath this WebGL glass for the entire front-facing half of the
    // turn, so the wallpaper, icons, shadows, typography and final resting
    // frame are literally the same pixels. There is no texture swap to hide.

    // Earpiece slot with its metal mesh, and the front camera beside it.
    const earpiece = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.09, 0.016, 3, 0.04), matteBlack);
    earpiece.position.set(0, 3.07, GLASS_Z + 0.003);
    phone.add(earpiece);
    const speakerMeshTexture = createSpeakerMeshTexture();
    if (speakerMeshTexture) {
      ownedTextures.push(speakerMeshTexture);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.06),
        new THREE.MeshStandardMaterial({ map: speakerMeshTexture, metalness: 0.4, roughness: 0.5 }),
      );
      mesh.position.set(0, 3.07, GLASS_Z + 0.012);
      phone.add(mesh);
    }
    const frontCamera = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.012, 32), matteBlack);
    frontCamera.rotation.x = Math.PI / 2;
    frontCamera.position.set(-0.58, 3.07, GLASS_Z + 0.004);
    phone.add(frontCamera);
    const frontPupil = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 24), lensGlass);
    frontPupil.rotation.x = Math.PI / 2;
    frontPupil.position.set(-0.58, 3.07, GLASS_Z + 0.008);
    phone.add(frontPupil);

    // Home button: seam ring, glossy cap, and the rounded-square glyph.
    const homeSeam = new THREE.Mesh(new THREE.TorusGeometry(0.223, 0.007, 12, 48), matteBlack);
    homeSeam.position.set(0, -3.06, GLASS_Z + 0.001);
    phone.add(homeSeam);
    const homeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.218, 0.218, 0.018, 48), frontGlass);
    homeCap.rotation.x = Math.PI / 2;
    homeCap.position.set(0, -3.06, GLASS_Z + 0.002);
    phone.add(homeCap);
    const homeGlyph = new THREE.Mesh(roundedFrameGeometry(0.165, 0.165, 0.05, 0.017, 0.008), glyphMetal);
    homeGlyph.position.set(0, -3.06, GLASS_Z + 0.012);
    phone.add(homeGlyph);

    // --- Back glass ---------------------------------------------------------
    // Culled whenever the front faces the viewer so the aperture stays a real
    // window onto the DOM; it only exists during the back half of the turn.
    const rearGroup = new THREE.Group();
    rearGroup.rotation.y = Math.PI;
    phone.add(rearGroup);

    const backShape = traceRoundedRect(new THREE.Shape(), GLASS_WIDTH, GLASS_HEIGHT, GLASS_RADIUS);
    const backGlassGeometry = new THREE.ExtrudeGeometry(backShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 4,
      curveSegments: 64,
    });
    backGlassGeometry.translate(0, 0, GLASS_Z - 0.045);
    rearGroup.add(new THREE.Mesh(backGlassGeometry, [backSubstrate, glassEdge]));

    // A separate surface sheet is deliberate: the black beneath it never
    // brightens with the lamps, while the cover glass catches a restrained
    // Fresnel-like highlight at grazing angles. That optical separation is
    // what makes the rear read as coated glass rather than a second display.
    const backCoverGeometry = new THREE.ShapeGeometry(backShape, 64);
    const backCover = new THREE.Mesh(backCoverGeometry, backCoverGlass);
    backCover.position.z = GLASS_Z + 0.002;
    backCover.renderOrder = 2;
    rearGroup.add(backCover);

    // A slim, frosted snap case printed with the user's Red Fuji reference.
    // It lives with the rear assembly, so its apparent thickness collapses to
    // a hairline at profile and is fully hidden once the phone faces front.
    const caseWidth = GLASS_WIDTH + 0.13;
    const caseHeight = GLASS_HEIGHT + 0.13;
    const caseShape = traceRoundedRect(new THREE.Shape(), caseWidth, caseHeight, GLASS_RADIUS + 0.055);
    const cameraCutout = new THREE.Path();
    cameraCutout.absellipse(-1.225, 2.95, 0.355, 0.225, 0, Math.PI * 2, true, 0);
    caseShape.holes.push(cameraCutout);

    const markCaseTextureReady = () => {
      caseTextureReady = true;
      if (modelActive) startIntro?.();
    };
    const caseTexture = new THREE.TextureLoader().load(
      FUJI_CASE_ART,
      markCaseTextureReady,
      undefined,
      markCaseTextureReady,
    );
    caseTexture.colorSpace = THREE.SRGBColorSpace;
    caseTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    // ShapeGeometry UVs use model units; normalize the bundled portrait texture.
    caseTexture.repeat.set(1 / caseWidth, 1 / caseHeight);
    caseTexture.offset.set(0.5, 0.5);
    ownedTextures.push(caseTexture);

    const caseArtMaterial = new THREE.MeshPhysicalMaterial({
      map: caseTexture,
      color: 0xf1f4f5,
      metalness: 0,
      roughness: 0.58,
      clearcoat: 0.12,
      clearcoatRoughness: 0.72,
      envMapIntensity: 0.2,
    });
    const frostedCaseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd9e2e6,
      metalness: 0,
      roughness: 0.5,
      transmission: 0.1,
      thickness: 0.08,
      ior: 1.46,
      transparent: true,
      opacity: 0.72,
      clearcoat: 0.18,
      clearcoatRoughness: 0.5,
      envMapIntensity: 0.32,
    });
    const casePanelGeometry = new THREE.ExtrudeGeometry(caseShape, {
      depth: 0.027,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.018,
      bevelSegments: 5,
      curveSegments: 64,
    });
    casePanelGeometry.translate(0, 0, GLASS_Z + 0.016);
    const casePanel = new THREE.Mesh(casePanelGeometry, [caseArtMaterial, frostedCaseMaterial]);
    casePanel.renderOrder = 5;
    casePanel.visible = showFujiCase;
    rearGroup.add(casePanel);

    const caseRimShape = traceRoundedRect(new THREE.Shape(), caseWidth + 0.085, caseHeight + 0.085, GLASS_RADIUS + 0.095);
    caseRimShape.holes.push(traceRoundedRect(new THREE.Path(), caseWidth - 0.035, caseHeight - 0.035, GLASS_RADIUS + 0.035));
    const caseRimGeometry = new THREE.ExtrudeGeometry(caseRimShape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 6,
      curveSegments: 64,
    });
    caseRimGeometry.translate(0, 0, GLASS_Z - 0.006);
    const caseRim = new THREE.Mesh(caseRimGeometry, frostedCaseMaterial);
    caseRim.renderOrder = 6;
    caseRim.visible = showFujiCase;
    rearGroup.add(caseRim);

    // Camera at the top-left of the back, LED flash beside it.
    const cameraBase = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.014, 48), matteBlack);
    cameraBase.rotation.x = Math.PI / 2;
    cameraBase.position.set(-1.39, 2.95, GLASS_Z + 0.004);
    rearGroup.add(cameraBase);
    const cameraLens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.016, 48), lensGlass);
    cameraLens.rotation.x = Math.PI / 2;
    cameraLens.position.set(-1.39, 2.95, GLASS_Z + 0.008);
    rearGroup.add(cameraLens);
    const cameraPupil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.014, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x02070c, metalness: 0.3, roughness: 0.05, clearcoat: 1 }),
    );
    cameraPupil.rotation.x = Math.PI / 2;
    cameraPupil.position.set(-1.39, 2.95, GLASS_Z + 0.013);
    rearGroup.add(cameraPupil);
    const flash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.095, 0.012, 32),
      new THREE.MeshStandardMaterial({ color: 0xf2eed6, emissive: 0x5c5844, emissiveIntensity: 0.4, roughness: 0.3 }),
    );
    flash.rotation.x = Math.PI / 2;
    flash.position.set(-1.06, 2.95, GLASS_Z + 0.005);
    rearGroup.add(flash);

    // A restrained personal mark in place of borrowed Apple branding. It only
    // catches the light on the back turn and disappears into the black glass.
    const backMarkTexture = createBackMarkTexture();
    if (backMarkTexture) {
      ownedTextures.push(backMarkTexture);
      const backMark = new THREE.Mesh(
        new THREE.PlaneGeometry(0.94, 0.35),
        new THREE.MeshStandardMaterial({
          map: backMarkTexture,
          color: 0xd4d9dc,
          metalness: 0.8,
          roughness: 0.3,
          envMapIntensity: 0.85,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
        }),
      );
      backMark.position.set(0, -0.15, GLASS_Z + 0.008);
      rearGroup.add(backMark);
    }

    // --- Band furniture -----------------------------------------------------
    // Left edge: mute switch above two round volume buttons.
    const mute = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.25, 0.15, 6, 0.045), steelButton);
    mute.position.set(-(PHONE_WIDTH / 2 + 0.032), 2.39, 0.01);
    phone.add(mute);
    const buttonWellMaterial = new THREE.MeshStandardMaterial({ color: 0x171a1d, metalness: 0.35, roughness: 0.56 });
    [1.64, 1.09].forEach((y) => {
      const well = new THREE.Mesh(new THREE.TorusGeometry(0.184, 0.011, 12, 64), buttonWellMaterial);
      well.rotation.y = Math.PI / 2;
      well.position.set(-(PHONE_WIDTH / 2 + 0.008), y, 0.02);
      phone.add(well);

      const volume = new THREE.Mesh(machinedButtonGeometry(0.19, 0.105), steelButton);
      volume.rotation.z = Math.PI / 2;
      volume.position.set(-(PHONE_WIDTH / 2 + 0.05), y, 0.02);
      phone.add(volume);
    });

    // Top edge: headphone jack, noise mic, and the sleep/wake button.
    const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.02, 40), matteBlack);
    jack.position.set(-1.28, PHONE_HEIGHT / 2 + 0.002, 0);
    phone.add(jack);
    const topMic = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.016, 24), matteBlack);
    topMic.position.set(-0.94, PHONE_HEIGHT / 2 + 0.002, 0);
    phone.add(topMic);
    const power = new THREE.Mesh(new RoundedBoxGeometry(0.54, 0.11, 0.21, 6, 0.052), steelButton);
    power.position.set(1.1, PHONE_HEIGHT / 2 + 0.032, 0.01);
    phone.add(power);

    // Bottom edge: 30-pin dock, pentalobe screws, speaker and mic grilles.
    const dock = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.05, 0.24, 2, 0.02), matteBlack);
    dock.position.set(0, -(PHONE_HEIGHT / 2 - 0.01), 0);
    phone.add(dock);
    [-0.75, 0.75].forEach((x) => {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.014, 20), steelButton);
      screw.position.set(x, -(PHONE_HEIGHT / 2 + 0.003), 0);
      phone.add(screw);
    });
    [-1, 1].forEach((side) => {
      for (let hole = 0; hole < 6; hole += 1) {
        const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.012, 16), matteBlack);
        grille.position.set(side * (0.93 + hole * 0.076), -(PHONE_HEIGHT / 2 + 0.002), 0);
        phone.add(grille);
      }
    });

    // Right edge: the micro-SIM tray seam.
    const simSeam = new THREE.Mesh(roundedFrameGeometry(0.115, 1, 0.055, 0.015, 0.006), new THREE.MeshStandardMaterial({ color: 0x54585c, metalness: 0.8, roughness: 0.4 }));
    simSeam.rotation.y = Math.PI / 2;
    simSeam.position.set(PHONE_WIDTH / 2 - 0.004, 0.75, 0.02);
    phone.add(simSeam);

    // --- Studio lighting ----------------------------------------------------
    // The environment does the heavy lifting; direct lights only shape form.
    scene.add(new THREE.HemisphereLight(0xd6e6f2, 0x0a0c0e, 0.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(-4.5, 6, 7.5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xbcd8ff, 1.8);
    rimLight.position.set(-5.5, 1.5, -6);
    scene.add(rimLight);
    const warmFill = new THREE.PointLight(0xffe4d4, 5, 18, 2);
    warmFill.position.set(4, -4.5, 4.5);
    scene.add(warmFill);

    let currentPose = poseAt(0);
    let pixelsPerUnit = 1;
    const applyPose = (pose: PhonePose) => {
      phone.rotation.set(pose.rotateX, pose.rotateY, pose.rotateZ, "XYZ");
      phone.position.set(pose.x, pose.y, pose.z);
      phone.scale.setScalar(pose.scale);
      rearGroup.visible = Math.cos(pose.rotateY) < 0;
      // The turn presents the left button rail. The far-side SIM seam is
      // physically hidden by the handset; without a solid display slab it can
      // otherwise project through the transparent screen aperture.
      simSeam.visible = pose.rotateY < 0.12;
      // The lower antenna break on that same far rail needs the same culling.
      // Otherwise its depth projects through the live DOM screen as a short
      // black line near the lower-right corner during the oblique turn.
      if (farSideAntennaGap) farSideAntennaGap.visible = pose.rotateY < 0.12;

      // CSS pixel space points y down, which mirrors rotations about X and Z.
      const x = pose.x * pixelsPerUnit;
      const y = -pose.y * pixelsPerUnit;
      const z = pose.z * pixelsPerUnit;
      const screenDepth = SCREEN_COMPOSITE_Z * pixelsPerUnit;
      const depthCompensation = 1 - SCREEN_COMPOSITE_Z / CAMERA_Z;
      product.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${-pose.rotateX}rad) rotateY(${pose.rotateY}rad) rotateZ(${-pose.rotateZ}rad) scale(${pose.scale}) translateZ(${screenDepth}px) scale(${depthCompensation})`;
      // The DOM front has backface-visibility:hidden, so it naturally disappears
      // while the 3D rear glass faces the camera and becomes the real display as
      // soon as the phone turns through profile.
      product.style.visibility = "visible";
    };

    const resize = () => {
      const hostWidth = host.clientWidth || 500;
      const hostHeight = host.clientHeight || 785;
      const stageHeight = stage.clientHeight || 785;
      renderer.setSize(hostWidth, hostHeight, false);
      camera.aspect = hostWidth / hostHeight;
      const perspective = stageHeight / (2 * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)));
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(hostHeight / (2 * perspective)));
      camera.updateProjectionMatrix();
      pixelsPerUnit = perspective / CAMERA_Z;
      stage.style.setProperty("--phone-perspective", `${perspective}px`);
      applyPose(currentPose);
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    let startedAt = 0;
    let introStarted = false;
    const render = (now: number) => {
      const progress = inspectionMs === null
        ? Math.min(1, (now - startedAt) / INTRO_MS)
        : inspectionMs / INTRO_MS;
      const eased = smoothstep5(progress);
      // The environment slides against the turn so one long highlight travels
      // down the band and across the glass — the classic product-spot sweep.
      scene.environmentRotation.y = THREE.MathUtils.lerp(0.9, -0.35, eased);
      keyLight.position.x = THREE.MathUtils.lerp(-6.4, -4.2, eased);
      // Let the hero frame settle into true black glass. The key is strongest
      // across the turn, then slips off-axis instead of flattening the face.
      keyLight.intensity = THREE.MathUtils.lerp(1.6, 0.68, eased);
      warmFill.intensity = THREE.MathUtils.lerp(5, 2.2, eased);
      currentPose = poseAt(progress);
      applyPose(currentPose);
      renderer.render(scene, camera);
      if (inspectionMs !== null && progress < 1) return;
      if (progress < 1) frame = window.requestAnimationFrame(render);
      else {
        // Keep the screen at the same physical glass depth after handoff; a
        // transform reset here caused a subtle final-frame size jump.
        applyPose(poseAt(1));
        renderer.render(scene, camera);
        document.documentElement.classList.add("phone-3d-complete");
      }
    };
    startIntro = () => {
      if (!modelActive || introStarted || !caseTextureReady) return;
      introStarted = true;
      resize();
      // Reveal only after the model and the case artwork have both produced a
      // complete WebGL frame. Animation time begins here as well, so waiting
      // for the case texture never skips or compresses the opening frames.
      document.documentElement.classList.add("phone-3d-ready");
      document.documentElement.classList.remove("phone-3d-complete", "phone-intro-pending");
      startedAt = performance.now();
      frame = window.requestAnimationFrame(render);
    };
    startIntro();

    return () => {
      modelActive = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      product.style.removeProperty("transform");
      product.style.removeProperty("visibility");
      stage.style.removeProperty("--phone-perspective");
      document.documentElement.classList.remove("phone-3d-ready");
      document.documentElement.classList.remove("phone-3d-complete");
      document.documentElement.classList.remove("phone-intro-pending");
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      ownedTextures.forEach((texture) => texture.dispose());
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [productRef]);

  return <div ref={hostRef} className="phone-3d-intro" aria-hidden="true" />;
}
