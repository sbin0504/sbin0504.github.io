// Project orbit: cards circle the centre and grow as the pointer gets close
(() => {
  const orbit = document.getElementById('orbit');
  if (!orbit) return;
  const cards = [...orbit.querySelectorAll('.orbit-card')];
  const count = orbit.querySelector('.orbit-center strong');
  orbit.classList.add('orbit-ready');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = reduced ? 0 : -0.12; // rad/s, counter-clockwise
  let REACH = 230;                   // px within which cards react to the pointer
  const GROW = 0.45;

  let base = 0;
  let pointer = null;
  let hoverCard = null;
  let visible = true;
  const scale = new Map(cards.map((c) => [c, 1]));

  orbit.addEventListener('pointermove', (e) => {
    const r = orbit.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  orbit.addEventListener('pointerleave', () => { pointer = null; hoverCard = null; });
  cards.forEach((c) => {
    c.addEventListener('pointerenter', () => { hoverCard = c; });
    c.addEventListener('pointerleave', () => { if (hoverCard === c) hoverCard = null; });
    c.addEventListener('focus', () => { hoverCard = c; });
    c.addEventListener('blur', () => { if (hoverCard === c) hoverCard = null; });
  });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(orbit);

  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;

    const shown = cards.filter((c) => !c.hidden);
    if (count) count.textContent = shown.length;
    if (!shown.length) return;

    const w = orbit.clientWidth, h = orbit.clientHeight;
    const size = shown[0].offsetWidth;
    REACH = Math.min(230, w * 0.45);
    const rx = w / 2 - size * 0.6;
    const ry = h / 2 - size * 0.6;
    // Slow down near the pointer, stop while a card is hovered
    base += SPEED * dt * (hoverCard ? 0 : pointer ? 0.35 : 1);

    shown.forEach((c, i) => {
      const a = base + (i / shown.length) * Math.PI * 2 - Math.PI / 2;
      const x = w / 2 + rx * Math.cos(a);
      const y = h / 2 + ry * Math.sin(a);
      let target = 1;
      if (pointer) {
        const d = Math.hypot(pointer.x - x, pointer.y - y);
        target = 1 + GROW * Math.max(0, 1 - d / REACH) ** 2;
      }
      const s = scale.get(c) + (target - scale.get(c)) * 0.15;
      scale.set(c, s);
      c.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px) scale(${s.toFixed(3)})`;
      c.style.zIndex = String(Math.round(s * 100));
    });
  };
  requestAnimationFrame(frame);
})();
