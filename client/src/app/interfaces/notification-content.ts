export enum NotificationType {
    Info = 'info',
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}

export class NotificationContent {
    constructor(
        public message: string = '',
        public type: NotificationType = NotificationType.Info,
        public durationMs: number = 0,
    ) {}
}
