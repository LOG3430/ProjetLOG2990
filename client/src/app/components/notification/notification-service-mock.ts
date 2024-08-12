import { NotificationContent } from '@app/interfaces/notification-content';
import { BehaviorSubject, Observable } from 'rxjs';

export class NotificationServiceMock {
    notificationState$: Observable<NotificationContent | null>;
    private notificationSubject: BehaviorSubject<NotificationContent | null>;

    constructor() {
        this.notificationSubject = new BehaviorSubject<NotificationContent | null>(new NotificationContent());
        this.notificationState$ = this.notificationSubject.asObservable();
    }

    setNotificationForTest(value: NotificationContent | null): void {
        this.notificationSubject.next(value);
    }

    /* eslint-disable @typescript-eslint/no-empty-function*/
    // Empty method is necessary as it allows to spy on it
    hideBanner() {}
}
