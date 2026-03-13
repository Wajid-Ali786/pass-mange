const PM_CRYPTO_KEY_STORAGE = 'pm_crypto_key_v1';

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function loadOrCreateKey() {
  const existing = localStorage.getItem(PM_CRYPTO_KEY_STORAGE);
  if (existing) {
    return crypto.subtle.importKey('raw', base64ToBytes(existing), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  localStorage.setItem(PM_CRYPTO_KEY_STORAGE, bytesToBase64(raw));
  return key;
}

async function encryptText(plainText) {
  if (!plainText) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await loadOrCreateKey();
  const data = new TextEncoder().encode(plainText);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  return `${bytesToBase64(iv)}:${bytesToBase64(encrypted)}`;
}

async function decryptText(payload) {
  if (!payload) return '';
  if (!payload.includes(':')) return payload;
  const [ivPart, dataPart] = payload.split(':');
  try {
    const iv = base64ToBytes(ivPart);
    const encrypted = base64ToBytes(dataPart);
    const key = await loadOrCreateKey();
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch (_) {
    return '';
  }
}

window.PMEncryption = {
  encryptText,
  decryptText,
};
