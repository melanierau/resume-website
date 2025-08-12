// This is the main JavaScript file for the entire website.
// We wrap everything in this 'DOMContentLoaded' listener, which is a safety net.
// It makes sure the HTML page is fully loaded before we try to find and manipulate any elements on it.
document.addEventListener('DOMContentLoaded', () => {

  // --- 1) GRAB ALL THE ELEMENTS WE'LL NEED ---
  // It's a good practice to get all the HTML elements we're going to work with right at the top.
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const languageToggle = document.getElementById('language-toggle');
  const languageDropdown = document.getElementById('language-dropdown');
  const mobileLanguageSwitcher = document.getElementById('mobile-language-switcher');
  const themeToggle = document.getElementById('theme-toggle');
  const backToTopButton = document.getElementById('back-to-top');
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');
  const faqItems = document.querySelectorAll('.faq-item');

  // --- 2) CHECK USER PREFERENCES ---
  // This is a key accessibility feature. We check if the user's operating system
  // is set to "reduce motion". If it is, we'll disable animations later on.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- 3) UTILITY: DEBOUNCE ---
  // This is a classic performance-enhancing function. It stops an event (like scrolling)
  // from firing hundreds of times a second, and instead, waits for a brief pause.
  function debounce(func, delay = 100) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // --- 4) CORE UI INTERACTIONS ---

  // --- Mobile menu toggle ---
  // This makes the hamburger icon open and close the menu on phones.
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      // This part is for accessibility: it tells screen readers if the menu is open or closed.
      mobileMenuButton.setAttribute('aria-expanded', !isHidden);
    });
  }

  // --- Desktop language dropdown ---
  // This handles the language dropdown on larger screens.
  if (languageToggle && languageDropdown) {
    languageToggle.addEventListener('click', (event) => {
      event.stopPropagation(); // This stops the window's click listener from immediately closing the menu.
      const isHidden = languageDropdown.style.display === 'block';
      languageDropdown.style.display = isHidden ? 'none' : 'block';
      languageToggle.setAttribute('aria-expanded', !isHidden);
    });
  }

  // --- Close dropdowns on outside click ---
  // If you click anywhere else on the page, the language menu will close.
  window.addEventListener('click', () => {
    if (languageDropdown && languageDropdown.style.display === 'block') {
      languageDropdown.style.display = 'none';
      languageToggle?.setAttribute('aria-expanded', 'false'); // The '?' is a safety check.
    }
  });

  // --- Back-to-top button visibility ---
  // This function checks how far the user has scrolled and decides whether to show the button.
  const handleScroll = () => {
    if (!backToTopButton) return; // Safety check
    if (window.scrollY > 300) { // If scrolled more than 300 pixels...
      backToTopButton.classList.remove('opacity-0', 'pointer-events-none'); // ...make it visible and clickable.
    } else {
      backToTopButton.classList.add('opacity-0', 'pointer-events-none'); // ...otherwise, hide it.
    }
  };
  // We wrap our scroll handler in the debounce function to improve performance.
  window.addEventListener('scroll', debounce(handleScroll, 150));

  // --- 5) THEME STATE MANAGEMENT ---
  // This is a simple "state machine". It's a professional way to manage the theme (light/dark)
  // from one central place, so all parts of the site can react to changes consistently.
  const themeState = {
    _subscribers: [], // A list of functions to call when the theme changes.
    _currentTheme: 'dark',
    subscribe(callback) { this._subscribers.push(callback); },
    notify() { this._subscribers.forEach(cb => cb(this._currentTheme)); },
    setTheme(theme) {
      this._currentTheme = theme;
      localStorage.setItem('theme', theme); // Save the choice for the user's next visit.
      this.notify(); // Tell all subscribers about the change.
    }
  };

  // This variable will hold the currently active translation dictionary.
  let currentTranslations = {};

  // We "subscribe" a function to the theme state. Now, whenever the theme changes, this code will run.
  themeState.subscribe((theme) => {
    // Toggle the 'light-mode' class on the main <html> element.
    document.documentElement.classList.toggle('light-mode', theme === 'light');
    if (themeToggle) {
      // Update the button's label for screen readers, using the current language.
      const label = currentTranslations.theme_toggle_aria || 'Toggle light/dark mode';
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
    }
  });

  // When the theme toggle button is clicked, it just tells the state machine to change the theme.
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
  const translationCache = {}; // Caching translations prevents re-downloading the same file.

  // This is a smart function to figure out the best language for the user on their first visit.
  function chooseAndPersistLanguage() {
    const saved = localStorage.getItem('language');
    if (saved && supportedLanguages.includes(saved)) return saved; // Use saved language if it exists.

    // Look through all the user's browser languages to find the first one we support.
    const prefs = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language
    ].filter(Boolean);

    const match = prefs
      .map(l => l.toLowerCase().split('-')[0]) // 'en-US' becomes 'en'
      .find(l => supportedLanguages.includes(l)) || 'en'; // Find the first match, or default to 'en'.

    localStorage.setItem('language', match); // Save the detected language.
    return match;
  }

  // This is the main function that fetches and applies the language translations.
  async function applyTranslations(lang) {
    lang = lang || 'en';
    try {
      // Load English first as a fallback if it's not already in our cache.
      if (!translationCache.en) {
        const r = await fetch('/i18n/en.json');
        if (!r.ok) throw new Error('Could not load English translations!');
        translationCache.en = await r.json();
      }
      // Load the target language if it's not English and not in our cache.
      if (lang !== 'en' && !translationCache[lang]) {
        const r = await fetch(`/i18n/${lang}.json`);
        translationCache[lang] = r.ok ? await r.json() : {}; // Graceful fallback.
      }

      // Merge the target language over English. This ensures no text is ever blank.
      const dict = { ...translationCache.en, ...translationCache[lang] };
      currentTranslations = dict; // Update our global variable.

      // Update the page title and meta description for SEO.
      if (dict.meta_title) document.title = dict.meta_title;
      const md = document.querySelector('meta[name="description"]');
      if (md && dict.meta_description) md.setAttribute('content', dict.meta_description);

      // Go through every element with a 'data-translate-key' and update its content.
      document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const val = dict[key];
        if (!val) return;

        // This allows translating attributes too, like 'aria-label' or 'title'.
        const attrs = (el.dataset.translateAttr || '').split(',').map(s => s.trim()).filter(Boolean);
        if (attrs.length) {
          attrs.forEach(a => el.setAttribute(a, val));
        } else {
          el.innerHTML = val; // This allows translations to contain HTML like <span> tags.
        }
      });

      // Update the download link for the correct language-specific CV.
      const cvFileName = cvFiles[lang] || cvFiles.en;
      document.querySelectorAll('a[download]').forEach(link => {
        link.href = `assets/docs/cv/${cvFileName}`;
        link.download = cvFileName;
      });

      // Update the main <html lang=""> attribute.
      document.documentElement.lang = lang;

      // Tell the theme state to update its subscribers, like the theme toggle's ARIA label.
      themeState.notify();
    } catch (e) {
      console.error('Translation Error:', e);
    }
  }

  // This function handles clicks on any language link.
  const handleLanguageChange = (event) => {
    if (event.target.tagName === 'A' && event.target.dataset.lang) {
      event.preventDefault();
      const lang = event.target.dataset.lang;
      localStorage.setItem('language', lang); // Save the user's manual choice.
      applyTranslations(lang);
    }
  };
  languageDropdown?.addEventListener('click', handleLanguageChange);
  mobileLanguageSwitcher?.addEventListener('click', handleLanguageChange);

  // --- 7) DYNAMIC CONTENT & ANIMATIONS ---

  // --- Section fade-in ---
  // If the user hasn't requested reduced motion, set up the fade-in animations.
  if (!prefersReducedMotion) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          sectionObserver.unobserve(entry.target); // Only animate once.
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.section-fade-in').forEach(section => sectionObserver.observe(section));
  }

  // --- Number Counters ---
  function initCounters() {
    document.querySelectorAll('.counter').forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target') || '0');
      if (prefersReducedMotion) {
        counter.textContent = target; // If motion is off, just show the final number.
        return;
      }
      // Otherwise, animate from 0 to the target number.
      let current = 0;
      const increment = target / 100;
      const updateCounter = () => {
        if (current < target) {
          current += increment;
          counter.textContent = Math.ceil(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };
      updateCounter();
    });
  }

  // --- FAQ accordion ---
  if (faqItems) {
    faqItems.forEach(item => {
      const button = item.querySelector('button');
      if (!button) return;
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const wasActive = item.classList.contains('active');
        // This part makes it so only one FAQ item can be open at a time.
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

  // --- Gallery slideshow (desktop only) ---
  function initSlideshow() {
    if (window.innerWidth <= 768) return;
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
  }, { rootMargin: '-50% 0px -50% 0px' }); // This triggers when a section is in the middle of the screen.
  document.querySelectorAll('main section[id]').forEach(section => navObserver.observe(section));

  // --- 8) PARTICLE BACKGROUND ---
  if (!prefersReducedMotion && typeof THREE !== 'undefined' && window.matchMedia('(pointer:fine)').matches) {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.position.setZ(50);

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.08,
        color: new THREE.Color(0x8A2BE2),
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      const particleCount = 4000;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i++) positions[i] = (Math.random() - 0.5) * 100;

      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particleSystem);

      // We subscribe the particle color to our theme state, so it changes automatically!
      themeState.subscribe((theme) => {
        const lightColor = new THREE.Color(0x1F2937);
        const darkColor = new THREE.Color(0x8A2BE2);
        particlesMaterial.color.set(theme === 'light' ? lightColor : darkColor);
      });

      const animate = () => {
        requestAnimationFrame(animate);
        particleSystem.rotation.y += 0.00012;
        particleSystem.rotation.x += 0.00008;
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
  // This is where we run all the functions for the first time when the page loads.
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  themeState.setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

  const initialLang = chooseAndPersistLanguage();
  applyTranslations(initialLang);

  initSlideshow();
  initCounters();

});
