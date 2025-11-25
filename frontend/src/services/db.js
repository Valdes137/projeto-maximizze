import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Só tentamos abrir o banco se NÃO for Web
let db = null;

if (Platform.OS !== 'web') {
  try {
    db = SQLite.openDatabaseSync('maximizee.db');
  } catch (e) {
    console.log("Erro ao abrir DB:", e);
  }
}

// Função Helper para verificar se pode usar o banco
const isDbAvailable = () => {
  if (Platform.OS === 'web') {
    console.log("⚠️ [DB] SQLite desativado na Web. Usando apenas API.");
    return false;
  }
  return db !== null;
};

export const initDB = async () => {
  if (!isDbAvailable()) return;

  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_products (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        image TEXT, 
        synced INTEGER DEFAULT 0
      );
    `);
    console.log("✅ [DB] Tabela local inicializada!");
  } catch (error) {
    console.log("❌ [DB] Erro ao iniciar banco:", error);
  }
};

export const saveProductsToLocal = async (products) => {
  if (!isDbAvailable()) return;

  try {
    await db.runAsync('DELETE FROM local_products');

    for (const p of products) {
      await db.runAsync(
        `INSERT INTO local_products (id, name, description, price, stock_quantity, image, synced) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [p.id, p.name, p.description, p.price, p.stock_quantity, p.image || null]
      );
    }
    console.log(`✅ [DB] ${products.length} produtos salvos no cache.`);
  } catch (error) {
    console.log("❌ [DB] Erro ao salvar:", error);
  }
};

export const addLocalProduct = async (product, synced = 0) => {
  if (!isDbAvailable()) return;
  try {
    await db.runAsync(
      `INSERT INTO local_products (name, description, price, stock_quantity, image, synced) VALUES (?, ?, ?, ?, ?, ?)`,
      [product.name, product.description || '', Number(product.price), Number(product.stock_quantity), product.image || null, synced ? 1 : 0]
    );
    console.log('✅ [DB] Produto salvo localmente (synced=', synced, ')');
  } catch (error) {
    console.log('❌ [DB] Erro ao salvar produto local:', error);
  }
};

export const getLocalProducts = async () => {
  if (!isDbAvailable()) return [];

  try {
    const allRows = await db.getAllAsync('SELECT * FROM local_products');
    return allRows;
  } catch (error) {
    console.log("❌ [DB] Erro ao ler:", error);
    return [];
  }
};

export const deleteLocalProduct = async (id) => {
  if (!isDbAvailable()) return;
  try {
    await db.runAsync('DELETE FROM local_products WHERE id = ?', [id]);
    console.log('🗑️ [DB] Produto removido do cache:', id);
  } catch (error) {
    console.log('❌ [DB] Erro ao remover produto local:', error);
  }
};

export const updateLocalProduct = async (product) => {
  if (!isDbAvailable()) return;
  try {
    await db.runAsync(
      `UPDATE local_products SET name = ?, description = ?, price = ?, stock_quantity = ?, image = ?, synced = 0 WHERE id = ?`,
      [product.name, product.description || '', Number(product.price), Number(product.stock_quantity), product.image || null, Number(product.id)]
    );
    console.log('✏️ [DB] Produto atualizado no cache:', product.id);
  } catch (error) {
    console.log('❌ [DB] Erro ao atualizar produto local:', error);
  }
};

export default db;
