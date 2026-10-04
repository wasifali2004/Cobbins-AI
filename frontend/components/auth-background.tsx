"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;
  varying vec2 vUv;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_color;

  float random(vec2 value) {
    return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 pixels = vUv * u_resolution;
    float size = 20.0;
    vec2 cell = floor(pixels / size);
    vec2 local = fract(pixels / size) - 0.5;
    float seed = random(cell);
    float pulse = 0.32 + 0.52 * sin(u_time * 0.42 + seed * 6.2831);
    float distanceFromCenter = length((vUv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0));
    float vignette = smoothstep(0.82, 0.05, distanceFromCenter);
    float dot = smoothstep(0.17, 0.10, length(local));
    float alpha = dot * (0.24 + seed * 0.52) * pulse * vignette;
    gl_FragColor = vec4(u_color, alpha);
  }
`;

function themeColor() {
  const dark = document.documentElement.dataset.theme === "dark";
  return new THREE.Color(dark ? "#f6f3ec" : "#6f3916");
}

export function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      u_resolution: { value: new THREE.Vector2(1, 1) },
      u_time: { value: 0 },
      u_color: { value: themeColor() },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Size to the canvas's own container (the logo stage), not the window —
    // this canvas no longer covers the full viewport, it's centered behind
    // just the logo, so the shader's own center/vignette math needs to match
    // that smaller box rather than the whole screen.
    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      uniforms.u_resolution.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      uniforms.u_color.value.copy(themeColor());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    let frame = 0;
    const draw = () => {
      uniforms.u_time.value = reducedMotion ? 1 : (performance.now() - startedAt) / 1000;
      renderer.render(scene, camera);
      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
    };
    draw();

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.cancelAnimationFrame(frame);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="auth-canvas" aria-hidden />;
}
