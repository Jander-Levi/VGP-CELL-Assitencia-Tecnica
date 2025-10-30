// views/clients.js
import { getAllClients, saveClient, deleteClient } from '../storage.js';

export function renderClients(view){
  const list=getAllClients();
  view.innerHTML=`
    <div class="panel">
      <div class="panel-header">Clientes</div>
      <div class="panel-body">
        <form id="clientForm" class="grid cols-4" style="margin-bottom:12px;">
          <input type="hidden" name="id">
          <div class="field"><label>Nome</label><input name="name" required></div>
          <div class="field"><label>CPF</label><input name="cpf"></div>
          <div class="field"><label>Telefone</label><input name="phone" required></div>
          <div class="field" style="grid-column:1/-1;"><label>Endereco</label><input name="address"></div>
          <div class="row" style="justify-content:flex-end; grid-column:1/-1;">
            <button type="reset" class="btn">Limpar</button>
            <button class="btn btn-primary">Salvar</button>
          </div>
        </form>
        <table class="table stack">
          <thead><tr><th>Nome</th><th>Telefone</th><th></th></tr></thead>
          <tbody>
            ${list.map(c=>`<tr data-id="${c.id}"><td data-label="Nome">${c.name}</td><td data-label="Telefone">${c.phone||'-'}</td><td class="toolbar" data-label="Acoes"><button class="btn action-edit">Editar</button><button class="btn btn-danger action-delete">Excluir</button></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  const form=view.querySelector('#clientForm');
  form.addEventListener('submit',(e)=>{ e.preventDefault(); const d=Object.fromEntries(new FormData(form).entries()); saveClient({ id:d.id, name:d.name, cpf:d.cpf, phone:d.phone, address:d.address }); renderClients(view); });
  view.querySelectorAll('.action-edit').forEach(b=>b.addEventListener('click',e=>{ const id=e.target.closest('tr').dataset.id; const c=getAllClients().find(x=>x.id===id); if(c) Object.entries(c).forEach(([k,v])=>{ const el=form.elements[k]; if(el) el.value=v??''; }); }));
  view.querySelectorAll('.action-delete').forEach(b=>b.addEventListener('click',e=>{ const id=e.target.closest('tr').dataset.id; if(confirm('Excluir cliente?')){ deleteClient(id); renderClients(view); } }));
}

