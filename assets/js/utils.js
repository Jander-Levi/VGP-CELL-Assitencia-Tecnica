// utils.js
// Funcoes utilitarias sem dependencia de UI
// Mantidas genericas para uso em todo o app (formatacao, datas, formulários)
// Observacao: evitar acentos em strings para reduzir risco de encoding
 
// Formata numero para BRL (exibe como R$ 0,00)
export function formatCurrencyBRL(value) {
  const n = Number(value || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Converte string monetaria (pt-BR) para numero (float)
export function parseCurrencyBRL(str) {
  if (!str) return 0;
  const normalized = String(str)
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(/,(\d{2})$/, '.$1');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

// Gera ID curto e unico com prefixo
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Retorna data atual no formato ISO (YYYY-MM-DD)
export function todayISO() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Debounce: atrasa execucao ate o usuario parar de digitar
export function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// Serializa campos de um formulario em objeto plano
export function serializeForm(form) {
  const data = {};
  const formData = new FormData(form);
  for (const [k, v] of formData.entries()) {
    data[k] = v;
  }
  // include checkboxes not checked as false
  form.querySelectorAll('input[type="checkbox"]').forEach(chk => {
    if (!data.hasOwnProperty(chk.name)) data[chk.name] = false;
  });
  return data;
}

// Preenche valores no formulario a partir de objeto plano
export function setFormValues(form, values = {}) {
  Object.entries(values).forEach(([k, v]) => {
    const field = form.querySelector(`[name="${CSS.escape(k)}"]`);
    if (!field) return;
    if (field.type === 'checkbox') field.checked = !!v;
    else field.value = v ?? '';
  });
}

// Forca download de um JSON (backup/exportacao)
export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// --- Extras deste projeto ---
// Formatacao de data dd/mm/yyyy
export function fmtDateBR(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Remocao de acentos/caracteres especiais + trim
export function strip(s) {
  return (s||'')
    .normalize('NFD')
    .replace(/[^\w\s-]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
