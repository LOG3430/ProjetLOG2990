import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-histogram',
    template: '<div>Mock Child Component</div>',
})
export class HistogramMockComponent {
    @Input() histogramValues: number[];
    @Input() histogramTooltipTexts: string[];
    @Input() histogramTexts: string[];
    @Input() histogramRightAnswers: number[];
}
