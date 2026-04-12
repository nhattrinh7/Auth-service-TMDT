import { User } from '~/domain/entities/user.entity'

export interface IUserRepository {
  save(user: User, tx?: any): Promise<User>
  findByEmail(email: string): Promise<User | null>
  findByPhoneNumber(phoneNumber: string): Promise<User | null>
}
export const USER_REPOSITORY = Symbol('IUserRepository')
