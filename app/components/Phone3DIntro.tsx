"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const PROJECT_ICONS = [
  "edutool",
  "surge-method",
  "bebop-puzzle",
  "quicky-resume",
  "5279-emulsion",
  "start-where-you-are",
  "texas-jack",
  "slotronome",
  "here-we-go-film-studio",
];

const INTRO_MS = 2800;

function smoothstep5(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function makeHeaderTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const status = context.createLinearGradient(0, 0, 0, 34);
  status.addColorStop(0, "#31495d");
  status.addColorStop(1, "#12283a");
  context.fillStyle = status;
  context.fillRect(0, 0, 512, 34);
  const title = context.createLinearGradient(0, 34, 0, 128);
  title.addColorStop(0, "#7e9ab0");
  title.addColorStop(0.5, "#3d607c");
  title.addColorStop(0.51, "#294961");
  title.addColorStop(1, "#426b88");
  context.fillStyle = title;
  context.fillRect(0, 34, 512, 94);
  context.fillStyle = "rgba(255,255,255,.94)";
  context.font = "700 24px Helvetica, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("9:41 PM", 256, 25);
  context.font = "700 34px Helvetica, Arial, sans-serif";
  context.fillText("Fun", 256, 93);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function Phone3DIntro() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || window.matchMedia("(max-width: 560px), (prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }

    document.documentElement.classList.add("phone-3d-ready");
    document.documentElement.classList.remove("phone-3d-complete");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 13.4);

    const phone = new THREE.Group();
    scene.add(phone);

    const width = 3.9;
    const height = 7.03;
    const depth = 0.62;
    const metal = new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 1, roughness: 0.2 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x171a1d, metalness: 0.92, roughness: 0.22 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x050607, metalness: 0.28, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.06 });
    const black = new THREE.MeshStandardMaterial({ color: 0x030405, metalness: 0.2, roughness: 0.18 });

    const chassis = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 8, 0.2), metal);
    phone.add(chassis);

    const insetWidth = width - 0.13;
    const insetHeight = height - 0.13;
    const frontGlass = new THREE.Mesh(new RoundedBoxGeometry(insetWidth, insetHeight, 0.08, 8, 0.19), glass);
    frontGlass.position.z = depth / 2 + 0.035;
    phone.add(frontGlass);
    const backGlass = frontGlass.clone();
    backGlass.position.z = -depth / 2 - 0.035;
    phone.add(backGlass);

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const loader = new THREE.TextureLoader();
    const wallpaper = loader.load(`${base}/media/ios4/water-drops.png`);
    wallpaper.colorSpace = THREE.SRGBColorSpace;
    wallpaper.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.36, 5.38),
      new THREE.MeshStandardMaterial({ map: wallpaper, roughness: 0.32, metalness: 0.03 }),
    );
    screen.position.set(0, 0.02, depth / 2 + 0.082);
    phone.add(screen);

    const headerTexture = makeHeaderTexture();
    if (headerTexture) {
      const header = new THREE.Mesh(
        new THREE.PlaneGeometry(3.36, 0.83),
        new THREE.MeshBasicMaterial({ map: headerTexture, transparent: true }),
      );
      header.position.set(0, 2.295, depth / 2 + 0.09);
      phone.add(header);
    }

    PROJECT_ICONS.forEach((slug, index) => {
      const texture = loader.load(`${base}/art/work-icons/${slug}.png`);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const icon = new THREE.Mesh(
        new RoundedBoxGeometry(0.62, 0.62, 0.045, 5, 0.13),
        new THREE.MeshBasicMaterial({ map: texture }),
      );
      const column = index % 3;
      const row = Math.floor(index / 3);
      icon.position.set((column - 1) * 1.03, 1.35 - row * 1.08, depth / 2 + 0.112);
      phone.add(icon);
    });

    const speaker = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.075, 0.045, 3, 0.035), black);
    speaker.position.set(0, 2.99, depth / 2 + 0.12);
    phone.add(speaker);
    const frontCamera = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), black);
    frontCamera.position.set(-0.58, 2.99, depth / 2 + 0.13);
    phone.add(frontCamera);
    const homeButton = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.045, 48), black);
    homeButton.rotation.x = Math.PI / 2;
    homeButton.position.set(0, -3.02, depth / 2 + 0.12);
    phone.add(homeButton);

    const rearCamera = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 48), black);
    rearCamera.rotation.x = Math.PI / 2;
    rearCamera.position.set(-1.43, 2.72, -depth / 2 - 0.11);
    phone.add(rearCamera);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.086, 48), new THREE.MeshPhysicalMaterial({ color: 0x071725, metalness: 0.4, roughness: 0.08, clearcoat: 1 }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(-1.43, 2.72, -depth / 2 - 0.155);
    phone.add(lens);
    const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.085, 32), new THREE.MeshStandardMaterial({ color: 0xf0edcf, emissive: 0x625f48, emissiveIntensity: 0.45, roughness: 0.22 }));
    flash.rotation.x = Math.PI / 2;
    flash.position.set(-1.12, 2.72, -depth / 2 - 0.145);
    phone.add(flash);

    const addSideButton = (y: number, buttonHeight: number) => {
      const button = new THREE.Mesh(new RoundedBoxGeometry(0.07, buttonHeight, 0.22, 3, 0.025), darkMetal);
      button.position.set(-width / 2 - 0.035, y, 0.02);
      phone.add(button);
    };
    addSideButton(1.6, 0.33);
    addSideButton(1.05, 0.33);
    addSideButton(2.15, 0.2);
    const powerButton = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.07, 0.2, 3, 0.025), darkMetal);
    powerButton.position.set(1.12, height / 2 + 0.035, 0.02);
    phone.add(powerButton);

    // The iPhone 4's exposed steel antenna frame is broken by visible black seams.
    // Modeling them as geometry keeps the side silhouette readable at exactly 90°.
    const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x050607, metalness: 0.35, roughness: 0.34 });
    [-2.34, 2.34].forEach((y) => {
      [-1, 1].forEach((side) => {
        const seam = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.09, depth + 0.018, 2, 0.02), seamMaterial);
        seam.position.set(side * (width / 2 + 0.012), y, 0);
        phone.add(seam);
      });
    });

    scene.add(new THREE.HemisphereLight(0xbfdcff, 0x090b0d, 1.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(-4.5, 5.5, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x9bd8ff, 4.8);
    rimLight.position.set(5, 1.5, -5);
    scene.add(rimLight);
    const lowLight = new THREE.PointLight(0xffd6be, 28, 16, 2);
    lowLight.position.set(-4, -4, 4);
    scene.add(lowLight);

    const resize = () => {
      const hostWidth = host.clientWidth || 500;
      const hostHeight = host.clientHeight || 785;
      renderer.setSize(hostWidth, hostHeight, false);
      camera.aspect = hostWidth / hostHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    const startedAt = performance.now();
    const render = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / INTRO_MS);
      const eased = smoothstep5(progress);
      phone.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.87, 0, eased);
      phone.rotation.x = THREE.MathUtils.lerp(-0.085, 0, eased);
      phone.rotation.z = THREE.MathUtils.lerp(0.012, 0, eased);
      phone.position.x = THREE.MathUtils.lerp(0.66, 0, eased);
      phone.position.z = THREE.MathUtils.lerp(-0.7, 0, eased);
      const scale = THREE.MathUtils.lerp(0.91, 1, eased);
      phone.scale.setScalar(scale);
      renderer.render(scene, camera);
      if (progress < 1) frame = window.requestAnimationFrame(render);
      else {
        document.documentElement.classList.add("phone-3d-complete");
        host.style.visibility = "hidden";
      }
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.documentElement.classList.remove("phone-3d-ready");
      document.documentElement.classList.remove("phone-3d-complete");
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          const mapped = material as THREE.Material & { map?: THREE.Texture | null };
          mapped.map?.dispose();
          material.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="phone-3d-intro" aria-hidden="true" />;
}
