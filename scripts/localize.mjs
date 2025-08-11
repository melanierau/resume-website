import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const SITE = 'https://www.melanie-rau.com';
const LOCALES = ['en','de','es','fr','ro'];

const CV_FILES = {
  en: 'MelanieRau-CV.pdf',
  de: 'Melanie-Rau-Lebenslauf-DE.pdf',
  es: 'Melanie-Rau-Curriculum-ES.pdf',
  fr: 'Melanie-Rau-CV-FR.pdf',
  ro: 'Melanie-Rau-CV-RO.pdf'
};

const tpl = fs.readFileSync('src/index.template.html', 'utf8');

// ensure dist and asset directories
if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });
fs.mkdirSync('dist/assets/docs/cv', { recursive: true });
fs.mkdirSync('dist/assets/img', { recursive: true });

// copy images from img folder if exists
if (fs.existsSync('img')) fs.cpSync('img', 'dist/assets/img', { recursive: true });

// copy CV pdfs from repo root into dist/assets/docs/cv
Object.values(CV_FILES).forEach(fileName => {
  const srcPath = fileName;
  const destPath = path.join('dist/assets/docs/cv', fileName);
  if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, destPath);
});

for (const lang of LOCALES) {
  const t = JSON.parse(fs.readFileSync(`i18n/${lang}.json`, 'utf8'));
  const dom = new JSDOM(tpl);
  const d = dom.window.document;

  d.documentElement.setAttribute('lang', lang);

  d.querySelectorAll('[data-translate-key]').forEach(el => {
    const key = el.getAttribute('data-translate-key');
    const val = t[key];
    if (!val) return;
    if (el.tagName === 'META' && el.hasAttribute('content')) {
      el.setAttribute('content', val);
    } else if (el.tagName === 'TITLE') {
      el.textContent = val;
    } else {
      el.innerHTML = val;
    }
  });

  d.querySelectorAll('[data-i18n-attrs]').forEach(el => {
    const pairs = el.getAttribute('data-i18n-attrs').split(';').map(s => s.trim()).filter(Boolean);
    for (const p of pairs) {
      const [attr, key] = p.split(':').map(s => s.trim());
      const val = t[key];
      if (attr && val) el.setAttribute(attr, val);
    }
  });

  // set CV link href and download attributes
  const cvLink = d.getElementById('cv-link');
  if (cvLink) {
    const name = CV_FILES[lang];
    cvLink.setAttribute('href', `/assets/docs/cv/${name}`);
    cvLink.setAttribute('download', name);
  }

  // canonical
  let canonical = d.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = d.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    d.head.appendChild(canonical);
  }
  canonical.setAttribute('href', `${SITE}/${lang}/`);

  // hreflang alternates
  d.querySelectorAll('link[rel="alternate"][hreflang]').forEach(n => n.remove());
  for (const l of LOCALES) {
    const link = d.createElement('link');
    link.setAttribute('rel','alternate');
    link.setAttribute('hreflang', l);
    link.setAttribute('href', `${SITE}/${l}/`);
    d.head.appendChild(link);
  }
  const xdef = d.createElement('link');
  xdef.setAttribute('rel','alternate');
  xdef.setAttribute('hreflang','x-default');
  xdef.setAttribute('href', `${SITE}/en/`);
  d.head.appendChild(xdef);

  const outDir = path.join('dist', lang);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), '<!DOCTYPE html>\n' + d.documentElement.outerHTML);
}

console.log('Localized pages built.');
