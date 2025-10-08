const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const isLikelyHex = (value: string): boolean => /^[0-9a-fA-F]+$/.test(value);

const hexToBytes = (hex: string): Uint8Array => {
  const normalized = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = parseInt(normalized.slice(index, index + 2), 16);
  }
  return bytes;
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const bytesToBase64 = (bytes: ArrayBuffer | Uint8Array): string => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let index = 0; index < view.length; index += 1) {
    binary += String.fromCharCode(view[index]);
  }
  return btoa(binary);
};

const importAesGcmKey = async (rawKeyBytes: Uint8Array): Promise<CryptoKey> => {
  if (rawKeyBytes.byteLength !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes (256-bit)");
  }
  return crypto.subtle.importKey(
    "raw",
    rawKeyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
};

const getRawKeyBytes = (keyMaterial: string): Uint8Array => {
  const trimmed = keyMaterial.trim();
  if (trimmed.length === 64 && isLikelyHex(trimmed)) {
    return hexToBytes(trimmed);
  }
  // Assume base64 otherwise
  return base64ToBytes(trimmed);
};

export const getEncryptionKeyFromString = async (
  keyString: string
): Promise<CryptoKey> => {
  const trimmed = (keyString || "").trim();
  if (!trimmed) throw new Error("Missing DATA_ENCRYPTION_KEY");
  const raw = getRawKeyBytes(trimmed);
  return importAesGcmKey(raw);
};

export const encryptString = async (
  plaintext: string,
  keyString: string
): Promise<string> => {
  if (!plaintext) return plaintext;
  const key = await getEncryptionKeyFromString(keyString);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = textEncoder.encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);
  return bytesToBase64(combined);
};

export const decryptString = async (
  ciphertextBase64: string,
  keyString: string
): Promise<string> => {
  if (!ciphertextBase64) return ciphertextBase64;
  const key = await getEncryptionKeyFromString(keyString);
  const combined = base64ToBytes(ciphertextBase64);
  if (combined.byteLength < 13) {
    throw new Error("Invalid ciphertext");
  }
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  return textDecoder.decode(decrypted);
};
