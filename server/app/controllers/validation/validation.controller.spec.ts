import { GameService } from '@app/services/game/game.service';
import { ConnectToGameErrorType } from '@common/enums/connect-to-game-error-type.enum';
import { ConnectionRes } from '@common/websockets/connection.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationController } from './validation.controller';

describe('ValidationController', () => {
    let controller: ValidationController;
    let gameServiceMock: GameService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ValidationController],
            providers: [
                ValidationController,
                {
                    provide: GameService,
                    useValue: {
                        getGameIdConnectionError: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<ValidationController>(ValidationController);
        gameServiceMock = module.get<GameService>(GameService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('verifyRoomId', () => {
        it('should return success: true when no error is found for the room ID', () => {
            jest.spyOn(gameServiceMock, 'getGameIdConnectionError').mockReturnValue(null);
            const response: ConnectionRes = controller.verifyRoomId('roomId');

            expect(response).toEqual({ success: true });
            expect(gameServiceMock.getGameIdConnectionError).toHaveBeenCalledWith('roomId');
        });

        it('should return success: false and the appropriate errorType when an error is found for the room ID', () => {
            jest.spyOn(gameServiceMock, 'getGameIdConnectionError').mockReturnValue('Error' as ConnectToGameErrorType);
            const response: ConnectionRes = controller.verifyRoomId('roomId');

            expect(response).toEqual({ success: false, errorType: 'Error' });
            expect(gameServiceMock.getGameIdConnectionError).toHaveBeenCalledWith('roomId');
        });
    });
});
