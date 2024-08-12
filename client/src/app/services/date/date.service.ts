import { Injectable } from '@angular/core';
import {
    DATE_FORMAT_MONTH_OFFSET,
    DATE_FORMAT_PADDING_SIZE,
    N_DAYS_IN_MONTH,
    N_HOURS_IN_DAY,
    N_MINUTES_IN_HOUR,
    N_MONTHS_IN_YEAR,
    N_MS_IN_SECONDS,
    N_SECONDS_IN_MINUTE,
} from '@app/constants/date.constants';

@Injectable({
    providedIn: 'root',
})
export class DateService {
    getTimeSinceLastModificationMessage(date: Date): string {
        const now = new Date();
        const lastModification = new Date(date);
        const timeSinceLastModification = now.getTime() - lastModification.getTime();
        const secondsSinceLastModification = Math.floor(timeSinceLastModification / N_MS_IN_SECONDS);
        const minutesSinceLastModification = Math.floor(secondsSinceLastModification / N_SECONDS_IN_MINUTE);
        const hoursSinceLastModification = Math.floor(minutesSinceLastModification / N_MINUTES_IN_HOUR);
        const daysSinceLastModification = Math.floor(hoursSinceLastModification / N_HOURS_IN_DAY);
        const monthsSinceLastModification = Math.floor(daysSinceLastModification / N_DAYS_IN_MONTH);
        const yearsSinceLastModification = Math.floor(monthsSinceLastModification / N_MONTHS_IN_YEAR);

        if (yearsSinceLastModification > 0) {
            return this.formatDateMessage(yearsSinceLastModification, 'an');
        } else if (monthsSinceLastModification > 0) {
            return this.formatDateMessage(monthsSinceLastModification, 'mois');
        } else if (daysSinceLastModification > 0) {
            return this.formatDateMessage(daysSinceLastModification, 'jour');
        } else if (hoursSinceLastModification > 0) {
            return this.formatDateMessage(hoursSinceLastModification, 'heure');
        } else if (minutesSinceLastModification > 0) {
            return this.formatDateMessage(minutesSinceLastModification, 'minute');
        } else {
            return "Il y a moins d'une minute";
        }
    }

    formatDateMessage(time: number, unit: string): string {
        return `Il y a ${time} ${unit}${time > 1 && unit !== 'mois' ? 's' : ''}`;
    }

    getDateFormatted(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + DATE_FORMAT_MONTH_OFFSET).padStart(DATE_FORMAT_PADDING_SIZE, '0');
        const day = String(date.getDate()).padStart(DATE_FORMAT_PADDING_SIZE, '0');
        const hours = String(date.getHours()).padStart(DATE_FORMAT_PADDING_SIZE, '0');
        const minutes = String(date.getMinutes()).padStart(DATE_FORMAT_PADDING_SIZE, '0');
        const seconds = String(date.getSeconds()).padStart(DATE_FORMAT_PADDING_SIZE, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}
