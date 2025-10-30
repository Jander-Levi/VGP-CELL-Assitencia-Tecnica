// views/os-form.js
import { formatCurrencyBRL as F, parseCurrencyBRL, uid, todayISO, serializeForm, setFormValues } from '../utils.js';
import { getAllClients, saveClient, getOSById, saveOS, generateOSNumber } from '../storage.js';
import { saveToDatabase } from '../db.js';
import { navigate } from '../router.js';

function flattenOS(os){ const out={...os}; if(os.client) Object.entries(os.client).forEach(([k,v])=>out[`client.${k}`]=v); if(os.device) Object.entries(os.device).forEach(([k,v])=>out[`device.${k}`]=v); if(os.finance) Object.entries(os.finance).forEach(([k,v])=>{ const key=`finance.${k}`; out[key]=['labor','total'].includes(k)?F(v):v; }); return out; }
function fillClient(form,c){ setFormValues(form,{ 'client.name':c.name, 'client.cpf':c.cpf||'', 'client.phone':c.phone||'', 'client.address':c.address||'', }); }
function normalizeServices(arr){ if(!Array.isArray(arr)) return []; return arr.map(s=> typeof s==='string' ? { name:s } : { name:s?.name||''}).filter(s=>s.name); }
function buildChangeEntry(prev,next,ts,Fmt){ const details=[]; if(prev.status!==next.status) details.push(`Status: ${prev.status||'-'} -> ${next.status}`); if((prev.finance?.labor||0)!==(next.finance?.labor||0)) details.push(`Mao de obra: ${Fmt(prev.finance?.labor||0)} -> ${Fmt(next.finance?.labor||0)}`); if((prev.finance?.discountPercent||0)!==(next.finance?.discountPercent||0)) details.push(`Desconto: ${(prev.finance?.discountPercent||0)}% -> ${(next.finance?.discountPercent||0)}%`); if((prev.finance?.total||0)!==(next.finance?.total||0)) details.push(`Total: ${Fmt(prev.finance?.total||0)} -> ${Fmt(next.finance?.total||0)}`); if((prev.device?.service||'')!==(next.device?.service||'')) details.push('Servico executado atualizado'); return { ts, title:'Alteracoes salvas', details }; }

function gatherOSFromForm(form){ const d=serializeForm(form); const existing=getOSById(d.id); return { id:d.id, dataId:d.dataId||'', osNumber:d.osNumber, dateOpen:d.dateOpen, status:d.status, technician:d.technician, attendant:d.attendant, dueDate:d.dueDate, client:{ name:d['client.name'], cpf:d['client.cpf'], phone:d['client.phone'], address:d['client.address'], }, device:{ brand:d['device.brand'], model:d['device.model'], color:d['device.color'], condition:d['device.condition'], accessories:d['device.accessories'], report:d['device.report'], service:d['device.service'], warranty: existing?.device?.warranty || 90 }, finance:{ labor:parseCurrencyBRL(d['finance.labor']), discountPercent:Number(d['finance.discountPercent']||0), total:parseCurrencyBRL(d['finance.total']), paymentMethod:d['paymentMethod'], paymentStatus:d['finance.paymentStatus'], }, notes:d.notes||'', history: existing?.history || [], createdAt: existing?.createdAt || new Date().toISOString(), updatedAt:new Date().toISOString(), }; }

