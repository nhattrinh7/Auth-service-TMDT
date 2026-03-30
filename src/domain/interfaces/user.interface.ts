import { Gender } from '~/domain/enums/user.enum'

export interface ICreateUserProps {
  email: string
  roleId: string
  hashedPassword: string
  fullName: string
  phoneNumber: string
  dob: Date
  gender: Gender
}

export interface ICreateGoogleUserProps {
  email: string
  roleId: string
  hashedPassword: string
  fullName: string
  phoneNumber: string
  dob: Date
  gender: Gender
  avatar?: string | null
}
