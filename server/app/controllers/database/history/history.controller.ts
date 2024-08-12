import { HistoryService } from '@app/services/database/history/history.service';
import { HistoryInfo } from '@common/http/historyInfo.dto';
import { Controller, Delete, Get } from '@nestjs/common';
@Controller('db/history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}
    @Get('/')
    async getHistory(): Promise<HistoryInfo[]> {
        return this.historyService.getHistory();
    }
    @Delete('/')
    async deleteHistory(): Promise<boolean> {
        return this.historyService.deleteHistory();
    }
}
