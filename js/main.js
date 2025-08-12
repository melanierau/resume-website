// This is the main JavaScript file for the entire website.
// It's wrapped in a 'DOMContentLoaded' listener to ensure the HTML is fully loaded before the script runs.
document.addEventListener('DOMContentLoaded', () => {

  // --- 1. GRAB ALL THE ELEMENTS WE NEED ---
  // Getting all our HTML elements at the start makes the code cleaner and a tiny bit faster.
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const languageToggle = document.getElementById('language-toggle');
  const languageDropdown = document.getElementById('language-dropdown');
  const mobileLanguageSwitcher = document.getElementById('mobile-language-switcher');
  const themeToggle = document.getElementById('theme-toggle'); // You'll need to add this button to your HTML
  const backToTopButton = document.getElementById('back-to-top');
  const navLinks = document.querySelectorAll('header nav a[href^="#"]'); // Get all nav links that point to a section
  const faqItems = document.querySelectorAll('.faq-item'); // Get all FAQ items for the accordion

  // --- 2. CHECK FOR USER PREFERENCES ---
  // This is a modern best practice for accessibility and a better user experience.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // --- 3. UTILITY FUNCTIONS (PRO TECHNIQUE: DEBOUNCING) ---
  // This is a performance-enhancing utility. It prevents a function from firing too often.
  // For example, it stops the scroll event from running hundreds of times as you scroll.
  function debounce(func, delay = 100) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // --- 4. CORE UI INTERACTIONS (WITH ACCESSIBILITY) ---

  // --- Mobile Menu Toggle (with ARIA) ---
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      // PRO TECHNIQUE: Update ARIA attribute for screen readers.
      mobileMenuButton.setAttribute('aria-expanded', !isHidden);
    });
  }

  // --- Desktop Language Dropdown ---
  if (languageToggle && languageDropdown) {
    languageToggle.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevents the click from closing the menu immediately
      const isHidden = languageDropdown.style.display === 'block';
      languageDropdown.style.display = isHidden ? 'none' : 'block';
      languageToggle.setAttribute('aria-expanded', !isHidden);
    });
  }

  // --- Close dropdowns when clicking elsewhere ---
  window.addEventListener('click', () => {
    if (languageDropdown && languageDropdown.style.display === 'block') {
      languageDropdown.style.display = 'none';
      languageToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // --- Back to Top Button Logic (with Debounce) ---
  const handleScroll = () => {
    if (backToTopButton) {
      if (window.scrollY > 300) {
        backToTopButton.classList.remove('opacity-0', 'pointer-events-none');
      } else {
        backToTopButton.classList.add('opacity-0', 'pointer-events-none');
      }
    }
  };
  window.addEventListener('scroll', debounce(handleScroll, 150));


  // --- 5. STATE MANAGEMENT & THEME SYSTEM (PRO TECHNIQUE: STATE MACHINE) ---

  // A simple "state machine" for our theme. This gives us one central place to manage the theme.
  const themeState = {
    _subscribers: [],
    _currentTheme: 'dark',
    subscribe(callback) {
      this._subscribers.push(callback);
    },
    notify() {
      this._subscribers.forEach(callback => callback(this._currentTheme));
    },
    setTheme(theme) {
      this._currentTheme = theme;
      localStorage.setItem('theme', theme);
      this.notify();
    }
  };

  // Subscribe our UI updates to the theme state.
  themeState.subscribe((theme) => {
    document.documentElement.classList.toggle('light-mode', theme === 'light');
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', theme === 'light' ? 'Activate dark mode' : 'Activate light mode');
    }
  });

  // The theme toggle button now just updates the central state.
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = themeState._currentTheme === 'light' ? 'dark' : 'light';
      themeState.setTheme(newTheme);
    });
  }
  
  // --- 6. TRANSLATION SYSTEM (WITH GRACEFUL ERROR HANDLING) ---

  const cvFiles = {
    en: 'MelanieRau-CV.pdf',
    de: 'Melanie-Rau-Lebenslauf-DE.pdf',
    es: 'Melanie-Rau-Curriculum-ES.pdf',
    fr: 'Melanie-Rau-CV-FR.pdf',
    ro: 'Melanie-Rau-CV-RO.pdf'
  };
  const translationCache = {};

  async function applyTranslations(lang) {
    lang = lang || 'en';
    try {
      if (!translationCache.en) {
        const response = await fetch('/i18n/en.json');
        if (!response.ok) throw new Error('Could not load English translations!');
        translationCache.en = await response.json();
      }
      if (lang !== 'en' && !translationCache[lang]) {
        const response = await fetch(`/i18n/${lang}.json`);
        // PRO TECHNIQUE: Graceful fallback. If a language file fails, we use an empty object and the site will just show English text.
        translationCache[lang] = response.ok ? await response.json() : {};
      }
      const finalTranslations = { ...translationCache.en, ...translationCache[lang] };

      document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.getAttribute('data-translate-key');
        if (finalTranslations[key]) el.innerHTML = finalTranslations[key];
      });

      const cvFileName = cvFiles[lang] || cvFiles['en'];
      document.querySelectorAll('a[download]').forEach(link => {
        link.href = `assets/docs/cv/${cvFileName}`;
        link.download = cvFileName;
      });

      document.documentElement.lang = lang;
      localStorage.setItem('language', lang);
      initCounters();
    } catch (error) {
      console.error("Translation Error:", error);
      // You could add a user-facing error message here if you wanted.
    }
  }

  const handleLanguageChange = (event) => {
    if (event.target.tagName === 'A' && event.target.dataset.lang) {
      event.preventDefault();
      const lang = event.target.dataset.lang;
      applyTranslations(lang);
    }
  };
  if (languageDropdown) languageDropdown.addEventListener('click', handleLanguageChange);
  if (mobileLanguageSwitcher) mobileLanguageSwitcher.addEventListener('click', handleLanguageChange);


  // --- 7. DYNAMIC CONTENT & ANIMATIONS (MOTION-AWARE & ACCESSIBLE) ---

  if (!prefersReducedMotion) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.section-fade-in').forEach(section => sectionObserver.observe(section));
  }

  function initCounters() {
    document.querySelectorAll('.counter').forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target') || '0');
      if (prefersReducedMotion) {
        counter.textContent = target;
        return;
      }
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
  
  // --- FAQ Accordion (with ARIA) ---
  if (faqItems) {
    faqItems.forEach(item => {
      const button = item.querySelector('button'); // Assuming you change the h3 to a button for accessibility
      if(button) {
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
      }
    });
  }

  // --- Image Gallery Slideshow (Desktop Only) ---
  function initSlideshow() {
    // Don't run this on mobile devices.
    if (window.innerWidth <= 768) return;

    const slideshow = document.querySelector('.gallery-slideshow');
    // If there's no slideshow on the page, stop.
    if (!slideshow) return;

    let slideIndex = 1;
    const slides = slideshow.getElementsByClassName("mySlides");
    const thumbs = document.querySelector('.gallery-thumbs').getElementsByClassName("thumb");

    function showSlides(n) {
      // Handle looping back to the start or end.
      if (n > slides.length) { slideIndex = 1; }
      if (n < 1) { slideIndex = slides.length; }

      // Hide all the main images.
      for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
      }
      // Remove the "active" look from all thumbnails.
      for (let i = 0; i < thumbs.length; i++) {
        thumbs[i].classList.remove("active");
      }

      // Show the correct slide and highlight the correct thumbnail.
      slides[slideIndex - 1].style.display = "block";
      if (thumbs[slideIndex - 1]) {
        thumbs[slideIndex - 1].classList.add("active");
      }
    }

    // Wire up the next/previous buttons.
    slideshow.querySelector('.prev').addEventListener('click', () => showSlides(slideIndex += -1));
    slideshow.querySelector('.next').addEventListener('click', () => showSlides(slideIndex += 1));
    
    // Wire up the thumbnail images.
    for (let i = 0; i < thumbs.length; i++) {
        thumbs[i].addEventListener('click', () => showSlides(slideIndex = i + 1));
    }

    // Show the first slide to start.
    showSlides(slideIndex);
  }

  // --- Active Navigation Link Highlighting ---
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
  }, { rootMargin: "-50% 0px -50% 0px" });
  document.querySelectorAll('main section[id]').forEach(section => navObserver.observe(section));


  // --- 8. 3D PARTICLE BACKGROUND (MOTION-AWARE & THEME-AWARE) ---
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
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 100;
      }
      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particleSystem);
      
      // Subscribe the particle color to our theme state machine!
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


  // --- 9. INITIALIZATION ---
  // Run all the necessary functions when the page first loads.
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  themeState.setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
  
  const initialLang = localStorage.getItem('language') || 'en';
  applyTranslations(initialLang);
  
  initSlideshow(); // Now we can safely call this.

});
