// router.js
// Roteador baseado em hash simples (#route?query)

export function navigate(route, params={}){
  const q = new URLSearchParams(params).toString();
  location.hash = `#${route}${q ? '?' + q : ''}`;
}

export function parseHash(hash){
  const h = (hash||location.hash||'').replace('#','') || 'dashboard';
  const [path, query] = h.split('?');
  const params = Object.fromEntries(new URLSearchParams(query));
  return { path, params };
}

export function onRouteChange(handler){
  window.addEventListener('hashchange', ()=>handler(parseHash()));
  // chamada inicial
  handler(parseHash());
}

