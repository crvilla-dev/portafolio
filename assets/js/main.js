/**
 * CONY — DISEÑO & DESARROLLO WEB
 * main.js
 *
 * Funcionalidades:
 *  1. Parallax hero (requestAnimationFrame)
 *  2. Navbar scroll state
 *  3. Skill bars animadas con IntersectionObserver
 *  4. Reveal on scroll con IntersectionObserver
 *  5. Año dinámico en footer
 *  6. Navegación suave (smooth scroll anchors)
 *  7. Cierre del menú mobile al hacer click en link
 */

'use strict';

/* ===================== HELPERS ===================== */

/**
 * Seleccionador simplificado
 * @param {string} sel - CSS selector
 * @param {Document|Element} ctx - contexto (default document)
 * @returns {Element|null}
 */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * Seleccionador múltiple
 * @param {string} sel
 * @param {Document|Element} ctx
 * @returns {NodeList}
 */
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

/**
 * Detecta si el usuario prefiere reducir movimiento
 * @returns {boolean}
 */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===================== 1. PARALLAX HERO ===================== */

/**
 * Efecto parallax en el hero usando rAF.
 * El layer .parallax-bg se desplaza a 0.4× la velocidad de scroll.
 * Se desactiva si el usuario prefiere movimiento reducido (WCAG 2.3.3).
 */
(function initParallax() {
  const bg = $('#parallaxBg');
  if (!bg || prefersReducedMotion()) return;

  let ticking = false;
  let scrollY = 0;

  function applyParallax() {
    // Desplaza el fondo más lento que el scroll = efecto profundidad
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

/**
 * Agrega la clase .scrolled al navbar cuando el usuario
 * baja más de 60px. Esto activa el fondo blur/oscuro.
 */
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

  // Estado inicial por si la página carga con scroll
  updateNav();
})();

/* ===================== 3. SKILL BARS ===================== */

/**
 * Anima las barras de progreso cuando entran en el viewport.
 * Usa IntersectionObserver para WCAG / performance.
 * Agrega aria-valuenow para accesibilidad.
 */
(function initSkillBars() {
  const bars = $$('.skill-bar');
  if (!bars.length) return;

  // Si reducción de movimiento: mostrar al 100% sin animación
  if (prefersReducedMotion()) {
    bars.forEach(bar => {
      const pct = bar.dataset.width || '0';
      bar.style.width = pct + '%';
      // Accesibilidad en el contenedor padre
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

      // ARIA progressbar
      if (wrap) {
        wrap.setAttribute('role', 'progressbar');
        wrap.setAttribute('aria-valuenow', pct);
        wrap.setAttribute('aria-valuemin', '0');
        wrap.setAttribute('aria-valuemax', '100');
      }

      // Pequeño delay para que la transición CSS sea visible
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

/**
 * Agrega .reveal a los elementos de contenido y los hace
 * visibles cuando entran en el viewport.
 */
(function initReveal() {
  // Elementos que queremos animar al aparecer
  const targets = [
    '.section-num',
    '.section-title',
    '.section-label',
    '.sobre-body',
    '.linkedin-card',
    '.link-section',
    '.skill-row',
    '.project-card',
    '.contact-title',
    '.contact-sub',
    '.btn-contact',
    '.social-nav'
  ];

  const elements = $$(targets.join(', '));
  if (!elements.length) return;

  // Si reducción de movimiento: no agregar clase reveal, mostrar todo
  if (prefersReducedMotion()) return;

  // Agregar clase reveal a cada elemento
  elements.forEach((el, i) => {
    el.classList.add('reveal');
    // Escalonar elementos hermanos (dentro de la misma sección)
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

/**
 * Maneja el scroll suave para todos los links ancla internos.
 * Compensa el alto del navbar fijo.
 */
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

    // Focus management para accesibilidad (WCAG 2.4.3)
    targetEl.setAttribute('tabindex', '-1');
    targetEl.focus({ preventScroll: true });
    targetEl.addEventListener('blur', () => {
      targetEl.removeAttribute('tabindex');
    }, { once: true });
  });
})();

/* ===================== 7. CIERRE MENÚ MOBILE ===================== */

/**
 * Cierra el menú de Bootstrap al hacer click en cualquier
 * link de navegación (en mobile).
 */
(function initMobileMenu() {
  const navMenu  = $('#navMenu');
  const navLinks = $$('.nav-link');

  if (!navMenu) return;

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Solo cerrar si el collapse está abierto (modo mobile)
      if (navMenu.classList.contains('show')) {
        // Usar la API de Bootstrap para colapsar correctamente
        const bsCollapse = window.bootstrap?.Collapse.getInstance(navMenu);
        if (bsCollapse) {
          bsCollapse.hide();
        }
      }
    });
  });
})();

/* ===================== 8. PROJECT ARROWS (placeholder) ===================== */

/**
 * Los botones de navegación de proyectos muestran una animación
 * de entrada. En una implementación completa, aquí iría
 * un carrusel/slider de proyectos.
 */
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
  window.addEventListener('load', updateArrows); // recalcula cuando ya cargaron las imágenes
  updateArrows();
})();

/* ===================== 9. ACTIVE NAV LINK (scroll spy) ===================== */

/**
 * Marca el link activo del navbar según la sección visible.
 * WCAG 4.1.3: estado actual communicado via aria-current.
 */
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

/* ===================== 10. SOUND EFFECT (card) ===================== */

document.querySelectorAll(".interest-card").forEach(card => {

    card.addEventListener("mouseenter", () => {

        const sound = new Audio("assets/audio/simple-whoosh.mp3");

        sound.volume = 0.10;

        sound.play();

    });

});

/*==================================================
BACK TO TOP
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const backToTop = document.querySelector(".back-to-top");

    if (!backToTop) return;

    const toggleBackToTop = () => {

        if (window.scrollY > 350) {

            backToTop.classList.add("show");

        } else {

            backToTop.classList.remove("show");

        }

    };

    // Comprobar al cargar la página
    toggleBackToTop();

    // Comprobar al hacer scroll
    window.addEventListener("scroll", toggleBackToTop);

});

/*==================================================
FORMULARIO DE CONTACTO
==================================================*/
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
      status.textContent = 'Hubo un error. Intenta escribir directo a hola@cony.dev';
      status.className = 'form-status error';
    } finally {
      btn.disabled = false;
    }
  });
})();