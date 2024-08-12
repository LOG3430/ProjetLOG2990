import { Component } from '@angular/core';
import { Direction } from '@app/enums/direction.enum';
import { QuizStatisticsHistory } from '@app/interfaces/quiz-statistics-history';
import { HistogramService } from '@app/services/histogram/histogram.service';

@Component({
    selector: 'app-statistic',
    templateUrl: './statistic.component.html',
    styleUrls: ['./statistic.component.scss'],
})
export class StatisticComponent {
    selectedIndex: number = 0;

    constructor(private histogramService: HistogramService) {}

    selectHistogram(index: number): void {
        this.selectedIndex = index;
    }

    getHistory(): QuizStatisticsHistory {
        return this.histogramService.quizHistory;
    }

    navigate(direction: Direction): void {
        if (direction === Direction.Left && this.canNavigateLeft()) {
            this.selectedIndex--;
        } else if (direction === Direction.Right && this.canNavigateRight()) {
            this.selectedIndex++;
        }
    }

    navigateLeft(): void {
        this.navigate(Direction.Left);
    }

    navigateRight(): void {
        this.navigate(Direction.Right);
    }

    canNavigateLeft(): boolean {
        return this.selectedIndex > 0;
    }

    canNavigateRight(): boolean {
        return this.selectedIndex < this.histogramService.quizHistory.totalSelectedChoicesHistory.length - 1;
    }

    isHistogramActive(index: number): boolean {
        return index === this.selectedIndex;
    }
}
