// Hero headline: letters lift and bend in 3D around the pointer, and sway gently when idle
(() => {
  const title = document.querySelector('.intro-title');
  if (!title) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const LIFT = 28;    // px a letter rises right under the pointer
  const REACH = 110;  // px radius of the bend
  const DRIFT = 0.12; // easing toward the target (lower = more lag)

  // Split into words (kept unbreakable so Korean line-breaking stays intact) and letters
  const chars = [];
  const split = (node, hl) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const word = document.createElement('span');
          word.className = 'ft-word';
          [...part].forEach((ch) => {
            const s = document.createElement('span');
            s.className = 'ft-char' + (hl ? ' ft-hl' : '');
            s.textContent = ch;
            word.append(s);
            chars.push({ el: s, x: 0, y: 0, lift: 0, rx: 0, ry: 0 });
          });
          frag.append(word);
        });
        n.replaceWith(frag);
      } else if (n.nodeName === 'SPAN') {
        split(n, true);
        n.replaceWith(...n.childNodes);
      }
    });
  };
  title.setAttribute('aria-label', title.innerText.replace(/\s+/g, ' ').trim());
  split(title, false);
  title.classList.add('ft-ready');

  const measure = () => {
    const r = title.getBoundingClientRect();
    chars.forEach((c) => {
      const b = c.el.getBoundingClientRect();
      c.x = b.left - r.left + b.width / 2;
      c.y = b.top - r.top + b.height / 2;
    });
  };
  measure();
  window.addEventListener('resize', measure);
  if (document.fonts) document.fonts.ready.then(measure);

  let pointer = null;
  const area = title.parentElement;
  area.addEventListener('pointermove', (e) => {
    const r = title.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  area.addEventListener('pointerleave', () => { pointer = null; });

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(title);

  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = now / 1000;
    chars.forEach((c, i) => {
      let lift = 0, rx = 0, ry = 0;
      if (pointer) {
        const dx = c.x - pointer.x, dy = c.y - pointer.y;
        const f = Math.exp(-(dx * dx + dy * dy) / (2 * REACH * REACH));
        lift = f * LIFT;
        rx = (dy / REACH) * f * 40;
        ry = (-dx / REACH) * f * 40;
      } else {
        lift = (Math.sin(t * 1.6 - i * 0.45) + 1) * 2.5; // idle ripple
      }
      c.lift += (lift - c.lift) * DRIFT;
      c.rx += (rx - c.rx) * DRIFT;
      c.ry += (ry - c.ry) * DRIFT;
      c.el.style.transform =
        `translate3d(0, ${(-c.lift).toFixed(2)}px, ${(c.lift * 2).toFixed(2)}px) rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg)`;
      c.el.style.textShadow = c.lift > 0.5
        ? `0 ${(c.lift * 0.35).toFixed(1)}px ${(c.lift * 0.5).toFixed(1)}px rgba(135, 133, 162, ${Math.min(0.45, c.lift / 50).toFixed(2)})`
        : 'none';
    });
  };
  requestAnimationFrame(frame);
})();
