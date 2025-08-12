// Client-side i18n loader + SEO tags + CV link switcher

const SITE = 'https://www.melanie-rau.com';
const LOCALES = ['en', 'de', 'es', 'fr', 'ro'];
const CV_FILES = {
  en: 'MelanieRau-CV.pdf',
  de: 'Melanie-Rau-Lebenslauf-DE.pdf',
  es: 'Melanie-Rau-Curriculum-ES.pdf',
  fr: 'Melanie-Rau-CV-FR.pdf',
  ro: 'Melanie-Rau-CV-RO.pdf'
};

// Infer language from first path segment; default to en
function getPathLang() {
  const seg = (location.pathname.split('/')[1] || '').toLowerCase();
  return LOCALES.includes(seg) ? seg : 'en';
}

async function loadTranslations(lang) {
  const res = await fetch(`/i18n/${lang}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load /i18n/${lang}.json`);
  return res.json();
}

function applyTranslations(lang, t) {
  document.documentElement.lang = lang;

  // Elements with innerHTML/text content
  document.querySelectorAll('[data-translate-key]').forEach(el => {
    const key = el.getAttribute('data-translate-key');
    const val = t[key];
    if (val == null) return;
    if (el.tagName === 'TITLE') el.textContent = val;
    else if (el.tagName === 'META' && el.hasAttribute('content')) el.setAttribute('content', val);
    else el.innerHTML = val;
  });

  // Attribute mappings
  document.querySelectorAll('[data-i18n-attrs]').forEach(el => {
    el.getAttribute('data-i18n-attrs')
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        const val = t[key];
        if (attr && val != null) el.setAttribute(attr, val);
      });
  });

  // CV link per locale
  const cv = document.getElementById('cv-link');
  if (cv) {
    const file = CV_FILES[lang] || CV_FILES.en;
    cv.setAttribute('href', `/assets/docs/cv/${file}`);
    cv.setAttribute('download', file);
  }
}

function ensureSeoLinks(lang) {
  // canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = `${SITE}/${lang}/`;

  // hreflang alternates
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(n => n.remove());
  LOCALES.forEach(l => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = l;
    link.href = `${SITE}/${l}/`;
    document.head.appendChild(link);
  });
  const xdef = document.createElement('link');
  xdef.rel = 'alternate';
  xdef.hreflang = 'x-default';
  xdef.href = `${SITE}/en/`;
  document.head.appendChild(xdef);
}

(async () => {
  const lang = getPathLang();
  try {
    const t = await loadTranslations(lang);
    applyTranslations(lang, t);
    ensureSeoLinks(lang);
  } catch (e) {
    console.error(e);
  }
})();
