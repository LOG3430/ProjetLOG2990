import { GameAction } from '@app/enums/game-action.enum';
import { DELAY_COOLDOWN, DELAY_QUESTION_RESULT } from '@app/services/game/game.service.constants';
import { GameState } from '@common/enums/game-state.enum';
import { KickPlayerReason } from '@common/enums/kick-player-reason.enum';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { GameStateService } from './game-state.service';

// any, magic numbers, max-lines and empty functions used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-magic-numbers */
/* eslint-disable  @typescript-eslint/no-empty-function */
/* eslint-disable  max-lines */

const gameServiceMock = {
    isOrganizer: jest.fn(),
    getGame: jest.fn(),
    canStartGame: jest.fn(),
    sendNewQuestion: jest.fn(),
    sendSelectedChoicesTotal: jest.fn(),
    sendQuestionResults: jest.fn(),
    sendScoresToOrganizer: jest.fn(),
    deleteGame: jest.fn(),
    loadNextQuestion: jest.fn(),
    resetPlayerInteractions: jest.fn(),
    gradeNextPlayer: jest.fn(),
    sendGradesTotal: jest.fn(),
    sendEditingLongAnswerTotal: jest.fn(),
    sendPanicAvailable: jest.fn(),
    getPlayerNames: jest.fn(),
    getPlayerName: jest.fn(),
};

const clientCommunicationServiceMock = {
    sendToRoom: jest.fn(),
    sendGameStateUpdate: jest.fn(),
    sendStartTimer: jest.fn(),
    sendTimerUpdate: jest.fn(),
    sendToPlayer: jest.fn(),
};

const historyServiceMock = {
    addTotalSelectedChoicesToHistory: jest.fn(),
    addHistory: jest.fn(),
};

const chatServiceMock = {
    unmuteAllPlayers: jest.fn(),
};

jest.mock('../game/game.service', () => ({
    gameService: jest.fn(() => gameServiceMock),
}));

jest.mock('../client-communication/client-communication.service', () => ({
    clientCommunicationService: jest.fn(() => clientCommunicationServiceMock),
}));

jest.mock('../chat/chat.service', () => ({
    chatService: jest.fn(() => chatServiceMock),
}));

