import { GameState } from '@common/enums/game-state.enum';
import { Qcm, Question } from '@common/interfaces/question.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { NewQuestionRes } from '@common/websockets/new-question.dto';
import { ClientCommunicationService } from './client-communication.service';

// any and numbers used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-magic-numbers */

const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    except: jest.fn().mockReturnThis(),
} as any;

describe('ClientCommunicationService', () => {
    let clientCommunicationService: ClientCommunicationService;

    beforeEach(() => {
        clientCommunicationService = new ClientCommunicationService();
        clientCommunicationService.setServer(mockIo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendToRoom', () => {
        it('should send data to room', () => {
            const roomId = 'room123';
            const event = WebSocketEvents.TimeUpdate;
            const data = 10;

            clientCommunicationService.sendToRoom(roomId, event, data);

            expect(mockIo.to).toHaveBeenCalledWith(roomId);
            expect(mockIo.emit).toHaveBeenCalledWith(event, data);
        });

        it('should not send data if server is not set', () => {
            clientCommunicationService.setServer(undefined);
            const roomId = 'room123';
            const event = WebSocketEvents.TimeUpdate;
            const data = 10;

            clientCommunicationService.sendToRoom(roomId, event, data);

            expect(mockIo.to).not.toHaveBeenCalled();
            expect(mockIo.emit).not.toHaveBeenCalled();
        });
    });

    describe('sendToPlayer', () => {
        it('should send data to player', () => {
            const playerId = 'player123';
            const event = WebSocketEvents.TimeUpdate;
            const data = 10;

            clientCommunicationService.sendToPlayer(playerId, event, data);

            expect(mockIo.to).toHaveBeenCalledWith(playerId);
            expect(mockIo.emit).toHaveBeenCalledWith(event, data);
        });

        it('should not send data if server is not set', () => {
            clientCommunicationService.setServer(undefined);
            const playerId = 'player123';
            const event = WebSocketEvents.TimeUpdate;
            const data = 10;

            clientCommunicationService.sendToPlayer(playerId, event, data);

            expect(mockIo.to).not.toHaveBeenCalled();
            expect(mockIo.emit).not.toHaveBeenCalled();
        });
    });

    describe('sendTimerUpdate', () => {
        it('should send timer update to room', () => {
            const roomId = 'room123';
            const timeRemaining = 60;

            const sendToRoomSpy = jest.spyOn(clientCommunicationService, 'sendToRoom');

            clientCommunicationService.sendTimerUpdate(roomId, timeRemaining);

            expect(sendToRoomSpy).toHaveBeenCalledWith(roomId, WebSocketEvents.TimeUpdate, timeRemaining);
        });
    });

    describe('sendStartTimer', () => {
        it('should send start timer to room', () => {
            const roomId = 'room123';
            const duration = 60;

            const sendToRoomSpy = jest.spyOn(clientCommunicationService, 'sendToRoom');

            clientCommunicationService.sendStartTimer(roomId, duration);

            expect(sendToRoomSpy).toHaveBeenCalledWith(roomId, WebSocketEvents.StartTimer, duration);
        });
    });

    describe('sendGameStateUpdate', () => {
        it('should send game state update to room', () => {
            const roomId = 'room123';
            const gameState = GameState.Answering;

            const sendToRoomSpy = jest.spyOn(clientCommunicationService, 'sendToRoom');

            clientCommunicationService.sendGameStateUpdate(roomId, gameState);

            expect(sendToRoomSpy).toHaveBeenCalledWith(roomId, WebSocketEvents.GameStateUpdate, gameState);
        });
    });

    describe('sendQuestion', () => {
        it('should send question to room', () => {
            const roomId = 'room123';
            const organizerId = 'asdf';
            const newQuestion = {
                question: {
                    _id: '123',
                    text: 'What is the capital of France?',
                    points: 10,
                    type: 'QCM',
                } as Qcm,
                duration: 10,
                isLastQuestion: false,
            };

            const sendToRoomExceptSpy = jest.spyOn(clientCommunicationService, 'sendToRoomExcept');

            clientCommunicationService.sendQuestionToPlayers(roomId, organizerId, newQuestion);

            expect(sendToRoomExceptSpy).toHaveBeenCalledWith(roomId, organizerId, WebSocketEvents.NewQuestion, newQuestion);
        });
    });

    describe('sendAnswersToPlayers', () => {
        it('should send the answers to all players except the organizer', () => {
            const sendToRoomExceptSpy = jest.spyOn(clientCommunicationService, 'sendToRoomExcept');

            clientCommunicationService.sendAnswersToPlayers('roomId', 'organizerId', [1, 2, 3]);

            expect(sendToRoomExceptSpy).toHaveBeenCalledWith('roomId', 'organizerId', WebSocketEvents.QuestionAnswers, [1, 2, 3]);
        });
    });

    describe('sendPauseRequest', () => {
        it('should send the pause request to the room', () => {
            const sendToRoomSpy = jest.spyOn(clientCommunicationService, 'sendToRoom');

            clientCommunicationService.sendPauseRequest('roomId', true);

            expect(sendToRoomSpy).toHaveBeenCalledWith('roomId', WebSocketEvents.PauseRequest, true);
        });
    });

    describe('sendQuestionToOrganizer', () => {
        it('should send the new question to the organizer', () => {
            const newQuestion: NewQuestionRes = {
                question: { text: 'allo' } as Question,
                duration: 30,
                isLastQuestion: false,
            };

            const sendToPlayerSpy = jest.spyOn(clientCommunicationService, 'sendToPlayer');

            clientCommunicationService.sendQuestionToOrganizer('roomId', 'organizerId', newQuestion);

            expect(sendToPlayerSpy).toHaveBeenCalledWith('organizerId', WebSocketEvents.NewQuestion, newQuestion);
        });
    });

    describe('sendPanicModeAvailable', () => {
        it('should send the panic mode availability to the room', () => {
            const sendToRoomSpy = jest.spyOn(clientCommunicationService, 'sendToRoom');

            clientCommunicationService.sendPanicModeAvailable('roomId', true);

            expect(sendToRoomSpy).toHaveBeenCalledWith('roomId', WebSocketEvents.PanicAvailable, true);
        });
    });

    describe('sendPanicModeStarted', () => {
        it('should send the panic mode started to the room', () => {
            const sendToRoomSpy = jest.spyOn(clientCommunicationService, 'sendToRoom');

            clientCommunicationService.sendPanicModeStarted('roomId', true);

            expect(sendToRoomSpy).toHaveBeenCalledWith('roomId', WebSocketEvents.PanicModeStarted, true);
        });
    });

    describe('sendGradingRequest', () => {
        it('should send the grading request to the organizer', () => {
            const sendToPlayerSpy = jest.spyOn(clientCommunicationService, 'sendToPlayer');

            clientCommunicationService.sendGradingRequest('organizerId', 'answer', 'playerName', 1, 10);

            expect(sendToPlayerSpy).toHaveBeenCalledWith('organizerId', WebSocketEvents.GradingRequest, {
                answer: 'answer',
                playerName: 'playerName',
                gradeIndex: 1,
                gradeTotal: 10,
            });
        });
    });
});
