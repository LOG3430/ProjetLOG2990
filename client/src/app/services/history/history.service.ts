import { Injectable } from '@angular/core';
import { ERROR_NOTIFICATION_DURATION, WARNING_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';
import { SortDirection, SortType } from '@app/constants/history-list.component.constants';
import { API_PATH } from '@app/constants/history.service.constants';
import { NotificationType } from '@app/interfaces/notification-content';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { HistoryInfo } from '@common/http/historyInfo.dto';
@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    games: HistoryInfo[] = [];

    constructor(
        private httpCommunicationService: HttpCommunicationService,
        private notificationService: NotificationService,
    ) {}

    getHistory() {
        this.httpCommunicationService.basicGet<HistoryInfo[]>(API_PATH).subscribe((games) => {
            this.games = games;
            this.sortBy(SortType.Date, SortDirection.Ascending);
        });
    }

    deleteHistory() {
        try {
            this.httpCommunicationService.basicDelete<boolean>(API_PATH).subscribe((success) => {
                if (success) {
                    this.games = [];
                } else {
                    this.notificationService.showBanner({
                        message: 'Aucune partie à supprimer',
                        type: NotificationType.Warning,
                        durationMs: WARNING_NOTIFICATION_DURATION,
                    });
                }
            });
        } catch (error) {
            this.notificationService.showBanner({
                message: "Erreur lors de la suppression de l'historique",
                type: NotificationType.Error,
                durationMs: ERROR_NOTIFICATION_DURATION,
            });
        }
    }

    sortBy(sortType: SortType, sortOrder: SortDirection) {
        if (!sortOrder || !sortType) {
            return;
        }

        this.games.sort((a, b) => {
            return b.startDateTime.getTime() - a.startDateTime.getTime();
        });

        if (sortType === SortType.Title) {
            this.games.sort((a, b) => {
                return a.title.localeCompare(b.title, 'fr-CA', { sensitivity: 'base' });
            });
        }
        if (sortOrder === SortDirection.Descending) {
            this.games.reverse();
        }
    }
}
