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
      <div class="box">
        <div>
          <p><strong>1. OBJETO</strong></p>
          <p>Este termo tem por objeto a prestação de serviços de assistência técnica em aparelhos celulares, abrangendo diagnóstico, reparo, substituição de componentes e manutenção preventiva ou corretiva.</p>

          <p><strong>2. PRAZO DE GARANTIA</strong></p>
          <p>2.1. A VPG CELL concede garantia de 90 (noventa) dias corridos, contados a partir da data de retirada do aparelho pelo cliente, conforme o artigo 26, inciso II, do Código de Defesa do Consumidor (Lei nº 8.078/90).</p>
          <p>2.2. A garantia cobre exclusivamente os serviços e peças substituídas pela assistência técnica.</p>
          <p>2.3. Caso ocorra novo defeito no mesmo componente reparado dentro do prazo de garantia, a assistência realizará novo reparo sem custo adicional, desde que observadas as condições deste termo.</p>

          <p><strong>3. PERDA DE GARANTIA</strong></p>
          <p>A garantia perderá sua validade automaticamente nos seguintes casos:</p>
          <p>(a) Violação do lacre de garantia ou abertura do aparelho por terceiros;</p>
          <p>(b) Danos causados por queda, impacto, oxidação, líquidos ou mau uso;</p>
          <p>(c) Utilização de acessórios, cabos ou carregadores não originais ou inadequados;</p>
          <p>(d) Intervenção técnica por pessoa não autorizada pela VPG CELL;</p>
          <p>(e) Alterações de software não autorizadas (root, jailbreak, custom ROM, etc.).</p>

          <p><strong>4. LIMITAÇÃO DA GARANTIA</strong></p>
          <p>4.1. A garantia não cobre dados armazenados no aparelho (fotos, contatos, aplicativos, etc.). O cliente é responsável pelo backup antes da entrega para reparo.</p>
          <p>4.2. A garantia não se estende ao aparelho completo, apenas às peças e serviços substituídos.</p>
          <p>4.3. A VPG CELL não se responsabiliza por defeitos decorrentes de peças não substituídas durante o serviço técnico.</p>

          <p><strong>5. APROVAÇÃO DE ORÇAMENTO</strong></p>
          <p>5.1. Após o diagnóstico, será apresentado orçamento detalhado ao cliente.</p>
          <p>5.2. O serviço só será iniciado após aprovação expressa do cliente, por escrito ou por meio digital (mensagem, e-mail ou assinatura).</p>
          <p>5.3. Orçamentos não aprovados terão prazo de 30 dias para retirada do aparelho, sob pena de cobrança de taxa de armazenamento e eventual descarte.</p>

          <p><strong>6. PRAZO PARA RETIRADA DO APARELHO</strong></p>
          <p>6.1. Após notificação de conclusão do serviço, o cliente deverá retirar o aparelho em até 30 dias.</p>
          <p>6.2. Após esse prazo, a VPG CELL poderá cobrar taxa diária de armazenamento ou dar destino ao aparelho, conforme previsto no art. 1.263 do Código Civil.</p>

          <p><strong>7. RESPONSABILIDADE</strong></p>
          <p>7.1. A VPG CELL se compromete a utilizar peças novas ou recondicionadas de qualidade equivalente.</p>
          <p>7.2. O cliente reconhece que em determinados reparos (placa, micro solda, regravação de memória etc.) há risco de perda total do equipamento, isentando a assistência de responsabilidade caso o dano decorra da própria falha do componente.</p>
        </div>
      </div>
      <div class="box"><p>Confirmo que li este termo, fui orientado sobre seu conteudo e testei o aparelho, que se encontra em perfeito estado estetico e de funcionamento no ato da retirada.</p><div class="sign"><div class="slot"><div class="dash"></div><div>Cliente: ${os.client?.name||''}</div></div><div class="slot"><div class="dash"></div><div>De acordo</div></div></div></div>
      <div class="toolbar" style="justify-content:flex-end; margin-top:12px;"><label class="row"><input type="checkbox" id="wAccept"> Cliente aceita os termos</label><button class="btn" id="wSave">Salvar garantia</button><button class="btn btn-primary" id="wPrint">Imprimir / Salvar PDF</button><button class="btn" id="wBack">Voltar</button></div>
    </div>`;
  view.querySelector('#wBack')?.addEventListener('click',()=>navigate('os-view',{id}));
  view.querySelector('#wPrint')?.addEventListener('click',()=>window.print());
  view.querySelector('#wSave')?.addEventListener('click',()=>{ const days=Number(view.querySelector('#wDays').value||0); os.device=os.device||{}; os.device.warranty=days; saveOS(os); alert('Garantia atualizada.'); });
}
