import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    CORRECT_CHOICE_COLOR,
    HISTOGRAM_FIRST_COLOR,
    HISTOGRAM_FOURTH_COLOR,
    HISTOGRAM_SECOND_COLOR,
    HISTOGRAM_THIRD_COLOR,
    WRONG_CHOICE_COLOR,
} from '@app/constants/histogram-colors.constants';
import { AppMaterialModule } from '@app/modules/material.module';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable, Subject } from 'rxjs';
import { HistogramComponent } from './histogram.component';

// any used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;

    beforeEach(() => {
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['histogramValues', 'histogramValues$']);

        TestBed.configureTestingModule({
            imports: [NgApexchartsModule, AppMaterialModule],
            declarations: [HistogramComponent],
            providers: [{ provide: HistogramService, useValue: histogramServiceSpy }],
        });
        histogramServiceSpy.histogramValues = [1, 2, 3, 3];
        histogramServiceSpy.histogramValues$ = new Observable();
        histogramServiceSpy.histogramTexts = ['1', '2', '3', '4'];
        histogramServiceSpy.histogramRightAnswers = [0];
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should initialize chart options and start subscription', () => {
            spyOn(component as any, 'initializeChartOptions');
            spyOn(component, 'startSubscription');
            component.ngOnInit();
            expect(component['initializeChartOptions']).toHaveBeenCalled();
            expect(component.startSubscription).toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should stop subscription', () => {
            spyOn(component, 'stopSubscription');
            component.ngOnDestroy();
            expect(component.stopSubscription).toHaveBeenCalled();
        });
    });

    describe('getSeries', () => {
        it('should get series', () => {
            expect(component.getSeries()).toEqual([
                {
                    data: [1, 2, 3, 3],
                },
            ]);
        });
    });

    describe('startSubscription', () => {
        it('should start subscription', () => {
            component.startSubscription();
            expect(component['histogramValuesSubscription']).toBeDefined();
        });

        it('subscribe should update histogram values', () => {
            const histogramValuesSource = new Subject<void>();
            histogramServiceSpy.histogramValues$ = histogramValuesSource.asObservable();
            component.startSubscription();
            component.histogramValues = [];
            component.xaxis = { categories: [] };
            component.series = [];
            spyOn(component, 'getXAxis').and.returnValue({ categories: ['done', 'close', 'close', 'close'] });
            spyOn(component, 'getSeries').and.returnValue([{ data: [1, 2, 3, 3] }]);
            histogramValuesSource.next();
            expect(component.histogramValues).toEqual([1, 2, 3, 3]);
            expect(component.xaxis).toEqual({ categories: ['done', 'close', 'close', 'close'] });
            expect(component.series).toEqual([{ data: [1, 2, 3, 3] }]);
        });
    });

    describe('stopSubscription', () => {
        it('should stop subscription', () => {
            component.startSubscription();
            component.stopSubscription();
            expect(component['histogramValuesSubscription'].closed).toBeTrue();
        });
    });

    describe('initializeChartOptions', () => {
        it('should initialize chart options', () => {
            spyOn(component, 'getSeries').and.returnValue([{ data: [1, 2, 3, 3] }]);
            spyOn(component, 'getXAxis').and.returnValue({ categories: ['done', 'close', 'close', 'close'] });
            component['initializeChartOptions']();

            expect(component.series).toEqual([{ data: [1, 2, 3, 3] }]);
            expect(component.chart).toEqual({
                type: 'bar',
                toolbar: {
                    show: false,
                },
                height: '330px',
                animations: {
                    enabled: false,
                },
            });
            expect(component.plotOptions).toEqual({
                bar: {
                    distributed: true,
                    dataLabels: {
                        position: 'top',
                    },
                },
            });
            expect(component.dataLabels).toEqual({
                offsetY: -1000,
                style: {
                    fontSize: '30px',
                    colors: ['#141414'],
                },
            });
            expect(component.xaxis).toEqual({ categories: ['done', 'close', 'close', 'close'] });
            expect(component.yaxis).toEqual({
                show: false,
            });
            expect(component.grid).toEqual({
                show: false,
            });
            expect(component.tooltip).toEqual({ enabled: false });

            expect(component.fill).toEqual({
                colors: [HISTOGRAM_FIRST_COLOR, HISTOGRAM_SECOND_COLOR, HISTOGRAM_THIRD_COLOR, HISTOGRAM_FOURTH_COLOR],
            });
            expect(component.legend).toEqual({
                show: false,
            });
        });
    });

    describe('getXAxis', () => {
        it('should get x axis', () => {
            expect(component.getXAxis()).toEqual({
                categories: ['done', 'close', 'close', 'close'],
                min: 2,
                max: 4,
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                labels: {
                    show: true,
                    style: {
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        fontFamily: 'Material Icons',
                        cssClass: 'label',
                        colors: component.getXAxisColor(),
                    },
                },
            });
        });
    });

    describe('getXAxisColor', () => {
        it('should get x axis color', () => {
            expect(component.getXAxisColor()).toEqual([CORRECT_CHOICE_COLOR, WRONG_CHOICE_COLOR, WRONG_CHOICE_COLOR, WRONG_CHOICE_COLOR]);
        });
    });
});
