// Mobile nav toggle
const toggle = document.getElementById('nav-toggle');
const drop = document.getElementById('mobile-drop');
if (toggle && drop) {
  toggle.addEventListener('click', () => {
    drop.classList.toggle('open');
  });
  drop.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => drop.classList.remove('open'));
  });
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const reveal = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => reveal.observe(el));
