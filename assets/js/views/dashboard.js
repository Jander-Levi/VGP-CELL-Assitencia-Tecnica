// views/dashboard.js
import { getAllOS } from '../storage.js';
import { strip, formatCurrencyBRL as F } from '../utils.js';
import { statusClass } from '../constants.js';
import { navigate } from '../router.js';

function renderTable(list){
  if (!list.length) return '<div class="help">Nenhuma O.S. encontrada.</div>';
  return `
    <table class="table stack">
      <thead><tr><th>No. O.S.</th><th>Cliente</th><th>Modelo</th><th>Status</th><th>Data</th><th>Valor</th><th>Acoes</th></tr></thead>
      <tbody>
        ${list.map(item=>`
          <tr data-id="${item.id}">
            <td data-label="No. O.S.">${item.osNumber}</td>
            <td data-label="Cliente">${item.client?.name || '-'}</td>
            <td data-label="Modelo">${item.device?.model || '-'}</td>
            <td data-label="Status"><span class="status ${statusClass(item.status)}">${item.status}</span></td>
            <td data-label="Data">${item.dateOpen || '-'}</td>
            <td data-label="Valor">${F(item.finance?.total || 0)}</td>
            <td data-label="Acoes"><div class="toolbar">
              <button class="btn btn-ghost action-view">Visualizar</button>
              <button class="btn action-edit">Editar</button>
            </div></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

export function renderDashboard(view){
  const list = getAllOS();
  const n = t => strip(t).toLowerCase();
  const stats = {
    total: list.length,
    abertas: list.filter(x => n(x.status) === 'aberta').length,
    andamento: list.filter(x => ['em analise','aguardando peca'].includes(n(x.status))).length,
    concluidas: list.filter(x => ['concluida','entregue'].includes(n(x.status))).length,
  };
  view.innerHTML = `
    <div class="cards">
      <div class="card" data-goto="os-list" data-status=""><div class="label">Total O.S.</div><div class="value">${stats.total}</div></div>
      <div class="card" data-goto="os-list" data-status="Aberta"><div class="label">Abertas</div><div class="value">${stats.abertas}</div></div>
      <div class="card" data-goto="os-list" data-status="Em analise"><div class="label">Em Andamento</div><div class="value">${stats.andamento}</div></div>
      <div class="card" data-goto="os-list" data-status="Concluida"><div class="label">Concluidas/Entregues</div><div class="value">${stats.concluidas}</div></div>
    </div>
    <div class="panel">
      <div class="panel-header">Ultimas O.S.</div>
      <div class="panel-body">${renderTable(list.slice(0,8))}</div>
    </div>`;
  // binds
  view.querySelectorAll('.card[data-goto]').forEach(c=>c.addEventListener('click',()=>navigate('os-list',{ status: c.getAttribute('data-status')||'' })));
  view.querySelectorAll('.action-edit').forEach(b=>b.addEventListener('click',e=>{ const id=e.target.closest('tr').dataset.id; navigate('os-edit',{id}); }));
  view.querySelectorAll('.action-view').forEach(b=>b.addEventListener('click',e=>{ const id=e.target.closest('tr').dataset.id; navigate('os-view',{id}); }));
}

