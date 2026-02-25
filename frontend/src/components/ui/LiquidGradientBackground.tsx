'use client';

import { useEffect, useRef, useState } from 'react';
import type { Texture as ThreeTexture } from 'three';

/**
 * LiquidGradientBackground — WebGL shader-driven animated gradient.
 *
 * Reference code: Cameron Knight's "Interactive Liquid Gradient" CodePen
 * (codepen.io/cameronknight/pen/ogxWmBP).
 * Ported to React/Next.js as a login-only background component.
 *
 * Removed from the original: color-adjust UI, custom cursor, heading,
 * scheme buttons. Kept: shader, touch/mouse distortion, animation loop.
 *
 * - Canvas is pointer-events:none so login form stays interactive.
 * - Pointer movement captured on window and fed to TouchTexture.
 * - Respects prefers-reduced-motion: renders a static CSS gradient fallback.
 * - Fully disposes Three.js resources on unmount (no leaks).
 */

// ---------------------------------------------------------------------------
// Touch Texture — offscreen canvas that captures pointer movement as a texture
// ---------------------------------------------------------------------------
class TouchTexture {
  size = 64;
  width = 64;
  height = 64;
  maxAge = 64;
  radius: number;
  speed: number;
  trail: { x: number; y: number; age: number; force: number; vx: number; vy: number }[] = [];
  last: { x: number; y: number } | null = null;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  texture!: ThreeTexture;

