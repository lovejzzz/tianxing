"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const INTRO_MS = 3000;
const CAMERA_Z = 13.263;
const PHONE_WIDTH = 3.91;
const PHONE_HEIGHT = 7.02;
const PHONE_DEPTH = 0.62;
const SCREEN_WIDTH = 3.492;
const SCREEN_HEIGHT = 5.437;

function smoothstep5(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

type PhonePose = {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  x: number;
  z: number;
  scale: number;
};

function poseAt(progress: number): PhonePose {
  const eased = smoothstep5(progress);
  return {
    rotateY: THREE.MathUtils.lerp(-Math.PI * 0.87, 0, eased),
    rotateX: THREE.MathUtils.lerp(-0.085, 0, eased),
    rotateZ: THREE.MathUtils.lerp(0.012, 0, eased),
    x: THREE.MathUtils.lerp(0.66, 0, eased),
    z: THREE.MathUtils.lerp(-0.7, 0, eased),
    scale: THREE.MathUtils.lerp(0.91, 1, eased),
  };
}

export function Phone3DIntro({ productRef }: { productRef: RefObject<HTMLDivElement | null> }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const product = productRef.current;
    const stage = host?.parentElement;
    if (!host || !product || !stage || window.matchMedia("(max-width: 560px), (prefers-reduced-motion: reduce)").matches) return;

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
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, CAMERA_Z);

    const phone = new THREE.Group();
    scene.add(phone);

    const metal = new THREE.MeshPhysicalMaterial({
      color: 0xa6acb0,
      metalness: 1,
      roughness: 0.18,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
    });
    const bezel = new THREE.MeshPhysicalMaterial({
      color: 0x060708,
      metalness: 0.22,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.045,
    });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x171a1d, metalness: 0.94, roughness: 0.2 });
    const black = new THREE.MeshStandardMaterial({ color: 0x020304, metalness: 0.22, roughness: 0.16 });

    // Four physical rails leave a true transparent aperture. The live React screen
    // sits behind that opening from frame one, so there is never a second phone.
    const sideWidth = (PHONE_WIDTH - SCREEN_WIDTH) / 2;
    const endHeight = (PHONE_HEIGHT - SCREEN_HEIGHT) / 2;
    const addRail = (geometry: RoundedBoxGeometry, x: number, y: number, material: THREE.Material) => {
      const rail = new THREE.Mesh(geometry, material);
      rail.position.set(x, y, 0);
      phone.add(rail);
      return rail;
    };
    addRail(new RoundedBoxGeometry(sideWidth + 0.045, PHONE_HEIGHT - 0.28, PHONE_DEPTH, 7, 0.09), -(SCREEN_WIDTH + sideWidth) / 2, 0, metal);
    addRail(new RoundedBoxGeometry(sideWidth + 0.045, PHONE_HEIGHT - 0.28, PHONE_DEPTH, 7, 0.09), (SCREEN_WIDTH + sideWidth) / 2, 0, metal);
    addRail(new RoundedBoxGeometry(PHONE_WIDTH, endHeight + 0.09, PHONE_DEPTH, 8, 0.2), 0, (SCREEN_HEIGHT + endHeight) / 2, metal);
    addRail(new RoundedBoxGeometry(PHONE_WIDTH, endHeight + 0.09, PHONE_DEPTH, 8, 0.2), 0, -(SCREEN_HEIGHT + endHeight) / 2, metal);

    // A slightly inset glossy black bezel gives the front its iPhone 4 depth while
    // preserving the exact 386 x 601 CSS-screen opening.
    const bezelDepth = 0.09;
    const bezelZ = PHONE_DEPTH / 2 + 0.015;
    const bezelSide = sideWidth + 0.014;
    const bezelEnd = endHeight + 0.014;
    const bezelRails = [
      [new RoundedBoxGeometry(bezelSide, PHONE_HEIGHT - 0.22, bezelDepth, 6, 0.075), -(SCREEN_WIDTH + bezelSide) / 2, 0],
      [new RoundedBoxGeometry(bezelSide, PHONE_HEIGHT - 0.22, bezelDepth, 6, 0.075), (SCREEN_WIDTH + bezelSide) / 2, 0],
      [new RoundedBoxGeometry(PHONE_WIDTH - 0.08, bezelEnd, bezelDepth, 7, 0.16), 0, (SCREEN_HEIGHT + bezelEnd) / 2],
      [new RoundedBoxGeometry(PHONE_WIDTH - 0.08, bezelEnd, bezelDepth, 7, 0.16), 0, -(SCREEN_HEIGHT + bezelEnd) / 2],
    ] as const;
    bezelRails.forEach(([geometry, x, y]) => {
      const rail = addRail(geometry, x, y, bezel);
      rail.position.z = bezelZ;
    });

    const screenGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT),
      new THREE.MeshPhysicalMaterial({
        color: 0xa8d4ec,
        transparent: true,
        opacity: 0.055,
        metalness: 0,
        roughness: 0.035,
        clearcoat: 1,
        clearcoatRoughness: 0.025,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    );
    screenGlass.position.z = PHONE_DEPTH / 2 + 0.068;
    phone.add(screenGlass);

    const speaker = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.075, 0.045, 3, 0.035), black);
    speaker.position.set(0, 2.99, PHONE_DEPTH / 2 + 0.092);
    phone.add(speaker);
    const frontCamera = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), black);
    frontCamera.position.set(-0.58, 2.99, PHONE_DEPTH / 2 + 0.102);
    phone.add(frontCamera);
    const homeButton = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.046, 48), black);
    homeButton.rotation.x = Math.PI / 2;
    homeButton.position.set(0, -3.02, PHONE_DEPTH / 2 + 0.098);
    phone.add(homeButton);
    const homeGlyph = new THREE.Mesh(
      new RoundedBoxGeometry(0.12, 0.12, 0.018, 3, 0.026),
      new THREE.MeshStandardMaterial({ color: 0x74787b, metalness: 0.55, roughness: 0.25 }),
    );
    homeGlyph.position.set(0, -3.02, PHONE_DEPTH / 2 + 0.132);
    phone.add(homeGlyph);

    // The rear face is culled while the front is visible. This gives the DOM screen
    // genuine occlusion on the back half of the rotation without painting over it at rest.
    const rearGroup = new THREE.Group();
    rearGroup.rotation.y = Math.PI;
    rearGroup.position.z = -PHONE_DEPTH / 2 - 0.035;
    phone.add(rearGroup);
    const rearPanel = new THREE.Mesh(
      new RoundedBoxGeometry(PHONE_WIDTH - 0.13, PHONE_HEIGHT - 0.13, 0.08, 8, 0.19),
      new THREE.MeshPhysicalMaterial({ color: 0x030405, metalness: 0.25, roughness: 0.075, clearcoat: 1, clearcoatRoughness: 0.045 }),
    );
    rearGroup.add(rearPanel);
    const rearCamera = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 48), black);
    rearCamera.rotation.x = Math.PI / 2;
    rearCamera.position.set(1.43, 2.72, 0.09);
    rearGroup.add(rearCamera);
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.086, 48),
      new THREE.MeshPhysicalMaterial({ color: 0x071725, metalness: 0.42, roughness: 0.07, clearcoat: 1 }),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(1.43, 2.72, 0.135);
    rearGroup.add(lens);
    const flash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.085, 32),
      new THREE.MeshStandardMaterial({ color: 0xf0edcf, emissive: 0x625f48, emissiveIntensity: 0.45, roughness: 0.22 }),
    );
    flash.rotation.x = Math.PI / 2;
    flash.position.set(1.12, 2.72, 0.13);
    rearGroup.add(flash);

    const addSideButton = (y: number, buttonHeight: number) => {
      const button = new THREE.Mesh(new RoundedBoxGeometry(0.07, buttonHeight, 0.22, 3, 0.025), darkMetal);
      button.position.set(-PHONE_WIDTH / 2 - 0.035, y, 0.02);
      phone.add(button);
    };
    addSideButton(1.6, 0.33);
    addSideButton(1.05, 0.33);
    addSideButton(2.15, 0.2);
    const powerButton = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.07, 0.2, 3, 0.025), darkMetal);
    powerButton.position.set(1.12, PHONE_HEIGHT / 2 + 0.035, 0.02);
    phone.add(powerButton);

    const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x050607, metalness: 0.35, roughness: 0.34 });
    [-2.34, 2.34].forEach((y) => {
      [-1, 1].forEach((side) => {
        const seam = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.09, PHONE_DEPTH + 0.018, 2, 0.02), seamMaterial);
        seam.position.set(side * (PHONE_WIDTH / 2 + 0.012), y, 0);
        phone.add(seam);
      });
    });

    scene.add(new THREE.HemisphereLight(0xcde3f4, 0x080a0c, 1.45));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
    keyLight.position.set(-4.5, 5.5, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x8ed4ff, 5.2);
    rimLight.position.set(5, 1.5, -5);
    scene.add(rimLight);
    const lowLight = new THREE.PointLight(0xffd6be, 25, 16, 2);
    lowLight.position.set(-4, -4, 4);
    scene.add(lowLight);

    let currentPose = poseAt(0);
    let pixelsPerUnit = 1;
    const applyPose = (pose: PhonePose) => {
      phone.rotation.set(pose.rotateX, pose.rotateY, pose.rotateZ, "XYZ");
      phone.position.set(pose.x, 0, pose.z);
      phone.scale.setScalar(pose.scale);
      rearGroup.visible = Math.cos(pose.rotateY) < 0;

      const x = pose.x * pixelsPerUnit;
      const z = pose.z * pixelsPerUnit;
      product.style.transform = `translate3d(${x}px, 0, ${z}px) rotateX(${pose.rotateX}rad) rotateY(${pose.rotateY}rad) rotateZ(${pose.rotateZ}rad) scale(${pose.scale})`;
      product.style.visibility = Math.cos(pose.rotateY) > 0 ? "visible" : "hidden";
    };

    const resize = () => {
      const hostWidth = host.clientWidth || 500;
      const hostHeight = host.clientHeight || 785;
      renderer.setSize(hostWidth, hostHeight, false);
      camera.aspect = hostWidth / hostHeight;
      camera.updateProjectionMatrix();
      const perspective = hostHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      pixelsPerUnit = perspective / CAMERA_Z;
      stage.style.setProperty("--phone-perspective", `${perspective}px`);
      applyPose(currentPose);
      renderer.render(scene, camera);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    const startedAt = performance.now();
    const render = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / INTRO_MS);
      currentPose = poseAt(progress);
      applyPose(currentPose);
      renderer.render(scene, camera);
      if (progress < 1) frame = window.requestAnimationFrame(render);
      else {
        product.style.transform = "none";
        product.style.visibility = "visible";
        document.documentElement.classList.add("phone-3d-complete");
      }
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      product.style.removeProperty("transform");
      product.style.removeProperty("visibility");
      stage.style.removeProperty("--phone-perspective");
      document.documentElement.classList.remove("phone-3d-ready");
      document.documentElement.classList.remove("phone-3d-complete");
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [productRef]);

  return <div ref={hostRef} className="phone-3d-intro" aria-hidden="true" />;
}
