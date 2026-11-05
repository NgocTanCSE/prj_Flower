(function () {
  const ZALO_BASE = 'https://zalo.me/0901234567';
  const MESSENGER_BASE = 'https://m.me/tiemhoacobecube';
  const CHANNEL_KEY = 'cobecube-order-channel';

  const body = document.body;
  body.classList.add('js-enabled');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getChannel() {
    try {
      return localStorage.getItem(CHANNEL_KEY) === 'messenger' ? 'messenger' : 'zalo';
    } catch (e) {
      return 'zalo';
    }
  }

  function setChannel(channel) {
    try {
      localStorage.setItem(CHANNEL_KEY, channel);
    } catch (e) {
      // Ignore storage errors in restricted contexts.
    }
  }

  function buildOrderUrl(channel, message) {
    const text = encodeURIComponent(message || 'Xin chào Tiệm Hoa CoBeCuBe, mình muốn đặt hoa.');
    if (channel === 'messenger') {
      return MESSENGER_BASE + '?text=' + text;
    }
    return ZALO_BASE + '?text=' + text;
  }

  function updateOrderLinks(channel) {
    const links = document.querySelectorAll('.js-order-link[data-order-message]');
    links.forEach(function (link) {
      const message = link.getAttribute('data-order-message');
      link.setAttribute('href', buildOrderUrl(channel, message));
      const label = channel === 'messenger' ? 'Nhắn Messenger' : 'Nhắn Zalo';
      if (link.dataset.dynamicLabel === 'true') {
        link.textContent = label;
      }
    });

    const heroZalo = document.querySelector('.hero-actions [data-zalo-link]');
    const heroMessenger = document.querySelector('.hero-actions [data-messenger-link]');
    if (heroZalo) {
      heroZalo.setAttribute('href', buildOrderUrl('zalo', heroZalo.getAttribute('data-order-message')));
    }
    if (heroMessenger) {
      heroMessenger.setAttribute('href', buildOrderUrl('messenger', heroMessenger.getAttribute('data-order-message')));
    }

    const contactMessenger = document.querySelector('.contact-actions [data-messenger-link]');
    if (contactMessenger) {
      contactMessenger.setAttribute('href', buildOrderUrl('messenger', contactMessenger.getAttribute('data-order-message')));
    }
  }

  // Channel picker (segmented)
  const channelSegment = document.getElementById('channel-segment');
  const segmentButtons = channelSegment ? Array.prototype.slice.call(channelSegment.querySelectorAll('.segment-btn[data-channel]')) : [];

  function syncChannelPicker(channel) {
    segmentButtons.forEach(function (btn) {
      const active = btn.getAttribute('data-channel') === channel;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', String(active));
      btn.tabIndex = active ? 0 : -1;
    });
  }

  function applyChannel(channel, shouldPersist) {
    const safe = channel === 'messenger' ? 'messenger' : 'zalo';
    if (shouldPersist) setChannel(safe);
    syncChannelPicker(safe);
    updateOrderLinks(safe);
  }

  if (segmentButtons.length) {
    applyChannel(getChannel(), false);
    segmentButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyChannel(btn.getAttribute('data-channel'), true);
      });
      btn.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const current = segmentButtons.indexOf(document.activeElement);
        const dir = event.key === 'ArrowRight' ? 1 : -1;
        const next = (current + dir + segmentButtons.length) % segmentButtons.length;
        segmentButtons[next].focus();
        applyChannel(segmentButtons[next].getAttribute('data-channel'), true);
      });
    });
  } else {
    updateOrderLinks(getChannel());
  }

  // Sticky header shadow
  const header = document.querySelector('.site-header');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  // Mobile nav
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.getElementById('site-nav');
  function closeNav() {
    if (!navToggle || !siteNav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Mở menu điều hướng');
    siteNav.classList.remove('is-open');
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navToggle.setAttribute('aria-label', expanded ? 'Mở menu điều hướng' : 'Đóng menu điều hướng');
      siteNav.classList.toggle('is-open', !expanded);
    });

    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    document.addEventListener('click', function (event) {
      if (!siteNav.classList.contains('is-open')) return;
      if (siteNav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });
  }

  // Hero reveal sequence
  const heroReveals = document.querySelectorAll('.hero .reveal');
  heroReveals.forEach(function (el, index) {
    el.style.setProperty('--reveal-delay', String(index * 90) + 'ms');
    if (prefersReducedMotion) {
      el.classList.add('is-visible');
    } else {
      window.setTimeout(function () {
        el.classList.add('is-visible');
      }, 80 + index * 90);
    }
  });

  // Scroll reveal
  const revealItems = document.querySelectorAll('.reveal:not(.hero .reveal)');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );
    revealItems.forEach(function (el) {
      observer.observe(el);
    });
  }

  // Reviews carousel
  const track = document.getElementById('review-track');
  const slides = track ? Array.prototype.slice.call(track.children) : [];
  const prevBtn = document.getElementById('review-prev');
  const nextBtn = document.getElementById('review-next');
  const status = document.getElementById('review-status');
  let currentIndex = 0;
  let autoTimer = null;

  function renderCarousel() {
    if (!track || !slides.length) return;
    track.style.transform = 'translateX(-' + currentIndex * 100 + '%)';
    if (status) status.textContent = (currentIndex + 1) + ' / ' + slides.length;
  }

  function goTo(index) {
    if (!slides.length) return;
    currentIndex = (index + slides.length) % slides.length;
    renderCarousel();
  }

  function startAuto() {
    if (prefersReducedMotion || slides.length < 2) return;
    stopAuto();
    autoTimer = window.setInterval(function () {
      goTo(currentIndex + 1);
    }, 5500);
  }

  function stopAuto() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      goTo(currentIndex - 1);
      startAuto();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      goTo(currentIndex + 1);
      startAuto();
    });
  }

  const carousel = document.querySelector('.carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin', stopAuto);
    carousel.addEventListener('focusout', startAuto);
  }
  renderCarousel();
  startAuto();

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxClose = document.getElementById('lightbox-close');
  let lastFocused = null;

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImage) return;
    lastFocused = document.activeElement;
    lightboxImage.src = src;
    lightboxImage.alt = alt || 'Ảnh hoa phóng to';
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImage) return;
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  document.querySelectorAll('.gallery-item').forEach(function (item) {
    item.addEventListener('click', function () {
      openLightbox(item.getAttribute('data-full'), item.getAttribute('data-alt'));
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightbox && !lightbox.hidden) {
      closeLightbox();
    }
  });

  // Newsletter (no backend)
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterMessage = document.getElementById('newsletter-message');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const email = emailInput ? emailInput.value.trim() : '';
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!newsletterMessage) return;
      if (!valid) {
        newsletterMessage.textContent = 'Vui lòng nhập email hợp lệ để nhận ưu đãi.';
        newsletterMessage.style.color = '#ffd7d7';
        if (emailInput) emailInput.focus();
        return;
      }
      newsletterMessage.textContent = 'Cảm ơn bạn! Shop sẽ gửi ưu đãi sớm nhất có thể.';
      newsletterMessage.style.color = '#d8eddc';
      newsletterForm.reset();
    });
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
