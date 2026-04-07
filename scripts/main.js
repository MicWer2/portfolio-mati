/* ============================================
   MATIAS GÜERNOS — PORTFOLIO JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- REVEAL ON SCROLL (Intersection Observer) ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach((el) => {
    const parent = el.parentElement;
    const siblings = parent.querySelectorAll('.reveal');
    if (siblings.length > 1) {
      const indexInGroup = Array.from(siblings).indexOf(el);
      el.dataset.delay = indexInGroup * 100;
    }
    revealObserver.observe(el);
  });


  // --- NAV SCROLL EFFECT ---
  const nav = document.getElementById('nav');

  const handleNavScroll = () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });


  // --- MOBILE NAV TOGGLE ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });


  // --- INLINE VIDEO PLAY (click to play in-place, with YT API error handling) ---
  const videoCards = document.querySelectorAll('.work-client__item[data-video]');

  function getYouTubeId(embedUrl) {
    const match = embedUrl.match(/\/embed\/([^?/]+)/);
    return match ? match[1] : '';
  }

  // Load YouTube IFrame API
  const ytScript = document.createElement('script');
  ytScript.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(ytScript);

  let ytReady = false;
  let activeVideo = null;
  let activePlayer = null;
  let playerIdCounter = 0;

  window.onYouTubeIframeAPIReady = () => { ytReady = true; };

  function stopActiveVideo() {
    if (activeVideo) {
      const prevThumb = activeVideo.querySelector('.work-client__thumb');
      const container = prevThumb.querySelector('.work-client__inline-video');
      if (container) container.remove();
      const fallback = prevThumb.querySelector('.work-client__fallback-link');
      if (fallback) fallback.remove();
      prevThumb.querySelector('.work-client__play').style.display = '';
      if (activePlayer) { try { activePlayer.destroy(); } catch(e) {} }
      activePlayer = null;
      activeVideo = null;
    }
  }

  videoCards.forEach(card => {
    card.addEventListener('click', () => {
      const videoId = getYouTubeId(card.dataset.video);
      if (!videoId) return;

      const thumb = card.querySelector('.work-client__thumb');
      const existing = thumb.querySelector('.work-client__inline-video') || thumb.querySelector('.work-client__fallback-link');

      // Toggle off if already playing
      if (existing) {
        stopActiveVideo();
        return;
      }

      // Stop any other playing video
      if (activeVideo && activeVideo !== card) {
        stopActiveVideo();
      }

      thumb.querySelector('.work-client__play').style.display = 'none';

      if (ytReady) {
        // Use YT Player API for error handling
        const wrapper = document.createElement('div');
        wrapper.className = 'work-client__inline-video';
        const playerId = 'yt-player-' + (++playerIdCounter);
        const playerDiv = document.createElement('div');
        playerDiv.id = playerId;
        wrapper.appendChild(playerDiv);
        thumb.appendChild(wrapper);

        activePlayer = new YT.Player(playerId, {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1
          },
          events: {
            onError: () => {
              // Error 150 or 153 = embedding disabled
              wrapper.remove();
              try { activePlayer.destroy(); } catch(err) {}
              activePlayer = null;

              const link = document.createElement('a');
              link.className = 'work-client__fallback-link';
              link.href = `https://www.youtube.com/watch?v=${videoId}`;
              link.target = '_blank';
              link.rel = 'noopener';
              link.innerHTML = `
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                <span>Ver en YouTube</span>
              `;
              thumb.appendChild(link);
            }
          }
        });
      } else {
        // Fallback if YT API not loaded yet: raw iframe
        const iframe = document.createElement('iframe');
        iframe.className = 'work-client__inline-video';
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('frameborder', '0');
        thumb.appendChild(iframe);
      }

      activeVideo = card;
    });
  });


  // --- 3D ARC CAROUSEL ---
  const carousel = document.getElementById('carousel');
  if (carousel) {
    const track = carousel.querySelector('.carousel__track');
    const cards = Array.from(track.querySelectorAll('.carousel__card'));
    const total = cards.length;
    let active = 0;
    let autoTimer;

    function getConfig() {
      const vw = window.innerWidth;
      return {
        // Radius of the arc — controls how spread out cards are
        radius: vw < 480 ? vw * 1.2 : vw < 768 ? vw * 0.85 : vw * 0.72,
        // Degrees between each card — larger = more spacing
        step: vw < 480 ? 24 : vw < 768 ? 20 : 16,
        // How many cards are visible on each side of center
        visibleSide: vw < 480 ? 2 : vw < 768 ? 2 : 3
      };
    }

    function updateCarousel() {
      const { radius, step, visibleSide } = getConfig();

      cards.forEach((card, i) => {
        card.classList.toggle('carousel__card--active', i === active);
        // Wrap offset so carousel loops
        let offset = i - active;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;

        const absOffset = Math.abs(offset);
        const angleDeg = offset * step;
        const angleRad = (angleDeg * Math.PI) / 180;

        // Position on arc
        const x = radius * Math.sin(angleRad);
        const z = radius * Math.cos(angleRad) - radius;

        // Rotation — cards face outward (away from center)
        const rotY = angleDeg;

        // Hide cards beyond visible range
        const isVisible = absOffset <= visibleSide + 0.5;
        const opacity = isVisible ? Math.max(1 - absOffset * 0.12, 0.3) : 0;
        const scale = Math.max(1 - absOffset * 0.04, 0.8);

        card.style.transform =
          `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
        card.style.zIndex = total - absOffset;
        card.style.opacity = opacity;
        card.style.pointerEvents = isVisible ? 'auto' : 'none';
      });
    }

    // Click to navigate (only if not dragging)
    cards.forEach((card, i) => {
      card.addEventListener('click', (e) => {
        if (hasDragged) { e.preventDefault(); return; }
        if (i !== active) {
          e.preventDefault();
          active = i;
          updateCarousel();
          resetAutoPlay();
        }
      });
    });

    // Auto-rotate — continuous loop
    function autoAdvance() {
      active = (active + 1) % total;
      updateCarousel();
    }

    function resetAutoPlay() {
      clearInterval(autoTimer);
      autoTimer = setInterval(autoAdvance, 3000);
    }

    // Drag-to-scroll con momentum
    const DRAG_THRESHOLD = 55;
    let startX = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let dragAccum = 0;
    let isDragging = false;
    let hasDragged = false;

    carousel.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      lastX = e.clientX;
      lastTime = Date.now();
      velocity = 0;
      dragAccum = 0;
      isDragging = true;
      hasDragged = false;
      carousel.classList.add('is-dragging');
      carousel.setPointerCapture(e.pointerId);
      clearInterval(autoTimer);
    });

    carousel.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const now = Date.now();
      const dt = now - lastTime || 1;
      velocity = (e.clientX - lastX) / dt; // px/ms
      lastX = e.clientX;
      lastTime = now;

      const delta = e.clientX - startX;
      const diff = delta - dragAccum;

      if (Math.abs(diff) >= DRAG_THRESHOLD) {
        const steps = Math.trunc(diff / DRAG_THRESHOLD);
        active = ((active - steps) % total + total) % total;
        updateCarousel();
        dragAccum += steps * DRAG_THRESHOLD;
        hasDragged = true;
      }
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      carousel.classList.remove('is-dragging');

      // Momentum: si la velocidad era alta, avanza 1-2 cards más
      const speed = Math.abs(velocity);
      if (hasDragged && speed > 0.4) {
        const extra = speed > 1.2 ? 2 : 1;
        const dir = velocity > 0 ? -1 : 1;
        let step = 0;
        const momentum = setInterval(() => {
          if (step >= extra) { clearInterval(momentum); return; }
          active = ((active + dir) % total + total) % total;
          updateCarousel();
          step++;
        }, 120);
      }

      resetAutoPlay();
    };

    carousel.addEventListener('pointerup', endDrag);
    carousel.addEventListener('pointercancel', endDrag);

    updateCarousel();
    resetAutoPlay();

    window.addEventListener('resize', updateCarousel);
  }


  // --- SMOOTH SCROLL FOR ANCHOR LINKS ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });


  // --- LANGUAGE TOGGLE (i18n) ---
  const translations = {
    es: {
      'nav.about': 'Sobre mí',
      'nav.contact': 'Contacto',
      'hero.heading': 'Marketing <span class="text-accent">estratégico,</span><br>con visión de <span class="text-accent">negocio</span>',
      'carousel.1': 'Estrategia de crecimiento de comunidad',
      'carousel.2': 'Campañas de alto impacto',
      'carousel.3': 'Contenido para multinacionales',
      'carousel.4': 'Video publicitario de alta retención',
      'carousel.5': 'Producción audiovisual para redes',
      'carousel.6': 'Reels y TikToks virales',
      'carousel.7': 'Diseño de activos digitales',
      'carousel.8': 'Estrategia de contenido con IA',
      'carousel.9': 'Layouts publicitarios creativos',
      'carousel.10': 'Branding y posicionamiento digital',
      'about.heading': 'Hola, soy Matias',
      'about.text1': 'Soy Licenciado en Comercialización con especialización en Marketing. Mi enfoque no es solo crear videos, sino diseñar soluciones que conviertan seguidores en clientes.',
      'about.text2': 'Me mantengo a la vanguardia con el uso de Inteligencia Artificial y las últimas tendencias de consumo para asegurar que cada pieza de contenido sea relevante y eficiente.',
      'about.text3': 'Cuento con experiencia comprobable potenciando marcas en diversos sectores:',
      'about.list1': '<strong>ZN PRO:</strong> Estrategia de crecimiento exponencial de comunidad.',
      'about.list2': '<strong>Infinity Racing:</strong> Gestión de contenido para una empresa multinacional.',
      'about.list3': '<strong>Autocentro ANG & Wer Studio:</strong> Desarrollo de activos digitales de alta retención.',
      'about.cta': 'Ver casos de éxito',
      'skills.title': 'Diseño, <span class="text-accent">edición</span><br>y estrategia de <span class="text-accent">contenido.</span>',
      'skills.card1.title': 'Diseño Gráfico',
      'skills.card1.desc': 'Desarrollo de diseños publicitarios, banners para sitios web, redes sociales, diseño visual, presentaciones, etc.',
      'skills.card1.foot': 'Herramientas de Diseño',
      'skills.card2.title': 'Edición de Video',
      'skills.card2.desc': 'Edición de video y layouts publicitarios para redes sociales (TikTok, Reels, Instagram) y canales de YouTube.',
      'skills.card2.foot': 'Post-Producción',
      'skills.card3.title': 'Estrategia de Contenido',
      'skills.card3.desc': 'Planificación estratégica basada en datos, tendencias de consumo e inteligencia artificial para máximo impacto.',
      'skills.card3.foot': 'Marketing Digital',
      'work.zn.desc': 'Estrategia de crecimiento exponencial de comunidad. Creación de contenido orgánico y campañas de alto impacto.',
      'work.infinity.desc': 'Gestión de contenido para una empresa multinacional. Producción audiovisual y estrategia de redes sociales.',
      'work.ang.desc': 'Desarrollo de activos digitales de alta retención. Edición de video publicitario y contenido para redes.',
      'work.wer.desc': 'Diseño de estrategias de contenido y producción audiovisual para marcas en diversos sectores.',
      'contact.heading': '¿Tenés un proyecto en mente?<br>Hablemos.',
      'contact.sub': 'Estrategia de contenido y producción audiovisual para tu marca',
      'footer': '&copy; 2026 Matias Güernos. Todos los derechos reservados.'
    },
    en: {
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'hero.heading': 'Strategic <span class="text-accent">marketing,</span><br>with a business <span class="text-accent">vision</span>',
      'carousel.1': 'Community growth strategy',
      'carousel.2': 'High-impact campaigns',
      'carousel.3': 'Content for multinationals',
      'carousel.4': 'High-retention advertising video',
      'carousel.5': 'Audiovisual production for social media',
      'carousel.6': 'Viral Reels & TikToks',
      'carousel.7': 'Digital asset design',
      'carousel.8': 'AI-powered content strategy',
      'carousel.9': 'Creative advertising layouts',
      'carousel.10': 'Branding & digital positioning',
      'about.heading': "Hi, I'm Matias",
      'about.text1': "I hold a degree in Marketing & Business. My focus isn't just creating videos — it's designing solutions that turn followers into customers.",
      'about.text2': 'I stay ahead of the curve using Artificial Intelligence and the latest consumer trends to ensure every piece of content is relevant and efficient.',
      'about.text3': 'I have proven experience empowering brands across various industries:',
      'about.list1': '<strong>ZN PRO:</strong> Exponential community growth strategy.',
      'about.list2': '<strong>Infinity Racing:</strong> Content management for a multinational company.',
      'about.list3': '<strong>Autocentro ANG & Wer Studio:</strong> High-retention digital asset development.',
      'about.cta': 'View success stories',
      'skills.title': 'Design, <span class="text-accent">editing</span><br>& content <span class="text-accent">strategy.</span>',
      'skills.card1.title': 'Graphic Design',
      'skills.card1.desc': 'Advertising design, website banners, social media assets, visual design, presentations, and more.',
      'skills.card1.foot': 'Design Tools',
      'skills.card2.title': 'Video Editing',
      'skills.card2.desc': 'Video editing and advertising layouts for social media (TikTok, Reels, Instagram) and YouTube channels.',
      'skills.card2.foot': 'Post-Production',
      'skills.card3.title': 'Content Strategy',
      'skills.card3.desc': 'Data-driven strategic planning, consumer trends, and artificial intelligence for maximum impact.',
      'skills.card3.foot': 'Digital Marketing',
      'work.zn.desc': 'Exponential community growth strategy. Organic content creation and high-impact campaigns.',
      'work.infinity.desc': 'Content management for a multinational company. Audiovisual production and social media strategy.',
      'work.ang.desc': 'High-retention digital asset development. Advertising video editing and social media content.',
      'work.wer.desc': 'Content strategy design and audiovisual production for brands across various industries.',
      'contact.heading': 'Have a project in mind?<br>Let\'s talk.',
      'contact.sub': 'Content strategy and audiovisual production for your brand',
      'footer': '&copy; 2026 Matias Güernos. All rights reserved.'
    }
  };

  let currentLang = localStorage.getItem('lang') || 'es';
  const langToggle = document.getElementById('langToggle');

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    document.documentElement.lang = lang === 'es' ? 'es' : 'en';

    // Update toggle active state
    langToggle.querySelectorAll('.lang-toggle__option').forEach(opt => {
      opt.classList.toggle('lang-toggle__option--active', opt.dataset.lang === lang);
    });
  }

  langToggle.addEventListener('click', () => {
    setLanguage(currentLang === 'es' ? 'en' : 'es');
  });

  // Apply saved language on load
  if (currentLang !== 'es') {
    setLanguage(currentLang);
  }

});
