import { getDb } from '../db/database'
import { PasswordHasher } from './PasswordHasher'

const SESSION_KEY = 'memory-shelf:session'
const ACCOUNT_SETTING_KEY = 'admin-account'
const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'change-me-now'

export interface Session {
  displayName: string
}

interface AdminAccount {
  username: string
  displayName: string
  passwordHash: string
  passwordSalt: string
}

/**
 * Memory Shelf has exactly one admin account — there is no multi-user
 * or role system. The account is a single row in the settings store,
 * not a full "users" table.
 */
export class AuthService {
  async ensureAccountExists(): Promise<void> {
    const db = await getDb()
    const existing = await db.get('settings', ACCOUNT_SETTING_KEY)
    if (existing) return
    const { hash, salt } = await PasswordHasher.hash(DEFAULT_PASSWORD)
    const account: AdminAccount = {
      username: DEFAULT_USERNAME,
      displayName: 'Administrator',
      passwordHash: hash,
      passwordSalt: salt,
    }
    await db.put('settings', account, ACCOUNT_SETTING_KEY)
  }

  async login(username: string, password: string): Promise<Session> {
    const db = await getDb()
    const account = (await db.get('settings', ACCOUNT_SETTING_KEY)) as AdminAccount | undefined
    if (!account || account.username !== username) throw new Error('Invalid username or password')
    const valid = await PasswordHasher.verify(password, account.passwordHash, account.passwordSalt)
    if (!valid) throw new Error('Invalid username or password')

    const session: Session = { displayName: account.displayName }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY)
  }

  getSession(): Session | null {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Session
    } catch {
      return null
    }
  }

  async changePassword(newPassword: string): Promise<void> {
    const db = await getDb()
    const account = (await db.get('settings', ACCOUNT_SETTING_KEY)) as AdminAccount | undefined
    if (!account) throw new Error('No admin account found')
    const { hash, salt } = await PasswordHasher.hash(newPassword)
    await db.put('settings', { ...account, passwordHash: hash, passwordSalt: salt }, ACCOUNT_SETTING_KEY)
  }
}
