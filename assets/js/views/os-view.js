// views/os-view.js
import { getOSById, deleteOS } from '../storage.js';
import { formatCurrencyBRL as F, fmtDateBR } from '../utils.js';
import { navigate } from '../router.js';
import { deleteFromDatabase } from '../db.js';

function sectionGrid(title, rows){ return `<div class="panel" style="margin:10px 0;"><div class="panel-header">${title}</div><div class="panel-body"><div class="grid cols-3">${rows.map(([k,v])=>`<div class="field"><label>${k}</label><div>${v||'-'}</div></div>`).join('')}</div></div></div>`; }
function sectionText(title, text){ return `<div class="panel" style="margin:10px 0;"><div class="panel-header">${title}</div><div class="panel-body"><div>${(text||'-').replace(/\n/g,'<br>')}</div></div></div>`; }
function renderHistory(hist){ const list = Array.isArray(hist) ? [...hist].reverse() : []; if (!list.length) return ''; return `<div class="panel" style="margin:10px 0;"><div class="panel-header">Historico</div><div class="panel-body">${list.slice(0,12).map(h=>`<div class="field" style="margin-bottom:8px;"><label>${fmtDateBR(h.ts)} - ${h.title||'Alteracoes'}</label><div>${(h.details||[]).map(d=>'- '+d).join('<br>')}</div></div>`).join('')}</div></div>`; }

export function renderOSView(view, id){
  const os=getOSById(id); if(!os){ view.innerHTML='<div class="help">O.S. nao encontrada.</div>'; return; }
  view.innerHTML=`
    <div class="panel">
      <div class="panel-header">O.S. ${os.osNumber}</div>
      <div class="panel-body">
        <div class="toolbar" style="justify-content:flex-end; margin-bottom:8px;">
          <button class="btn" id="vPrint">Imprimir / PDF</button>
          <button class="btn" id="vWarranty">Termo de Garantia</button>
          <button class="btn" id="vEdit">Editar</button>
          <button class="btn btn-danger" id="vDelete">Excluir</button>
        </div>
        ${sectionGrid('Identificacao', [ ['Numero', os.osNumber], ['Abertura', os.dateOpen||'-'], ['Status', os.status], ['Tecnico', os.technician||'-'], ['Atendente', os.attendant||'-'], ['Prazo', os.dueDate||'-'], ])}
        ${sectionGrid('Cliente', [ ['Nome', os.client?.name||'-'], ['CPF', os.client?.cpf||'-'], ['Telefone', os.client?.phone||'-'], ['Endereco', os.client?.address||'-'], ])}
        ${sectionGrid('Aparelho', [ ['Marca', os.device?.brand||'-'], ['Modelo', os.device?.model||'-'], ['Cor', os.device?.color||'-'], ['Condicao', os.device?.condition||'-'], ['Acessorios', os.device?.accessories||'-'], ])}
        ${sectionText('Servico executado', os.device?.service || '')}
        ${sectionGrid('Financeiro', [ ['Mao de obra', F(os.finance?.labor)], ['Desconto', (os.finance?.discountPercent??0)+'%'], ['Total', F(os.finance?.total)], ['Pagamento', os.finance?.paymentMethod||'-'], ['Status', os.finance?.paymentStatus||'-'], ])}
        ${sectionText('Observacoes', os.notes)}
        ${renderHistory(os.history)}
        <div class="help">ID integracao (data-id): ${os.dataId || '-'}</div>
      </div>
    </div>`;
  view.querySelector('#vPrint')?.addEventListener('click',()=>window.print());
  view.querySelector('#vWarranty')?.addEventListener('click',()=>navigate('warranty',{id}));
  view.querySelector('#vEdit')?.addEventListener('click',()=>navigate('os-edit',{id}));
  view.querySelector('#vDelete')?.addEventListener('click',async ()=>{ if(confirm('Excluir esta O.S.?')){ deleteOS(id); try{ await deleteFromDatabase(id);}catch{} navigate('os-list'); } });
}

