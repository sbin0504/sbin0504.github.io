// Intro headline: each line is unmasked from the centre outwards (ease-in-out)
(() => {
  const title = document.querySelector('.intro-title');
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Wrap each <br>-separated line so it can be masked on its own
  const lines = [[]];
  [...title.childNodes].forEach((n) => {
    if (n.nodeName === 'BR') { lines.push([]); n.remove(); } else lines[lines.length - 1].push(n);
  });
  lines.forEach((nodes, i) => {
    const line = document.createElement('span');
    line.className = 'mr-line';
    line.style.transitionDelay = `${i * 0.18}s`;
    nodes.forEach((n) => line.append(n));
    title.append(line);
  });
  title.classList.add('mr-ready');

  const reveal = () => {
    new IntersectionObserver((es, obs) => {
      if (!es[0].isIntersecting) return;
      requestAnimationFrame(() => title.classList.add('mr-in'));
      obs.disconnect();
    }, { threshold: 0.3 }).observe(title);
  };
  reveal();
})();
