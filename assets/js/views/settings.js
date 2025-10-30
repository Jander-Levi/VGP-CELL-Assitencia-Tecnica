// views/settings.js
import { exportAll, importAll } from '../storage.js';
import { downloadJSON } from '../utils.js';

export function renderSettings(view){
  view.innerHTML=`
    <div class="panel">
      <div class="panel-header">Configuracoes / Backup</div>
      <div class="panel-body grid cols-2">
        <div class="field"><label>Exportar dados (JSON)</label><div class="row"><button class="btn btn-primary" id="btnExport">Exportar</button></div><div class="help">Inclui O.S., clientes e sequencia de numeracao</div></div>
        <div class="field"><label>Importar dados (JSON)</label><input type="file" id="fileImport" accept="application/json"></div>
      </div>
    </div>`;
  view.querySelector('#btnExport')?.addEventListener('click',()=>{ downloadJSON(`backup_vgp_${new Date().toISOString().slice(0,10)}.json`, exportAll()); });
  view.querySelector('#fileImport')?.addEventListener('change', async (e)=>{ const file=e.target.files?.[0]; if(!file) return; const text=await file.text(); try{ const payload=JSON.parse(text); importAll(payload); alert('Importacao concluida.'); } catch(err){ alert('Falha ao importar: '+err.message); } });
}