export function renderOSForm(view, id){
  const editing = !!id; const os = editing ? (getOSById(id)||{}) : {};
  const osNumber = editing ? os.osNumber : generateOSNumber();
  const clients = getAllClients();
  const clientOptions = clients.map(c=>`<option value="${c.name} - ${c.phone}" data-id="${c.id}"></option>`).join('');

  view.innerHTML = `
    <form id="osForm" class="form panel" onsubmit="return false;">
      <div class="panel-header">${editing?'Editar O.S.':'Nova O.S.'}</div>
      <div class="panel-body">
        <input type="hidden" name="id" value="${os.id || uid('os')}">
        <input type="hidden" name="dataId" value="${os.dataId || ''}">
        <div class="grid cols-4">
          <div class="field"><label>Numero da O.S</label><input name="osNumber" value="${osNumber}" readonly></div>
          <div class="field"><label>Data de abertura</label><input type="date" name="dateOpen" value="${os.dateOpen || todayISO()}"></div>
          <div class="field"><label>Status</label><select name="status">${['Aberta','Em analise','Aguardando peca','Concluida','Entregue'].map(s=>`<option ${String(os.status).toLowerCase()===s.toLowerCase()?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Prazo de entrega</label><input type="date" name="dueDate" value="${os.dueDate||''}"></div>
        </div>
        <div class="grid cols-3">
          <div class="field"><label>Tecnico responsavel</label><input name="technician" value="${os.technician||''}"></div>
          <div class="field"><label>Atendente</label><input name="attendant" value="${os.attendant||''}"></div>
          <div class="field"><label>Forma de pagamento</label><select name="paymentMethod">${['Pix','Cartao','Dinheiro'].map(m=>`<option ${os.finance?.paymentMethod===m?'selected':''}>${m}</option>`).join('')}</select></div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="panel-header">Cliente</div>
          <div class="panel-body grid cols-3">
            <div class="field"><label>Buscar cliente</label><input list="clientList" id="clientPicker" placeholder="Nome - Telefone"><datalist id="clientList">${clientOptions}</datalist><div class="help">Selecione para preencher os campos</div></div>
            <div></div><div></div>
            <div class="field"><label>Nome completo</label><input name="client.name" value="${os.client?.name||''}" required></div>
            <div class="field"><label>CPF</label><input name="client.cpf" value="${os.client?.cpf||''}"></div>
            <div class="field"><label>Telefone / WhatsApp</label><input name="client.phone" value="${os.client?.phone||''}" required></div>
            <div class="field" style="grid-column:1/-1;"><label>Endereco</label><input name="client.address" value="${os.client?.address||''}"></div>
          </div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="panel-header">Aparelho</div>
          <div class="panel-body grid cols-3">
            <div class="field"><label>Marca</label><input name="device.brand" value="${os.device?.brand||''}"></div>
            <div class="field"><label>Modelo</label><input name="device.model" value="${os.device?.model||''}" required></div>
            <div class="field"><label>Cor</label><input name="device.color" value="${os.device?.color||''}"></div>
            <div class="field"><label>Condicao fisica</label><input name="device.condition" value="${os.device?.condition||''}"></div>
            <div class="field"><label>Acessorios deixados</label><input name="device.accessories" value="${os.device?.accessories||''}"></div>
            <div class="field" style="grid-column:1/-1;"><label>Relato do cliente</label><textarea name="device.report">${os.device?.report||''}</textarea></div>
            <div class="field" style="grid-column:1/-1;"><label>Servico executado</label><textarea name="device.service">${os.device?.service || (normalizeServices(os.device?.servicesList||[]).map(s=>s.name).join(', ')) || ''}</textarea></div>
          </div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="panel-header">Financeiro</div>
          <div class="panel-body grid cols-4">
            <div class="field"><label>Valor da mao de obra</label><input name="finance.labor" value="${F(os.finance?.labor||0)}" placeholder="0,00"></div>
            <div class="field"><label>Desconto (%)</label><input type="number" min="0" max="100" step="1" name="finance.discountPercent" value="${os.finance?.discountPercent ?? 0}"></div>
            <div class="field"><label>Valor total</label><input name="finance.total" value="${F(os.finance?.total||0)}" readonly></div>
            <div class="field"><label>Status do pagamento</label><select name="finance.paymentStatus">${['Pendente','Pago'].map(s=>`<option ${os.finance?.paymentStatus===s?'selected':''}>${s}</option>`).join('')}</select></div>
          </div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="panel-header">Outros</div>
          <div class="panel-body grid cols-1">
            <div class="field"><label>Observacoes gerais</label><textarea name="notes">${os.notes||''}</textarea></div>
          </div>
        </div>

        <div class="row" style="justify-content:flex-end; margin-top:10px;">
          <button type="button" class="btn" id="btnPrint">Imprimir / PDF</button>
          <button type="button" class="btn" id="btnCancel">Cancelar</button>
          <button class="btn btn-primary">${editing?'Salvar alteracoes':'Criar O.S.'}</button>
        </div>
      </div>
    </form>`;

  const form = view.querySelector('#osForm');
  if (editing) setFormValues(form, flattenOS(os));

  const clientPicker = view.querySelector('#clientPicker');
  clientPicker?.addEventListener('change',()=>{ const val=clientPicker.value; const c=getAllClients().find(x=>`${x.name} - ${x.phone}`===val); if(c) fillClient(form,c); });

  const recalc = () => { const labor=parseCurrencyBRL(form.elements['finance.labor'].value); const p=Number(form.elements['finance.discountPercent'].value||0); const total=Math.max(0, labor - (labor*(Math.max(0,Math.min(100,p))/100))); form.elements['finance.total'].value = F(total); };
  form.elements['finance.labor'].addEventListener('input', recalc);
  form.elements['finance.labor'].addEventListener('blur', e=> e.target.value = F(parseCurrencyBRL(e.target.value)));
  form.elements['finance.discountPercent'].addEventListener('input', recalc);
  recalc();

  view.querySelector('#btnCancel')?.addEventListener('click', ()=>navigate('os-list'));
  view.querySelector('#btnPrint')?.addEventListener('click', ()=>window.print());

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = gatherOSFromForm(form);
    const prev = editing ? (getOSById(data.id)||null) : null; const nowIso=new Date().toISOString();
    if (prev) {
      data.history = (prev.history||[]).slice();
      const entry = buildChangeEntry(prev, data, nowIso, F);
      if (entry.details.length) data.history.push(entry);
    } else {
      data.history = [{ ts: nowIso, title: 'O.S. criada', details: [] }];
    }
    const allClients=getAllClients(); const existing=allClients.find(c=>c.name===data.client.name && c.phone===data.client.phone);
    const clientSaved=saveClient({ ...(existing||{}), ...data.client });
    data.client.id=clientSaved.id;
    saveOS(data); try{ await saveToDatabase(data);}catch{}
    navigate('os-view',{ id: data.id });
  });
}

