import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistogramMockComponent } from '@app/components/game/histogram/histogram-mock.component';
import { Direction } from '@app/enums/direction.enum';
import { AppMaterialModule } from '@app/modules/material.module';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { StatisticComponent } from './statistic.component';

// magic numbers used for tests
/* eslint-disable  @typescript-eslint/no-magic-numbers */

describe('StatisticComponent', () => {
    let component: StatisticComponent;
    let fixture: ComponentFixture<StatisticComponent>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;

    beforeEach(() => {
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['']);
        histogramServiceSpy.quizHistory = {
            totalSelectedChoicesHistory: new Array(4).fill(null),
            questionHistory: [],
            histogramTextsHistory: [],
            rightAnswerHistory: [],
        };
        TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [StatisticComponent, HistogramMockComponent],
            providers: [{ provide: HistogramService, useValue: histogramServiceSpy }],
        });
        fixture = TestBed.createComponent(StatisticComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('selectHistogram', () => {
        it('should update selectedIndex when a new index is selected', () => {
            const newIndex = 1;
            component.selectHistogram(newIndex);
            expect(component.selectedIndex).toEqual(newIndex);
        });
    });

    describe('navigate', () => {
        it('should decrement selectedIndex when direction is Left and can navigate left', () => {
            spyOn(component, 'canNavigateLeft').and.returnValue(true);
            component.selectHistogram(3);
            component.navigate(Direction.Left);
            expect(component.selectedIndex).toEqual(2);
        });

        it('should not decrement selectedIndex when direction is Left and cannot navigate left', () => {
            spyOn(component, 'canNavigateLeft').and.returnValue(false);
            component.selectHistogram(0);
            component.navigate(Direction.Left);
            expect(component.selectedIndex).toEqual(0);
        });

        it('should increment selectedIndex when direction is Right and can navigate right', () => {
            spyOn(component, 'canNavigateRight').and.returnValue(true);
            component.selectHistogram(0);
            component.navigate(Direction.Right);
            expect(component.selectedIndex).toEqual(1);
        });

        it('should not increment selectedIndex when direction is Right and cannot navigate right', () => {
            spyOn(component, 'canNavigateRight').and.returnValue(false);
            component.selectHistogram(histogramServiceSpy.quizHistory.totalSelectedChoicesHistory.length - 1);
            component.navigate(Direction.Right);
            expect(component.selectedIndex).toEqual(histogramServiceSpy.quizHistory.totalSelectedChoicesHistory.length - 1);
        });
    });

    describe('navigateLeft', () => {
        it('should call navigate with Direction.Left', () => {
            spyOn(component, 'navigate');
            component.navigateLeft();
            expect(component.navigate).toHaveBeenCalledWith(Direction.Left);
        });
    });

    describe('navigateRight', () => {
        it('should call navigate with Direction.Right', () => {
            spyOn(component, 'navigate');
            component.navigateRight();
            expect(component.navigate).toHaveBeenCalledWith(Direction.Right);
        });
    });

    describe('canNavigateLeft', () => {
        it('should return true if selectedIndex is greater than 0', () => {
            component.selectHistogram(1);
            expect(component.canNavigateLeft()).toBeTrue();
        });

        it('should return false if selectedIndex is 0', () => {
            component.selectHistogram(0);
            expect(component.canNavigateLeft()).toBeFalse();
        });
    });

    describe('canNavigateRight', () => {
        it('should return true if there are more histograms to the right of selectedIndex', () => {
            component.selectHistogram(0);
            expect(component.canNavigateRight()).toBeTrue();
        });

        it('should return false if selectedIndex is at the last histogram', () => {
            component.selectHistogram(histogramServiceSpy.quizHistory.totalSelectedChoicesHistory.length - 1);
            expect(component.canNavigateRight()).toBeFalse();
        });
    });

    describe('isHistogramActive', () => {
        it('should return true if the given index is the selectedIndex', () => {
            const activeIndex = 2;
            component.selectHistogram(activeIndex);
            expect(component.isHistogramActive(activeIndex)).toBeTrue();
        });

        it('should return false if the given index is not the selectedIndex', () => {
            component.selectHistogram(2);
            expect(component.isHistogramActive(3)).toBeFalse();
        });
    });
});
