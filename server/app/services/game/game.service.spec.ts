import { Game } from '@app/classes/game/game';
import { Player } from '@app/classes/player/player';
import { ORGANIZER_NAME } from '@app/constants/organizer.constants';
import { QuizDto } from '@app/model/schema/quiz.schema';
import { ClientCommunicationService } from '@app/services/client-communication/client-communication.service';
import { QuizDatabaseService } from '@app/services/database/quiz/quiz.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { RoomService } from '@app/services/room/room.service';
import { ConnectToGameErrorType } from '@common/enums/connect-to-game-error-type.enum';
import { GameState } from '@common/enums/game-state.enum';
import { KickPlayerReason } from '@common/enums/kick-player-reason.enum';
import { Quiz } from '@common/interfaces/quiz.dto';
import { ConnectionReq } from '@common/websockets/connection.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { GameService } from './game.service';

// any, magic numbers, max-lines and empty functions used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-magic-numbers */
/* eslint-disable  @typescript-eslint/no-empty-function */
/* eslint-disable  max-lines */

describe('GameService', () => {
    let service: GameService;
    let quizModel: Model<QuizDto>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                {
                    provide: ClientCommunicationService,
                    useValue: {
                        sendToRoom: jest.fn(),
                        sendToPlayer: jest.fn(),
                        sendToRoomExcept: jest.fn(),
                        sendQuestionToPlayers: jest.fn(),
                        sendQuestionToOrganizer: jest.fn(),
                        sendAnswersToPlayers: jest.fn(),
                        sendPauseRequest: jest.fn(),
                        sendPanicModeAvailable: jest.fn(),
                        sendPanicModeStarted: jest.fn(),
                        sendGradingRequest: jest.fn(),
                    },
                },
                {
                    provide: QuizDatabaseService,
                    useValue: {
                        addQuiz: jest.fn(),
                        getAllQuizzes: jest.fn(),
                        updateQuiz: jest.fn(),
                        deleteQuiz: jest.fn(),
                    },
                },
                {
                    provide: QuizService,
                    useValue: {
                        getQuizById: jest.fn(),
                        getQuiz: jest.fn(),
                    },
                },
                {
                    provide: RoomService,
                    useValue: {
                        roomCodes: [],
                        createRoom: jest.fn(),
                        joinRoom: jest.fn(),
                        leaveRoom: jest.fn(),
                        deleteRoom: jest.fn(),
                        getRoomId: jest.fn(),
                        isRoomActive: jest.fn(),
                        leaveRoomById: jest.fn(),
                    },
                },
                { provide: getModelToken(QuizDto.name), useValue: quizModel },
            ],
        }).compile();
        service = module.get<GameService>(GameService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('constructor', () => {
        it('should initialize games', () => {
            expect(service['games']).toBeDefined();
            expect(service['games'].size).toBe(0);
            expect(service['games']).toBeInstanceOf(Map);
        });
    });

    describe('createGame', () => {
        let roomId;
        let quizId;
        let organizerId;
        let isTest;
        let isRandom;

        beforeEach(() => {
            roomId = 'unique-room-id';
            quizId = 'unique-quiz-id';
            organizerId = 'unique-organizer-id';
            isTest = false;
            isRandom = false;
            const mockQuiz = { title: 'yo' } as Quiz;

            service['quizService'].getQuiz = jest.fn().mockResolvedValue(mockQuiz);
            jest.spyOn(service, 'sendNewQuestion').mockImplementation(() => {});
            jest.spyOn(service, 'sendScoresToOrganizer').mockImplementation(() => {});
            jest.spyOn(service, 'addOrganizerAsPlayerToGame').mockImplementation(() => {});
        });

        it('should create a game without test or random mode', async () => {
            const mockQuiz = { title: 'yo' } as Quiz;
            await service.createGame(roomId, quizId, organizerId, isTest, isRandom);

            expect(service['quizService'].getQuiz).toHaveBeenCalledWith(quizId, isRandom);
            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledWith(
                organizerId,
                WebSocketEvents.JoinGame,
                expect.objectContaining({
                    quizTitle: mockQuiz.title,
                    isOrganizer: true,
                    isTestingMode: isTest,
                    isRandomMode: isRandom,
                    gameState: expect.any(String),
                    playerName: ORGANIZER_NAME,
                    roomId,
                }),
            );
            expect(service.sendNewQuestion).toHaveBeenCalledWith(expect.any(Game), roomId);
            expect(service.sendScoresToOrganizer).toHaveBeenCalledWith(roomId);
            expect(service.addOrganizerAsPlayerToGame).not.toHaveBeenCalled();
        });

        it('should create a game with test or random mode and add organizer as player', async () => {
            const mockQuiz = { title: 'yo' } as Quiz;
            isTest = true;

            await service.createGame(roomId, quizId, organizerId, isTest, isRandom);

            expect(service['quizService'].getQuiz).toHaveBeenCalledWith(quizId, isRandom);
            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledWith(
                organizerId,
                WebSocketEvents.JoinGame,
                expect.objectContaining({
                    quizTitle: mockQuiz.title,
                    isOrganizer: true,
                    isTestingMode: isTest,
                    isRandomMode: isRandom,
                    gameState: expect.any(String),
                    playerName: ORGANIZER_NAME,
                    roomId,
                }),
            );
            expect(service.sendNewQuestion).toHaveBeenCalledWith(expect.any(Game), roomId);
            expect(service.sendScoresToOrganizer).toHaveBeenCalledWith(roomId);
            expect(service.addOrganizerAsPlayerToGame).toHaveBeenCalledWith(roomId, organizerId);
        });
    });

    describe('deleteGame', () => {
        it('should delete the game', () => {
            jest.spyOn(service['games'], 'delete');
            const game: any = {
                timer: {
                    reset: jest.fn(),
                },
            };
            jest.spyOn(service, 'getGame').mockReturnValue(game);

            service.deleteGame('1234');

            expect(service['games'].delete).toBeCalledTimes(1);
            expect(game.timer.reset).toBeCalledTimes(1);
        });

        it('should not delete the game if it does not exist', () => {
            jest.spyOn(service['games'], 'delete');

            service.deleteGame('1234');

            expect(service['games'].delete).not.toHaveBeenCalled();
        });
    });
    describe('connectPlayerToGame', () => {
        const client = { id: '1234' } as any;
        const connectionRequest = { playerName: 'name' } as ConnectionReq;

        it('should connect player to game', () => {
            jest.spyOn(service, 'getGame').mockReturnValue({
                isNameBanned: jest.fn().mockReturnValue(false),
                isNameAlreadyTaken: jest.fn().mockReturnValue(false),
                isRoomLocked: false,
            } as unknown as Game);
            jest.spyOn(service, 'addPlayerToGame').mockReturnValueOnce(true);
            jest.spyOn(service['roomService'], 'isRoomActive').mockReturnValue(true);

            const { success, errorType } = service.connectPlayerToGame(client, connectionRequest);

            expect(success).toBe(true);
            expect(errorType).toBe(undefined);
        });

        it('should not let player join if the name is already taken', () => {
            jest.spyOn(service, 'getGame').mockReturnValue({
                isNameBanned: jest.fn().mockReturnValue(false),
                isNameAlreadyTaken: jest.fn().mockReturnValue(true),
                isRoomLocked: false,
            } as unknown as Game);
            jest.spyOn(service, 'addPlayerToGame').mockReturnValueOnce(true);
            jest.spyOn(service['roomService'], 'isRoomActive').mockReturnValue(true);

            const { success, errorType } = service.connectPlayerToGame(client, connectionRequest);

            expect(success).toBe(false);
            expect(errorType).toBe(ConnectToGameErrorType.NameTaken);
        });

        it('should not let the player join if their name is banned', () => {
            jest.spyOn(service, 'getGame').mockReturnValue({
                isNameBanned: jest.fn().mockReturnValue(true),
                isNameAlreadyTaken: jest.fn().mockReturnValue(false),
                isRoomLocked: false,
            } as unknown as Game);
            jest.spyOn(service, 'addPlayerToGame').mockReturnValueOnce(true);
            jest.spyOn(service['roomService'], 'isRoomActive').mockReturnValue(true);

            const { success, errorType } = service.connectPlayerToGame(client, connectionRequest);

            expect(success).toBe(false);
            expect(errorType).toBe(ConnectToGameErrorType.BannedName);
        });

        it('should not let the player join if the room is locked', () => {
            jest.spyOn(service, 'getGame').mockReturnValue({
                isNameBanned: jest.fn().mockReturnValue(false),
                isNameAlreadyTaken: jest.fn().mockReturnValue(false),
                isRoomLocked: true,
            } as unknown as Game);
            jest.spyOn(service, 'addPlayerToGame').mockReturnValueOnce(true);
            jest.spyOn(service['roomService'], 'isRoomActive').mockReturnValue(true);

            const { success, errorType } = service.connectPlayerToGame(client, connectionRequest);

            expect(success).toBe(false);
            expect(errorType).toBe(ConnectToGameErrorType.RoomLocked);
        });
        it('should return false if room is not active', () => {
            jest.spyOn(service, 'getGame').mockReturnValue({
                isNameBanned: jest.fn().mockReturnValue(false),
                isNameAlreadyTaken: jest.fn().mockReturnValue(false),
                isRoomLocked: false,
            } as unknown as Game);
            jest.spyOn(service, 'addPlayerToGame').mockReturnValueOnce(true);
            jest.spyOn(service['roomService'], 'isRoomActive').mockReturnValue(false);

            const { success, errorType } = service.connectPlayerToGame(client, connectionRequest);

            expect(success).toBe(false);
            expect(errorType).toBe(ConnectToGameErrorType.InvalidGame);
        });
        it('should return false if error has occurred', () => {
            jest.spyOn(service, 'getGame').mockReturnValue({
                isNameBanned: jest.fn().mockReturnValue(false),
                isNameAlreadyTaken: jest.fn().mockReturnValue(false),
                isRoomLocked: false,
            } as unknown as Game);
            jest.spyOn(service, 'addPlayerToGame').mockReturnValueOnce(false);
            jest.spyOn(service['roomService'], 'isRoomActive').mockReturnValue(true);

            const { success, errorType } = service.connectPlayerToGame(client, connectionRequest);

            expect(success).toBe(false);
            expect(errorType).toBe(ConnectToGameErrorType.InvalidGame);
        });
    });

    describe('addPlayerToGame', () => {
        it('should do nothing if game is null', () => {
            jest.spyOn(service, 'getGame').mockReturnValueOnce(null);

            const result = service.addPlayerToGame('1234', '1234', 'name');

            expect(result).toBe(false);
        });

        it('should add a player to the game', () => {
            const roomId = 'roomId';
            const playerId = 'playerId';
            const playerName = 'playerName';
            const game = {
                addPlayer: jest.fn(),
                getQuizTitle: jest.fn().mockReturnValue('quizTitle'),
                getIsTest: jest.fn().mockReturnValue(false),
                getIsRandom: jest.fn().mockReturnValue(false),
                getPlayerNames: jest.fn().mockReturnValue([]),
                state: GameState.WaitingRoom,
            };
            jest.spyOn(service, 'getGame').mockReturnValue(game as any);
            jest.spyOn(service, 'isOrganizer').mockReturnValueOnce(false);

            service.addPlayerToGame(roomId, playerId, playerName);

            expect(game.addPlayer).toHaveBeenCalledWith(playerId, playerName);
            expect(service['clientCommunicationService'].sendToRoom).toHaveBeenCalledTimes(1);
            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledTimes(1);
        });
    });

    describe('getPlayerId', () => {
        it('should do nothing if game is null', () => {
            jest.spyOn(service, 'getGame').mockReturnValueOnce(null);

            const result = service.getPlayerId('roomId', 'playerName');

            expect(result).toBe(null);
        });

        it('should return undefined if there are no playuer with specified name', () => {
            const roomId = 'roomId';
            const playerName = 'playerName';
            const game = {
                getPlayers: jest.fn().mockReturnValue([
                    { name: 'name 1', id: '1' },
                    { name: 'name 2', id: '2' },
                ]),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(game as any);

            const result = service.getPlayerId(roomId, playerName);

            expect(result).toBe(undefined);
        });

        it('should return the player id', () => {
            const roomId = 'roomId';
            const playerName = 'playerName';
            const playerId = '1';
            const game = {
                getPlayers: jest.fn().mockReturnValue([
                    { name: playerName, id: playerId },
                    { name: 'name 2', id: '2' },
                ]),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(game as any);

            const result = service.getPlayerId(roomId, playerName);

            expect(result).toBe(playerId);
        });
    });

    describe('getPlayerNames', () => {
        it('should return an empty array if game is null', () => {
            jest.spyOn(service, 'getGame').mockReturnValueOnce(null);

            const result = service.getPlayerNames('roomId');

            expect(result).toEqual([]);
        });

        it('should return player names', () => {
            const roomId = 'roomId';
            const game = {
                getPlayerNames: jest.fn().mockReturnValue(['name 1', 'name 2']),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(game as any);

            const result = service.getPlayerNames(roomId);

            expect(result).toEqual(['name 1', 'name 2']);
        });
    });

    describe('addTesterToGame', () => {
        it('should add a tester to the game', () => {
            const roomId = 'roomId';
            const organizerId = 'organizerId';
            const addPlayerToGameSpy = jest.spyOn(service, 'addPlayerToGame').mockImplementation(() => true);

            service.addOrganizerAsPlayerToGame(roomId, organizerId);

            expect(addPlayerToGameSpy).toHaveBeenCalledWith(roomId, organizerId, 'Organisateur');
        });
    });

    describe('removePlayerFromGame', () => {
        it('should return an empty array if game does not exist', () => {
            const roomId = 'nonexistentRoom';
            const playerId = 'playerId';
            jest.spyOn(service, 'getGame').mockReturnValue(null);

            const result = service.removePlayerFromGame(roomId, playerId);

            expect(result).toEqual([]);
        });

        it('should remove player from results page if game state is QuizResults', () => {
            const roomId = 'roomId';
            const playerId = 'playerId';
            const game = {
                state: GameState.QuizResults,
            };
            jest.spyOn(service, 'getGame').mockReturnValue(game as any);
            const removePlayerFromResultsPageSpy = jest.spyOn(service as any, 'removePlayerFromResultsPage').mockReturnValue([]);

            const result = service.removePlayerFromGame(roomId, playerId);

            expect(removePlayerFromResultsPageSpy).toHaveBeenCalledWith(game, roomId, playerId);
            expect(result).toEqual([]);
        });

        it('should remove organizer from game if player is the organizer', () => {
            const roomId = 'roomId';
            const playerId = 'playerId';
            const game = {
                state: GameState.Answering,
                getOrganizerId: jest.fn().mockReturnValue(playerId),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(game as any);
            const removeOrganizerFromGameSpy = jest.spyOn(service as any, 'removeOrganizerFromGame').mockReturnValue([]);

            const result = service.removePlayerFromGame(roomId, playerId);

            expect(removeOrganizerFromGameSpy).toHaveBeenCalledWith(game, roomId);
            expect(result).toEqual([]);
        });

        it('should remove player internally if none of the above conditions are met', () => {
            const roomId = 'roomId';
            const playerId = 'playerId';
            const game = {
                state: GameState.Answering,
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(game as any);
            const removePlayerInternallySpy = jest.spyOn(service as any, 'removePlayerInternally').mockReturnValue([]);

            const result = service.removePlayerFromGame(roomId, playerId);

            expect(removePlayerInternallySpy).toHaveBeenCalledWith(game, roomId, playerId);
            expect(result).toEqual([]);
        });
    });

    describe('updateCurrentChoices', () => {
        it('should update current choices for a player and send selected choices total', () => {
            const roomId = 'testRoomId';
            const playerId = 'testPlayerId';
            const selectedChoices = [1, 2, 3];

            const mockGame: any = {
                updateSelectedChoices: jest.fn().mockReturnValue(selectedChoices),
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
                getSelectedChoicesTotal: jest.fn().mockReturnValue([1, 2, 3]),
                getPlayers: jest.fn().mockReturnValue([
                    { name: 'name 1', id: playerId, hasSelectedChoice: false },
                    { name: 'name 2', id: '2', hasSelectedChoice: false },
                ]),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);
            const sendSelectedChoicesTotalSpy = jest.spyOn(service, 'sendSelectedChoicesTotal');

            const result = service.updateCurrentChoices(roomId, playerId, selectedChoices);

            expect(result).toEqual(selectedChoices);
            expect(mockGame.updateSelectedChoices).toHaveBeenCalledWith(playerId, selectedChoices);
            expect(sendSelectedChoicesTotalSpy).toHaveBeenCalledWith(mockGame);
        });
    });

    describe('getSelectedChoicesTotal', () => {
        it('should return the total selected choices for a game', () => {
            const roomId = 'testRoomId';
            const mockTotalSelectedChoices = [1, 2];
            const mockGame: any = {
                getSelectedChoicesTotal: jest.fn().mockReturnValue(mockTotalSelectedChoices),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);

            const result = service.getSelectedChoicesTotal(roomId);

            expect(result).toEqual(mockTotalSelectedChoices);
            expect(mockGame.getSelectedChoicesTotal).toHaveBeenCalled();
        });
    });

    describe('lockChoices', () => {
        it('should lock choices for the player if conditions are met', () => {
            const roomId = 'testRoomId';
            const playerId = 'testPlayerId';
            const mockGame: any = {
                lockAnswers: jest.fn(),
                getPlayers: jest.fn().mockReturnValue([
                    { name: 'name 1', id: playerId, hasLockedChoices: false },
                    { name: 'name 2', id: '2', hasLockedChoices: false },
                ]),
                getPlayerByName: jest.fn().mockReturnValue({ name: 'name 1', id: playerId, hasLockedChoices: false } as unknown as Player),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);
            jest.spyOn(service as any, 'canLockChoices').mockReturnValue(true);

            service.lockAnswers(roomId, playerId);

            expect(mockGame.lockAnswers).toHaveBeenCalledWith(playerId);
        });

        it('should not lock choices for the player if conditions are not met', () => {
            const roomId = 'testRoomId';
            const playerId = 'testPlayerId';
            const mockGame: any = {
                lockChoices: jest.fn(),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);
            jest.spyOn(service as any, 'canLockChoices').mockReturnValue(false);

            service.lockAnswers(roomId, playerId);

            expect(mockGame.lockChoices).not.toHaveBeenCalled();
        });
    });

    describe('banName', () => {
        it('should do nothing if requester is not organizer', () => {
            const roomId = 'testRoomId';
            const name = 'testName';
            const mockGame: any = {
                banName: jest.fn(),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);
            jest.spyOn(service, 'isOrganizer').mockReturnValue(false);

            service.banName('requesterId', roomId, name);

            expect(mockGame.banName).not.toHaveBeenCalled();
        });

        it('should ban a name', () => {
            const roomId = 'testRoomId';
            const name = 'testName';
            const mockGame: any = {
                banName: jest.fn(),
                getPlayerNames: jest.fn().mockReturnValue([]),
            };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);
            jest.spyOn(service, 'isOrganizer').mockReturnValue(true);
            jest.spyOn(service, 'getPlayerId').mockReturnValue('');
            jest.spyOn(service, 'removePlayerFromGame').mockReturnValue([]);
            jest.spyOn(service, 'getPlayerNames').mockReturnValue([]);

            service.banName('requesterId', roomId, name);

            expect(mockGame.banName).toHaveBeenCalledWith(name);
            expect(service['clientCommunicationService'].sendToRoom).toHaveBeenCalledTimes(1);
            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledTimes(1);
        });
    });

    describe('toggleLockRoom', () => {
        it('should toggle the room lock status', () => {
            const roomId = 'testRoomId';
            const mockGame: any = {
                isRoomLocked: true,
            };
            const newLockStatus = false;
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);

            service.toggleLockRoom(roomId, newLockStatus);

            expect(mockGame.isRoomLocked).toEqual(newLockStatus);
        });
    });

    describe('getGameIdConnectionError', () => {
        it('should return the RoomLocked connection error if room locked', () => {
            const roomId = 'testRoomId';
            const mockGame: any = {
                isRoomLocked: true,
            };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);

            const result = service.getGameIdConnectionError(roomId);

            expect(result).toEqual(ConnectToGameErrorType.RoomLocked);
        });

        it('should return the InvalidGame connection error if game is invalid', () => {
            const roomId = 'testRoomId';
            const mockGame = null;
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);

            const result = service.getGameIdConnectionError(roomId);

            expect(result).toEqual(ConnectToGameErrorType.InvalidGame);
        });

        it('should return null if game is valid and room is not locked', () => {
            const roomId = 'testRoomId';
            const mockGame: any = {
                isRoomLocked: false,
            };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as Game);

            const result = service.getGameIdConnectionError(roomId);

            expect(result).toBe(null);
        });
    });

    describe('canStartGame', () => {
        it('should return true if game has players and is locked', () => {
            const mockGame: any = {
                isRoomLocked: true,
                getPlayers: jest.fn().mockReturnValue([{}]),
            };

            const result = service.canStartGame(mockGame);

            expect(result).toBe(true);
        });

        it('should return false if game has no player', () => {
            const mockGame: any = {
                isRoomLocked: true,
                getPlayers: jest.fn().mockReturnValue([]),
            };

            const result = service.canStartGame(mockGame);

            expect(result).toBe(false);
        });

        it('should return false if game is not locked', () => {
            const mockGame: any = {
                isRoomLocked: false,
                getPlayers: jest.fn().mockReturnValue([{}]),
            };

            const result = service.canStartGame(mockGame);

            expect(result).toBe(false);
        });
    });

    describe('getGame', () => {
        it('should return the game if it exists', () => {
            const roomId = 'testRoomId';
            const mockGame = {} as Game;
            jest.spyOn(service['games'], 'get').mockReturnValue(mockGame);

            const result = service.getGame(roomId);

            expect(result).toBe(mockGame);
        });

        it('should return null if game does not exist', () => {
            const roomId = 'testRoomId';
            jest.spyOn(service['games'], 'get').mockReturnValue(null);

            const result = service.getGame(roomId);

            expect(result).toBe(null);
        });
    });

    describe('isOrganizer', () => {
        it('should return true if the player is the organizer', () => {
            const playerId = 'testPlayerId';
            const mockGame: any = {
                getOrganizerId: jest.fn().mockReturnValue(playerId),
            };

            const result = service.isOrganizer(mockGame, playerId);

            expect(result).toBe(true);
        });

        it('should return false if the player is not the organizer', () => {
            const playerId = 'testPlayerId';
            const mockGame: any = {
                getOrganizerId: jest.fn().mockReturnValue('anotherPlayerId'),
            };

            const result = service.isOrganizer(mockGame, playerId);

            expect(result).toBe(false);
        });
    });

    describe('loadNextQuestion', () => {
        it('should load the next question', () => {
            const roomId = 'testRoomId';
            const mockGame: any = {
                nextQuestion: jest.fn(),
                getPlayers: jest.fn().mockReturnValue([
                    { name: 'name 1', id: '1', hasLockedChoices: false },
                    { name: 'name 2', id: '2', hasLockedChoices: false },
                ]),
            };
            const sendNewQuestionSpy = jest.spyOn(service, 'sendNewQuestion').mockReturnValue(mockGame as any);

            service.loadNextQuestion(mockGame, roomId);

            expect(mockGame.nextQuestion).toHaveBeenCalled();
            expect(sendNewQuestionSpy).toHaveBeenCalled();
        });
    });

    describe('sendNewQuestion', () => {
        it('should send the new qmc question to the room', () => {
            const roomId = 'testRoomId';
            const mockGame: any = {
                getQuestion: jest.fn().mockReturnValue({}),
                getCurrentQuestionWithoutAnswers: jest.fn().mockReturnValue({}),
                getCurrentQuestion: jest.fn().mockReturnValue({}),
                getDuration: jest.fn().mockReturnValue(10),
                isLastQuestion: jest.fn().mockReturnValue(false),
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
                isQcm: jest.fn().mockReturnValue(true),
            };
            const sendSelectedChoicesTotalSpy = jest.spyOn(service, 'sendSelectedChoicesTotal').mockReturnValue(mockGame as any);

            service.sendNewQuestion(mockGame, roomId);

            expect(sendSelectedChoicesTotalSpy).toHaveBeenCalledWith(mockGame);
            expect(service['clientCommunicationService'].sendQuestionToPlayers).toHaveBeenCalledTimes(1);
            expect(service['clientCommunicationService'].sendQuestionToOrganizer).toHaveBeenCalledTimes(1);
        });

        it('should call sendEditingLongAnswerTotal if not a qmc', () => {
            const roomId = 'testRoomId';
            const mockGame: any = {
                getQuestion: jest.fn().mockReturnValue({}),
                getCurrentQuestionWithoutAnswers: jest.fn().mockReturnValue({}),
                getCurrentQuestion: jest.fn().mockReturnValue({}),
                getDuration: jest.fn().mockReturnValue(10),
                isLastQuestion: jest.fn().mockReturnValue(false),
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
                getEditingLongAnswerTotal: jest.fn(),
                isQcm: jest.fn().mockReturnValue(false),
            };
            const sendEditingLongAnswerTotalSpy = jest.spyOn(service, 'sendEditingLongAnswerTotal');

            service.sendNewQuestion(mockGame, roomId);

            expect(sendEditingLongAnswerTotalSpy).toHaveBeenCalledWith(mockGame);
            expect(service['clientCommunicationService'].sendQuestionToPlayers).toHaveBeenCalledTimes(1);
            expect(service['clientCommunicationService'].sendQuestionToOrganizer).toHaveBeenCalledTimes(1);
        });
    });

    describe('sendSelectedChoicesTotal', () => {
        it('should send the selected choices total to the room', () => {
            const mockGame: any = {
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
                getSelectedChoicesTotal: jest.fn().mockReturnValue([1, 2, 3]),
            };

            service.sendSelectedChoicesTotal(mockGame);

            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledTimes(1);
        });
    });

    describe('sendQuestionResults', () => {
        it('should send the question results to the room', () => {
            const roomId = 'testRoomId';
            const mockGame: any = {
                getPlayersOrderedByScore: jest.fn().mockReturnValue([
                    { id: '1', lastQuestionIsBonus: true, lastQuestionResult: 100 },
                    { id: '2', lastQuestionIsBonus: false, lastQuestionResult: 0 },
                ]),
            };
            const sendAnswersToPlayersSpy = jest.spyOn(service, 'sendAnswersToPlayers').mockReturnValue(mockGame as any);

            service.sendQuestionResults(mockGame, roomId);

            expect(sendAnswersToPlayersSpy).toHaveBeenCalledTimes(1);
            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledTimes(2);
        });
    });

    describe('sendAnswersToPlayers', () => {
        it('should send the answers to the players', () => {
            const roomId = 'testRoomId';
            const organizerId = 'organizerId';
            const answers = [
                { playerId: '1', answer: 'answer1' },
                { playerId: '2', answer: 'answer2' },
                { playerId: '3', answer: 'answer3' },
            ];
            const mockGame = {
                getOrganizerId: jest.fn().mockReturnValue(organizerId),
                getAnswers: jest.fn().mockReturnValue(answers),
            };

            service.sendAnswersToPlayers(mockGame as any, roomId);

            expect(service['clientCommunicationService'].sendAnswersToPlayers).toHaveBeenCalledTimes(1);
            expect(service['clientCommunicationService'].sendAnswersToPlayers).toHaveBeenCalledWith(roomId, organizerId, answers);
        });
    });

    describe('sendScoresToOrganizer', () => {
        it('should send scores to the organizer', () => {
            const roomId = 'testRoomId';
            const organizerId = 'organizerId';
            const scores = { player1: 10, player2: 20, player3: 30 };
            const mockGame = { getPlayersScores: jest.fn().mockReturnValue(scores), getOrganizerId: jest.fn().mockReturnValue(organizerId) };
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame as any);

            service.sendScoresToOrganizer(roomId);

            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledWith(organizerId, WebSocketEvents.UpdateScores, scores);
        });

        it('should do nothing if game is not found', () => {
            const roomId = 'testRoomId';
            jest.spyOn(service, 'getGame').mockReturnValue(null);

            service.sendScoresToOrganizer(roomId);

            expect(service['clientCommunicationService'].sendToPlayer).not.toHaveBeenCalled();
        });
    });

    describe('canLockChoices', () => {
        it('should return true if state is Answering', () => {
            const mockGame = { state: GameState.Answering };

            const result = service['canLockChoices'](mockGame as any);

            expect(result).toEqual(true);
        });

        it('should return false if state is not Answering', () => {
            const mockGame = { state: GameState.WaitingRoom };

            const result = service['canLockChoices'](mockGame as any);

            expect(result).toEqual(false);
        });
    });

    describe('removeOrganizerFromGame', () => {
        it('should send kick player event to room except organizer', () => {
            const roomId = 'testRoomId';
            const organizerId = 'organizerId';
            const mockGame = { getOrganizerId: jest.fn().mockReturnValue(organizerId) };
            jest.spyOn(service['clientCommunicationService'], 'sendToRoomExcept');

            service['removeOrganizerFromGame'](mockGame as any, roomId);

            expect(service['clientCommunicationService'].sendToRoomExcept).toHaveBeenCalledWith(roomId, organizerId, WebSocketEvents.KickPlayer, {
                kickPlayerReason: KickPlayerReason.OrganizerLeft,
            });
        });

        it('should delete the game', () => {
            const roomId = 'testRoomId';
            const mockGame = { getOrganizerId: jest.fn().mockReturnValue('') };
            jest.spyOn(service, 'deleteGame');

            service['removeOrganizerFromGame'](mockGame as any, roomId);

            expect(service.deleteGame).toHaveBeenCalledWith(roomId);
        });
    });

    describe('removePlayerFromResultsPage', () => {
        it('should remove player from results page and return updated player list', () => {
            const roomId = 'testRoomId';
            const playerId = 'playerId';
            const mockGame = {
                removePlayer: jest.fn().mockReturnValue(['player1', 'player2']),
            };
            jest.spyOn(service['roomService'], 'leaveRoomById');
            jest.spyOn(service as any, 'shouldGameBeDeleted').mockReturnValue(false);
            jest.spyOn(service, 'deleteGame');

            const result = service['removePlayerFromResultsPage'](mockGame as any, roomId, playerId);

            expect(mockGame.removePlayer).toHaveBeenCalledWith(playerId);
            expect(service['roomService'].leaveRoomById).toHaveBeenCalledWith(roomId, playerId);
            expect(service.deleteGame).not.toHaveBeenCalled();
            expect(result).toEqual(['player1', 'player2']);
        });

        it('should remove player from results page, delete game, and return empty player list', () => {
            const roomId = 'testRoomId';
            const playerId = 'playerId';
            const mockGame = {
                removePlayer: jest.fn().mockReturnValue([]),
            };
            jest.spyOn(service['roomService'], 'leaveRoomById');
            jest.spyOn(service as any, 'shouldGameBeDeleted').mockReturnValue(true);
            jest.spyOn(service, 'deleteGame');

            const result = service['removePlayerFromResultsPage'](mockGame as any, roomId, playerId);

            expect(mockGame.removePlayer).toHaveBeenCalledWith(playerId);
            expect(service['roomService'].leaveRoomById).toHaveBeenCalledWith(roomId, playerId);
            expect(service.deleteGame).toHaveBeenCalledWith(roomId);
            expect(result).toEqual([]);
        });
    });

    describe('removePlayerInternally', () => {
        it('should remove player internally and return updated player list', () => {
            const roomId = 'testRoomId';
            const playerId = 'playerId';
            const mockGame = {
                removePlayer: jest.fn().mockReturnValue(['player1', 'player2']),
                state: GameState.Answering,
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
            };
            jest.spyOn(service['roomService'], 'leaveRoomById');
            jest.spyOn(service['clientCommunicationService'], 'sendToPlayer');
            jest.spyOn(service, 'deleteGame');

            const result = service['removePlayerInternally'](mockGame as any, roomId, playerId);

            expect(mockGame.removePlayer).toHaveBeenCalledWith(playerId);
            expect(service['roomService'].leaveRoomById).toHaveBeenCalledWith(roomId, playerId);
            expect(result).toEqual(['player1', 'player2']);
        });

        it('should remove player internally, delete game, and return empty player list', () => {
            const roomId = 'testRoomId';
            const playerId = 'playerId';
            const mockGame = {
                removePlayer: jest.fn().mockReturnValue([]),
                state: GameState.Answering,
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
            };
            jest.spyOn(service['roomService'], 'leaveRoomById');
            jest.spyOn(service['clientCommunicationService'], 'sendToPlayer');
            jest.spyOn(service, 'deleteGame');

            const result = service['removePlayerInternally'](mockGame as any, roomId, playerId);

            expect(mockGame.removePlayer).toHaveBeenCalledWith(playerId);
            expect(service['roomService'].leaveRoomById).toHaveBeenCalledWith(roomId, playerId);
            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledWith('organizerId', WebSocketEvents.KickPlayer, {
                kickPlayerReason: KickPlayerReason.AllPlayersLeft,
            });
            expect(service.deleteGame).toHaveBeenCalledWith(roomId);
            expect(result).toEqual([]);
        });

        it('should remove player internally and return updated player list without deleting game', () => {
            const roomId = 'testRoomId';
            const playerId = 'playerId';
            const mockGame = {
                removePlayer: jest.fn().mockReturnValue(['player1', 'player2']),
                state: GameState.WaitingRoom,
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
            };
            jest.spyOn(service['roomService'], 'leaveRoomById');
            jest.spyOn(service['clientCommunicationService'], 'sendToPlayer');
            jest.spyOn(service, 'deleteGame');

            const result = service['removePlayerInternally'](mockGame as any, roomId, playerId);

            expect(mockGame.removePlayer).toHaveBeenCalledWith(playerId);
            expect(service['roomService'].leaveRoomById).toHaveBeenCalledWith(roomId, playerId);
            expect(service['clientCommunicationService'].sendToPlayer).not.toHaveBeenCalled();
            expect(service.deleteGame).not.toHaveBeenCalled();
            expect(result).toEqual(['player1', 'player2']);
        });
    });

    describe('shouldGameBeDeleted', () => {
        it('should return true if the player is the organizer and there are no other players', () => {
            const game = {};
            const playerId = 'organizerId';
            const playerList = [];
            jest.spyOn(service, 'isOrganizer').mockReturnValue(true);

            const result = service['shouldGameBeDeleted'](game as any, playerId, playerList as any);

            expect(result).toBe(true);
        });

        it('should return true if there are players and the organizer has left', () => {
            const game = { getOrganizerHasLeft: jest.fn().mockReturnValue(true) };
            const playerId = 'playerId';
            const playerList = [{ id: 'organizerId' }];
            jest.spyOn(service, 'isOrganizer').mockReturnValue(false);

            const result = service['shouldGameBeDeleted'](game as any, playerId, playerList as any);

            expect(result).toBe(true);
        });

        it('should return false if the player is the organizer but there are other players', () => {
            const game = { getOrganizerHasLeft: jest.fn().mockReturnValue(false) };
            const playerId = 'organizerId';
            const playerList = [{ id: 'playerId' }];
            jest.spyOn(service, 'isOrganizer').mockReturnValue(true);

            const result = service['shouldGameBeDeleted'](game as any, playerId, playerList as any);

            expect(result).toBe(false);
        });

        it('should return false if there are other players and the organizer has not left', () => {
            const game = { getOrganizerHasLeft: jest.fn().mockReturnValue(false) };
            const playerId = 'playerId';
            const playerList = [{ id: 'organizerId' }, { id: 'playerId' }];
            jest.spyOn(service, 'isOrganizer').mockReturnValue(false);

            const result = service['shouldGameBeDeleted'](game as any, playerId, playerList as any);

            expect(result).toBe(false);
        });
    });

    describe('getPlayerById', () => {
        let roomId;
        let playerId;
        let mockPlayer;
        let mockGame;

        beforeEach(() => {
            roomId = '123';
            playerId = '1';
            mockPlayer = { id: playerId, name: 'joe' };
            mockGame = {
                getPlayers: jest.fn().mockReturnValue([mockPlayer]),
            };

            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);
        });

        it('should return the player by ID', () => {
            const result = service.getPlayerById(roomId, playerId);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(mockGame.getPlayers).toHaveBeenCalled();
            expect(result).toEqual(mockPlayer);
        });

        it('should return undefined if no game is found for the given roomId', () => {
            jest.spyOn(service, 'getGame').mockReturnValue(undefined);

            const result = service.getPlayerById(roomId, playerId);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(result).toBeUndefined();
        });

        it('should return undefined if no player is found for the given playerId', () => {
            const nonExistingPlayerId = 'nonExistingPlayer123';
            const result = service.getPlayerById(roomId, nonExistingPlayerId);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(mockGame.getPlayers).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });

    describe('getPlayerByName', () => {
        let roomId;
        let playerName;
        let mockPlayer;
        let mockGame;

        beforeEach(() => {
            roomId = '123';
            playerName = 'joe';
            mockPlayer = { id: '1', name: playerName };
            mockGame = {
                getPlayers: jest.fn().mockReturnValue([mockPlayer]),
            };

            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);
        });

        it('should return the player by name', () => {
            const result = service.getPlayerByName(roomId, playerName);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(mockGame.getPlayers).toHaveBeenCalled();
            expect(result).toEqual(mockPlayer);
        });

        it('should return undefined if no game is found for the given roomId', () => {
            jest.spyOn(service, 'getGame').mockReturnValue(undefined);

            const result = service.getPlayerByName(roomId, playerName);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(result).toBeUndefined();
        });

        it('should return undefined if no player is found for the given name', () => {
            const nonExistingPlayerName = 'joey';
            const result = service.getPlayerByName(roomId, nonExistingPlayerName);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(mockGame.getPlayers).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });

    describe('togglePausedGame', () => {
        let roomId;
        let mockGame;

        beforeEach(() => {
            roomId = '123';
            mockGame = {
                state: GameState.Answering,
                isGamePaused: false,
                pauseGame: jest.fn(),
            };

            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);
            jest.spyOn(service, 'sendPauseRequest').mockImplementation(() => {});
        });

        it('should pause the game if it is in answering state and paused is true', () => {
            service.togglePausedGame(roomId, true);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(mockGame.isGamePaused).toBe(false);
            expect(mockGame.pauseGame).toHaveBeenCalled();
            expect(service.sendPauseRequest).toHaveBeenCalledWith(mockGame, roomId);
        });

        it('should unpause the game if it is in answering state and paused is false', () => {
            mockGame.isGamePaused = true;
            service.togglePausedGame(roomId, true);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(mockGame.isGamePaused).toBe(false);
            expect(mockGame.pauseGame).toHaveBeenCalled();
            expect(service.sendPauseRequest).toHaveBeenCalledWith(mockGame, roomId);
        });

        it('should call sendPauseRequest and pauseGame regardless of the game state', () => {
            mockGame.state = GameState.QuestionResults;

            service.togglePausedGame(roomId, true);

            expect(service.sendPauseRequest).toHaveBeenCalledWith(mockGame, roomId);
            expect(mockGame.pauseGame).toHaveBeenCalled();
        });

        it('should not toggle game pause if game is not in answering state', () => {
            mockGame.state = GameState.QuestionResults;

            service.togglePausedGame(roomId, false);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(mockGame.isGamePaused).toBe(false);
            expect(mockGame.pauseGame).toHaveBeenCalled();
            expect(service.sendPauseRequest).toHaveBeenCalledWith(mockGame, roomId);
        });
    });

    describe('startPanicMode', () => {
        it('should start panic mode for the game and notify clients', () => {
            const roomId = '123';
            const mockGame = {
                startPanicMode: jest.fn(),
            } as any as Game;

            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);
            jest.spyOn(service, 'sendPanicStarted').mockImplementation(() => {});

            service.startPanicMode(roomId);

            expect(service.getGame).toHaveBeenCalledWith(roomId);
            expect(mockGame.startPanicMode).toHaveBeenCalled();
            expect(service.sendPanicStarted).toHaveBeenCalledWith(roomId);
        });
    });

    describe('sendPauseRequest', () => {
        it('should call sendPauseRequest on clientCommunicationService with correct roomId and game pause status', () => {
            const roomId = '123';
            const mockGame = {
                getIsGamePaused: jest.fn().mockReturnValue(true),
            } as any as Game;

            service.sendPauseRequest(mockGame, roomId);

            expect(mockGame.getIsGamePaused).toHaveBeenCalled();
            expect(service['clientCommunicationService'].sendPauseRequest).toHaveBeenCalledWith(roomId, true);
        });
    });

    describe('sendGradesTotal', () => {
        it('should call sendToPlayer with the organizerId, TotalGrades event, and long answer total', () => {
            const mockGame = {
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
                getLongAnswerTotal: jest.fn().mockReturnValue({ grade0: 1, grade50: 2, grade100: 3 }),
            } as any as Game;

            jest.spyOn(service['clientCommunicationService'], 'sendToPlayer').mockImplementation(() => {});

            service.sendGradesTotal(mockGame);

            expect(mockGame.getOrganizerId).toHaveBeenCalled();
            expect(mockGame.getLongAnswerTotal).toHaveBeenCalled();
            expect(service['clientCommunicationService'].sendToPlayer).toHaveBeenCalledWith('organizerId', WebSocketEvents.TotalGrades, {
                grade0: 1,
                grade50: 2,
                grade100: 3,
            });
        });
    });

    describe('sendPanicAvailable', () => {
        it('should call sendPanicModeAvailable with the correct roomId and panic mode availability', () => {
            const roomId = '123';
            const time = 100;
            const panicModeAvailable = true;

            const mockGame = {
                canStartPanicMode: jest.fn().mockReturnValue(panicModeAvailable),
            } as any as Game;
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);

            service.sendPanicAvailable(roomId, time);

            expect(mockGame.canStartPanicMode).toHaveBeenCalledWith(time);
            expect(service['clientCommunicationService'].sendPanicModeAvailable).toHaveBeenCalledWith(roomId, panicModeAvailable);
        });
    });

    describe('sendPanicStarted', () => {
        it('should call sendPanicModeStarted with the correct roomId and panic mode state', () => {
            const roomId = '123';
            const mockGame = {
                isPanicOn: true,
            } as any as Game;
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);

            service.sendPanicStarted(roomId);

            expect(service['clientCommunicationService'].sendPanicModeStarted).toHaveBeenCalledWith(roomId, true);
        });
    });

    describe('applyGrading', () => {
        it('should call addGrade on game with the correct grade', () => {
            const roomId = '123';
            const grade = 5;

            const mockGame = {
                addGrade: jest.fn(),
            } as any as Game;
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);

            service.applyGrading(roomId, grade);

            expect(mockGame.addGrade).toHaveBeenCalledWith(grade);
        });

        it('should do nothing if game is not found', () => {
            const roomId = '123';
            const grade = 5;
            jest.spyOn(service, 'getGame').mockReturnValue(undefined);

            service.applyGrading(roomId, grade);
        });
    });

    describe('gradeNextPlayer', () => {
        it('should call sendGradingRequest with correct parameters for next player to grade', () => {
            const roomId = 'testRoomId';
            const mockPlayer = {
                longAnswer: 'Test answer',
                name: 'Test Player',
            };
            const mockGame = {
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
                getNextPlayerToGrade: jest.fn().mockReturnValue(mockPlayer),
                getGradeIndex: jest.fn().mockReturnValue(1),
                nStartPlayers: 3,
            } as any as Game;
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);

            service.gradeNextPlayer(roomId);

            expect(service['clientCommunicationService'].sendGradingRequest).toHaveBeenCalledWith(
                'organizerId',
                mockPlayer.longAnswer,
                mockPlayer.name,
                1,
                3,
            );
        });

        it('should not call sendGradingRequest if there is no game for given roomId', () => {
            const roomId = 'nonExistentRoomId';
            jest.spyOn(service, 'getGame').mockReturnValue(undefined);

            service.gradeNextPlayer(roomId);

            expect(service['clientCommunicationService'].sendGradingRequest).not.toHaveBeenCalled();
        });
    });

    describe('updateLongAnswer', () => {
        it('should call updateLongAnswer on the game and send updated interaction status to room', () => {
            const roomId = '1234';
            const playerId = 'Oh';
            const longAnswer = 'Test long answer';
            const mockPlayer = {
                id: playerId,
                name: 'Mbappe',
                hasInteracted: true,
            } as any as Player;
            const mockGame = {
                updateLongAnswer: jest.fn(),
            } as any as Game;
            jest.spyOn(service, 'getGame').mockReturnValue(mockGame);
            jest.spyOn(service, 'getPlayerById').mockReturnValue(mockPlayer);

            service.updateLongAnswer(roomId, playerId, longAnswer);

            expect(mockGame.updateLongAnswer).toHaveBeenCalledWith(playerId, longAnswer, expect.any(Function));
            expect(service['clientCommunicationService'].sendToRoom).toHaveBeenCalledWith(roomId, WebSocketEvents.OnChangeHasInteracted, {
                hasInteracted: mockPlayer.hasInteracted,
                name: mockPlayer.name,
            });
        });

        it('should not proceed if there is no game for given roomId', () => {
            const roomId = '1234';
            const playerId = 'Oh';
            const longAnswer = 'Test long answer';

            jest.spyOn(service, 'getGame').mockReturnValue(undefined);

            service.updateLongAnswer(roomId, playerId, longAnswer);

            expect(service['clientCommunicationService'].sendToRoom).not.toHaveBeenCalled();
        });
    });
});
