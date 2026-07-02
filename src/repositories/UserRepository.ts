import type { IStorageProvider } from '../storage/IStorageProvider'
import type { PublicUser, Role, User } from '../domain/models'
import { toPublicUser } from '../domain/models'
import { PasswordHasher } from '../services/PasswordHasher'
import { createId, nowIso } from '../utils/id'

export class UserRepository {
  private readonly storage: IStorageProvider

  constructor(storage: IStorageProvider) {
    this.storage = storage
  }

  async list(): Promise<PublicUser[]> {
    const users = await this.storage.listUsers()
    return users.map(toPublicUser)
  }

  getByUsername(username: string): Promise<User | null> {
    return this.storage.getUserByUsername(username)
  }

  async create(username: string, displayName: string, password: string, role: Role): Promise<PublicUser> {
    const existing = await this.storage.getUserByUsername(username)
    if (existing) throw new Error('Username already exists')

    const { hash, salt } = await PasswordHasher.hash(password)
    const now = nowIso()
    const user: User = {
      id: createId(),
      username,
      displayName,
      role,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: now,
      updatedAt: now,
    }
    await this.storage.saveUser(user)
    return toPublicUser(user)
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const user = await this.storage.getUser(userId)
    if (!user) throw new Error('User not found')
    const { hash, salt } = await PasswordHasher.hash(password)
    await this.storage.saveUser({ ...user, passwordHash: hash, passwordSalt: salt, updatedAt: nowIso() })
  }

  async delete(id: string): Promise<void> {
    await this.storage.deleteUser(id)
  }

  async ensureDefaultAdmin(): Promise<void> {
    const users = await this.storage.listUsers()
    if (users.length > 0) return
    await this.create('admin', 'Administrator', 'change-me-now', 'admin')
  }
}
