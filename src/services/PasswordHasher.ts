const ITERATIONS = 150_000
const HASH_ALGORITHM = 'SHA-256'
const KEY_LENGTH = 32

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function randomSaltHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return toHex(bytes.buffer)
}

async function derive(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: HASH_ALGORITHM },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  return toHex(derived)
}

/**
 * Client-side password hashing using PBKDF2 (Web Crypto). Passwords are
 * never stored in plain text, even in the local IndexedDB backend. A
 * future REST backend should re-hash server-side with the same or a
 * stronger scheme (e.g. Argon2) — this keeps the local-only deployment
 * honest in the meantime.
 */
export const PasswordHasher = {
  async hash(password: string): Promise<{ hash: string; salt: string }> {
    const salt = randomSaltHex()
    const hash = await derive(password, salt)
    return { hash, salt }
  },

  async verify(password: string, hash: string, salt: string): Promise<boolean> {
    const candidate = await derive(password, salt)
    return candidate === hash
  },
}
