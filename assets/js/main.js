/**
 * CONY — DISEÑO & DESARROLLO WEB
 * main.js
 *
 * 0. Carga el navbar y el footer compartidos (partials/) vía fetch,
 *    y recién cuando terminan, corre initSite() con todo lo demás.
 *
 * Funcionalidades dentro de initSite():
 *  1. Parallax hero (requestAnimationFrame)
 *  2. Navbar scroll state
 *  3. Skill bars animadas con IntersectionObserver
 *  4. Reveal on scroll con IntersectionObserver
 *  5. Año dinámico en footer
 *  6. Navegación suave (smooth scroll anchors)
 *  7. Cierre del menú mobile al hacer click en link
 *  8. Flechas del carrusel de proyectos
 *  9. Active nav link (scroll spy)
 * 10. Interest cards: flip al click + sonido
 * 11. Back to top
 * 12. Formulario de contacto
 * 13. Botón del caos (AJAX)
 */

'use strict';

/* ===================== 0. CARGA DE NAV/FOOTER COMPARTIDOS ===================== */

/**
 * Trae un fragmento HTML (partials/nav.html, partials/footer.html)
 * y lo inyecta dentro del elemento indicado.
 * Requiere servir el sitio por HTTP (Live Server o GitHub Pages);
 * no funciona abriendo el archivo directo con doble clic (file://).
 */
