import { HistoryDocument, HistoryDto } from '@app/model/schema/history.schema';
import { objectOptions } from '@app/services/database/database.constants';
import { HistoryInfo } from '@common/http/historyInfo.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class HistoryService {
    constructor(@InjectModel(HistoryDto.name) private readonly historyModel: Model<HistoryDocument>) {}

    async getHistory(): Promise<HistoryInfo[]> {
        return this.historyModel
            .find()
            .exec()
            .then((history) => history.map((game) => game.toObject(objectOptions)));
    }

    async addHistory(historyInfo: HistoryInfo): Promise<void> {
        const newHistoryEntry = new this.historyModel(historyInfo);
        this.historyModel.create(newHistoryEntry);
    }

    async deleteHistory(): Promise<boolean> {
        return await this.historyModel
            .deleteMany({})
            .exec()
            .then((history) => history.deletedCount > 0);
    }
}
