// helpers/dom.js
// Pequenos helpers de DOM para legibilidade

export const qs = (sel, root=document) => root.querySelector(sel);
export const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
export const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

