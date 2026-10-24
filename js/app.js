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
  // threshold 0: tall sections (project details) can never be 12% on screen at once
  { threshold: 0, rootMargin: '0px 0px -8% 0px' }
);
revealEls.forEach((el) => reveal.observe(el));

// Project category filter
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.ov-card, .proj, .proj-mini').forEach((el) => {
      el.hidden = f !== 'all' && el.dataset.cat !== f;
    });
  });
});

// Side timeline: drawer toggle on narrow screens + highlight the project in view
const side = document.getElementById('side-nav');
const sideToggle = document.getElementById('sn-toggle');
if (side && sideToggle) {
  const setOpen = (open) => {
    side.classList.toggle('open', open);
    sideToggle.setAttribute('aria-expanded', String(open));
    sideToggle.textContent = open ? '닫기' : '타임라인';
  };
  sideToggle.addEventListener('click', () => setOpen(!side.classList.contains('open')));
  side.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));

  const links = [...side.querySelectorAll('a[data-target]')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('current', l.dataset.target === e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  new Set(links.map((l) => l.dataset.target)).forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });
}

// Intro splash: leave on scroll / swipe / key / click; mouse movement only plays with the balls
const splash = document.getElementById('splash');
if (splash && splash.classList.contains('show')) {
  let closing = false;
  let touchY = null;
  const close = () => {
    if (closing) return;
    closing = true;
    window.scrollTo(0, 0);
    splash.classList.add('leaving');
    const done = () => {
      splash.remove();
      document.documentElement.classList.remove('splash-lock');
      document.dispatchEvent(new Event('splash:closed'));
    };
    splash.addEventListener('transitionend', done, { once: true });
    setTimeout(() => { if (splash.isConnected) done(); }, 1200);
  };
  window.addEventListener('wheel', (e) => { if (e.deltaY > 0) close(); }, { passive: true });
  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (touchY !== null && touchY - e.touches[0].clientY > 30) close();
  }, { passive: true });
  window.addEventListener('keydown', (e) => {
    if ([' ', 'Enter', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); close(); }
  });
  splash.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.getAttribute('href').startsWith('mailto:')) return; // let the mail app open
    e.preventDefault();
    close();
    // "프로젝트 보러가기": jump there once the intro has slid away
    if (link) setTimeout(() => document.querySelector(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }), 950);
  });
}
