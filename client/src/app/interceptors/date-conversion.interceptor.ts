import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DateInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(req).pipe(
            map((event: HttpEvent<unknown>) => {
                if (event instanceof HttpResponse) {
                    const modifiedEvent = this.parseDates(event);
                    return modifiedEvent;
                }
                return event;
            }),
        );
    }

    private parseDates(event: HttpResponse<unknown>): HttpResponse<unknown> {
        const modifiedBody = this.parseDateFields(event.body);
        return new HttpResponse({
            body: modifiedBody,
            headers: event.headers,
            status: event.status,
            statusText: event.statusText,
            url: event.url ? event.url : undefined,
        });
    }

    // this needs to be any because we don't know the http event that will be intercepted
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    private parseDateFields(body: any): any {
        if (!body || typeof body !== 'object') {
            return body;
        }
        for (const key in body) {
            if ((key === 'lastModification' || key === 'startDateTime') && typeof body[key] === 'string' && this.isDateString(body[key])) {
                body[key] = new Date(body[key]);
            } else if (typeof body[key] === 'object') {
                body[key] = this.parseDateFields(body[key]);
            }
        }
        return body;
    }

    private isDateString(value: string): boolean {
        return !isNaN(Date.parse(value));
    }
}
