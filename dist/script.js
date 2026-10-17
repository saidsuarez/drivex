const slidesRoot = document.getElementById('slides');
const slides = [...document.querySelectorAll('.slide')];
const currentEl = document.getElementById('currentSlide');
const totalEl = document.getElementById('totalSlides');
const progressBar = document.getElementById('progressBar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const chapterIndex = document.getElementById('chapterIndex');
const chapterNav = document.getElementById('chapterNav');
const indexTrigger = document.getElementById('indexTrigger');
const indexClose = document.getElementById('indexClose');
const scrim = document.getElementById('scrim');
let current = 0;
let touchStart = 0;

const pad = value => String(value).padStart(2, '0');
// La portada es 00 para que el contador coincida con el número de cada capítulo.
totalEl.textContent = pad(slides.length - 1);

slides.forEach((slide, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `<span>${pad(index)}</span>${slide.dataset.title}`;
  button.addEventListener('click', () => { goTo(index); toggleIndex(false); });
  chapterNav.appendChild(button);
});

const navButtons = [...chapterNav.querySelectorAll('button')];

function updateUI(index) {
  current = index;
  currentEl.textContent = pad(index);
  progressBar.style.width = `${((index + 1) / slides.length) * 100}%`;
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === slides.length - 1;
  navButtons.forEach((button, i) => button.classList.toggle('active', i === index));
  if (location.hash !== `#${slides[index].id}`) history.replaceState(null, '', `#${slides[index].id}`);
  document.title = `${slides[index].dataset.title} — Drivex`;
}

function goTo(index) {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  slides[next].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function toggleIndex(open) {
  chapterIndex.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  chapterIndex.setAttribute('aria-hidden', String(!open));
  indexTrigger.setAttribute('aria-expanded', String(open));
  if (open) indexClose.focus(); else indexTrigger.focus();
}

// En móvil las secciones miden lo que su contenido, así que el capítulo actual
// es el que cruza una línea a media pantalla, sin importar su alto.
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) updateUI(slides.indexOf(entry.target)); });
}, { root: slidesRoot, rootMargin: '-45% 0px -54% 0px' });
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
}, { root: slidesRoot, threshold: .12 });
slides.forEach(slide => { observer.observe(slide); revealObserver.observe(slide); });
const isMobile = matchMedia('(max-width: 800px)');

prevBtn.addEventListener('click', () => goTo(current - 1));
nextBtn.addEventListener('click', () => goTo(current + 1));
document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => goTo(current + 1)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.go))));
indexTrigger.addEventListener('click', () => toggleIndex(!chapterIndex.classList.contains('open')));
indexClose.addEventListener('click', () => toggleIndex(false));
scrim.addEventListener('click', () => toggleIndex(false));

document.addEventListener('keydown', event => {
  if (lightbox.open) return;
  if (event.key === 'Escape' && chapterIndex.classList.contains('open')) return toggleIndex(false);
  if (chapterIndex.classList.contains('open')) return;
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); goTo(current + 1); }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); goTo(current - 1); }
  if (event.key === 'Home') { event.preventDefault(); goTo(0); }
  if (event.key === 'End') { event.preventDefault(); goTo(slides.length - 1); }
});

slidesRoot.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientY; }, { passive: true });
slidesRoot.addEventListener('touchend', event => {
  // En móvil el scroll es libre; el gesto no salta de capítulo.
  if (isMobile.matches) return;
  const delta = touchStart - event.changedTouches[0].clientY;
  // Let native scrolling move through slides that are taller than the screen.
  if (slides[current].offsetHeight > slidesRoot.clientHeight + 4) return;
  if (Math.abs(delta) > 70) goTo(current + (delta > 0 ? 1 : -1));
}, { passive: true });

const versionStage = document.querySelector('.version-stage');
const versionLogo = document.getElementById('versionLogo');
const versionNote = document.getElementById('versionNote');
const versions = {
  gold: ['assets/logo-gold.svg', 'Lujo / Full Color · #C5A572 en color plano. Piezas premium sobre negro mate o Navy; en impresión, foil dorado.'],
  white: ['assets/logo-white.svg', 'Monocromática blanca · #FFFFFF sobre Navy #0B2545 o negro mate.'],
  black: ['assets/logo-black.svg', 'Monocromática oscura · Negro #000000 sobre fondos claros y papelería legal en papel blanco.'],
  charcoal: ['assets/logo-charcoal.svg', 'Monocromática oscura · Gris Carbón #2E2E2E sobre fondos claros y papelería legal.']
};
document.querySelectorAll('[data-version]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.version;
  document.querySelectorAll('[data-version]').forEach(item => item.classList.toggle('active', item === button));
  versionStage.classList.add('changing');
  setTimeout(() => {
    versionStage.dataset.theme = key;
    versionLogo.src = versions[key][0];
    versionNote.textContent = versions[key][1];
    versionStage.classList.remove('changing');
  }, 180);
}));

const toast = document.getElementById('toast');
let toastTimer;
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const value = button.dataset.copy;
  const label = button.dataset.copyLabel || value;
  try { await navigator.clipboard.writeText(value); } catch { /* Clipboard may be unavailable on file:// */ }
  const hint = button.closest('.slide').querySelector('.copy-hint');
  if (hint) hint.textContent = `${label} copiado al portapapeles.`;
  toast.textContent = `${label} · copiado`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}));

// Lightbox de mockups: ampliar, recorrer y descargar cada imagen.
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxCount = document.getElementById('lightboxCount');
const lightboxDownload = document.getElementById('lightboxDownload');
const mockups = [...document.querySelectorAll('.mockup')];
let mockupIndex = 0;

function showMockup(index) {
  mockupIndex = (index + mockups.length) % mockups.length;
  const img = mockups[mockupIndex].querySelector('img');
  const src = img.getAttribute('src');
  lightboxImg.src = src;
  lightboxImg.alt = img.alt;
  lightboxCaption.textContent = mockups[mockupIndex].querySelector('figcaption').textContent;
  lightboxCount.textContent = `${pad(mockupIndex + 1)} / ${pad(mockups.length)}`;
  lightboxDownload.href = src;
  lightboxDownload.download = `drivex-mockup-${src.split('/').pop()}`;
}

mockups.forEach((figure, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mockup__open';
  button.setAttribute('aria-label', `Ampliar: ${figure.querySelector('figcaption').textContent}`);
  button.addEventListener('click', () => { showMockup(index); lightbox.showModal(); });
  figure.appendChild(button);
});

document.getElementById('lightboxClose').addEventListener('click', () => lightbox.close());
document.getElementById('lightboxPrev').addEventListener('click', () => showMockup(mockupIndex - 1));
document.getElementById('lightboxNext').addEventListener('click', () => showMockup(mockupIndex + 1));
// Clic en el fondo oscuro (fuera de la imagen y los controles) cierra.
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') showMockup(mockupIndex + 1);
  if (event.key === 'ArrowLeft') showMockup(mockupIndex - 1);
});

const initialIndex =slides.findIndex(slide => `#${slide.id}` === location.hash);
if (initialIndex > -1) setTimeout(() => goTo(initialIndex), 60);
else slides[0].classList.add('in-view');
