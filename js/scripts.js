// js/scripts.js
document.addEventListener('DOMContentLoaded', () => {
  // language dropdown
  const toggle = document.getElementById('language-toggle');
  const dd = document.getElementById('language-dropdown');
  if (toggle && dd) {
    toggle.addEventListener('click', () => dd.classList.toggle('hidden'));
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target) && !toggle.contains(e.target)) dd.classList.add('hidden');
    });
  }

  // fun counters
  document.querySelectorAll('.counter').forEach((el) => {
    const target = Number(el.dataset.target || '0');
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const tick = () => {
      current = Math.min(target, current + step);
      el.textContent = current;
      if (current < target) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});
