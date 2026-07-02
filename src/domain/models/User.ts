import type { Entity, Role } from './common'

export interface User extends Entity {
  username: string
  displayName: string
  role: Role
  passwordHash: string
  passwordSalt: string
}

export type PublicUser = Omit<User, 'passwordHash' | 'passwordSalt'>

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _hash, passwordSalt: _salt, ...rest } = user
  return rest
}
