// main.js - ponto de entrada
import { onRouteChange, navigate } from './router.js';
import { debounce } from './utils.js';
import { renderDashboard } from './views/dashboard.js';
import { renderOSList } from './views/os-list.js';
import { renderOSForm } from './views/os-form.js';
import { renderOSView } from './views/os-view.js';
import { renderWarranty } from './views/warranty.js';
import { renderClients } from './views/clients.js';
import { renderSettings } from './views/settings.js';

const view = document.getElementById('view');
const routeButtons = document.querySelectorAll('.menu-item');
const btnNewOS = document.getElementById('btnNewOS');
const globalSearch = document.getElementById('globalSearch');
const sidebar = document.getElementById('sidebar');

// Ajustes de UI (menu mobile e brand no topo)
ensureUI();
routeButtons.forEach(btn => btn.addEventListener('click', () => { navigate(btn.dataset.route); closeMenu(); }));
btnNewOS?.addEventListener('click', () => navigate('os-new'));
globalSearch?.addEventListener('input', debounce(e => {
  const q = e.target.value.trim();
  if (!q) { navigate('os-list'); return; }
  navigate('os-list', { q });
}, 300));

function setActive(route) { routeButtons.forEach(b => b.classList.toggle('active', b.dataset.route === route)); }

const routes = {
  dashboard: (p)=>renderDashboard(view,p),
  'os-list': (p)=>renderOSList(view,p),
  'os-new': ()=>renderOSForm(view),
  'os-edit': (p)=>renderOSForm(view, p?.id),
  'os-view': (p)=>renderOSView(view, p?.id),
  warranty: (p)=>renderWarranty(view, p?.id),
  clients: (p)=>renderClients(view,p),
  settings: (p)=>renderSettings(view,p),
};

onRouteChange(({path, params})=>{
  setActive(path);
  const render = routes[path] || routes.dashboard;
  render(params||{});
});

// Helpers de menu
function ensureUI(){
  const topbar = document.querySelector('.topbar');
  if (topbar && !document.getElementById('btnMenu')) {
    const btn = document.createElement('button');
    btn.id = 'btnMenu'; btn.className = 'hamburger'; btn.ariaLabel = 'Abrir menu'; btn.textContent = 'Menu';
    btn.addEventListener('click', toggleMenu);
    topbar.prepend(btn);
    const brand = document.createElement('div'); brand.className = 'topbrand';
    brand.innerHTML = '<img src="assets/img/Logo.png" alt="VGP CELL" class="brand-logo" onerror="this.style.display=\'none\'"/><span class="brand-text">VGP CELL</span>';
    topbar.insertBefore(brand, topbar.children[1] || null);
    brand.style.cursor = 'pointer'; brand.addEventListener('click', () => navigate('dashboard'));
  }
  if (!document.getElementById('backdrop')) {
    const b = document.createElement('div'); b.id = 'backdrop'; b.className = 'backdrop'; b.hidden = true; b.addEventListener('click', closeMenu);
    document.getElementById('app')?.appendChild(b);
  }
  sidebar?.classList.remove('open');
  const back = document.getElementById('backdrop'); if (back) back.hidden = true;
  const sbBrand = document.querySelector('.sidebar .brand');
  if (sbBrand) { sbBrand.style.cursor = 'pointer'; sbBrand.addEventListener('click', () => { navigate('dashboard'); closeMenu(); }); }
}
function toggleMenu() { const b = document.getElementById('backdrop'); const opened = sidebar?.classList.toggle('open'); if (b) b.hidden = !opened; const m = document.getElementById('btnMenu'); if (m) m.setAttribute('aria-expanded', String(!!opened)); }
function closeMenu() { sidebar?.classList.remove('open'); const b = document.getElementById('backdrop'); if (b) b.hidden = true; const m = document.getElementById('btnMenu'); if (m) m.setAttribute('aria-expanded', 'false'); }

