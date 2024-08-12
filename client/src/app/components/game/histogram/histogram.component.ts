import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
    CORRECT_CHOICE_COLOR,
    HISTOGRAM_FIRST_COLOR,
    HISTOGRAM_FOURTH_COLOR,
    HISTOGRAM_SECOND_COLOR,
    HISTOGRAM_THIRD_COLOR,
    WRONG_CHOICE_COLOR,
} from '@app/constants/histogram-colors.constants';
import { HistogramService } from '@app/services/histogram/histogram.service';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexDataLabels,
    ApexFill,
    ApexGrid,
    ApexLegend,
    ApexPlotOptions,
    ApexTooltip,
    ApexXAxis,
    ApexYAxis,
} from 'ng-apexcharts';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent implements OnInit, OnDestroy {
    @Input() histogramValues: number[] = this.histogramService.histogramValues;
    @Input() histogramTexts: string[] = this.histogramService.histogramTexts;
    @Input() histogramRightAnswers: number[] = this.histogramService.histogramRightAnswers;

    series: ApexAxisChartSeries;
    chart: ApexChart;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    grid: ApexGrid;
    tooltip: ApexTooltip;
    fill: ApexFill;
    legend: ApexLegend;

    private histogramValuesSubscription: Subscription = new Subscription();

    constructor(private histogramService: HistogramService) {}

    ngOnInit(): void {
        this.initializeChartOptions();
        this.startSubscription();
    }

    ngOnDestroy() {
        this.stopSubscription();
    }

    getSeries(): ApexAxisChartSeries {
        return [
            {
                data: this.histogramValues,
            },
        ];
    }

    getXAxis(): ApexXAxis {
        const colorsXAxis = this.getXAxisColor();
        return {
            categories: this.histogramValues.map((_, index) => (this.histogramRightAnswers.includes(index) ? 'done' : 'close')),
            min: 2,
            max: 4,
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                show: this.histogramRightAnswers.length > 0,
                style: {
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    fontFamily: 'Material Icons',
                    cssClass: 'label',
                    colors: colorsXAxis,
                },
            },
        };
    }

    getXAxisColor() {
        return this.histogramValues.map((_, index) => (this.histogramRightAnswers.includes(index) ? CORRECT_CHOICE_COLOR : WRONG_CHOICE_COLOR));
    }

    startSubscription() {
        this.histogramValuesSubscription = this.histogramService.histogramValues$.subscribe(() => {
            this.updateData();
        });
    }

    stopSubscription() {
        this.histogramValuesSubscription.unsubscribe();
    }

    private updateData() {
        this.histogramValues = this.histogramService.histogramValues;
        this.histogramTexts = this.histogramService.histogramTexts;

        this.xaxis = this.getXAxis();
        this.series = this.getSeries();
    }

    private initializeChartOptions() {
        this.series = this.getSeries();

        this.chart = {
            type: 'bar',
            toolbar: {
                show: false,
            },
            height: '330px',
            animations: {
                enabled: false,
            },
        };

        this.plotOptions = {
            bar: {
                distributed: true,
                dataLabels: {
                    position: 'top',
                },
            },
        };
        this.dataLabels = {
            offsetY: -1000,
            style: {
                fontSize: '30px',
                colors: ['#141414'],
            },
        };
        this.xaxis = this.getXAxis();

        this.yaxis = {
            show: false,
        };
        this.grid = {
            show: false,
        };

        this.tooltip = {
            enabled: false,
        };

        this.fill = {
            colors: [HISTOGRAM_FIRST_COLOR, HISTOGRAM_SECOND_COLOR, HISTOGRAM_THIRD_COLOR, HISTOGRAM_FOURTH_COLOR],
        };
        this.legend = {
            show: false,
        };
    }
}
