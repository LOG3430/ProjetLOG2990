import { TestBed } from '@angular/core/testing';

import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NotificationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('constructor', () => {
        it('should create a notificationSubject', () => {
            expect(service['notificationSubject']).toBeTruthy();
        });

        it('should create a notificationState$ observable', () => {
            expect(service.notificationState$).toBeTruthy();
        });
    });

    it('should emit notification content when showBanner is called', (done) => {
        const testContent = new NotificationContent('test', NotificationType.Info, 0);

        service.notificationState$.subscribe((content) => {
            expect(content).toEqual(testContent);
            done();
        });

        service.showBanner(testContent);
    });

    it('should emit empty message and Info type when hideBanner is called', (done) => {
        const testContent = null;

        service.notificationState$.subscribe((content) => {
            expect(content).toEqual(testContent);
            done();
        });

        service.hideBanner();
    });
});
