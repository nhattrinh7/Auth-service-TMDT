import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { UserCreatedEvent } from '~/domain/events/user-created.event'
import { Inject } from '@nestjs/common'
import { type IMessagePublisher, MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'

@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  handle(event: UserCreatedEvent): void {
    this.messagePublisher.publishToNotificationService('user.created', event)
  }
}
