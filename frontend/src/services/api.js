import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const QUEUE_KEY = '@offlineQueue';
const GET_CACHE_PREFIX = '@getCache:';
let PROCESSING_QUEUE = false;
let QUEUE_TIMER = null;

// Usa domínio público via variável de ambiente (Expo injeta EXPO_PUBLIC_*)
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
});

// Interceptor (O Espião)
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    // LOG DE DEPURAÇÃO 1: O Token existe?
    if (token) {
      console.log('🟢 [API] Token encontrado:', token.substring(0, 10) + '...'); 
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('🔴 [API] NENHUM Token encontrado no AsyncStorage!');
    }

    // LOG DE DEPURAÇÃO 2: Para onde estamos indo?
    console.log(`📡 [API] Enviando requisição para: ${config.url}`);
    
  } catch (error) {
    console.error('❌ [API] Erro ao recuperar token:', error);
  }
  return config;
});

// Cache GETs and offline queue for mutating requests
api.interceptors.response.use(
  async (response) => {
    try {
      const method = (response?.config?.method || 'get').toLowerCase();
      const url = response?.config?.url || '';
      if (method === 'get') {
        // Evita cache pesado de produtos (usamos SQLite)
        const skipCache = url.startsWith('/products');
        if (!skipCache) {
          const paramsStr = JSON.stringify(response?.config?.params || {});
          const cacheKey = `${GET_CACHE_PREFIX}${url}|${paramsStr}`;
          // Evita gravar payloads enormes com imagens base64
          const data = response.data;
          const isHugeImageArray = Array.isArray(data) && data.length > 0 && typeof data[0]?.image === 'string' && data[0].image.length > 50000;
          if (!isHugeImageArray) {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
          }
        }
      }
      scheduleQueueProcessing();
    } catch (e) {
      // silencioso
    }
    return response;
  },
  async (error) => {
    const config = error?.config || {};
    const method = (config?.method || 'get').toLowerCase();
    const url = config?.url || '';
    const isAuth = url.startsWith('/auth/');
    const noResponse = !error?.response;

    if (noResponse) {
      // Offline handling
      if (method === 'get') {
        try {
          const paramsStr = JSON.stringify(config?.params || {});
          const cacheKey = `${GET_CACHE_PREFIX}${url}|${paramsStr}`;
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            console.log('📦 [API] Servindo cache para GET:', url);
            return Promise.resolve({ data: JSON.parse(cached), status: 200, config });
          }
        } catch {}
      } else if (!isAuth) {
        try {
          const item = {
            method,
            url,
            data: config?.data || null,
            headers: config?.headers || {},
            ts: Date.now()
          };
          const qStr = await AsyncStorage.getItem(QUEUE_KEY);
          const q = qStr ? JSON.parse(qStr) : [];
          q.push(item);
          await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
          console.log('📦 [API] Requisição enfileirada offline:', method, url);
          return Promise.resolve({ data: { queued: true }, status: 202, config });
        } catch {}
      }
    }

    return Promise.reject(error);
  }
);

function scheduleQueueProcessing() {
  try {
    if (QUEUE_TIMER) return;
    QUEUE_TIMER = setTimeout(() => {
      QUEUE_TIMER = null;
      processQueue();
    }, 1000);
  } catch {}
}

async function processQueue() {
  try {
    if (PROCESSING_QUEUE) return;
    PROCESSING_QUEUE = true;
    const qStr = await AsyncStorage.getItem(QUEUE_KEY);
    const q = qStr ? JSON.parse(qStr) : [];
    if (!Array.isArray(q) || q.length === 0) return;

    const remaining = [];
    // Processa no máximo 10 por ciclo para evitar travar UI
    for (const item of q.slice(0, 10)) {
      try {
        await api.request({ method: item.method, url: item.url, data: item.data, headers: item.headers });
        console.log('✅ [API] Sincronizado:', item.method, item.url);
      } catch (e) {
        // Mantém na fila se continuar offline ou erro transitório
        remaining.push(item);
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch {}
  finally {
    PROCESSING_QUEUE = false;
  }
}

// Tenta processar periodicamente e quando o navegador voltar online (web)
setInterval(() => { processQueue(); }, 30000);
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('online', () => { processQueue(); });
}
// Em apps nativos, também dispara ao voltar ao foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    processQueue();
  }
});

// Exponha utilitário opcional
api.processOfflineQueue = processQueue;

export default api;
