import { TestBed } from '@angular/core/testing';
import { NotificationType } from '@app/interfaces/notification-content';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { HistoryInfo } from '@common/http/historyInfo.dto';
import { of } from 'rxjs';
import { HistoryService } from './history.service';
import { SortType, SortDirection } from '@app/constants/history-list.component.constants';
import { ERROR_NOTIFICATION_DURATION, WARNING_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';

describe('HistoryService', () => {
    let service: HistoryService;
    let httpCommunicationServiceSpy: jasmine.SpyObj<HttpCommunicationService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

    beforeEach(() => {
        httpCommunicationServiceSpy = jasmine.createSpyObj('HttpCommunicationService', ['basicGet', 'basicDelete']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showBanner']);
        TestBed.configureTestingModule({
            providers: [
                { provide: HttpCommunicationService, useValue: httpCommunicationServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
            ],
        });
        service = TestBed.inject(HistoryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getHistory', () => {
        it('should return history', () => {
            // for testing purposes, we will use any type
            /* eslint-disable @typescript-eslint/no-explicit-any*/
            httpCommunicationServiceSpy.basicGet.and.returnValue(of([{}] as any));
            service.getHistory();
            expect(service.games).toEqual([{}] as any);
            expect(httpCommunicationServiceSpy.basicGet).toHaveBeenCalled();
        });

        it('should sort history by date in ascending order', () => {
            // for testing purposes, we will use any type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mockGames: HistoryInfo[] = [{ startDateTime: new Date('2024-03-22') }, { startDateTime: new Date('2024-03-21') }] as any;
            httpCommunicationServiceSpy.basicGet.and.returnValue(of(mockGames));

            service.getHistory();

            expect(httpCommunicationServiceSpy.basicGet).toHaveBeenCalled();
            expect(service.games).toEqual(mockGames);
        });
    });

    describe('deleteHistory', () => {
        it('should delete history', () => {
            service.deleteHistory();
            expect(httpCommunicationServiceSpy.basicDelete).toHaveBeenCalled();
        });
        it('should only clear games if the db has been cleared', () => {
            // for testing purposes, we will use any type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mockGames: HistoryInfo[] = [{}, {}, {}] as any;
            service.games = mockGames;
            httpCommunicationServiceSpy.basicDelete.and.returnValue(of(true));

            service.deleteHistory();

            expect(httpCommunicationServiceSpy.basicDelete).toHaveBeenCalled();
            expect(service['games']).toEqual([]);
        });

        it('should show error notification if deleteHistory fails', () => {
            // for testing purposes, we will use any type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mockGames: HistoryInfo[] = [{}, {}, {}] as any;
            service['games'] = mockGames;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (httpCommunicationServiceSpy.basicDelete as any).and.returnValue(new Error('error'));

            service.deleteHistory();

            expect(service['games']).toEqual(mockGames);
            expect(httpCommunicationServiceSpy.basicDelete).toHaveBeenCalled();
            expect(notificationServiceSpy.showBanner).toHaveBeenCalledWith({
                message: "Erreur lors de la suppression de l'historique",
                type: NotificationType.Error,
                durationMs: ERROR_NOTIFICATION_DURATION,
            });
        });

        it('should show warning notification if there is no history to delete', () => {
            // for testing purposes, we will use any type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mockGames: HistoryInfo[] = [{}, {}, {}] as any;
            service['games'] = mockGames;
            httpCommunicationServiceSpy.basicDelete.and.returnValue(of(false));

            service.deleteHistory();

            expect(httpCommunicationServiceSpy.basicDelete).toHaveBeenCalled();
            expect(service['games']).toEqual(mockGames);
            expect(notificationServiceSpy.showBanner).toHaveBeenCalledWith({
                message: 'Aucune partie à supprimer',
                type: NotificationType.Warning,
                durationMs: WARNING_NOTIFICATION_DURATION,
            });
        });
    });

    describe('sortBy', () => {
        it('should not sort if no sort type or order is provided', () => {
            // for testing purposes, we will use any type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mockGames: HistoryInfo[] = [{ startDateTime: new Date('2024-03-22') }, { startDateTime: new Date('2024-03-21') }] as any;
            service['games'] = [...mockGames];

            service.sortBy(undefined as any, undefined as any);

            expect(service['games']).toEqual(mockGames);
        });

        it('should sort by date in descending order', () => {
            const mockGames: HistoryInfo[] = [
                { startDateTime: new Date('2024-03-22') },
                { startDateTime: new Date('2024-03-21') },
                { startDateTime: new Date('2024-03-23') },
                // for testing purposes, we will use any type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ] as any;
            service['games'] = [...mockGames];

            service.sortBy(SortType.Date, SortDirection.Descending);

            expect(service['games']).toEqual([mockGames[1], mockGames[0], mockGames[2]]);
        });
        it('should sort by date in ascending order', () => {
            const mockGames: HistoryInfo[] = [
                { startDateTime: new Date('2024-03-22') },
                { startDateTime: new Date('2024-03-21') },
                { startDateTime: new Date('2024-03-23') },
                // for testing purposes, we will use any type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ] as any;
            service['games'] = [...mockGames];

            service.sortBy(SortType.Date, SortDirection.Ascending);

            expect(service['games']).toEqual([mockGames[2], mockGames[0], mockGames[1]]);
        });
    });

    it('should sort by title in ascending order', () => {
        // for testing purposes, we will use any type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockGames: HistoryInfo[] = [
            { title: 'C', startDateTime: new Date('2024-03-22') },
            { title: 'A', startDateTime: new Date('2024-03-22') },
            { title: 'B', startDateTime: new Date('2024-03-22') },
        ] as any;
        service['games'] = [...mockGames];

        service.sortBy(SortType.Title, SortDirection.Ascending);

        expect(service['games']).toEqual([mockGames[1], mockGames[2], mockGames[0]]);
    });

    it('should sort by title in descending order', () => {
        // for testing purposes, we will use any type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockGames: HistoryInfo[] = [
            { title: 'C', startDateTime: new Date('2024-03-22') },
            { title: 'A', startDateTime: new Date('2024-03-22') },
            { title: 'B', startDateTime: new Date('2024-03-22') },
        ] as any;
        service['games'] = [...mockGames];

        service.sortBy(SortType.Title, SortDirection.Descending);

        expect(service['games']).toEqual([mockGames[0], mockGames[2], mockGames[1]]);
    });
});
