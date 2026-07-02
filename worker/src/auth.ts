const ITERATIONS = 150_000
const KEY_LENGTH = 32

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Same PBKDF2 scheme as the client's PasswordHasher, so a password set
 * locally and pushed to this backend via /backup/import verifies identically. */
export async function verifyPassword(password: string, hash: string, saltHex: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  return toHex(derived) === hash
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return toHex(signature)
}

export interface TokenPayload {
  userId: string
  username: string
  displayName: string
  role: string
  exp: number
}

export async function issueToken(secret: string, payload: Omit<TokenPayload, 'exp'>): Promise<string> {
  const full: TokenPayload = { ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }
  const body = btoa(JSON.stringify(full))
  const signature = await hmac(secret, body)
  return `${body}.${signature}`
}

export async function verifyToken(secret: string, token: string): Promise<TokenPayload | null> {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = await hmac(secret, body)
  if (expected !== signature) return null
  try {
    const payload = JSON.parse(atob(body)) as TokenPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