async function includeHTML(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    const res = await fetch(url);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error(`No se pudo cargar ${url}:`, err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {

  await Promise.all([
    includeHTML('#nav-mount', 'partials/nav.html'),
    includeHTML('#footer-mount', 'partials/footer.html')
  ]);

  // En index.html los links del nav apuntan solo al ancla (#seccion),
  // no a "index.html#seccion" (eso es solo necesario desde otras páginas).
  const enHome = /(^|\/)index\.html$/.test(location.pathname) || location.pathname.endsWith('/');
  if (enHome) {
    document.querySelectorAll('#nav-mount a[href^="index.html#"]').forEach(a => {
      a.setAttribute('href', a.getAttribute('href').replace('index.html', ''));
    });
  }

  initSite();
});

/* ===================== initSite: todo lo demás ===================== */

function initSite() {

  /* ===================== HELPERS ===================== */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===================== 1. PARALLAX HERO ===================== */

  (function initParallax() {
    const bg = $('#parallaxBg');
    if (!bg || prefersReducedMotion()) return;

    let ticking = false;
    let scrollY = 0;

    function applyParallax() {
      const offset = scrollY * 0.4;
      bg.style.transform = `translateY(${offset}px)`;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }, { passive: true });
  })();

  /* ===================== 2. NAVBAR SCROLL STATE ===================== */

  (function initNavbar() {
    const nav = $('nav.navbar');
    if (!nav) return;

    let ticking = false;

    function updateNav() {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
        nav.setAttribute('aria-label', 'Navegación principal (modo compacto)');
      } else {
        nav.classList.remove('scrolled');
        nav.setAttribute('aria-label', 'Navegación principal');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNav);
        ticking = true;
      }
    }, { passive: true });

    updateNav();
  })();

  /* ===================== 3. SKILL BARS ===================== */

  (function initSkillBars() {
    const bars = $$('.skill-bar');
    if (!bars.length) return;

    if (prefersReducedMotion()) {
      bars.forEach(bar => {
        const pct = bar.dataset.width || '0';
        bar.style.width = pct + '%';
        const wrap = bar.closest('.skill-bar-wrap');
        if (wrap) {
          wrap.setAttribute('role', 'progressbar');
          wrap.setAttribute('aria-valuenow', pct);
          wrap.setAttribute('aria-valuemin', '0');
          wrap.setAttribute('aria-valuemax', '100');
        }
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const bar  = entry.target;
        const pct  = bar.dataset.width || '0';
        const wrap = bar.closest('.skill-bar-wrap');

        if (wrap) {
          wrap.setAttribute('role', 'progressbar');
          wrap.setAttribute('aria-valuenow', pct);
          wrap.setAttribute('aria-valuemin', '0');
          wrap.setAttribute('aria-valuemax', '100');
        }

        requestAnimationFrame(() => {
          bar.style.width = pct + '%';
        });

        observer.unobserve(bar);
      });
    }, {
      threshold: 0.3
    });

    bars.forEach(bar => observer.observe(bar));
  })();

  /* ===================== 4. REVEAL ON SCROLL ===================== */

  (function initReveal() {
    const targets = [
      '.section-num',
      '.section-title',
      '.section-label',
      '.sobre-body',
      '.linkedin-card',
      '.link-section',
      '.skill-row',
      '.contact-title',
      '.contact-sub',
      '.btn-contact',
      '.social-nav'
    ];

    const elements = $$(targets.join(', '));
    if (!elements.length) return;

    if (prefersReducedMotion()) return;

    elements.forEach((el, i) => {
      el.classList.add('reveal');
      const rowIndex = i % 6;
      if (rowIndex > 0) {
        el.classList.add(`reveal-delay-${rowIndex}`);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  })();

  /* ===================== 5. AÑO DINÁMICO ===================== */

  (function initYear() {
    const yearEl = $('#currentYear');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  })();

  /* ===================== 6. SMOOTH SCROLL ANCHORS ===================== */

  (function initSmoothScroll() {
    const navHeight = () => {
      const nav = $('nav.navbar');
      return nav ? nav.offsetHeight : 80;
    };

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = $(targetId);
      if (!targetEl) return;

      e.preventDefault();

      const top = targetEl.getBoundingClientRect().top + window.scrollY - navHeight() - 16;

      if (prefersReducedMotion()) {
        window.scrollTo({ top, behavior: 'auto' });
      } else {
        window.scrollTo({ top, behavior: 'smooth' });
      }

      targetEl.setAttribute('tabindex', '-1');
      targetEl.focus({ preventScroll: true });
      targetEl.addEventListener('blur', () => {
        targetEl.removeAttribute('tabindex');
      }, { once: true });
    });
  })();

  /* ===================== 7. CIERRE MENÚ MOBILE ===================== */

  (function initMobileMenu() {
    const navMenu  = $('#navMenu');
    const navLinks = $$('.nav-link');

    if (!navMenu) return;

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('show')) {
          const bsCollapse = window.bootstrap?.Collapse.getInstance(navMenu);
          if (bsCollapse) {
            bsCollapse.hide();
          }
        }
      });
    });
  })();

  /* ===================== 8. PROJECT ARROWS ===================== */

  (function initProjectNav() {
    const prevBtn = $('#projPrev');
    const nextBtn = $('#projNext');
    const grid    = $('#projectsGrid');
    if (!prevBtn || !nextBtn || !grid) return;

    function getStep() {
      const firstSlide = grid.firstElementChild;
      if (!firstSlide) return grid.clientWidth;
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 24;
      return firstSlide.getBoundingClientRect().width + gap;
    }

    function updateArrows() {
      const maxScroll = grid.scrollWidth - grid.clientWidth;
      const atStart = grid.scrollLeft <= 4;
      const atEnd   = grid.scrollLeft >= maxScroll - 4;

      prevBtn.classList.toggle('is-disabled', atStart);
      nextBtn.classList.toggle('is-disabled', atEnd);
    }

    prevBtn.addEventListener('click', () => {
      grid.scrollBy({
        left: -getStep(),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    });

    nextBtn.addEventListener('click', () => {
      grid.scrollBy({
        left: getStep(),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    });

    grid.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    window.addEventListener('load', updateArrows);
    updateArrows();
  })();

  /* ===================== 9. ACTIVE NAV LINK (scroll spy) ===================== */

  (function initScrollSpy() {
    const sections = $$('section[id]');
    const navLinks = $$('.navbar-nav .nav-link');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const id = entry.target.id;

        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', isActive);
          if (isActive) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    }, {
      threshold: 0.4,
      rootMargin: '-80px 0px -30% 0px'
    });

    sections.forEach(sec => observer.observe(sec));
  })();

  /* ===================== 10. INTEREST CARDS: FLIP AL CLICK + SONIDO ===================== */

  (function initInterestCards() {
    $$('.interest-card').forEach(card => {

      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');

      function toggleFlip() {
        const isFlipped = card.classList.toggle('is-flipped');
        card.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');

        const audioSrc = 'assets/audio/simple-whoosh.mp3';
        const sound = new Audio(audioSrc);
        sound.volume = 0.10;
        sound.play();
      }

      card.addEventListener('click', toggleFlip);

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFlip();
        }
      });
    });
  })();

  /* ===================== 11. BACK TO TOP ===================== */

  (function initBackToTop() {
    const backToTop = $('.back-to-top');
    if (!backToTop) return;

    const toggleBackToTop = () => {
      if (window.scrollY > 350) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    };

    toggleBackToTop();
    window.addEventListener('scroll', toggleBackToTop);
  })();

  /* ===================== 12. FORMULARIO DE CONTACTO ===================== */

  (function initContactForm() {
    const form   = $('#contactForm');
    const status = $('#formStatus');
    if (!form || !status) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');

      status.textContent = 'Enviando...';
      status.className = 'form-status loading';
      btn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          status.textContent = '¡Mensaje enviado! Te responderé pronto.';
          status.className = 'form-status success';
          form.reset();
        } else {
          throw new Error('Error en el envío');
        }
      } catch (err) {
        status.textContent = 'Hubo un error. Intenta escribir directamente a consta.riquelmev@duocuc.cl';
        status.className = 'form-status error';
      } finally {
        btn.disabled = false;
      }
    });
  })();

  /* ===================== 13. BOTÓN DEL CAOS (AJAX) ===================== */

  (function initBotonCaos() {
    const botonCaos = $('#boton-caos');
    if (!botonCaos) return;

    botonCaos.addEventListener('click', () => {

      fetch('assets/json/easteregg.json')
        .then(res => res.json())
        .then(eventos => {

          const evento = eventos[
            Math.floor(Math.random() * eventos.length)
          ];

          const sonido = new Audio('assets/audio/error-xp.mp3');
          sonido.volume = 0.15;
          sonido.play();

          const alerta = $('#caos-alerta');

          if (alerta) {
            alerta.innerHTML = `
              <h2>${evento.titulo}</h2>
              <p>${evento.mensaje}</p>
            `;
            alerta.style.display = 'block';
          }

          document.documentElement.classList.add('caos-' + evento.modo);

          setTimeout(() => {
            if (alerta) {
              alerta.style.display = 'none';
            }
            document.documentElement.classList.remove('caos-' + evento.modo);
          }, 4000);
        })
        .catch(error => {
          console.error('Error cargando caos:', error);
        });
    });
  })();

} // fin initSite()
