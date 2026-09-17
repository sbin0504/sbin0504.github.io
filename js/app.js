// Mobile menu toggle
const toggle = document.getElementById('mobile-toggle');
const menu = document.getElementById('mobile-menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
  menu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => menu.classList.remove('open'));
  });
}

// Scrollspy: highlight active sidebar/mobile nav link
const sections = document.querySelectorAll('main .block, main .contact-block');
const navLinks = document.querySelectorAll('[data-nav], .mobile-menu a');

const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
);
sections.forEach((s) => spy.observe(s));

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
