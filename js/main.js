// This is the main JavaScript file for the entire website.
// We wrap everything in this 'DOMContentLoaded' listener, which is a safety net.
// It makes sure the HTML page is fully loaded before we try to find and manipulate any elements on it.
document.addEventListener('DOMContentLoaded', () => {

  // --- 1) GRAB ALL THE ELEMENTS WE'LL NEED ---
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const languageToggle = document.getElementById('language-toggle');
  const languageDropdown = document.getElementById('language-dropdown');
  const mobileLanguageSwitcher = document.getElementById('mobile-language-switcher');
  const themeToggle = document.getElementById('theme-toggle');
  const backToTopButton = document.getElementById('back-to-top');
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');
  const faqItems = document.querySelectorAll('.faq-item');
  const follower = document.getElementById('mouse-follower');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');


  // --- 2) CHECK USER PREFERENCES ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- 3) UTILITY: DEBOUNCE ---
  // This function prevents another function from running too frequently.
  // It's used on the scroll event to improve performance.
  function debounce(func, delay = 100) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // --- 4) CORE UI INTERACTIONS ---

  // --- Mobile menu toggle ---
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      mobileMenuButton.setAttribute('aria-expanded', !isHidden);
    });
  }

  // --- Desktop language dropdown ---
  if (languageToggle && languageDropdown) {
    languageToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isHidden = languageDropdown.style.display === 'block';
      languageDropdown.style.display = isHidden ? 'none' : 'block';
      languageToggle.setAttribute('aria-expanded', !isHidden);
    });
  }

  // --- Close dropdowns on outside click ---
  window.addEventListener('click', () => {
    if (languageDropdown && languageDropdown.style.display === 'block') {
      languageDropdown.style.display = 'none';
      languageToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // --- Back-to-top button visibility ---
  const handleScroll = () => {
    if (!backToTopButton) return;
    if (window.scrollY > 300) {
      backToTopButton.classList.remove('opacity-0', 'pointer-events-none');
    } else {
      backToTopButton.classList.add('opacity-0', 'pointer-events-none');
    }
  };
  window.addEventListener('scroll', debounce(handleScroll, 150));

  // --- Mouse Follower Logic ---
  if (follower) {
    document.addEventListener('mousemove', (e) => {
      requestAnimationFrame(() => {
        follower.style.left = `${e.clientX}px`;
        follower.style.top = `${e.clientY}px`;
      });
    });
  }

  // --- 5) THEME STATE MANAGEMENT ---
  const themeState = {
    _subscribers: [],
    _currentTheme: 'dark',
    subscribe(callback) { this._subscribers.push(callback); },
    notify() { this._subscribers.forEach(cb => cb(this._currentTheme)); },
    setTheme(theme) {
      this._currentTheme = theme;
      localStorage.setItem('theme', theme);
      this.notify();
    }
  };

  let currentTranslations = {};

  themeState.subscribe((theme) => {
    document.documentElement.classList.toggle('light-mode', theme === 'light');
    
    if (sunIcon && moonIcon) {
        sunIcon.style.display = theme === 'light' ? 'block' : 'none';
        moonIcon.style.display = theme === 'light' ? 'none' : 'block';
    }

    if (themeToggle) {
      const label = currentTranslations.theme_toggle_aria || 'Toggle light/dark mode';
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
    }
  });

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = themeState._currentTheme === 'light' ? 'dark' : 'light';
      themeState.setTheme(nextTheme);
    });
  }

  // --- 6) INTERNATIONALIZATION (I18N) ---
  const supportedLanguages = ['en', 'de', 'es', 'fr', 'ro'];
  const cvFiles = {
    en: 'MelanieRau-CV.pdf',
    de: 'Melanie-Rau-Lebenslauf-DE.pdf',
    es: 'Melanie-Rau-Curriculum-ES.pdf',
    fr: 'Melanie-Rau-CV-FR.pdf',
    ro: 'Melanie-Rau-CV-RO.pdf'
  };
  const translationCache = {};

  // This function fetches all language files in the background.
  async function preloadTranslations() {
    await Promise.all(supportedLanguages.map(async (lang) => {
      if (!translationCache[lang]) { 
        try {
          const response = await fetch(`i18n/${lang}.json`);
          if (response.ok) {
            translationCache[lang] = await response.json();
          } else {
            console.error(`Failed to preload translation for: ${lang}`);
          }
        } catch (error) {
          console.error(`Error preloading translation for ${lang}:`, error);
        }
      }
    }));
  }

  function chooseAndPersistLanguage() {
    const saved = localStorage.getItem('language');
    if (saved && supportedLanguages.includes(saved)) return saved;
    const prefs = [...(Array.isArray(navigator.languages) ? navigator.languages : []), navigator.language].filter(Boolean);
    const match = prefs.map(l => l.toLowerCase().split('-')[0]).find(l => supportedLanguages.includes(l)) || 'en';
    localStorage.setItem('language', match);
    return match;
  }

  async function applyTranslations(lang) {
    lang = lang || 'en';
    try {
      if (!translationCache[lang]) {
        const r = await fetch(`i18n/${lang}.json`);
        if (!r.ok) throw new Error(`Could not load translations for ${lang}!`);
        translationCache[lang] = await r.json();
      }
      
      const dict = { ... (translationCache.en || {}), ... (translationCache[lang] || {}) };
      currentTranslations = dict;
      
      if (dict.meta_title) document.title = dict.meta_title;
      const md = document.querySelector('meta[name="description"]');
      if (md && dict.meta_description) md.setAttribute('content', dict.meta_description);
      
      document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const val = dict[key];
        if (!val) return;
        const attrs = (el.dataset.translateAttr || '').split(',').map(s => s.trim()).filter(Boolean);
        if (attrs.length) {
          attrs.forEach(a => el.setAttribute(a, val));
        } else {
          el.innerHTML = val;
        }
      });
      
      const cvFileName = cvFiles[lang] || cvFiles.en;
      document.querySelectorAll('a[download]').forEach(link => {
        link.href = `assets/docs/cv/${cvFileName}`;
        link.download = cvFileName;
      });
      
      document.documentElement.lang = lang;
      themeState.notify();
    } catch (e) {
      console.error('Translation Error:', e);
    }
  }

  const handleLanguageChange = (event) => {
    if (event.target.tagName === 'A' && event.target.dataset.lang) {
      event.preventDefault();
      const lang = event.target.dataset.lang;
      localStorage.setItem('language', lang);
      applyTranslations(lang);
    }
  };
  languageDropdown?.addEventListener('click', handleLanguageChange);
  mobileLanguageSwitcher?.addEventListener('click', handleLanguageChange);

  // --- 7) DYNAMIC CONTENT & ANIMATIONS ---

  // --- Section fade-in and Counter Animation Trigger ---
  if (!prefersReducedMotion) {
    const animationObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.id === 'impact' || entry.target.id === 'case-studies') {
            initCounters(entry.target);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.section-fade-in').forEach(section => {
      animationObserver.observe(section);
    });
  }

  // --- Number Counters (Sequential & Slower) ---
  async function initCounters(section) {
    const counters = section.querySelectorAll('.counter');
    if (counters.length === 0) return;

    const duration = 2000;
    const delayBetweenCounters = 500;

    const animateCounter = (counter) => {
      return new Promise(resolve => {
        const target = parseFloat(counter.getAttribute('data-target') || '0');
        if (prefersReducedMotion) {
          counter.textContent = target;
          resolve();
          return;
        }
        let startTimestamp = null;
        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          counter.textContent = Math.floor(progress * target);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            counter.textContent = target;
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    };

    for (const counter of counters) {
      await animateCounter(counter);
      await new Promise(resolve => setTimeout(resolve, delayBetweenCounters));
    }
  }

  // --- FAQ accordion ---
  if (faqItems) {
    faqItems.forEach(item => {
      const button = item.querySelector('button');
      if (!button) return;
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const wasActive = item.classList.contains('active');
        faqItems.forEach(other => {
          other.classList.remove('active');
          other.querySelector('button')?.setAttribute('aria-expanded', 'false');
        });
        if (!wasActive) {
          item.classList.add('active');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // --- Gallery slideshow ---
  function initSlideshow() {
    const slideshow = document.querySelector('.gallery-slideshow');
    if (!slideshow) return;
    let slideIndex = 1;
    const slides = slideshow.getElementsByClassName('mySlides');
    const thumbsWrap = document.querySelector('.gallery-thumbs');
    if (!thumbsWrap) return;
    const thumbs = thumbsWrap.getElementsByClassName('thumb');
    function showSlides(n) {
      if (n > slides.length) slideIndex = 1;
      if (n < 1) slideIndex = slides.length;
      for (let i = 0; i < slides.length; i++) slides[i].style.display = 'none';
      for (let i = 0; i < thumbs.length; i++) thumbs[i].classList.remove('active');
      slides[slideIndex - 1].style.display = 'block';
      if (thumbs[slideIndex - 1]) thumbs[slideIndex - 1].classList.add('active');
    }
    slideshow.querySelector('.prev')?.addEventListener('click', () => showSlides(slideIndex += -1));
    slideshow.querySelector('.next')?.addEventListener('click', () => showSlides(slideIndex += 1));
    for (let i = 0; i < thumbs.length; i++) {
      thumbs[i].addEventListener('click', () => showSlides(slideIndex = i + 1));
    }
    showSlides(slideIndex);
  }

  // --- Active nav link highlighting on scroll ---
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('active-link');
          if (link.getAttribute('href').substring(1) === entry.target.id) {
            link.classList.add('active-link');
          }
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => navObserver.observe(section));

  // --- 8) INTERACTIVE PARTICLE BACKGROUND ---
  if (!prefersReducedMotion && typeof THREE !== 'undefined' && window.matchMedia('(pointer:fine)').matches) {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.position.setZ(50);

      function createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
      }

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        map: createStarTexture(),
        color: new THREE.Color(0x8A2BE2),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const particleCount = 7000;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i++) positions[i] = (Math.random() - 0.5) * 100;
      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particleSystem);

      themeState.subscribe((theme) => {
        const lightColor = new THREE.Color(0x1F2937);
        const darkColor = new THREE.Color(0x8A2BE2);
        particlesMaterial.color.set(theme === 'light' ? lightColor : darkColor);
      });

      let mouseX = 0, mouseY = 0;
      document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      });

      const animate = () => {
        requestAnimationFrame(animate);
        particleSystem.rotation.y = -mouseX * 0.1;
        particleSystem.rotation.x = -mouseY * 0.1;
        particleSystem.rotation.y += 0.0001;
        renderer.render(scene, camera);
      };
      animate();

      window.addEventListener('resize', debounce(() => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }, 150));
    }
  }

  // --- 9) INITIALIZATION ---
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  themeState.setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

  const initialLang = chooseAndPersistLanguage();
  applyTranslations(initialLang);

  initSlideshow();
  
  window.addEventListener('load', () => {
    preloadTranslations();
  });
});
