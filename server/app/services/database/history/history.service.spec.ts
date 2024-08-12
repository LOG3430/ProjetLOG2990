import { HistoryDocument, HistoryDto, historySchema } from '@app/model/schema/history.schema';
import { HistoryInfo } from '@common/http/historyInfo.dto';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
    let historyService: HistoryService;
    let historyModel: Model<HistoryDto>;
    let mongod: MongoMemoryServer;
    const historyStubs: HistoryInfo[] = [
        { title: 'History 1', startDateTime: new Date(), highScore: 100, nPlayersStart: 10, winner: 'Player 1' },
        { title: 'History 2', startDateTime: new Date(), highScore: 200, nPlayersStart: 20, winner: 'Player 2' },
        { title: 'History 3', startDateTime: new Date(), highScore: 300, nPlayersStart: 30, winner: 'Player 3' },
    ];

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const mongoUri = mongod.getUri();
        await mongoose.connect(mongoUri);
        historyModel = mongoose.model(HistoryDto.name, historySchema);
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HistoryService,
                {
                    provide: getModelToken(HistoryDto.name),
                    useValue: historyModel,
                },
            ],
        }).compile();

        historyService = module.get<HistoryService>(HistoryService);
        historyModel = module.get<Model<HistoryDocument>>(getModelToken(HistoryDto.name));

        await historyModel.deleteMany({});
        await historyModel.insertMany(historyStubs);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        mongod.stop();
    });

    describe('getHistory', () => {
        it('should return an array of HistoryInfo', async () => {
            const result = await historyService.getHistory();
            expect(result.map((history) => history.title)).toEqual(historyStubs.map((history) => history.title));
        });
    });

    describe('addHistory', () => {
        it('should add a history', async () => {
            const history: HistoryInfo = { title: 'History 4', startDateTime: new Date(), highScore: 400, nPlayersStart: 40, winner: 'Player 4' };

            historyModel.create = jest.fn();
            historyService.addHistory(history);

            expect(historyModel.create).toHaveBeenCalledWith(expect.objectContaining({ ...history }));
        });
    });

    describe('deleteHistory', () => {
        it('should delete all history', async () => {
            const result = await historyService.deleteHistory();
            expect(result).toBe(true);
            expect(await historyService.getHistory()).toEqual([]);
        });

        it('should return false if there is no history to delete', async () => {
            await historyModel.deleteMany({});
            const result = await historyService.deleteHistory();
            expect(result).toBe(false);
        });
    });
});
