import { Injectable } from '@angular/core';
import { NotificationContent } from '@app/interfaces/notification-content';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    notificationState$: Observable<NotificationContent | null>;
    private notificationSubject: Subject<NotificationContent | null>;

    constructor() {
        this.notificationSubject = new Subject<NotificationContent | null>();
        this.notificationState$ = this.notificationSubject.asObservable();
    }

    showBanner(content: NotificationContent) {
        this.notificationSubject.next(content);
    }

    hideBanner() {
        this.notificationSubject.next(null);
    }
}
