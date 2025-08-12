document.addEventListener('DOMContentLoaded', () => {

  // --- 1. CORE UI INTERACTIONS ---

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  }

  // Language dropdown toggle
  const languageToggle = document.getElementById('language-toggle');
  const languageDropdown = document.getElementById('language-dropdown');
  if (languageToggle && languageDropdown) {
    languageToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      languageDropdown.style.display = languageDropdown.style.display === 'block' ? 'none' : 'block';
    });
    window.addEventListener('click', () => {
      if (languageDropdown.style.display === 'block') {
        languageDropdown.style.display = 'none';
      }
    });
  }


  // --- 2. DYNAMIC CONTENT & ANIMATIONS ---

  // Section fade-in on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.section-fade-in').forEach(section => observer.observe(section));

  // Function to animate counters
  function initCounters() {
    document.querySelectorAll('.counter').forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target') || '0');
      let current = 0;
      const increment = target / 100; // Animate over ~100 frames

      const updateCounter = () => {
        if (current < target) {
          current += increment;
          counter.textContent = Math.ceil(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target; // Ensure it ends exactly on target
        }
      };
      updateCounter();
    });
  }

  // Function to initialise the image gallery slideshow (desktop only)
  function initSlideshow() {
    if (window.innerWidth <= 768) return; // Only run on desktop

    const slideshow = document.querySelector('.gallery-slideshow');
    if (!slideshow) return;

    let slideIndex = 1;
    const slides = slideshow.getElementsByClassName("mySlides");
    const thumbs = document.querySelector('.gallery-thumbs').getElementsByClassName("thumb");

    function showSlides(n) {
      if (n > slides.length) { slideIndex = 1; }
      if (n < 1) { slideIndex = slides.length; }

      for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
      }
      for (let i = 0; i < thumbs.length; i++) {
        thumbs[i].className = thumbs[i].className.replace(" active", "");
      }

      slides[slideIndex - 1].style.display = "block";
      if (thumbs[slideIndex - 1]) {
        thumbs[slideIndex - 1].className += " active";
      }
    }

    slideshow.querySelector('.prev').addEventListener('click', () => showSlides(slideIndex += -1));
    slideshow.querySelector('.next').addEventListener('click', () => showSlides(slideIndex += 1));
    
    for (let i = 0; i < thumbs.length; i++) {
        thumbs[i].addEventListener('click', () => showSlides(slideIndex = i + 1));
    }

    showSlides(slideIndex);
  }


  // --- 3. TRANSLATION SYSTEM (FETCH-BASED) ---

  const translationCache = {};

  async function applyTranslations(lang) {
    lang = lang || 'en';

    try {
      if (!translationCache.en) {
        const response = await fetch('/i18n/en.json');
        if (!response.ok) throw new Error('English translation file not found');
        translationCache.en = await response.json();
      }

      if (lang !== 'en' && !translationCache[lang]) {
        const response = await fetch(`/i18n/${lang}.json`);
        translationCache[lang] = response.ok ? await response.json() : {};
      }

      const finalTranslations = Object.assign({}, translationCache.en, translationCache[lang]);

      document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.getAttribute('data-translate-key');
        if (finalTranslations[key]) {
          el.innerHTML = finalTranslations[key];
        }
      });

      document.documentElement.lang = lang;
      localStorage.setItem('language', lang);
      initCounters(); // Re-run counters after text might have changed

    } catch (error) {
      console.error('Failed to apply translations:', error);
    }
  }

  // Wire up the language menu to trigger translations
  if (languageDropdown) {
    languageDropdown.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        const lang = e.target.getAttribute('data-lang');
        applyTranslations(lang);
      }
    });
  }


  // --- 4. INITIALIZATION ---

  // Initial page load calls
  const initialLang = localStorage.getItem('language') || 'en';
  applyTranslations(initialLang);
  initSlideshow();

  // Load Three.js particles on desktop only
  if (typeof THREE !== 'undefined' && window.matchMedia('(pointer:fine)').matches) {
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.position.setZ(50);

      const particleCount = 4000;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 100;
      }

      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
          size: 0.08,
          color: new THREE.Color(0x8A2BE2),
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending
      });
      
      const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particleSystem);

      const animate = () => {
        requestAnimationFrame(animate);
        particleSystem.rotation.y += 0.00012;
        particleSystem.rotation.x += 0.00008;
        renderer.render(scene, camera);
      };
      animate();

      window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      });
    }
  }

});
