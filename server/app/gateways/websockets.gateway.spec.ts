// necessary to test all methods of service
/* eslint-disable max-lines */
import { Player } from '@app/classes/player/player';
import { GameAction } from '@app/enums/game-action.enum';
import { ChangeLongAnswerReq } from '@common/websockets/change-long-answer.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { GradeQuestionRes } from '@common/websockets/grade-question.dto';
import { MuteReq } from '@common/websockets/mute.dto';
import { PausedGameReq } from '@common/websockets/paused-game.dto';
import { Server, Socket } from 'socket.io';
import { GameSocketGateway } from './websockets.gateway';

// any used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */

const gameServiceMock = {
    createGame: jest.fn(),
    connectPlayerToGame: jest.fn(),
    removePlayerFromGame: jest.fn(),
    updateCurrentChoices: jest.fn(),
    lockAnswers: jest.fn(),
    toggleLockRoom: jest.fn(),
    getPlayerId: jest.fn(),
    getBannedNames: jest.fn(),
    banName: jest.fn(),
    getPlayerNames: jest.fn(),
    getPlayerByName: jest.fn(),
    isOrganizer: jest.fn(),
    getGame: jest.fn(),
    updateLongAnswer: jest.fn(),
    startPanicMode: jest.fn(),
    togglePausedGame: jest.fn(),
    applyGrading: jest.fn(),
};

const gameStateServiceMock = {
    handleState: jest.fn(),
    checkAllLockedChoices: jest.fn(),
};

const roomServiceMock = {
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    getRoomId: jest.fn(),
    setServer: jest.fn(),
};

const clientCommunicationServiceMock = {
    sendToRoom: jest.fn(),
    sendToPlayer: jest.fn(),
    setServer: jest.fn(),
};

const chatServiceMock = {
    sendMessage: jest.fn(),
    sendMessageInternally: jest.fn(),
    toggleMute: jest.fn(),
};

jest.mock('@app/services/game/game.service', () => ({
    gameService: jest.fn(() => gameServiceMock),
}));

jest.mock('@app/services/room/room.service', () => ({
    goomService: jest.fn(() => roomServiceMock),
}));

jest.mock('@app/services/client-communication/client-communication.service', () => ({
    clientCommunicationService: jest.fn(() => clientCommunicationServiceMock),
}));

jest.mock('@app/services/chat/chat.service', () => ({
    chatService: jest.fn(() => chatServiceMock),
}));

