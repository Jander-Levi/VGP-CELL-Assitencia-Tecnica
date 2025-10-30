// storage.js
// Persistencia em localStorage (fonte principal de dados do app)
// Mantem listas de O.S., clientes e o sequencial diario de numeracao
import { uid, todayISO } from './utils.js';

// Chaves do localStorage usadas pelo aplicativo
const LS_KEYS = {
  OS_LIST: 'vgp_os_list',
  CLIENTS: 'vgp_clients',
  SEQ: 'vgp_os_seq',
};

// Le e faz parse de JSON seguro (com fallback)
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Escreve JSON no localStorage
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Retorna todas as O.S.
export function getAllOS() {
  return read(LS_KEYS.OS_LIST, []);
}

// Insere/atualiza uma O.S. (por id) e retorna o objeto salvo
export function saveOS(os) {
  const list = getAllOS();
  const idx = list.findIndex(x => x.id === os.id);
  if (idx >= 0) list[idx] = os; else list.unshift(os);
  write(LS_KEYS.OS_LIST, list);
  return os;
}

// Remove O.S. pelo id
export function deleteOS(id) {
  const list = getAllOS().filter(x => x.id !== id);
  write(LS_KEYS.OS_LIST, list);
}

// Busca O.S. por id
export function getOSById(id) {
  return getAllOS().find(x => x.id === id);
}

// Gera numero de O.S. unico por dia (ex.: OS-YYYYMMDD-0001)
export function generateOSNumber() {
  const today = todayISO().replaceAll('-', '');
  const seq = read(LS_KEYS.SEQ, {});
  const n = (seq[today] || 0) + 1;
  seq[today] = n;
  write(LS_KEYS.SEQ, seq);
  return `OS-${today}-${String(n).padStart(4, '0')}`;
}

// Retorna todos os clientes
export function getAllClients() {
  return read(LS_KEYS.CLIENTS, []);
}

// Insere/atualiza cliente (gera id quando necessario)
export function saveClient(client) {
  const list = getAllClients();
  if (!client.id) client.id = uid('cli');
  const idx = list.findIndex(c => c.id === client.id);
  if (idx >= 0) list[idx] = client; else list.unshift(client);
  write(LS_KEYS.CLIENTS, list);
  return client;
}

// Remove cliente pelo id
export function deleteClient(id) {
  const list = getAllClients().filter(c => c.id !== id);
  write(LS_KEYS.CLIENTS, list);
}

// Exporta todo o banco (O.S., clientes e sequencia) para backup
export function exportAll() {
  return {
    os: getAllOS(),
    clients: getAllClients(),
    seq: read(LS_KEYS.SEQ, {}),
    exportedAt: new Date().toISOString(),
    version: 1,
  };
}

// Importa dados de backup (sobrescreve chaves existentes)
export function importAll(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Arquivo inválido');
  if (payload.os) write(LS_KEYS.OS_LIST, payload.os);
  if (payload.clients) write(LS_KEYS.CLIENTS, payload.clients);
  if (payload.seq) write(LS_KEYS.SEQ, payload.seq);
}
