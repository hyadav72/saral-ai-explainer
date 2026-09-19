const DEVICE_STORAGE_KEY = 'saral_device_id';

export function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!id) {
      // Generate a UUID-like identifier
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      }
      localStorage.setItem(DEVICE_STORAGE_KEY, id);
    }
    return id;
  } catch (e) {
    console.warn('LocalStorage unavailable, using session identifier:', e);
    return 'session_' + Date.now();
  }
}
