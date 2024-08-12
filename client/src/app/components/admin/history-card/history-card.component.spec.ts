import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMaterialModule } from '@app/modules/material.module';
import { DateService } from '@app/services/date/date.service';
import { HistoryCardComponent } from './history-card.component';

describe('HistoryCardComponent', () => {
    let component: HistoryCardComponent;
    let fixture: ComponentFixture<HistoryCardComponent>;
    let dateServiceSpy: jasmine.SpyObj<DateService>;

    beforeEach(() => {
        dateServiceSpy = jasmine.createSpyObj('DateService', ['getDateFormatted']);
        TestBed.configureTestingModule({
            declarations: [HistoryCardComponent],
            imports: [AppMaterialModule],
            providers: [{ provide: DateService, useValue: dateServiceSpy }],
        });
        fixture = TestBed.createComponent(HistoryCardComponent);
        component = fixture.componentInstance;
        component.gameInfo = {
            title: 'test',
            startDateTime: new Date(),
            // disabled any for testing purposes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).not.toBeUndefined();
    });

    describe('formatDate', () => {
        it('should return formatted date', () => {
            component.formatDate(new Date());
            expect(dateServiceSpy.getDateFormatted).toHaveBeenCalled();
        });
    });
});