  constructor(THREE: typeof import('three')) {
    this.radius = 0.25 * this.size;
    this.speed = 1 / this.maxAge;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.width, this.height);
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const pt = this.trail[i];
      const f = pt.force * this.speed * (1 - pt.age / this.maxAge);
      pt.x += pt.vx * f;
      pt.y += pt.vy * f;
      pt.age++;
      if (pt.age > this.maxAge) {
        this.trail.splice(i, 1);
      } else {
        this.drawPoint(pt);
      }
    }
    this.texture.needsUpdate = true;
  }

  addTouch(point: { x: number; y: number }) {
    let force = 0, vx = 0, vy = 0;
    if (this.last) {
      const dx = point.x - this.last.x;
      const dy = point.y - this.last.y;
      if (dx === 0 && dy === 0) return;
      const d = Math.sqrt(dx * dx + dy * dy);
      vx = dx / d;
      vy = dy / d;
      force = Math.min((dx * dx + dy * dy) * 20000, 2.0);
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  private drawPoint(pt: typeof this.trail[0]) {
    const pos = { x: pt.x * this.width, y: (1 - pt.y) * this.height };
    let intensity: number;
    if (pt.age < this.maxAge * 0.3) {
      intensity = Math.sin((pt.age / (this.maxAge * 0.3)) * (Math.PI / 2));
    } else {
      const t = 1 - (pt.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
      intensity = -t * (t - 2);
    }
    intensity *= pt.force;
    const color = `${((pt.vx + 1) / 2) * 255}, ${((pt.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = this.size * 5;
    this.ctx.shadowOffsetX = offset;
    this.ctx.shadowOffsetY = offset;
    this.ctx.shadowBlur = this.radius;
    this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(255,0,0,1)';
    this.ctx.arc(pos.x - offset, pos.y - offset, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------
const vertexShader = `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec3  uColor1;
  uniform vec3  uColor2;
  uniform vec3  uColor3;
  uniform vec3  uColor4;
  uniform vec3  uColor5;
  uniform vec3  uColor6;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform sampler2D uTouchTexture;
  uniform float uGrainIntensity;
  uniform vec3  uDarkNavy;
  uniform float uGradientSize;
  uniform float uColor1Weight;
  uniform float uColor2Weight;

  varying vec2 vUv;

  float grain(vec2 uv, float time) {
    vec2 g = uv * uResolution * 0.5;
    return fract(sin(dot(g + time, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
  }

  vec3 getGradientColor(vec2 uv, float time) {
    float r = uGradientSize;

    vec2 c1  = vec2(0.5 + sin(time*uSpeed*0.4)*0.4,  0.5 + cos(time*uSpeed*0.5)*0.4);
    vec2 c2  = vec2(0.5 + cos(time*uSpeed*0.6)*0.5,  0.5 + sin(time*uSpeed*0.45)*0.5);
    vec2 c3  = vec2(0.5 + sin(time*uSpeed*0.35)*0.45, 0.5 + cos(time*uSpeed*0.55)*0.45);
    vec2 c4  = vec2(0.5 + cos(time*uSpeed*0.5)*0.4,   0.5 + sin(time*uSpeed*0.4)*0.4);
    vec2 c5  = vec2(0.5 + sin(time*uSpeed*0.7)*0.35,  0.5 + cos(time*uSpeed*0.6)*0.35);
    vec2 c6  = vec2(0.5 + cos(time*uSpeed*0.45)*0.5,  0.5 + sin(time*uSpeed*0.65)*0.5);
    vec2 c7  = vec2(0.5 + sin(time*uSpeed*0.55)*0.38, 0.5 + cos(time*uSpeed*0.48)*0.42);
    vec2 c8  = vec2(0.5 + cos(time*uSpeed*0.65)*0.36, 0.5 + sin(time*uSpeed*0.52)*0.44);
    vec2 c9  = vec2(0.5 + sin(time*uSpeed*0.42)*0.41, 0.5 + cos(time*uSpeed*0.58)*0.39);
    vec2 c10 = vec2(0.5 + cos(time*uSpeed*0.48)*0.37, 0.5 + sin(time*uSpeed*0.62)*0.43);
    vec2 c11 = vec2(0.5 + sin(time*uSpeed*0.68)*0.33, 0.5 + cos(time*uSpeed*0.44)*0.46);
    vec2 c12 = vec2(0.5 + cos(time*uSpeed*0.38)*0.39, 0.5 + sin(time*uSpeed*0.56)*0.41);

    float i1  = 1.0 - smoothstep(0.0, r, length(uv - c1));
    float i2  = 1.0 - smoothstep(0.0, r, length(uv - c2));
    float i3  = 1.0 - smoothstep(0.0, r, length(uv - c3));
    float i4  = 1.0 - smoothstep(0.0, r, length(uv - c4));
    float i5  = 1.0 - smoothstep(0.0, r, length(uv - c5));
    float i6  = 1.0 - smoothstep(0.0, r, length(uv - c6));
    float i7  = 1.0 - smoothstep(0.0, r, length(uv - c7));
    float i8  = 1.0 - smoothstep(0.0, r, length(uv - c8));
    float i9  = 1.0 - smoothstep(0.0, r, length(uv - c9));
    float i10 = 1.0 - smoothstep(0.0, r, length(uv - c10));
    float i11 = 1.0 - smoothstep(0.0, r, length(uv - c11));
    float i12 = 1.0 - smoothstep(0.0, r, length(uv - c12));

    // Rotation layers for depth
    vec2 r1 = uv - 0.5;
    float a1 = time * uSpeed * 0.15;
    r1 = vec2(r1.x*cos(a1) - r1.y*sin(a1), r1.x*sin(a1) + r1.y*cos(a1)) + 0.5;
    vec2 r2 = uv - 0.5;
    float a2 = -time * uSpeed * 0.12;
    r2 = vec2(r2.x*cos(a2) - r2.y*sin(a2), r2.x*sin(a2) + r2.y*cos(a2)) + 0.5;

    float ri1 = 1.0 - smoothstep(0.0, 0.8, length(r1 - 0.5));
    float ri2 = 1.0 - smoothstep(0.0, 0.8, length(r2 - 0.5));

    vec3 color = vec3(0.0);
    color += uColor1 * i1  * (0.55 + 0.45*sin(time*uSpeed))       * uColor1Weight;
    color += uColor2 * i2  * (0.55 + 0.45*cos(time*uSpeed*1.2))   * uColor2Weight;
    color += uColor3 * i3  * (0.55 + 0.45*sin(time*uSpeed*0.8))   * uColor1Weight;
    color += uColor4 * i4  * (0.55 + 0.45*cos(time*uSpeed*1.3))   * uColor2Weight;
    color += uColor5 * i5  * (0.55 + 0.45*sin(time*uSpeed*1.1))   * uColor1Weight;
    color += uColor6 * i6  * (0.55 + 0.45*cos(time*uSpeed*0.9))   * uColor2Weight;
    // Extra gradient centers
    color += uColor1 * i7  * (0.55 + 0.45*sin(time*uSpeed*1.4))   * uColor1Weight;
    color += uColor2 * i8  * (0.55 + 0.45*cos(time*uSpeed*1.5))   * uColor2Weight;
    color += uColor3 * i9  * (0.55 + 0.45*sin(time*uSpeed*1.6))   * uColor1Weight;
    color += uColor4 * i10 * (0.55 + 0.45*cos(time*uSpeed*1.7))   * uColor2Weight;
    color += uColor5 * i11 * (0.55 + 0.45*sin(time*uSpeed*1.8))   * uColor1Weight;
    color += uColor6 * i12 * (0.55 + 0.45*cos(time*uSpeed*1.9))   * uColor2Weight;

    // Radial overlays
    color += mix(uColor1, uColor3, ri1) * 0.45 * uColor1Weight;
    color += mix(uColor2, uColor4, ri2) * 0.4  * uColor2Weight;

    color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;

    // Saturation boost
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(lum), color, 1.35);
    color = pow(color, vec3(0.92));

    // Navy base in dark areas
    float br = length(color);
    color = mix(uDarkNavy, color, max(br * 1.2, 0.15));

    float maxB = 1.0;
    float b = length(color);
    if (b > maxB) color *= maxB / b;
    return color;
  }

  void main() {
    vec2 uv = vUv;

    // Touch distortion
    vec4 tt = texture2D(uTouchTexture, uv);
    float vx = -(tt.r * 2.0 - 1.0);
    float vy = -(tt.g * 2.0 - 1.0);
    float ti = tt.b;
    uv.x += vx * 0.8 * ti;
    uv.y += vy * 0.8 * ti;

    // Ripple + wave
    float dist = length(uv - vec2(0.5));
    float ripple = sin(dist*20.0 - uTime*3.0) * 0.04 * ti;
    float wave   = sin(dist*15.0 - uTime*2.0) * 0.03 * ti;
    uv += vec2(ripple + wave);

    vec3 color = getGradientColor(uv, uTime);

    // Film grain
    color += grain(uv, uTime) * uGrainIntensity;

    // Subtle colour shift
    float ts = uTime * 0.5;
    color.r += sin(ts)      * 0.02;
    color.g += cos(ts*1.4)  * 0.02;
    color.b += sin(ts*1.2)  * 0.02;

    // Navy floor
    float br2 = length(color);
    color = mix(uDarkNavy, color, max(br2*1.2, 0.15));
    color = clamp(color, vec3(0.0), vec3(1.0));

    float maxB = 1.0;
    float b = length(color);
    if (b > maxB) color *= maxB / b;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// React Component
// ---------------------------------------------------------------------------
export function LiquidGradientBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [usesFallback, setUsesFallback] = useState(false);

  useEffect(() => {
    // Reduced-motion → static CSS fallback
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setUsesFallback(true);
      return;
    }

    let disposed = false;
    let frameId: number;

    async function init() {
      const container = containerRef.current;
      if (!container || disposed) return;

      let THREE: typeof import('three');
      try {
        THREE = await import('three');
      } catch {
        setUsesFallback(true);
        return;
      }

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        stencil: false,
        depth: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      container.appendChild(renderer.domElement);

      // Scene + camera
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0e27);
      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        10000,
      );
      camera.position.z = 50;

      // Helpers
      const getViewSize = () => {
        const fov = (camera.fov * Math.PI) / 180;
        const h = Math.abs(camera.position.z * Math.tan(fov / 2) * 2);
        return { width: h * camera.aspect, height: h };
      };

      // Touch texture
      const touchTex = new TouchTexture(THREE);

      // Shader material
      const vs = getViewSize();
      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        // Project palette: primary blue/indigo + purple accent
        uColor1: { value: new THREE.Vector3(0.345, 0.396, 0.949) }, // #5865f2
        uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // #0a0e27
        uColor3: { value: new THREE.Vector3(0.576, 0.200, 0.918) }, // #9333ea
        uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // #0a0e27
        uColor5: { value: new THREE.Vector3(0.345, 0.396, 0.949) }, // #5865f2
        uColor6: { value: new THREE.Vector3(0.231, 0.647, 0.365) }, // #3ba55d
        uSpeed: { value: 1.5 },
        uIntensity: { value: 1.8 },
        uTouchTexture: { value: touchTex.texture },
        uGrainIntensity: { value: 0.08 },
        uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
        uGradientSize: { value: 0.45 },
        uColor1Weight: { value: 0.5 },
        uColor2Weight: { value: 1.8 },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(vs.width, vs.height, 1, 1),
        material,
      );
      scene.add(mesh);

      // Clock
      const clock = new THREE.Clock();

      // Pointer listener (canvas is pointer-events:none, listen on window)
      const onPointerMove = (ev: PointerEvent | MouseEvent) => {
        touchTex.addTouch({
          x: ev.clientX / window.innerWidth,
          y: 1 - ev.clientY / window.innerHeight,
        });
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerdown', onPointerMove);

      // Resize
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        const v = getViewSize();
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(v.width, v.height, 1, 1);
      };
      window.addEventListener('resize', onResize);

      // RAF loop
      const tick = () => {
        if (disposed) return;
        const delta = Math.min(clock.getDelta(), 0.1);
        uniforms.uTime.value += delta;
        touchTex.update();
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(tick);
      };
      tick();

      // Cleanup
      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerMove);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        material.dispose();
        mesh.geometry.dispose();
        touchTex.texture.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => {
      cleanup = fn;
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  // ---- Fallback: static CSS gradient for reduced-motion / WebGL failure ----
  if (usesFallback) {
    return (
      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #0a0e1a 0%, #111827 30%, #1e1b4b 60%, #0f172a 100%)',
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#0a0e1a' }}
    />
  );
}