describe('GameStateService', () => {
    let gameStateService: GameStateService;

    beforeEach(() => {
        gameStateService = new GameStateService(
            gameServiceMock as any,
            clientCommunicationServiceMock as any,
            historyServiceMock as any,
            chatServiceMock as any,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handleState', () => {
        it('should do nothing if player is not organizer', () => {
            gameServiceMock.isOrganizer.mockReturnValue(false);
            const handleStateInternallySpy = jest.spyOn(gameStateService as any, 'handleStateInternally').mockImplementation(() => {});

            gameStateService.handleState('roomId', GameAction.ActionButton, 'playerId');

            expect(handleStateInternallySpy).not.toHaveBeenCalled();
        });

        it('should call handleStateInternally if player is organizer', () => {
            gameServiceMock.isOrganizer.mockReturnValue(true);
            const handleStateInternallySpy = jest.spyOn(gameStateService as any, 'handleStateInternally').mockImplementation(() => {});

            gameStateService.handleState('roomId', GameAction.ActionButton, 'playerId');

            expect(handleStateInternallySpy).toHaveBeenCalledWith('roomId', GameAction.ActionButton);
        });
    });

    describe('checkAllLockedChoices', () => {
        it('should do nothing if game state is not Answering', () => {
            const game = { state: GameState.WaitingRoom, isAllChoicesLocked: jest.fn().mockReturnValue(true) };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleStateSpy = jest.spyOn(gameStateService, 'handleState').mockImplementation(() => {});

            gameStateService.checkAllLockedChoices('roomId');

            expect(handleStateSpy).not.toHaveBeenCalled();
        });

        it('should call handleState if game state is Answering and all choices are locked', () => {
            const game = {
                state: GameState.Answering,
                isAllChoicesLocked: jest.fn().mockReturnValue(true),
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
            };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleStateSpy = jest.spyOn(gameStateService, 'handleState').mockImplementation(() => {});

            gameStateService.checkAllLockedChoices('roomId');

            expect(handleStateSpy).toHaveBeenCalledWith('roomId', GameAction.EndTimer, 'organizerId');
        });

        it('should do nothing if game state is Answering and not all choices are locked', () => {
            const game = { state: GameState.Answering, isAllChoicesLocked: jest.fn().mockReturnValue(false) };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleStateSpy = jest.spyOn(gameStateService, 'handleState').mockImplementation(() => {});

            gameStateService.checkAllLockedChoices('roomId');

            expect(handleStateSpy).not.toHaveBeenCalled();
        });
    });

    describe('handleStateInternally', () => {
        it('should call handleWaitingRoomStateActions if game state is WaitingRoom', () => {
            const game = { state: GameState.WaitingRoom };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleWaitingRoomStateActionsSpy = jest
                .spyOn(gameStateService as any, 'handleWaitingRoomStateActions')
                .mockImplementation(() => {});

            gameStateService['handleStateInternally']('roomId', GameAction.ActionButton);

            expect(handleWaitingRoomStateActionsSpy).toHaveBeenCalledWith(game, GameAction.ActionButton, 'roomId');
        });

        it('should call handleInitialTimerStateActions if game state is InitialTimer', () => {
            const game = { state: GameState.InitialTimer };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleInitialTimerStateActionsSpy = jest
                .spyOn(gameStateService as any, 'handleInitialTimerStateActions')
                .mockImplementation(() => {});

            gameStateService['handleStateInternally']('roomId', GameAction.ActionButton);

            expect(handleInitialTimerStateActionsSpy).toHaveBeenCalledWith(game, GameAction.ActionButton, 'roomId');
        });

        it('should call handleAnsweringStateActions if game state is Answering', () => {
            const game = { state: GameState.Answering };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleAnsweringStateActionsSpy = jest.spyOn(gameStateService as any, 'handleAnsweringStateActions').mockImplementation(() => {});

            gameStateService['handleStateInternally']('roomId', GameAction.ActionButton);

            expect(handleAnsweringStateActionsSpy).toHaveBeenCalledWith(game, GameAction.ActionButton, 'roomId');
        });

        it('should call handleQuestionResultsStateActions if game state is QuestionResults', () => {
            const game = { state: GameState.QuestionResults };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleQuestionResultsStateActionsSpy = jest
                .spyOn(gameStateService as any, 'handleQuestionResultsStateActions')
                .mockImplementation(() => {});

            gameStateService['handleStateInternally']('roomId', GameAction.ActionButton);

            expect(handleQuestionResultsStateActionsSpy).toHaveBeenCalledWith(game, GameAction.ActionButton, 'roomId');
        });

        it('should call handleCooldownStateActions if game state is Cooldown', () => {
            const game = { state: GameState.Cooldown };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleCooldownStateActionsSpy = jest.spyOn(gameStateService as any, 'handleCooldownStateActions').mockImplementation(() => {});

            gameStateService['handleStateInternally']('roomId', GameAction.ActionButton);

            expect(handleCooldownStateActionsSpy).toHaveBeenCalledWith(game, GameAction.ActionButton, 'roomId');
        });

        it('should call handleGradingStateActions if game state is Grading', () => {
            const game = { state: GameState.Grading };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleGradingStateActionsSpy = jest.spyOn(gameStateService as any, 'handleGradingStateActions').mockImplementation(() => {});

            gameStateService['handleStateInternally']('roomId', GameAction.ActionButton);

            expect(handleGradingStateActionsSpy).toHaveBeenCalledWith(game, GameAction.ActionButton, 'roomId');
        });
    });

    describe('handleWaitingRoomStateActions', () => {
        it('should start timer if action is SkipStateOnTestMode and game is test', () => {
            const game = {
                getIsTest: jest.fn().mockReturnValue(true),
                getDuration: jest.fn().mockReturnValue(10),
                state: GameState.WaitingRoom,
                startDateTime: 'test',
            };
            gameServiceMock.getGame.mockReturnValue(game);
            const startTimerSpy = jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});

            gameStateService['handleWaitingRoomStateActions'](game as any, GameAction.SkipStateOnTestMode, 'roomId');
            gameStateService['sendGameStateUpdate'](game as any, 'roomId');
            gameStateService['handleWaitingRoomStateActions'](game as any, GameAction.SkipStateOnTestMode, 'roomId');

            expect(startTimerSpy).toHaveBeenCalledWith(game, 10, 'roomId');
            expect(game.startDateTime).toBeDefined();
        });

        it('should call switchToInitialTimerState if action is button and game is not test', () => {
            const game = {
                getIsTest: jest.fn().mockReturnValue(false),
                getIsRandom: jest.fn().mockReturnValue(false),
                getDuration: jest.fn().mockReturnValue(10),
                state: GameState.WaitingRoom,
            };
            gameServiceMock.getGame.mockReturnValue(game);
            gameServiceMock.canStartGame.mockReturnValue(true);
            const switchToInitialTimerStateSpy = jest.spyOn(gameStateService as any, 'switchToInitialTimerState').mockImplementation(() => {});

            gameStateService['handleWaitingRoomStateActions'](game as any, GameAction.ActionButton, 'roomId');

            expect(switchToInitialTimerStateSpy).toHaveBeenCalledWith(game, 'roomId');
        });

        it('should do nothing if action is button and game is not test and cannot start game', () => {
            const game = {
                getIsTest: jest.fn().mockReturnValue(false),
                getIsRandom: jest.fn().mockReturnValue(false),
                getDuration: jest.fn().mockReturnValue(10),
                state: GameState.WaitingRoom,
            };
            gameServiceMock.getGame.mockReturnValue(game);
            gameServiceMock.canStartGame.mockReturnValue(false);
            const switchToInitialTimerStateSpy = jest.spyOn(gameStateService as any, 'switchToInitialTimerState').mockImplementation(() => {});

            gameStateService['handleWaitingRoomStateActions'](game as any, GameAction.ActionButton, 'roomId');

            expect(switchToInitialTimerStateSpy).not.toHaveBeenCalled();
        });

        it('should change organizer status if game is random', () => {
            const game = {
                getIsTest: jest.fn().mockReturnValue(false),
                getIsRandom: jest.fn().mockReturnValue(true),
                getDuration: jest.fn().mockReturnValue(10),
                removeOrganizer: jest.fn(),
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
                state: GameState.WaitingRoom,
            };
            gameServiceMock.getGame.mockReturnValue(game);
            gameServiceMock.canStartGame.mockReturnValue(true);
            const sendToPlayerSpy = clientCommunicationServiceMock.sendToPlayer.mockImplementation(() => {});
            const switchToInitialTimerStateSpy = jest.spyOn(gameStateService as any, 'switchToInitialTimerState').mockImplementation(() => {});

            gameStateService['handleWaitingRoomStateActions'](game as any, GameAction.ActionButton, 'roomId');

            expect(switchToInitialTimerStateSpy).toHaveBeenCalledWith(game, 'roomId');
            expect(sendToPlayerSpy).toHaveBeenCalledWith('organizerId', WebSocketEvents.ChangeOrganizerStatus, { isOrganizer: false });
            expect(game.removeOrganizer).toHaveBeenCalled();
        });
    });

    describe('handleInitialTimerStateActions', () => {
        it('should do nothing if action is not EndTimer', () => {
            const game = { state: GameState.InitialTimer };
            gameServiceMock.getGame.mockReturnValue(game);
            const startTimerSpy = jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});

            gameStateService['handleInitialTimerStateActions'](game as any, GameAction.ActionButton, 'roomId');

            expect(startTimerSpy).not.toHaveBeenCalled();
        });

        it('should start answering state if action is EndTimer', () => {
            const game = { state: GameState.InitialTimer, getDuration: jest.fn().mockReturnValue(10), isQcm: jest.fn().mockReturnValue(true) };
            gameServiceMock.getGame.mockReturnValue(game);
            const startTimerSpy = jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});

            gameStateService['handleInitialTimerStateActions'](game as any, GameAction.EndTimer, 'roomId');

            expect(startTimerSpy).toHaveBeenCalledWith(game, 10, 'roomId');
        });
    });

    describe('handleAnsweringStateActions', () => {
        it('should do nothing if action is ActionButton', () => {
            const game = { state: GameState.Answering };
            gameServiceMock.getGame.mockReturnValue(game);

            gameStateService['handleAnsweringStateActions'](game as any, GameAction.ActionButton, 'roomId');

            expect(clientCommunicationServiceMock.sendGameStateUpdate).not.toHaveBeenCalled();
            expect(gameServiceMock.sendSelectedChoicesTotal).not.toHaveBeenCalled();
        });

        it('should send game state update and selected choices total if action is not ActionButton', () => {
            const game = {
                state: GameState.Answering,
                timer: { reset: jest.fn() },
                lockAllRemainingPlayersAnswers: jest.fn(),
                updatePlayersScore: jest.fn(),
                getIsTest: jest.fn().mockReturnValue(false),
                getIsRandom: jest.fn().mockReturnValue(false),
                isQcm: jest.fn().mockReturnValue(true),
                endAllPlayersTimers: jest.fn(),
            };
            gameServiceMock.getGame.mockReturnValue(game);

            gameStateService['handleAnsweringStateActions'](game as any, GameAction.EndTimer, 'roomId');
            expect(clientCommunicationServiceMock.sendGameStateUpdate).toHaveBeenCalledWith('roomId', GameState.QuestionResults);
            expect(gameServiceMock.sendScoresToOrganizer).toHaveBeenCalledWith('roomId');
            expect(game.timer.reset).toHaveBeenCalled();
        });

        it('should start timer if game is test', () => {
            const game = {
                state: GameState.Answering,
                timer: { reset: jest.fn() },
                lockAllRemainingPlayersAnswers: jest.fn(),
                updatePlayersScore: jest.fn(),
                getIsTest: jest.fn().mockReturnValue(true),
                endAllPlayersTimers: jest.fn(),
            };
            gameServiceMock.getGame.mockReturnValue(game);
            const startTimerSpy = jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});

            gameStateService['handleAnsweringStateActions'](game as any, GameAction.EndTimer, 'roomId');

            expect(startTimerSpy).toHaveBeenCalledWith(game, DELAY_QUESTION_RESULT, 'roomId');
            expect(game.endAllPlayersTimers).toHaveBeenCalled();
        });

        it('should set game to grading state, reset timer, and initiate grading when not a test or QCM', () => {
            const game = {
                getIsTest: jest.fn().mockReturnValue(false),
                isQcm: jest.fn().mockReturnValue(false),
                timer: { reset: jest.fn() },
                state: GameState.Answering,
            };
            gameStateService['handleAnsweringStateActions'](game as any, GameAction.EndTimer, 'roomId');

            expect(game.state).toEqual(GameState.Grading);
            expect(game.timer.reset).toHaveBeenCalled();
            expect(clientCommunicationServiceMock.sendGameStateUpdate).toHaveBeenCalledWith('roomId', GameState.Grading);
            expect(gameServiceMock.gradeNextPlayer).toHaveBeenCalledWith('roomId');
        });
    });

    describe('handleQuestionResultsStateActions', () => {
        it('should do nothing if action is ActionButton and game is test', () => {
            const game = { state: GameState.QuestionResults, getIsTest: jest.fn().mockReturnValue(true) };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleQuestionResultsStateActionsForTestSpy = jest
                .spyOn(gameStateService as any, 'handleQuestionResultsStateActionsForTest')
                .mockImplementation(() => {});

            gameStateService['handleQuestionResultsStateActions'](game as any, GameAction.ActionButton, 'roomId');

            expect(handleQuestionResultsStateActionsForTestSpy).not.toHaveBeenCalled();
        });

        it('should do nothing if action is EndTimer and game is not test or random', () => {
            const game = {
                state: GameState.QuestionResults,
                getIsTest: jest.fn().mockReturnValue(false),
                getIsRandom: jest.fn().mockReturnValue(false),
            };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleQuestionResultsStateActionsForTestSpy = jest
                .spyOn(gameStateService as any, 'handleQuestionResultsStateActionsForTest')
                .mockImplementation(() => {});

            gameStateService['handleQuestionResultsStateActions'](game as any, GameAction.EndTimer, 'roomId');

            expect(handleQuestionResultsStateActionsForTestSpy).not.toHaveBeenCalled();
        });

        it('should call handleQuestionResultsStateActionsForTest if game is test', () => {
            const game = { state: GameState.QuestionResults, getIsTest: jest.fn().mockReturnValue(true) };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleQuestionResultsStateActionsForTestSpy = jest
                .spyOn(gameStateService as any, 'handleQuestionResultsStateActionsForTest')
                .mockImplementation(() => {});

            gameStateService['handleQuestionResultsStateActions'](game as any, GameAction.EndTimer, 'roomId');

            expect(handleQuestionResultsStateActionsForTestSpy).toHaveBeenCalledWith(game, 'roomId');
        });

        it('should call handleQuestionResultsStateActionsForGame if game is not test', () => {
            const game = { state: GameState.QuestionResults, getIsTest: jest.fn().mockReturnValue(false) };
            gameServiceMock.getGame.mockReturnValue(game);
            const handleQuestionResultsStateActionsForGameSpy = jest
                .spyOn(gameStateService as any, 'handleQuestionResultsStateActionsForGame')
                .mockImplementation(() => {});

            gameStateService['handleQuestionResultsStateActions'](game as any, GameAction.ActionButton, 'roomId');

            expect(handleQuestionResultsStateActionsForGameSpy).toHaveBeenCalledWith(game, 'roomId');
        });
    });

    describe('handleQuestionResultsStateActionsForTest', () => {
        it('should handle last question', () => {
            const game = { isLastQuestion: jest.fn().mockReturnValue(true), getHistoryInfo: jest.fn() };
            const deleteGameSpy = jest.spyOn(gameServiceMock, 'deleteGame').mockImplementation(() => {});
            const sendToRoomSpy = jest.spyOn(clientCommunicationServiceMock, 'sendToRoom').mockImplementation(() => {});

            gameStateService['handleQuestionResultsStateActionsForTest'](game as any, 'roomId');

            expect(deleteGameSpy).toHaveBeenCalledWith('roomId');
            expect(sendToRoomSpy).toHaveBeenCalledWith('roomId', WebSocketEvents.KickPlayer, { kickPlayerReason: KickPlayerReason.GameEnded });
            expect(historyServiceMock.addHistory).not.toHaveBeenCalled();
        });

        it('should handle not last question', () => {
            const game = { isLastQuestion: jest.fn().mockReturnValue(false), state: GameState.Answering, getDuration: jest.fn().mockReturnValue(10) };
            const startTimerSpy = jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});
            const sendGameStateUpdateSpy = jest.spyOn(gameStateService as any, 'sendGameStateUpdate').mockImplementation(() => {});
            const loadNextQuestionSpy = jest.spyOn(gameServiceMock, 'loadNextQuestion').mockImplementation(() => {});
            gameStateService['handleQuestionResultsStateActionsForTest'](game as any, 'roomId');
            expect(startTimerSpy).toHaveBeenCalledWith(game, 10, 'roomId');
            expect(sendGameStateUpdateSpy).toHaveBeenCalledWith(game, 'roomId');
            expect(loadNextQuestionSpy).toHaveBeenCalledWith(game, 'roomId');
        });
    });

    describe('handleQuestionResultsStateActionsForGame', () => {
        it('should handle last question', () => {
            const game = {
                isLastQuestion: jest.fn().mockReturnValue(true),
                state: GameState.QuizResults,
                addTotalSelectedChoicesToHistory: jest.fn(),
                getPlayersScores: jest.fn(),
                getTotalResultHistory: jest.fn().mockReturnValue([]),
                getQuiz: jest.fn(),
                getPlayerBonusTimes: jest.fn().mockReturnValue(0),
                nextQuestion: jest.fn(),
                getHistoryInfo: jest.fn(),
            };
            const sendGameStateUpdateSpy = jest.spyOn(gameStateService as any, 'sendGameStateUpdate').mockImplementation(() => {});
            const sendToRoomSpy = jest.spyOn(clientCommunicationServiceMock, 'sendToRoom').mockImplementation(() => {});

            gameStateService['handleQuestionResultsStateActionsForGame'](game as any, 'roomId');

            expect(sendGameStateUpdateSpy).toHaveBeenCalledWith(game, 'roomId');
            expect(sendToRoomSpy).toHaveBeenCalledWith('roomId', WebSocketEvents.QuizStatisticsHistory, {
                totalSelectedChoicesHistory: game.getTotalResultHistory(),
                quiz: game.getQuiz(),
            });
            expect(sendToRoomSpy).toHaveBeenCalledWith('roomId', WebSocketEvents.UpdateScores, game.getPlayersScores());
            expect(game.nextQuestion).toHaveBeenCalled();
            expect(chatServiceMock.unmuteAllPlayers).toHaveBeenCalled();
        });

        it('should handle not last question', () => {
            const game = { isLastQuestion: jest.fn().mockReturnValue(false), state: GameState.Cooldown, getDuration: jest.fn().mockReturnValue(10) };
            const startTimerSpy = jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});
            const sendGameStateUpdateSpy = jest.spyOn(gameStateService as any, 'sendGameStateUpdate').mockImplementation(() => {});
            const loadNextQuestionSpy = jest.spyOn(gameServiceMock, 'loadNextQuestion').mockImplementation(() => {});
            gameStateService['handleQuestionResultsStateActionsForGame'](game as any, 'roomId');
            expect(startTimerSpy).toHaveBeenCalledWith(game, DELAY_COOLDOWN, 'roomId');
            expect(sendGameStateUpdateSpy).toHaveBeenCalledWith(game, 'roomId');
            expect(loadNextQuestionSpy).toHaveBeenCalledWith(game, 'roomId');
        });
    });

    describe('handleCooldownStateActions', () => {
        it('should do nothing if action is ActionButton', () => {
            const game = { state: GameState.Cooldown };
            gameServiceMock.getGame.mockReturnValue(game);

            gameStateService['handleCooldownStateActions'](game as any, GameAction.ActionButton, 'roomId');

            expect(clientCommunicationServiceMock.sendGameStateUpdate).not.toHaveBeenCalled();
        });

        it('should send game state update if action is not ActionButton', () => {
            const game = { state: GameState.Cooldown, getDuration: jest.fn().mockReturnValue(10), isQcm: jest.fn().mockReturnValue(true) };
            gameServiceMock.getGame.mockReturnValue(game);
            const startTimerSpy = jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});

            gameStateService['handleCooldownStateActions'](game as any, GameAction.EndTimer, 'roomId');

            expect(startTimerSpy).toHaveBeenCalledWith(game, 10, 'roomId');
            expect(clientCommunicationServiceMock.sendGameStateUpdate).toHaveBeenCalledWith('roomId', GameState.Answering);
        });
    });

    describe('handleGradingStateActions', () => {
        let mockGame;

        beforeEach(() => {
            mockGame = {
                areGradingsFinished: jest.fn(),
                state: GameState.Grading,
            };

            jest.spyOn(gameStateService as any, 'switchToQuestionResultsState').mockImplementation(() => {});
        });

        it('should switch to QuestionResultsState and send grades total when gradings are finished', () => {
            mockGame.areGradingsFinished.mockReturnValue(true);

            gameStateService['handleGradingStateActions'](mockGame, GameAction.GradingFinished, 'roomId');

            expect(gameStateService['switchToQuestionResultsState']).toHaveBeenCalledWith(mockGame, 'roomId');
            expect(gameServiceMock.sendGradesTotal).toHaveBeenCalledWith(mockGame);
            expect(gameServiceMock.gradeNextPlayer).not.toHaveBeenCalled();
        });

        it('should call gradeNextPlayer when gradings are not finished', () => {
            mockGame.areGradingsFinished.mockReturnValue(false);

            gameStateService['handleGradingStateActions'](mockGame, GameAction.GradingFinished, 'roomId');

            expect(gameServiceMock.gradeNextPlayer).toHaveBeenCalledWith('roomId');
            expect(gameServiceMock.sendGradesTotal).not.toHaveBeenCalled();
        });

        it('should do nothing if action is not GradingFinished', () => {
            gameStateService['handleGradingStateActions'](mockGame, GameAction.ActionButton, 'roomId');

            expect(mockGame.state).not.toEqual(GameState.QuestionResults);
            expect(gameServiceMock.sendGradesTotal).not.toHaveBeenCalled();
            expect(gameServiceMock.gradeNextPlayer).not.toHaveBeenCalled();
        });
    });

    describe('switchToInitialTimerState', () => {
        let mockGame;
        const roomId = 'testRoomId';

        beforeEach(() => {
            mockGame = {
                state: GameState.WaitingRoom,
                orderPlayersAlphabetically: jest.fn(),
                getPlayers: jest.fn().mockReturnValue({ length: 2 } as any),
                getPlayerNames: jest.fn().mockReturnValue([]),
                nStartPlayers: 0,
                startDateTime: 'test',
            };

            jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});
        });

        it('should call startTimer', () => {
            gameStateService['switchToInitialTimerState'](mockGame, roomId);

            expect(mockGame.state).toBe(GameState.InitialTimer);
            expect(gameStateService['startTimer']).toHaveBeenCalledWith(mockGame, 5, roomId);
            expect(mockGame.orderPlayersAlphabetically).toHaveBeenCalled();
            expect(mockGame.nStartPlayers).toBe(2);
        });
    });

    describe('switchToAnsweringState', () => {
        let mockGame;
        const roomId = 'testRoomId';

        beforeEach(() => {
            mockGame = {
                state: GameState.InitialTimer,
                getDuration: jest.fn().mockReturnValue(30),
                isQcm: jest.fn(),
            };

            jest.spyOn(gameStateService as any, 'sendGameStateUpdate').mockImplementation(() => {});
            jest.spyOn(gameStateService as any, 'startTimer').mockImplementation(() => {});
        });

        it('should call sendSelectedChoicesTotal if game is QCM', () => {
            mockGame.isQcm.mockReturnValue(true);

            gameStateService['switchToAnsweringState'](mockGame, roomId);

            expect(mockGame.state).toBe(GameState.Answering);
            expect(gameStateService['sendGameStateUpdate']).toHaveBeenCalledWith(mockGame, roomId);
            expect(gameServiceMock.sendSelectedChoicesTotal).toHaveBeenCalledWith(mockGame);
        });

        it('should call sendEditingLongAnswerTotal if game is not QCM', () => {
            mockGame.isQcm.mockReturnValue(false);

            gameStateService['switchToAnsweringState'](mockGame, roomId);

            expect(mockGame.state).toBe(GameState.Answering);
            expect(gameStateService['sendGameStateUpdate']).toHaveBeenCalledWith(mockGame, roomId);
            expect(gameServiceMock.sendEditingLongAnswerTotal).toHaveBeenCalledWith(mockGame);
        });
    });

    describe('startTimer', () => {
        it('should start the game timer and setup callbacks', () => {
            const roomId = '123';
            const duration = 30;
            const mockGame = {
                timer: {
                    start: jest.fn(),
                },
            } as any;
            jest.spyOn(gameStateService as any, 'sendTimerUpdate');
            jest.spyOn(gameStateService as any, 'handleStateInternally');

            gameStateService['startTimer'](mockGame, duration, roomId);

            expect(gameServiceMock.sendPanicAvailable).toHaveBeenCalledWith(roomId, duration);
            expect(clientCommunicationServiceMock.sendStartTimer).toHaveBeenCalledWith(roomId, duration);
            expect(mockGame.timer.start).toHaveBeenCalledWith(duration, expect.any(Function), expect.any(Function));
        });
    });

    describe('sendTimerUpdate', () => {
        it('should send timer update and panic availability', () => {
            const roomId = '123';
            const timeRemaining = 20;

            gameStateService['sendTimerUpdate'](roomId, timeRemaining);

            expect(gameServiceMock.sendPanicAvailable).toHaveBeenCalledWith(roomId, timeRemaining);
            expect(clientCommunicationServiceMock.sendTimerUpdate).toHaveBeenCalledWith(roomId, timeRemaining);
        });
    });
});
