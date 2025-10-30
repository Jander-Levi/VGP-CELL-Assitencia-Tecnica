// constants.js
// Listas e mapeamentos usados em diversas telas

export const STATUS = ['Aberta','Em analise','Aguardando peca','Concluida','Entregue'];
export const PAYMENT_METHODS = ['Pix','Cartao','Dinheiro'];
export const PAYMENT_STATUS = ['Pendente','Pago'];

export function statusClass(s){
  const n = (s||'').normalize('NFD').replace(/[^\w\s-]/g,'').trim().toLowerCase();
  if(n==='aberta') return 'aberta';
  if(n==='em analise') return 'analise';
  if(n==='aguardando peca') return 'peca';
  if(n==='concluida') return 'concluida';
  return 'entregue';
}

