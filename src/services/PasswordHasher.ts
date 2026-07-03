import { pbkdf2Async } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'

const ITERATIONS = 150_000
const KEY_LENGTH = 32

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))
}

/**
 * `crypto.subtle` (Web Crypto's SubtleCrypto) only exists in "secure
 * contexts" — https or 127.0.0.1/localhost. Memory Shelf is meant to
 * run on a Raspberry Pi over plain HTTP on a home network
 * (http://192.168.x.x), where `crypto.subtle` is `undefined`. This
 * checks for it rather than assuming it's there.
 */
function hasSubtleCrypto(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle
}

function randomSaltHex(): string {
  // crypto.getRandomValues, unlike crypto.subtle, works in any context,
  // secure or not — safe to use unconditionally.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return toHex(bytes)
}

async function deriveViaWebCrypto(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex).slice().buffer, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  return toHex(new Uint8Array(derived))
}

/**
 * Pure-JS PBKDF2-HMAC-SHA256 (via @noble/hashes, a small audited
 * dependency-free implementation) for insecure contexts where
 * crypto.subtle isn't available. Same algorithm, same iteration count,
 * same output shape as the Web Crypto path — a password hashed under
 * one produces a different-looking hash than the other, but each is
 * internally consistent, which is all a fixed local deployment needs.
 */
async function deriveViaPureJs(password: string, saltHex: string): Promise<string> {
  const derived = await pbkdf2Async(sha256, password, fromHex(saltHex), { c: ITERATIONS, dkLen: KEY_LENGTH })
  return toHex(derived)
}

async function derive(password: string, saltHex: string): Promise<string> {
  return hasSubtleCrypto() ? deriveViaWebCrypto(password, saltHex) : deriveViaPureJs(password, saltHex)
}

/**
 * Client-side password hashing using PBKDF2. Passwords are never
 * stored in plain text, even in the local IndexedDB backend. Uses Web
 * Crypto when available (HTTPS or localhost) and transparently falls
 * back to a pure-JS PBKDF2 when it isn't (plain HTTP on a LAN IP, e.g.
 * a Raspberry Pi at http://192.168.x.x) — same behavior either way.
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
