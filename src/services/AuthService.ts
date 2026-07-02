import type { PublicUser } from '../domain/models'
import type { IStorageProvider } from '../storage/IStorageProvider'

const SESSION_KEY = 'memory-shelf:session'

export interface Session {
  userId: string
  username: string
  displayName: string
  role: PublicUser['role']
}

/**
 * Authentication is delegated to the active storage provider's
 * `verifyCredentials`, so each backend decides how credentials are
 * checked — locally for IndexedDB, server-side via `/auth/login` for a
 * REST backend — without this service ever seeing a password hash it
 * shouldn't. Only the resulting session is cached here, in
 * localStorage.
 */
export class AuthService {
  private readonly storage: IStorageProvider

  constructor(storage: IStorageProvider) {
    this.storage = storage
  }

  async login(username: string, password: string): Promise<Session> {
    const user = await this.storage.verifyCredentials(username, password)
    if (!user) throw new Error('Invalid username or password')

    const session: Session = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    }
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
}
