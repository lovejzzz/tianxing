"use client";

import { useEffect, useRef, useState } from "react";

type ImpactDetail = {
  phoneLeft: number;
  phoneWidth: number;
  delay: number;
  duration: number;
};

type FluidParticle = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  hitAt: number;
  phase: number;
  color: string;
};

const IMPACT_EVENT = "tian:immersive-home";

export function FluidHeartNote() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [fluidActive, setFluidActive] = useState(false);
  const [fluidComplete, setFluidComplete] = useState(false);

  useEffect(() => {
    const handleImpact = (event: Event) => {
      const detail = (event as CustomEvent<ImpactDetail>).detail;
      const root = rootRef.current;
      const canvas = canvasRef.current;
      if (!root || !canvas || window.innerWidth <= 960) {
        setFluidComplete(true);
        return;
      }

      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const offscreen = document.createElement("canvas");
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const source = offscreen.getContext("2d", { willReadFrequently: true });
      const target = canvas.getContext("2d");
      if (!source || !target) return;
      source.scale(dpr, dpr);

      const lines = Array.from(root.querySelectorAll<HTMLElement>("[data-fluid-line]"));
      for (const line of lines) {
        const rect = line.getBoundingClientRect();
        const style = getComputedStyle(line);
        source.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        source.textBaseline = "top";
        source.fillStyle = style.color;
        source.fillText(line.textContent ?? "", rect.left, rect.top - 1);
      }

      const bounds = root.getBoundingClientRect();
      const left = Math.max(0, Math.floor((bounds.left - 8) * dpr));
      const top = Math.max(0, Math.floor((bounds.top - 8) * dpr));
      const right = Math.min(offscreen.width, Math.ceil((bounds.right + 8) * dpr));
      const bottom = Math.min(offscreen.height, Math.ceil((bounds.bottom + 8) * dpr));
      const pixels = source.getImageData(left, top, right - left, bottom - top);
      const particles: FluidParticle[] = [];
      const step = Math.max(3, Math.round(3 * dpr));
      const textLeft = bounds.left;
      const textRight = bounds.right;

      for (let sy = 0; sy < pixels.height; sy += step) {
        for (let sx = 0; sx < pixels.width; sx += step) {
          const index = (sy * pixels.width + sx) * 4;
          const alpha = pixels.data[index + 3] / 255;
          if (alpha < .24) continue;
          const x = (left + sx) / dpr;
          const y = (top + sy) / dpr;
          const fromRight = (textRight - x) / Math.max(1, textRight - textLeft);
          particles.push({
            x,
            y,
            px: x,
            py: y,
            vx: 0,
            vy: 0,
            radius: 1.25 + Math.random() * .95,
            alpha,
            hitAt: .46 + fromRight * .34 + Math.random() * .03,
            phase: Math.random() * Math.PI * 2,
            color: `rgb(${pixels.data[index]},${pixels.data[index + 1]},${pixels.data[index + 2]})`,
          });
        }
      }

      setFluidActive(true);
      const started = performance.now();
      const total = detail.delay + detail.duration;
      const phoneStart = detail.phoneLeft;
      const phoneEnd = width / 2 - detail.phoneWidth / 2;
      const textMiddleY = bounds.top + bounds.height * .43;

      const ease = (value: number) => {
        const clamped = Math.min(1, Math.max(0, value));
        return clamped * clamped * (3 - 2 * clamped);
      };
      const frame = (now: number) => {
        const elapsed = now - started;
        const progress = Math.min(1, Math.max(0, (elapsed - detail.delay) / detail.duration));
        const eased = ease(progress);
        const phoneEdge = phoneStart + (phoneEnd - phoneStart) * eased;

        target.setTransform(dpr, 0, 0, dpr, 0, 0);
        target.clearRect(0, 0, width, height);
        target.lineCap = "round";

        const collisionProgress = Math.max(0, (progress - .22) / .78);
        if (collisionProgress > 0 && collisionProgress < 1) {
          const rippleX = Math.min(textRight + 20, phoneEdge - 22);
          for (let ring = 0; ring < 3; ring += 1) {
            const radius = Math.max(0, (collisionProgress * 190) - ring * 34);
            if (!radius) continue;
            target.beginPath();
            target.strokeStyle = `rgba(135,196,232,${Math.max(0, .13 - collisionProgress * .11)})`;
            target.lineWidth = 1.4;
            target.ellipse(rippleX, textMiddleY, radius * 1.2, radius * .52, 0, 0, Math.PI * 2);
            target.stroke();
          }
        }

        for (const particle of particles) {
          particle.px = particle.x;
          particle.py = particle.y;
          if (progress >= particle.hitAt) {
            if (particle.vx === 0 && particle.vy === 0) {
              const vertical = (particle.y - textMiddleY) / Math.max(28, bounds.height * .5);
              const impactStrength = 2.2 + Math.random() * 2.8;
              particle.vx = -impactStrength * (.72 + (1 - particle.hitAt) * .65);
              particle.vy = vertical * (1.6 + Math.random() * 2.1) + (Math.random() - .5) * 1.25;
            }
            const turbulence = Math.sin(elapsed * .018 + particle.phase) * .055;
            particle.vx = particle.vx * .974 - .012;
            particle.vy = particle.vy * .968 + turbulence + .014;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha *= progress > .79 ? .925 : .982;
          } else {
            particle.x += Math.sin(elapsed * .012 + particle.phase) * .018 * collisionProgress;
          }

          if (particle.alpha < .018) continue;
          target.globalAlpha = particle.alpha * Math.max(0, 1 - Math.max(0, progress - .86) / .14);
          target.strokeStyle = particle.color;
          target.lineWidth = particle.radius * 1.15;
          target.beginPath();
          target.moveTo(particle.px, particle.py);
          target.lineTo(particle.x, particle.y);
          target.stroke();
          target.fillStyle = particle.color;
          target.beginPath();
          target.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          target.fill();
        }
        target.globalAlpha = 1;

        if (elapsed < total) {
          animationRef.current = requestAnimationFrame(frame);
        } else {
          target.clearRect(0, 0, width, height);
          setFluidComplete(true);
          animationRef.current = null;
        }
      };
      animationRef.current = requestAnimationFrame(frame);
    };

    window.addEventListener(IMPACT_EVENT, handleImpact);
    return () => {
      window.removeEventListener(IMPACT_EVENT, handleImpact);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`heart-note ${fluidActive ? "is-fluid-active" : ""} ${fluidComplete ? "is-fluid-complete" : ""}`}
    >
      <p className="heart-copy" aria-label="Welcome to my heart. Have fun. — Tian Xing">
        <span className="heart-line" data-fluid-line>Welcome to my</span>
        <span className="heart-line" data-fluid-line>heart. Have fun.</span>
        <span className="heart-signature" data-fluid-line>— Tian Xing</span>
      </p>
      <canvas ref={canvasRef} className="heart-fluid-canvas" aria-hidden="true" />
    </div>
  );
}
