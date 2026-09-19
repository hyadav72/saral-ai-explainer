import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine safe storage path: prefer server/data, fallback to /tmp if readonly (e.g. serverless)
const defaultDir = path.resolve(__dirname, '../../data');
const fallbackDir = process.env.TMPDIR || process.env.TEMP || '/tmp';

let dataFilePath;
try {
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
  dataFilePath = path.join(defaultDir, 'history.json');
  // Test write
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2), 'utf-8');
  }
} catch (err) {
  console.warn('Warning: Server directory is read-only, falling back to temp directory for history store.', err.message);
  dataFilePath = path.join(fallbackDir, 'saral_history.json');
  if (!fs.existsSync(dataFilePath)) {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2), 'utf-8');
    } catch (e) {
      console.error('Could not write to fallback temp dir:', e);
    }
  }
}

// In-memory cache
let memoryStore = [];

function loadData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      memoryStore = JSON.parse(raw);
    } else {
      memoryStore = [];
    }
  } catch (err) {
    console.error('Error loading history store:', err);
    memoryStore = [];
  }
}

function saveData() {
  try {
    const tempFile = `${dataFilePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(memoryStore, null, 2), 'utf-8');
    fs.renameSync(tempFile, dataFilePath);
  } catch (err) {
    // Direct write fallback
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(memoryStore, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting history to disk:', e);
    }
  }
}

// Initial load
loadData();

export const historyStore = {
  getByDevice(deviceId) {
    loadData();
    if (!deviceId) return memoryStore.slice(0, 50);
    return memoryStore
      .filter((item) => item.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);
  },

  getById(id, deviceId) {
    loadData();
    return memoryStore.find(
      (item) => item.id === id && (!deviceId || item.deviceId === deviceId)
    );
  },

  add(entry) {
    const record = {
      id: entry.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      deviceId: entry.deviceId || 'anonymous',
      timestamp: entry.timestamp || new Date().toISOString(),
      originalExcerpt: (entry.originalExcerpt || '').trim().slice(0, 160),
      language: entry.language || 'en',
      readingLevel: entry.readingLevel || 'simple',
      mode: entry.mode || 'text',
      documentType: entry.documentType || null,
      explanation: entry.explanation || '',
      actionableAdvice: entry.actionableAdvice || '',
      fileName: entry.fileName || null
    };

    memoryStore.unshift(record);
    // Keep max 200 items in store
    if (memoryStore.length > 200) {
      memoryStore = memoryStore.slice(0, 200);
    }
    saveData();
    return record;
  },

  delete(id, deviceId) {
    loadData();
    const index = memoryStore.findIndex(
      (item) => item.id === id && (!deviceId || item.deviceId === deviceId)
    );
    if (index !== -1) {
      const removed = memoryStore.splice(index, 1)[0];
      saveData();
      return removed;
    }
    return null;
  }
};
