/* ==========================================================================
   BRANDIVO STUDIO — shared behaviour
   ========================================================================== */

/* Contact form delivery.
   Leave empty for demo mode (form validates but sends nothing).
   Before going live, create a free form endpoint (e.g. Formspree or Web3Forms) and paste its URL here,
   for example: const FORM_ENDPOINT = 'https://formspree.io/f/your-form-id'; */
const FORM_ENDPOINT = '';

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky header ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-counter]');
  const animateCounter = (el) => {
    const target = parseFloat(el.getAttribute('data-counter'));
    const decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = val.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(el => cio.observe(el));
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------- Accordion (FAQ) ---------- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.accordion-panel').style.maxHeight = null;
          openItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', (!isOpen).toString());
      panel.style.maxHeight = !isOpen ? panel.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Tabs (service detail pages) ---------- */
  document.querySelectorAll('.tabs-row').forEach(row => {
    const btns = row.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        const panelGroup = document.querySelector(`[data-tab-group="${row.getAttribute('data-group')}"]`) || document;
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        panelGroup.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      });
    });
  });

  /* ---------- Contact form validation ---------- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      const fields = contactForm.querySelectorAll('[data-required]');
      fields.forEach(field => {
        const wrapper = field.closest('.field');
        const value = field.value.trim();
        let ok = value.length > 0;
        if (field.type === 'email' && ok) {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        if (field.type === 'tel' && ok) {
          ok = /^[0-9+\-\s()]{7,}$/.test(value);
        }
        wrapper.classList.toggle('invalid', !ok);
        if (!ok) valid = false;
      });
      if (valid) {
        // Save to admin panel localStorage
        const formData = new FormData(contactForm);
        const submissions = JSON.parse(localStorage.getItem('brandivo_submissions') || '[]');
        const submission = {
          id: Date.now().toString(),
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          company: formData.get('company'),
          service: formData.get('service'),
          budget: formData.get('budget'),
          message: formData.get('message'),
          date: new Date().toISOString()
        };
        submissions.unshift(submission);
        localStorage.setItem('brandivo_submissions', JSON.stringify(submissions));

        const showSuccess = () => {
          contactForm.style.display = 'none';
          const success = document.getElementById('form-success');
          if (success) success.classList.add('show');
        };

        // If external endpoint is configured, also send there
        if (FORM_ENDPOINT) {
          const submitBtn = contactForm.querySelector('button[type="submit"]');
          const oldLabel = submitBtn.textContent;
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
          fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Accept': 'application/json' }, body: formData })
            .then(res => { if (!res.ok) throw new Error('Bad response'); showSuccess(); })
            .catch(() => {
              submitBtn.disabled = false;
              submitBtn.textContent = oldLabel;
              let msg = contactForm.querySelector('.send-error');
              if (!msg) {
                msg = document.createElement('p');
                msg.className = 'field-error send-error';
                msg.style.display = 'block';
                contactForm.appendChild(msg);
              }
              msg.textContent = 'Sorry, your message could not be sent. Please email us at amankumar991855@gmail.com.';
            });
        } else {
          // No external endpoint - just save to admin and show success
          showSuccess();
        }
      } else {
        const firstInvalid = contactForm.querySelector('.invalid input, .invalid select, .invalid textarea');
        if (firstInvalid) firstInvalid.focus();
      }
    });
    contactForm.querySelectorAll('[data-required]').forEach(field => {
      field.addEventListener('input', () => field.closest('.field').classList.remove('invalid'));
    });
  }

  /* ---------- Newsletter form (blog / footer) ---------- */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const btn = form.querySelector('button');
      if (input && input.value.trim()) {
        btn.textContent = 'Subscribed';
        input.value = '';
        setTimeout(() => { btn.textContent = 'Subscribe'; }, 2600);
      }
    });
  });

  /* ---------- Blog category filter ---------- */
  const filterBtns = document.querySelectorAll('[data-filter]');
  if (filterBtns.length) {
    const cards = document.querySelectorAll('[data-category]');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        cards.forEach(card => {
          card.style.display = (filter === 'all' || card.getAttribute('data-category') === filter) ? '' : 'none';
        });
      });
    });
  }

  /* ---------- Blog search ---------- */
  const blogSearch = document.getElementById('blog-search');
  if (blogSearch) {
    blogSearch.addEventListener('input', () => {
      const q = blogSearch.value.trim().toLowerCase();
      document.querySelectorAll('[data-category]').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  /* ---------- Set active year in footer ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Custom cursor (mouse devices only) ---------- */
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hasFinePointer) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const make = (cls) => { const d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); document.body.appendChild(d); return d; };
    const glow = make('cursor-glow');
    const ring = make('cursor-ring');
    const dot = make('cursor-dot');
    const layers = [glow, ring, dot];

    let mx = -100, my = -100;      // real mouse position
    let rx = -100, ry = -100;      // ring position (eased)
    let gx = -100, gy = -100;      // glow position (eased)
    let started = false, running = false;

    const place = (el, x, y) => { el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; };

    const frame = () => {
      const ringEase = reduceMotion ? 1 : 0.18;
      const glowEase = reduceMotion ? 1 : 0.08;
      rx += (mx - rx) * ringEase; ry += (my - ry) * ringEase;
      gx += (mx - gx) * glowEase; gy += (my - gy) * glowEase;
      place(dot, mx, my); place(ring, rx, ry); place(glow, gx, gy);
      const settled = Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1 && Math.abs(mx - gx) < 0.1 && Math.abs(my - gy) < 0.1;
      if (settled) { running = false; } else { requestAnimationFrame(frame); }
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

    const interactive = 'a, button, [role="button"], .btn, .accordion-trigger, .tab-btn, .nav-toggle, .cs-card, summary';
    const isField = 'input, textarea, select';

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!started) {
        started = true;
        rx = gx = mx; ry = gy = my;
        document.documentElement.classList.add('has-cursor');
        layers.forEach(l => l.classList.add('is-active'));
      }
      const t = e.target instanceof Element ? e.target : null;
      const overField = !!(t && t.closest(isField));
      const overLink = !!(t && t.closest(interactive));
      layers.forEach(l => l.classList.toggle('is-hidden', overField));
      ring.classList.toggle('is-link', overLink);
      dot.classList.toggle('is-link', overLink);
      kick();
    }, { passive: true });

    window.addEventListener('mousedown', (e) => {
      ring.classList.add('is-down');
      if (reduceMotion) return;
      const r = make('cursor-ripple');
      r.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      r.style.opacity = '1';
      r.addEventListener('animationend', () => r.remove(), true);
      setTimeout(() => r.remove(), 900);
    });
    window.addEventListener('mouseup', () => ring.classList.remove('is-down'));

    document.documentElement.addEventListener('mouseleave', () => layers.forEach(l => l.classList.remove('is-active')));
    document.documentElement.addEventListener('mouseenter', () => { if (started) layers.forEach(l => l.classList.add('is-active')); });
  }

});
