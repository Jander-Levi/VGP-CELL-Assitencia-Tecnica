// db.js
// Integração com banco de dados local (IndexedDB)
let db;

const DB_NAME = 'vgp_cell_db';
const DB_VERSION = 1;
const STORE_NAME = 'os_store';

// Abre/cria o banco e retorna a instancia
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Salva/atualiza uma O.S. no IndexedDB (espelho)
export async function saveToDatabase(osData) {
  try {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(osData);
      
      request.onsuccess = () => resolve(osData);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Erro ao salvar no IndexedDB:', err);
    return null;
  }
}

// Busca todas as O.S. do IndexedDB
export async function fetchFromDatabase() {
  try {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Erro ao buscar do IndexedDB:', err);
    return [];
  }
}

// Exclui O.S. por id no IndexedDB
export async function deleteFromDatabase(id) {
  try {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Erro ao excluir do IndexedDB:', err);
  }
}
