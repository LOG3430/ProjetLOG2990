import { Component, Input } from '@angular/core';
import { DateService } from '@app/services/date/date.service';
import { HistoryInfo } from '@common/http/historyInfo.dto';
@Component({
    selector: 'app-history-card',
    templateUrl: './history-card.component.html',
    styleUrls: ['./history-card.component.scss'],
})
export class HistoryCardComponent {
    @Input() gameInfo: HistoryInfo;

    constructor(private dateService: DateService) {}

    formatDate(date: Date): string {
        return this.dateService.getDateFormatted(date);
    }
}
