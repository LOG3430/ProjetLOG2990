import { HistoryService } from '@app/services/database/history/history.service';
import { HistoryInfo } from '@common/http/historyInfo.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from './history.controller';

describe('HistoryController', () => {
    let controller: HistoryController;
    let service: HistoryService;

    beforeEach(async () => {
        const historyServiceSpy = {
            getHistory: jest.fn(),
            deleteHistory: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [HistoryController],
            providers: [{ provide: HistoryService, useValue: historyServiceSpy }],
        }).compile();

        controller = module.get<HistoryController>(HistoryController);
        service = module.get<HistoryService>(HistoryService);
    });

    describe('getHistory', () => {
        it('should return an array of HistoryInfo', async () => {
            // disabled no-explicit-any to make tests more concise
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const historyInfo: HistoryInfo[] = [{}] as any;

            jest.spyOn(service, 'getHistory').mockResolvedValue(historyInfo);

            expect(await controller.getHistory()).toEqual(historyInfo);
        });
    });

    describe('deleteHistory', () => {
        it('should return true when history is deleted successfully', async () => {
            jest.spyOn(service, 'deleteHistory').mockResolvedValue(true);

            expect(await controller.deleteHistory()).toBe(true);
        });
        it("should return false when history can't be deleted", async () => {
            jest.spyOn(service, 'deleteHistory').mockResolvedValue(false);

            expect(await controller.deleteHistory()).toBe(false);
        });
    });
});
