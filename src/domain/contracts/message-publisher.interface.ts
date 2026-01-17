export interface IMessagePublisher {
  publishToNotificationService<T>(pattern: string, event: T): void
}
export const MESSAGE_PUBLISHER = Symbol('MESSAGE_PUBLISHER')
