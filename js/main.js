const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ===== 1. Nome animado palavra por palavra ===== */
const nome = document.getElementById('nome');
nome.innerHTML = nome.textContent.trim().split(' ')
  .map((p, i) => `<span class="w" style="--i:${i}">${p}</span>`).join(' ');

/* ===== 2. Céu estrelado (canvas) ===== */
const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');
let w, h, dpr, stars = [], shoot = null, nextShoot = 4000;
let mx = 0, my = 0, tx = 0, ty = 0, lastWidth = 0;

function setup() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = canvas.width = innerWidth * dpr;
  h = canvas.height = innerHeight * dpr;
  lastWidth = innerWidth;
  // menos estrelas em telas pequenas, para ficar leve no celular
  const density = innerWidth < 700 ? 9500 : 6500;
  const total = Math.round((innerWidth * innerHeight) / density);
  // z = profundidade: estrelas mais próximas (z alto) se movem mais
  stars = Array.from({ length: total }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    z: Math.random() * 0.9 + 0.1, t: Math.random() * 6.28
  }));
}

const wrap = (v, m) => ((v % m) + m) % m;

function draw(ts = 0) {
  ctx.clearRect(0, 0, w, h);
  mx += (tx - mx) * 0.05;   // suaviza o movimento do mouse
  my += (ty - my) * 0.05;
  for (const s of stars) {
    const px = wrap(s.x - mx * s.z * 40 * dpr, w);
    const py = wrap(s.y - my * s.z * 25 * dpr - scrollY * s.z * 0.12 * dpr, h);
    const a = 0.35 + 0.65 * Math.abs(Math.sin(ts / 1100 * s.z + s.t));
    ctx.fillStyle = s.z > 0.8 ? `rgba(196,181,253,${a})` : `rgba(235,235,255,${a})`;
    ctx.beginPath();
    ctx.arc(px, py, (s.z * 1.3 + 0.3) * dpr, 0, 6.28);
    ctx.fill();
  }
  // estrela cadente de tempos em tempos
  if (!shoot && ts > nextShoot) {
    shoot = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.35, life: 0 };
  }
  if (shoot) {
    const vx = 14 * dpr, vy = 6 * dpr;
    const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - vx * 9, shoot.y - vy * 9);
    g.addColorStop(0, 'rgba(255,255,255,.9)');
    g.addColorStop(1, 'rgba(167,139,250,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6 * dpr;
    ctx.beginPath();
    ctx.moveTo(shoot.x, shoot.y);
    ctx.lineTo(shoot.x - vx * 9, shoot.y - vy * 9);
    ctx.stroke();
    shoot.x += vx; shoot.y += vy; shoot.life++;
    if (shoot.life > 70) { shoot = null; nextShoot = ts + 6000 + Math.random() * 6000; }
  }
  if (!reduceMotion) requestAnimationFrame(draw);
}

setup();
draw();
// No celular, a barra do navegador some e aparece ao rolar e dispara "resize".
// Só recriamos o céu quando a LARGURA muda (girar o aparelho, redimensionar a janela).
addEventListener('resize', () => {
  if (innerWidth === lastWidth) return;
  setup();
  if (reduceMotion) draw();
});
if (hasMouse) {
  addEventListener('pointermove', e => {
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
  });
}

/* ===== 3. Revelar elementos ao rolar a página ===== */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    revealObs.unobserve(en.target);
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ===== 4. Destacar no menu a seção atual ===== */
const links = document.querySelectorAll('.top nav a');
const navObs = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => {
      if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section, footer').forEach(s => navObs.observe(s));

/* ===== 5. Botão "Copiar e-mail" ===== */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const texto = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // alternativa para navegadores sem acesso à área de transferência
      const t = document.createElement('textarea');
      t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      document.execCommand('copy');
      t.remove();
    }
    const original = btn.textContent;
    btn.textContent = 'Copiado!';
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
});