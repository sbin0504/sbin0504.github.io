// Hero 3D ball pit: rubber spheres labelled with tools & skills
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const host = document.querySelector('.ball-pit');

const LABELS = [
  '기획', '리더십', '이커머스', '캠페인', '데이터', 'SEO', 'Excel', 'GA',
  '콘텐츠', '마케팅', '브랜드', 'Figma', 'ChatGPT', 'AI', 'OPIc', '글로벌',
];

// [ball color, text color]
const COLORS = [
  ['#ffffff', '#5f5d78'],
  ['#FFC7C7', '#5f5d78'],
  ['#8785A2', '#ffffff'],
  ['#5f5d78', '#FFE2E2'],
  ['#FFE2E2', '#8785A2'],
];

const COUNT = 40;
const RADIUS = 1.75;
const ATTRACTION = 0.006;
const DAMPING = 0.9;
const MAX_SPEED = 2;
const MOUSE_RADIUS = 8;
const MOUSE_FORCE = 0.12;
const RESTITUTION = 0.6;
const ITERS = 3;

function labelTexture(text, bg, fg) {
  // Equirectangular map: u = 0.25 faces the camera on a three.js sphere
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 120;
  const font = (s) => `700 ${s}px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  g.font = font(size);
  while (g.measureText(text).width > W * 0.24 && size > 40) {
    size -= 4;
    g.font = font(size);
  }
  g.fillText(text, W * 0.25, H / 2 + size * 0.05);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    host.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Size the pit and canvas here too, so a stale/missing stylesheet can't make them grow unbounded
  Object.assign(host.style, { position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', width: '100%', maxWidth: '480px' });
  Object.assign(renderer.domElement.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block',
  });
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0, 30);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3d6dc, 1.3));
  const key = new THREE.DirectionalLight(0xfff9f5, 1.4);
  key.position.set(12, 18, 20);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.05;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xf0f0ff, 0.4);
  fill.position.set(-15, -10, 15);
  scene.add(fill);

  const geo = new THREE.SphereGeometry(1, 48, 48);
  const bodies = [];
  for (let i = 0; i < COUNT; i++) {
    const [bg, fg] = COLORS[i % COLORS.length];
    const mat = new THREE.MeshPhysicalMaterial({
      map: labelTexture(LABELS[i % LABELS.length], bg, fg),
      roughness: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      sheen: 0.6,
      sheenColor: new THREE.Color(bg),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const r = RADIUS * (1 + (Math.random() - 0.5) * 0.3);
    mesh.scale.setScalar(r);
    // Slight tilt so labels face the viewer but don't look flat
    mesh.rotation.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4);
    const a = Math.random() * Math.PI * 2;
    const d = 14 + Math.random() * 8;
    bodies.push({
      mesh,
      r,
      pos: new THREE.Vector3(Math.cos(a) * d, Math.sin(a) * d, (Math.random() - 0.5) * 6),
      vel: new THREE.Vector3(),
      wobble: Math.random() * Math.PI * 2,
    });
    scene.add(mesh);
  }

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  new ResizeObserver(resize).observe(host);
  resize();

  // Pointer → point on the z = 0 plane
  const AWAY = new THREE.Vector3(0, 0, -9999);
  const mouse = AWAY.clone();
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  host.addEventListener('pointermove', (e) => {
    const rect = host.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, mouse)) mouse.copy(AWAY);
  }, { passive: true });
  host.addEventListener('pointerleave', () => mouse.copy(AWAY));

  const tmp = new THREE.Vector3();
  const rel = new THREE.Vector3();
  const step = () => {
    for (const b of bodies) {
      b.vel.addScaledVector(tmp.copy(b.pos).negate(), ATTRACTION);
      if (mouse.z !== AWAY.z) {
        const d = b.pos.distanceTo(mouse);
        if (d < MOUSE_RADIUS) {
          tmp.copy(b.pos).sub(mouse);
          if (tmp.lengthSq() < 1e-8) tmp.set(0, 1, 0);
          b.vel.addScaledVector(tmp.normalize(), (MOUSE_RADIUS - d) * MOUSE_FORCE);
        }
      }
      if (b.vel.length() > MAX_SPEED) b.vel.setLength(MAX_SPEED);
      b.vel.multiplyScalar(DAMPING);
      b.pos.add(b.vel);
    }
    for (let k = 0; k < ITERS; k++) {
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const c = bodies[j];
          const min = a.r + c.r;
          tmp.copy(a.pos).sub(c.pos);
          const dist = tmp.length();
          if (dist >= min) continue;
          if (dist < 1e-6) tmp.set(1, 0, 0); else tmp.divideScalar(dist);
          const push = (min - dist) * 0.5;
          a.pos.addScaledVector(tmp, push);
          c.pos.addScaledVector(tmp, -push);
          const approach = rel.copy(a.vel).sub(c.vel).dot(tmp);
          if (approach < 0) {
            a.vel.addScaledVector(tmp, -approach * RESTITUTION);
            c.vel.addScaledVector(tmp, approach * RESTITUTION);
          }
        }
      }
    }
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) for (let i = 0; i < 400; i++) step();

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(host);

  let last = performance.now(), acc = 0, t = 0;
  const DT = 1 / 60;
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (!visible) { last = now; return; }
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    let n = 0;
    while (acc >= DT && n < 5) { step(); acc -= DT; n++; t += DT; }
    if (acc >= DT) acc = 0;
    for (const b of bodies) {
      b.mesh.position.copy(b.pos);
      // Gentle rubbery wobble driven by velocity
      b.mesh.rotation.z += (b.vel.x * -0.15 - b.mesh.rotation.z * 0.02);
      b.mesh.rotation.x = Math.sin(t * 0.6 + b.wobble) * 0.12 - b.vel.y * 0.3;
    }
    renderer.render(scene, camera);
  };
  requestAnimationFrame(tick);
}

if (host) init();
