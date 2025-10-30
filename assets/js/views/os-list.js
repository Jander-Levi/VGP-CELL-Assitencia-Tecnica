// views/os-list.js
import { getAllOS, deleteOS } from '../storage.js';
import { deleteFromDatabase } from '../db.js';
import { strip, formatCurrencyBRL as F } from '../utils.js';
import { STATUS, statusClass } from '../constants.js';
import { navigate } from '../router.js';

function table(list){
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
            <button class="btn btn-danger action-delete">Excluir</button>
          </div></td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}

export function renderOSList(view, params={}){
  const list = getAllOS();
  const q = (params.q || '').toLowerCase();
  const status = params.status || '';
  const filtered = list.filter(item => {
    const text = `${item.osNumber} ${item.client?.name || ''}`.toLowerCase();
    const okQ = q ? text.includes(q) : true;
    const okS = status ? strip(item.status).toLowerCase() === strip(status).toLowerCase() : true;
    return okQ && okS;
  });
  view.innerHTML = `
    <div class="panel">
      <div class="panel-header">Ordens de Servico</div>
      <div class="panel-body">
        <div class="toolbar" style="margin-bottom:10px;">
          <select id="filterStatus">
            <option value="">Todos os status</option>
            ${STATUS.map(s=>`<option ${strip(status)===strip(s)?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="btn" id="btnClearFilters">Limpar filtros</button>
          <span class="badge">${filtered.length} resultados</span>
        </div>
        ${table(filtered)}
      </div>
    </div>`;

  view.querySelector('#filterStatus')?.addEventListener('change', e=>{
    const globalSearch = document.getElementById('globalSearch');
    navigate('os-list', { q: globalSearch?.value?.trim() || '', status: e.target.value });
  });
  view.querySelector('#btnClearFilters')?.addEventListener('click', ()=>{
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) globalSearch.value = '';
    navigate('os-list');
  });
  view.querySelectorAll('.action-edit').forEach(b=>b.addEventListener('click',e=>{ const id=e.target.closest('tr').dataset.id; navigate('os-edit',{id}); }));
  view.querySelectorAll('.action-delete').forEach(b=>b.addEventListener('click',async e=>{ const id=e.target.closest('tr').dataset.id; if(confirm('Deseja excluir esta O.S.?')){ deleteOS(id); try{ await deleteFromDatabase(id);}catch{} navigate('os-list',{ q, status }); } }));
  view.querySelectorAll('.action-view').forEach(b=>b.addEventListener('click',e=>{ const id=e.target.closest('tr').dataset.id; navigate('os-view',{id}); }));
}
