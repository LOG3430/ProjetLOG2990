import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { SortDirection, SortType } from '@app/constants/history-list.component.constants';
import { AppMaterialModule } from '@app/modules/material.module';
import { HistoryService } from '@app/services/history/history.service';
import { of } from 'rxjs';
import { HistoryListComponent } from './history-list.component';

// disabled no-explicit-any to make tests more concise
/* eslint-disable @typescript-eslint/no-explicit-any */

describe('HistoryListComponent', () => {
    let component: HistoryListComponent;
    let fixture: ComponentFixture<HistoryListComponent>;
    let historyServiceSpy: jasmine.SpyObj<HistoryService>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        const historyServiceSpyObj = jasmine.createSpyObj('HistoryService', ['getHistory', 'deleteHistory', 'sortBy']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            declarations: [HistoryListComponent],
            imports: [MatMenuModule, AppMaterialModule],
            providers: [
                { provide: HistoryService, useValue: historyServiceSpyObj },
                { provide: MatDialog, useValue: matDialogSpy },
            ],
        });

        fixture = TestBed.createComponent(HistoryListComponent);
        component = fixture.componentInstance;
        historyServiceSpy = TestBed.inject(HistoryService) as jasmine.SpyObj<HistoryService>;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should fetch history on init', () => {
            component.ngOnInit();
            expect(historyServiceSpy.getHistory).toHaveBeenCalled();
        });
    });
    describe('deleteHistory', () => {
        it('should delete history', () => {
            component.deleteHistory();
            expect(historyServiceSpy.deleteHistory).toHaveBeenCalled();
        });
    });

    describe('getHistory', () => {
        it('should return history', () => {
            historyServiceSpy.games = [{ text: 'allo' }] as any[];
            expect(component.getHistory()).toEqual([{ text: 'allo' }] as any);
        });
    });

    describe('canDelete', () => {
        it('should return true if there is history', () => {
            historyServiceSpy['games'] = [{}] as any[];
            expect(component.canDelete()).toBeTrue();
        });
        it('should return false if there is no history', () => {
            historyServiceSpy['games'] = [] as any[];
            expect(component.canDelete()).toBeFalse();
        });
    });

    describe('sortOptions', () => {
        it('should have 4 sort options', () => {
            // disabled magic numbers for test purposes
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(component.sortOptions.length).toEqual(4);
        });

        it('should sort by date ascending', () => {
            component.sortOptions[0].sortingFunction(new Event('click'));
            expect(historyServiceSpy.sortBy).toHaveBeenCalledWith(SortType.Date, SortDirection.Ascending);
            expect(component.selectedSortingIndex).toEqual(0);
        });

        it('should sort by date descending', () => {
            component.sortOptions[1].sortingFunction(new Event('click'));
            expect(historyServiceSpy.sortBy).toHaveBeenCalledWith(SortType.Date, SortDirection.Descending);
            expect(component.selectedSortingIndex).toEqual(1);
        });

        it('should sort by title ascending', () => {
            component.sortOptions[2].sortingFunction(new Event('click'));
            expect(historyServiceSpy.sortBy).toHaveBeenCalledWith(SortType.Title, SortDirection.Ascending);
            expect(component.selectedSortingIndex).toEqual(2);
        });

        it('should sort by title descending', () => {
            component.sortOptions[3].sortingFunction(new Event('click'));
            expect(historyServiceSpy.sortBy).toHaveBeenCalledWith(SortType.Title, SortDirection.Descending);
            expect(component.selectedSortingIndex).toEqual(3);
        });
    });

    describe('openConfirmationModal', () => {
        it('should open dialog', () => {
            spyOn(component, 'deleteHistory');
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            component.openConfirmationModal();
            expect(matDialogSpy.open).toHaveBeenCalled();
        });

        it('should delete history if dialog is confirmed', () => {
            spyOn(component, 'deleteHistory');
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            component.openConfirmationModal();
            expect(component.deleteHistory).toHaveBeenCalled();
        });

        it('should not delete history if dialog is not confirmed', () => {
            spyOn(component, 'deleteHistory');
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
            component.openConfirmationModal();
            expect(component.deleteHistory).not.toHaveBeenCalled();
        });
    });
});