describe('GameSocketGateway', () => {
    let gameSocketGateway: GameSocketGateway;
    let mockSocket: Socket;
    let mockServer: Server;

    beforeEach(() => {
        gameSocketGateway = new GameSocketGateway(
            gameServiceMock as any,
            gameStateServiceMock as any,
            roomServiceMock as any,
            clientCommunicationServiceMock as any,
            chatServiceMock as any,
        );

        mockSocket = {} as Socket;
        mockSocket.data = {};

        mockServer = {} as Server;
        gameSocketGateway.server = mockServer;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handleGameCreation', () => {
        it('should create a room and a game', async () => {
            const createGameReq = { quizId: 'quiz123', isTest: false, isRandom: false };
            roomServiceMock.createRoom.mockReturnValue('room123');
            gameServiceMock.createGame.mockResolvedValue(undefined);

            await gameSocketGateway.handleGameCreation(mockSocket, createGameReq);

            expect(roomServiceMock.createRoom).toHaveBeenCalled();
            expect(gameServiceMock.createGame).toHaveBeenCalledWith(
                'room123',
                createGameReq.quizId,
                mockSocket.id,
                createGameReq.isTest,
                createGameReq.isRandom,
            );
            expect(mockSocket.data.name).toEqual('Organisateur');
            expect(clientCommunicationServiceMock.sendToRoom).toHaveBeenCalledWith('room123', WebSocketEvents.PlayerChange, []);
        });
    });

    describe('handleGameJoining', () => {
        it('should connect player to game and join room', () => {
            const connectionReq = { roomId: 'room123', playerName: 'Player1' };
            gameServiceMock.connectPlayerToGame.mockReturnValue({ success: true });
            gameServiceMock.getPlayerNames.mockReturnValue([]);
            roomServiceMock.joinRoom.mockImplementation();

            const connectionRes = gameSocketGateway.handleGameJoining(mockSocket, connectionReq);

            expect(gameServiceMock.connectPlayerToGame).toHaveBeenCalledWith(mockSocket, connectionReq);
            expect(roomServiceMock.joinRoom).toHaveBeenCalledWith(connectionReq.roomId, mockSocket);
            expect(connectionRes.success).toBeTruthy();
        });

        it('should return failure if player cannot connect to game', () => {
            const connectionReq = { roomId: 'room123', playerName: 'Player1' };
            gameServiceMock.connectPlayerToGame.mockReturnValue({ success: false });

            const connectionRes = gameSocketGateway.handleGameJoining(mockSocket, connectionReq);

            expect(gameServiceMock.connectPlayerToGame).toHaveBeenCalledWith(mockSocket, connectionReq);
            expect(roomServiceMock.leaveRoom).toHaveBeenCalled();
            expect(clientCommunicationServiceMock.sendToRoom).not.toHaveBeenCalled();
            expect(connectionRes.success).toBeFalsy();
        });
    });

    describe('handleGameLeaving', () => {
        it('should remove player from game and room', () => {
            const roomId = 'room123';
            gameServiceMock.getPlayerNames.mockReturnValue([]);
            roomServiceMock.getRoomId.mockReturnValue(roomId);
            mockSocket.data.name = 'Organisateur';

            gameSocketGateway.handleGameLeaving(mockSocket);

            expect(chatServiceMock.sendMessageInternally).toHaveBeenCalledWith(roomId, 'MESSAGE SYSTÈME', 'Organisateur a quitté la partie');
            expect(gameServiceMock.removePlayerFromGame).toHaveBeenCalledWith(roomId, mockSocket.id);
            expect(clientCommunicationServiceMock.sendToRoom).toHaveBeenCalledWith(roomId, WebSocketEvents.PlayerChange, expect.any(Array));
        });
    });

    describe('handleActionButton', () => {
        it('should handle action button', () => {
            const roomId = 'room123';
            roomServiceMock.getRoomId.mockReturnValue(roomId);

            gameSocketGateway.handleActionButton(mockSocket);

            expect(gameStateServiceMock.handleState).toHaveBeenCalledWith(roomId, GameAction.ActionButton, mockSocket.id);
        });
    });

    describe('handleSelectedChoices', () => {
        it('should handle selected choices', () => {
            const roomId = 'room123';
            const selectedChoicesReq = {
                selectedChoiceIndexes: [0, 1],
            };
            gameServiceMock.updateCurrentChoices.mockReturnValue(selectedChoicesReq.selectedChoiceIndexes);
            roomServiceMock.getRoomId.mockReturnValue(roomId);

            const res = gameSocketGateway.handleSelectedChoices(mockSocket, selectedChoicesReq);

            expect(gameServiceMock.updateCurrentChoices).toHaveBeenCalledWith(roomId, mockSocket.id, selectedChoicesReq.selectedChoiceIndexes);
            expect(res.selectedChoiceIndexes).toEqual(selectedChoicesReq.selectedChoiceIndexes);
        });
    });

    describe('handleLockChoices', () => {
        it('should lock choices', () => {
            const roomId = 'room123';
            roomServiceMock.getRoomId.mockReturnValue(roomId);

            const res = gameSocketGateway.handleLockAnswers(mockSocket);

            expect(gameServiceMock.lockAnswers).toHaveBeenCalledWith(roomId, mockSocket.id);
            expect(gameStateServiceMock.handleState).toHaveBeenCalledWith(roomId, GameAction.SkipStateOnTestMode, mockSocket.id);
            expect(gameStateServiceMock.checkAllLockedChoices).toHaveBeenCalledWith(roomId);
            expect(res).toBeTruthy();
        });
    });

    describe('handleLockRoom', () => {
        it('should lock the room', () => {
            const mockRoomId = 'testRoomId';
            const lockRoomReq = { locked: true };
            roomServiceMock.getRoomId.mockReturnValue(mockRoomId);

            gameSocketGateway.handleLockRoom(mockSocket, lockRoomReq);

            expect(roomServiceMock.getRoomId).toHaveBeenCalledWith(mockSocket);
            expect(gameServiceMock.toggleLockRoom).toHaveBeenCalledWith(mockRoomId, lockRoomReq.locked);
        });

        it('should unlock the room', () => {
            const mockRoomId = 'testRoomId';
            const lockRoomReq = { locked: false };
            roomServiceMock.getRoomId.mockReturnValue(mockRoomId);

            gameSocketGateway.handleLockRoom(mockSocket, lockRoomReq);

            expect(roomServiceMock.getRoomId).toHaveBeenCalledWith(mockSocket);
            expect(gameServiceMock.toggleLockRoom).toHaveBeenCalledWith(mockRoomId, lockRoomReq.locked);
        });
    });

    describe('handleBannedNames', () => {
        it('should handle banned names', () => {
            const roomId = 'room123';
            const banNameReq = { playerName: 'Player1' };
            gameServiceMock.getBannedNames.mockReturnValue(['Player1']);
            roomServiceMock.getRoomId.mockReturnValue(roomId);

            gameSocketGateway.handleBannedNames(mockSocket, banNameReq);

            expect(gameServiceMock.banName).toHaveBeenCalledWith(mockSocket.id, roomId, banNameReq.playerName);
        });
    });

    describe('handleChatMessage', () => {
        it('should handle chat message', () => {
            const roomId = 'room123';
            const chatMessageReq = { message: 'Hello' };
            roomServiceMock.getRoomId.mockReturnValue(roomId);
            gameServiceMock.getPlayerByName.mockReturnValue({ name: 'joe', isMuted: false } as Player);
            gameServiceMock.isOrganizer.mockReturnValue(false);

            gameSocketGateway.handleChatMessage(mockSocket, chatMessageReq);

            expect(chatServiceMock.sendMessage).toHaveBeenCalledWith(roomId, { name: 'joe', isMuted: false }, chatMessageReq.message, false);
        });
    });

    describe('onModuleInit', () => {
        it('should set server', () => {
            gameSocketGateway.onModuleInit();

            expect(clientCommunicationServiceMock.setServer).toHaveBeenCalledWith(mockServer);
        });
    });

    describe('handleDisconnect', () => {
        it('should handle disconnect', () => {
            const mockHandleGameLeaving = jest.spyOn(gameSocketGateway, 'handleGameLeaving');

            gameSocketGateway.handleDisconnect(mockSocket);

            expect(mockHandleGameLeaving).toHaveBeenCalledWith(mockSocket);
        });
    });

    describe('handleLongAnswer', () => {
        it('should update long answer questions', () => {
            const roomId = '123';
            const longAnswerData: ChangeLongAnswerReq = {
                longAnswer: 'yoo my name is joe',
            };
            roomServiceMock.getRoomId.mockReturnValue(roomId);

            gameSocketGateway.handleLongAnswer(mockSocket, longAnswerData);

            expect(roomServiceMock.getRoomId).toHaveBeenCalledWith(mockSocket);
            expect(gameServiceMock.updateLongAnswer).toHaveBeenCalledWith(roomId, mockSocket.id, longAnswerData.longAnswer);
        });
    });

    describe('handlePanicStart', () => {
        it('should handle panic mode start', () => {
            const roomId = '123';
            roomServiceMock.getRoomId.mockReturnValue(roomId);

            gameSocketGateway.handlePanicStart(mockSocket);

            expect(roomServiceMock.getRoomId).toHaveBeenCalledWith(mockSocket);
            expect(gameServiceMock.startPanicMode).toHaveBeenCalledWith(roomId);
        });
    });

    describe('handlePausedGame', () => {
        it('should handle game pauses', () => {
            const roomId = '123';
            const pausedGameReq: PausedGameReq = {
                paused: true,
            };
            roomServiceMock.getRoomId.mockReturnValue(roomId);

            gameSocketGateway.handlePausedGame(mockSocket, pausedGameReq);

            expect(roomServiceMock.getRoomId).toHaveBeenCalledWith(mockSocket);
            expect(gameServiceMock.togglePausedGame).toHaveBeenCalledWith(roomId, pausedGameReq.paused);
        });
    });

    describe('handleToggleMute', () => {
        it('should handle toggleMute requests', () => {
            const roomId = '123';
            const muteReq: MuteReq = {
                name: 'joe',
            };
            const mockPlayer = {
                id: 'joeID',
                name: 'joe',
            };
            roomServiceMock.getRoomId.mockReturnValue(roomId);
            gameServiceMock.getPlayerByName.mockReturnValue(mockPlayer);

            gameSocketGateway.handleToggleMute(mockSocket, muteReq);

            expect(roomServiceMock.getRoomId).toHaveBeenCalledWith(mockSocket);
            expect(gameServiceMock.getPlayerByName).toHaveBeenCalledWith(roomId, muteReq.name);
            expect(chatServiceMock.toggleMute).toHaveBeenCalledWith(mockPlayer, roomId);
        });
    });

    describe('handleGrade', () => {
        it('should handle grading', () => {
            const roomId = '123';
            const gradeData: GradeQuestionRes = {
                grade: 5,
            };
            roomServiceMock.getRoomId.mockReturnValue(roomId);

            gameSocketGateway.handleGrade(mockSocket, gradeData);

            expect(roomServiceMock.getRoomId).toHaveBeenCalledWith(mockSocket);
            expect(gameServiceMock.applyGrading).toHaveBeenCalledWith(roomId, gradeData.grade);
            expect(gameStateServiceMock.handleState).toHaveBeenCalledWith(roomId, GameAction.GradingFinished, mockSocket.id);
        });
    });
});
