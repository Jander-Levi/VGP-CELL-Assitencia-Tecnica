// views/warranty.js
import { getOSById, saveOS } from '../storage.js';
import { fmtDateBR } from '../utils.js';
import { navigate } from '../router.js';

export function renderWarranty(view, id){
  const os=getOSById(id); if(!os){ view.innerHTML='<div class="help">O.S. nao encontrada.</div>'; return; }
  const warrantyDays=Number(os.device?.warranty||90);
  const today=fmtDateBR(new Date().toISOString());
  const brand=os.device?.brand||'-';
  const model=os.device?.model||'';
  const color=os.device?.color||'-';
  const condition=os.device?.condition||'-';
  const cName=os.client?.name||'-';
  const cPhone=os.client?.phone||'-';
  const cCPF=os.client?.cpf||'-';
  const cAddr=os.client?.address||'-';
  view.innerHTML=`
    <div class="doc panel">
      <header>
        <div><img src="assets/img/Logo.png" class="logo" alt="Logo" onerror="this.style.display='none'"><div style="font-weight:800;">VGP CELL - Assistencia Tecnica</div></div>
        <div class="meta">No. O.S.: <strong>${os.osNumber}</strong><br>Data: ${today}</div>
      </header>
      <h1>Termo de Garantia</h1>
      <div class="box">
        <div class="rowline"><div class="line"><span class="label">Cliente</span><br>${cName}</div><div class="line"><span class="label">Telefone</span><br>${cPhone}</div></div>
        <div class="rowline"><div class="line"><span class="label">CPF</span><br>${cCPF}</div><div class="line"><span class="label">Endereco</span><br>${cAddr}</div></div>
      </div>
      <div class="box">
        <div class="rowline"><div class="line"><span class="label">Marca / Modelo</span><br>${brand} ${model}</div><div class="line"><span class="label">Cor</span><br>${color}</div></div>
        <div class="rowline"><div class="line"><span class="label">Condicao</span><br>${condition}</div></div>
        <div class="rowline"><div class="line"><span class="label">Garantia (dias)</span><br><input id="wDays" type="number" min="0" value="${warrantyDays}" style="max-width:120px;"></div></div>
      </div>
      <div class="box"><div class="rowline"><div>Data: ${today}</div><div>Marca: ${brand}</div></div><div style="margin-top:8px; font-weight:700;">${warrantyDays} DIAS DE GARANTIA</div></div>
      <div class="box"><p>Confirmo que li este termo, fui orientado sobre seu conteudo e testei o aparelho, que se encontra em perfeito estado estetico e de funcionamento no ato da retirada.</p><div class="sign"><div class="slot"><div class="dash"></div><div>Cliente: ${os.client?.name||''}</div></div><div class="slot"><div class="dash"></div><div>De acordo</div></div></div></div>
      <div class="toolbar" style="justify-content:flex-end; margin-top:12px;"><label class="row"><input type="checkbox" id="wAccept"> Cliente aceita os termos</label><button class="btn" id="wSave">Salvar garantia</button><button class="btn btn-primary" id="wPrint">Imprimir / Salvar PDF</button><button class="btn" id="wBack">Voltar</button></div>
    </div>`;
  view.querySelector('#wBack')?.addEventListener('click',()=>navigate('os-view',{id}));
  view.querySelector('#wPrint')?.addEventListener('click',()=>window.print());
  view.querySelector('#wSave')?.addEventListener('click',()=>{ const days=Number(view.querySelector('#wDays').value||0); os.device=os.device||{}; os.device.warranty=days; saveOS(os); alert('Garantia atualizada.'); });
}

