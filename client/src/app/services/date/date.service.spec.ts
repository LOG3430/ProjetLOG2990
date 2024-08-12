import { TestBed } from '@angular/core/testing';
import { TEN_SECONDS, TWO_DAYS, TWO_HOURS, TWO_MINUTES, TWO_MONTHS, TWO_YEARS } from '@app/constants/date.constants';
import { DateService } from './date.service';

describe('DateService', () => {
    let service: DateService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return the correct time since last modification message if delay is less than 60s', () => {
        const currentDate = new Date();
        const lastModifiedDate = new Date(currentDate.getTime() - TEN_SECONDS);
        const expectedMessage = "Il y a moins d'une minute";

        const result = service.getTimeSinceLastModificationMessage(lastModifiedDate);

        expect(result).toEqual(expectedMessage);
    });

    it('should return the correct time since last modification message if delay is less than 60mins', () => {
        const currentDate = new Date();
        const lastModifiedDate = new Date(currentDate.getTime() - TWO_MINUTES);
        const expectedMessage = 'Il y a 2 minutes';

        const result = service.getTimeSinceLastModificationMessage(lastModifiedDate);

        expect(result).toEqual(expectedMessage);
    });

    it('should return the correct time since last modification message if delay is less than 24h', () => {
        const currentDate = new Date();
        const lastModifiedDate = new Date(currentDate.getTime() - TWO_HOURS);
        const expectedMessage = 'Il y a 2 heures';

        const result = service.getTimeSinceLastModificationMessage(lastModifiedDate);

        expect(result).toEqual(expectedMessage);
    });

    it('should return the correct time since last modification message if delay is less than 30 days', () => {
        const currentDate = new Date();
        const lastModifiedDate = new Date(currentDate.getTime() - TWO_DAYS);
        const expectedMessage = 'Il y a 2 jours';

        const result = service.getTimeSinceLastModificationMessage(lastModifiedDate);

        expect(result).toEqual(expectedMessage);
    });

    it('should return the correct time since last modification message if delay is less than 12 months', () => {
        const currentDate = new Date();
        const lastModifiedDate = new Date(currentDate.getTime() - TWO_MONTHS);
        const expectedMessage = 'Il y a 2 mois';

        const result = service.getTimeSinceLastModificationMessage(lastModifiedDate);

        expect(result).toEqual(expectedMessage);
    });

    it('should return the correct time since last modification message if delay is more than 12 months', () => {
        const currentDate = new Date();
        const lastModifiedDate = new Date(currentDate.getTime() - TWO_YEARS);
        const expectedMessage = 'Il y a 2 ans';

        const result = service.getTimeSinceLastModificationMessage(lastModifiedDate);

        expect(result).toEqual(expectedMessage);
    });

    it('should return the correct formatted date', () => {
        const date = new Date('2022-02-01T03:02:01');
        const expectedFormattedDate = '2022-02-01 03:02:01';

        const result = service.getDateFormatted(date);

        expect(result).toEqual(expectedFormattedDate);
    });
});
