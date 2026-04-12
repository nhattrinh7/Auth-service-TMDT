import { PhoneNumber } from '~/domain/value-objects/phone-number.vo'
import { ICreateAddressProps } from '~/domain/interfaces/address.interface'
import { v4 as uuidv4 } from 'uuid'

export class Address {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public recipientName: string,
    public phoneNumber: PhoneNumber,
    public province: string,
    public ward: string,
    public detail: string,
    public isDefault: boolean = false,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: ICreateAddressProps): Address {
    const address = new Address(
      uuidv4(),
      props.userId,
      props.recipientName,
      PhoneNumber.create(props.phoneNumber),
      props.province,
      props.ward,
      props.detail,
      props.isDefault || false,
      new Date(),
      new Date(),
    )

    return address
  }
}
