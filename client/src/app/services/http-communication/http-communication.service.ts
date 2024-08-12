import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ERROR_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class HttpCommunicationService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(
        private readonly http: HttpClient,
        private readonly notificationService: NotificationService,
    ) {}

    basicGet<T>(route: string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${route}`, {}).pipe(catchError(this.handleError<T>('basicGet')));
    }

    basicPost<Req, Res>(route: string, body: Req): Observable<Res> {
        return this.http.post<Res>(`${this.baseUrl}/${route}`, body).pipe(catchError(this.handleError<Res>('basicPost')));
    }

    basicPut<Req, Res>(route: string, body: Req): Observable<Res> {
        return this.http.put<Res>(`${this.baseUrl}/${route}`, body).pipe(catchError(this.handleError<Res>('basicPut')));
    }

    basicPatch<Req, Res>(route: string, body: Partial<Req>): Observable<Res> {
        return this.http.patch<Res>(`${this.baseUrl}/${route}`, body).pipe(catchError(this.handleError<Res>('basicPatch')));
    }

    basicDelete<T>(route: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}/${route}`).pipe(catchError(this.handleError<T>('basicDelete')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return (error) => {
            this.notificationService.showBanner(
                new NotificationContent(`Erreur lors de l'accès au serveur: ${error.message}`, NotificationType.Error, ERROR_NOTIFICATION_DURATION),
            );
            return of(result as T);
        };
    }
}
