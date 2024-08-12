import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { By } from '@angular/platform-browser';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { AppMaterialModule } from '@app/modules/material.module';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { NotificationServiceMock } from './notification-service-mock';
import { NotificationComponent } from './notification.component';

describe('NotificationComponent', () => {
    let component: NotificationComponent;
    let fixture: ComponentFixture<NotificationComponent>;
    let notificationServiceMock: NotificationServiceMock;

    beforeEach(() => {
        notificationServiceMock = new NotificationServiceMock();

        TestBed.configureTestingModule({
            declarations: [NotificationComponent],
            imports: [AppMaterialModule],
            providers: [{ provide: NotificationService, useValue: notificationServiceMock }],
        });
        spyOn(notificationServiceMock, 'hideBanner');

        fixture = TestBed.createComponent(NotificationComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('constructor', () => {
        it('should create notification', () => {
            expect(component.notification).toBeTruthy();
        });

        it('should set notificationStackedCount to 0', () => {
            expect(component['notificationStackedCount']).toBe(0);
        });
    });

    it('should show notification when notificationState$ emits', fakeAsync(() => {
        const duration = 3000;
        const message = 'Test Message';
        const notification = new NotificationContent(message, NotificationType.Info, duration);

        notificationServiceMock.setNotificationForTest(notification);
        fixture.detectChanges();
        tick();

        const notificationElement = fixture.debugElement.query(By.css('.notification'));

        expect(notificationElement).toBeTruthy();
        expect(notificationElement.nativeElement.textContent).toContain(message);

        tick(duration);
    }));

    it('should hide notification after a delay', fakeAsync(() => {
        const duration = 3000;
        const message = 'Test Message';
        const notification = new NotificationContent(message, NotificationType.Info, duration);

        notificationServiceMock.setNotificationForTest(notification);
        fixture.detectChanges();

        tick(duration);

        expect(notificationServiceMock.hideBanner).toHaveBeenCalled();
    }));

    it('should hide notification on button click', fakeAsync(() => {
        const duration = 3000;
        const message = 'Test Message';
        const notification = new NotificationContent(message, NotificationType.Info, duration);

        notificationServiceMock.setNotificationForTest(notification);
        fixture.detectChanges();
        tick();

        const button = fixture.debugElement.query(By.css('#close-icon'));
        button.triggerEventHandler('click', null);
        fixture.detectChanges();
        tick();

        expect(notificationServiceMock.hideBanner).toHaveBeenCalled();
        expect(component.notification.message).toBeFalsy();

        tick(duration);
    }));

    it('should reset when notificationState$ emits empty object', fakeAsync(() => {
        const duration = 0;
        const message = '';
        const notification = new NotificationContent(message, NotificationType.Info, duration);

        notificationServiceMock.setNotificationForTest(notification);
        fixture.detectChanges();
        tick();
        spyOn(component, 'reset');

        component.hideNotification();

        expect(component.reset).toHaveBeenCalled();
    }));

    it('should hide notification after a delay when multiple notifications are stacked', fakeAsync(() => {
        const duration = 3000;
        const message1 = 'Test Message 1';
        const message2 = 'Test Message 2';
        const notification1 = new NotificationContent(message1, NotificationType.Info, duration);
        const notification2 = new NotificationContent(message2, NotificationType.Info, duration);

        notificationServiceMock.setNotificationForTest(notification1);
        fixture.detectChanges();
        tick();

        notificationServiceMock.setNotificationForTest(notification2);
        fixture.detectChanges();
        tick();

        expect(notificationServiceMock.hideBanner).not.toHaveBeenCalled();

        tick(duration);

        expect(notificationServiceMock.hideBanner).toHaveBeenCalled();
    }));

    it('should not change notification after null notification is received', fakeAsync(() => {
        const duration = 3000;
        const message1 = 'Test Message 1';
        const notification1 = new NotificationContent(message1, NotificationType.Info, duration);
        const notification2 = null;

        notificationServiceMock.setNotificationForTest(notification1);
        fixture.detectChanges();
        tick();

        notificationServiceMock.setNotificationForTest(notification2);
        fixture.detectChanges();
        tick();

        expect(notificationServiceMock.hideBanner).not.toHaveBeenCalled();

        tick(duration);

        expect(notificationServiceMock.hideBanner).toHaveBeenCalled();
    }));
});
