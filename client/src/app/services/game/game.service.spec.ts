import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfirmationModalComponent } from '@app/components/admin/confirmation-modal/confirmation-modal.component';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { NotificationType } from '@app/interfaces/notification-content';
import { PlayerInfo } from '@app/interfaces/player-info';
import { SocketServiceMock } from '@app/mocks/socket.mock';
import { AppMaterialModule } from '@app/modules/material.module';
import { AudioService } from '@app/services/audio/audio.service';
import { ChatService } from '@app/services/chat-client/chat-client.service';
import { getMockQuiz } from '@app/services/import-export/import-export.mock';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { PlayersService } from '@app/services/players/players.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { GameState } from '@common/enums/game-state.enum';
import { KickPlayerReason } from '@common/enums/kick-player-reason.enum';
import { Qcm, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { ChangeOrganizerStatusRes } from '@common/websockets/change-organizer-status.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { GradeQuestionReq } from '@common/websockets/grade-question.dto';
import { JoinGameRes } from '@common/websockets/join-game.dto';
import { KickPlayerRes } from '@common/websockets/kick-player.dto';
import { NewQuestionRes } from '@common/websockets/new-question.dto';
import { QuestionResultsRes } from '@common/websockets/question-result.dto';
import { Subject, of } from 'rxjs';
import { GameService } from './game.service';
import SpyObj = jasmine.SpyObj;

// disabled max-lines because this is a test file
/* eslint-disable max-lines*/

describe('GameService', () => {
    let service: GameService;
    let playersServiceSpy: SpyObj<PlayersService>;
    let socketCommunicationServiceSpy: SocketServiceMock;
    let httpClientSpy: SpyObj<HttpClient>;
    let routerSpy: SpyObj<Router>;
    let chatServiceSpy: SpyObj<ChatService>;
    let notificationServiceSpy: SpyObj<NotificationService>;
    let audioServiceSpy: SpyObj<AudioService>;
    let mockQuiz: Quiz;

    beforeEach(() => {
        socketCommunicationServiceSpy = new SocketServiceMock();
        spyOn(socketCommunicationServiceSpy, 'send').and.callThrough();
        spyOn(socketCommunicationServiceSpy, 'on').and.callThrough();
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        playersServiceSpy = jasmine.createSpyObj('PlayersService', ['playerList']);
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['resetChats']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showBanner']);
        audioServiceSpy = jasmine.createSpyObj('AudioService', ['playAudio', 'pauseAudio']);

        TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes([]), AppMaterialModule, MatDialogModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: HttpClient, useValue: httpClientSpy },
                { provide: PlayersService, useValue: playersServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: AudioService, useValue: audioServiceSpy },
                {
                    provide: MatDialog,
                    useValue: {
                        open: () => {
                            return { afterClosed: () => of(true) };
                        },
                    },
                },
            ],
        });
        mockQuiz = getMockQuiz();
        service = TestBed.inject(GameService);
    });

    describe('initializeSocketListener', () => {
        it('should call onNewQuestion method correctly', () => {
            spyOn(service, 'onNewQuestion');
            service.initializeSocketListeners();
            expect(service.onNewQuestion).toHaveBeenCalled();
        });

        it('should call onKickPlayer method correctly', () => {
            spyOn(service, 'onKickPlayer');
            service.initializeSocketListeners();
            expect(service.onKickPlayer).toHaveBeenCalled();
        });

        it('should call onJoinGame method correctly', () => {
            spyOn(service, 'onJoinGame');
            service.initializeSocketListeners();
            expect(service.onJoinGame).toHaveBeenCalled();
        });

        it('should call onGameStateUpdate method correctly', () => {
            spyOn(service, 'onGameStateUpdate');
            service.initializeSocketListeners();
            expect(service.onGameStateUpdate).toHaveBeenCalled();
        });

        it('should call onStartTimer method correctly', () => {
            spyOn(service, 'onStartTimer');
            service.initializeSocketListeners();
            expect(service.onStartTimer).toHaveBeenCalled();
        });

        it('should call onTimeUpdate method correctly', () => {
            spyOn(service, 'onTimeUpdate');
            service.initializeSocketListeners();
            expect(service.onTimeUpdate).toHaveBeenCalled();
        });

        it('should call onQuestionResults method correctly', () => {
            spyOn(service, 'onQuestionResults');
            service.initializeSocketListeners();
            expect(service.onQuestionResults).toHaveBeenCalled();
        });
    });

    describe('sendNewQuestionMessage', () => {
        it('should send a new message in the observable', () => {
            const subject = new Subject<void>();
            service['newQuestionSubject'] = subject;
            spyOn(subject, 'next');

            service.sendNewQuestionMessage();

            expect(subject.next).toHaveBeenCalled();
        });
    });

    describe('getNewQuestionMessage', () => {
        it('should return an observable for every new question', () => {
            const subject = new Subject<void>();
            service['newQuestionSubject'] = subject;
            spyOn(subject, 'asObservable');

            service.getNewQuestionMessage();

            expect(subject.asObservable).toHaveBeenCalled();
        });
    });

    describe('getChoices', () => {
        it('should get the choices for the current question correctly', () => {
            service.question = { text: 'test', type: QuestionType.MULTIPLE_CHOICE, choices: [], _id: '1', points: 10 };
            spyOn(service, 'isQcm').and.returnValue(true);
            expect(service.getChoices()).toEqual((service.question as Qcm).choices);
        });
        it('should return empty choices if question is not Qcm', () => {
            service.question = { text: 'test', type: QuestionType.LONG_ANSWER, _id: '1', points: 10 };
            spyOn(service, 'isQcm').and.returnValue(false);
            expect(service.getChoices()).toEqual([]);
        });
    });

    describe('getTime', () => {
        it('should return the time value correctly', () => {
            const TIME_VALUE = 10;
            service['time'] = TIME_VALUE;
            expect(service.getTime()).toEqual(TIME_VALUE);
        });
        it('should return 0 if not set', () => {
            expect(service.getTime()).toEqual(0);
        });
    });

    describe('getDuration', () => {
        it('should return the duration value correctly', () => {
            const DURATION_VALUE = 30;
            service['duration'] = DURATION_VALUE;
            expect(service.getDuration()).toEqual(DURATION_VALUE);
        });
    });

    describe('getGameState', () => {
        it('should return the duration value correctly', () => {
            const GAME_STATE_VALUE: GameState = GameState.Answering;
            service['gameState'] = GAME_STATE_VALUE;
            expect(service.getGameState()).toEqual(GAME_STATE_VALUE);
        });
        it('should be in waiting room by default if not set', () => {
            expect(service.getGameState()).toEqual(GameState.WaitingRoom);
        });
    });

    describe('getIsOrganizer', () => {
        it('should return the isOrganizer value correctly', () => {
            service['isOrganizer'] = true;
            expect(service.getIsOrganizer()).toBeTrue();
        });

        it('should return false by default', () => {
            expect(service.getIsOrganizer()).toBeFalse();
        });
    });

    describe('getRoomId', () => {
        it('should return the roomId value correctly', () => {
            const ROOM_ID = '1234';
            service['roomId'] = ROOM_ID;
            expect(service.getRoomId()).toEqual(ROOM_ID);
        });
    });

    describe('getGradeQuestionRequest', () => {
        it('should return the correct request for grade question', () => {
            const request = { answer: '22' } as unknown as GradeQuestionReq;
            service['gradeQuestionRequest'] = request;
            expect(service.getGradeQuestionRequest()).toEqual(request);
        });
    });

    describe('canStartQuiz', () => {
        it('should return true if room is locked, user is organiser and there is at least 1 player in the playerList', () => {
            service['isRoomLocked'] = true;
            service['isOrganizer'] = true;
            const PLAYER: PlayerInfo = { name: 'joueur', hasLeft: false, isMuted: false, score: 0, bonusTimes: 0 } as PlayerInfo;
            playersServiceSpy.playerList = [PLAYER];
            expect(service.canStartQuiz()).toBeTrue();
        });
        it('should return false if player list length is inferior to 1', () => {
            service['isRoomLocked'] = true;
            service['isOrganizer'] = true;
            playersServiceSpy.playerList = [];
            expect(service.canStartQuiz()).toBeFalse();
        });
    });

    describe('getTooltipGameStartMessage', () => {
        it('should return the correct message if player list length is inferior to 1', () => {
            playersServiceSpy.playerList = [];
            expect(service.getTooltipGameStartMessage()).toEqual('Il faut au moins un joueur pour commencer');
        });

        it('should return correct message for unlocked game', () => {
            const PLAYER: PlayerInfo = { name: 'joueur', hasLeft: false, isMuted: false, score: 0, bonusTimes: 0 } as PlayerInfo;
            playersServiceSpy.playerList = [PLAYER];
            expect(service.getTooltipGameStartMessage()).toEqual('Il faut verrouiller la salle pour commencer');
        });

        it('should return correct message for unlocked game', () => {
            const PLAYER: PlayerInfo = { name: 'joueur', hasLeft: false, isMuted: false, score: 0, bonusTimes: 0 } as PlayerInfo;
            playersServiceSpy.playerList = [PLAYER];
            service['isRoomLocked'] = true;
            expect(service.getTooltipGameStartMessage()).toEqual('');
        });
    });

    describe('getIsRoomLocked', () => {
        it('should return true if room is locked', () => {
            service['isRoomLocked'] = true;
            expect(service.getIsRoomLocked()).toBeTrue();
        });

        it('should return false if room is not locked', () => {
            service['isRoomLocked'] = false;
            expect(service.getIsRoomLocked()).toBeFalse();
        });
    });

    describe('checkIfGameStarted', () => {
        it('should be false if the gameState is waiting room', () => {
            service['gameState'] = GameState.WaitingRoom;
            service.checkIfGameStarted();
            expect(playersServiceSpy.isGameStarted).toBeFalse();
        });

        it('should be true if the gameState is not waiting room', () => {
            service['gameState'] = GameState.Answering;
            service.checkIfGameStarted();
            expect(playersServiceSpy.isGameStarted).toBeTrue();
        });
    });

    describe('checkIfGameFinished', () => {
        it('should be false if the gameState is not QuizResults', () => {
            service['gameState'] = GameState.WaitingRoom;
            service.checkIfGameFinished();
            expect(playersServiceSpy.hasGameFinished).toBeFalse();
        });

        it('should be true if the gameState is QuizResults', () => {
            service['gameState'] = GameState.QuizResults;
            service.checkIfGameFinished();
            expect(playersServiceSpy.hasGameFinished).toBeTrue();
        });
    });

    describe('isQcm', () => {
        it('should return false if there is no question', () => {
            // disabled no-any because we want to test the behavior when the question is undefined
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            service.question = undefined as any;
            expect(service.isQcm()).toBeFalse();
        });

        it('should correctly identify if the current question is Qcm', () => {
            service.question = { text: 'test', type: QuestionType.MULTIPLE_CHOICE, choices: [], _id: '1', points: 10 };
            expect(service.isQcm()).toBeTrue();
        });

        it('should correctly identify if the current question is not Qcm', () => {
            service.question = { text: 'test', type: QuestionType.LONG_ANSWER, _id: '1', points: 10 };
            expect(service.isQcm()).toBeFalse();
        });
    });

    describe('asQcm', () => {
        it('should return the question if it is a Qcm type', () => {
            spyOn(service, 'isQcm').and.returnValue(true);
            expect(service.asQcm()).toBe(service.question as Qcm);
        });

        it('should return undefined if the current question is not Qcm', () => {
            spyOn(service, 'isQcm').and.returnValue(false);
            expect(service.asQcm()).toBeUndefined();
        });
    });

    describe('resetStatsOnNewQuestion', () => {
        it('should reset the values correctly', () => {
            service.question = { text: 'test', type: QuestionType.MULTIPLE_CHOICE, choices: [], _id: '1', points: 10 };
            service.questionResult = 100;
            service.bonus = true;
            service.selectedChoiceIndexes = [1];
            service.isLocked = true;

            service.resetStatsOnNewQuestion();

            expect(service.questionResult).toEqual(0);
            expect(service.bonus).toBeFalse();
            expect(service.selectedChoiceIndexes).toEqual([]);
            expect(service.isLocked).toBeFalse();
        });
    });

    describe('resetGame', () => {
        it('should reset the game correctly', () => {
            spyOn(service, 'resetStatsOnNewQuestion');

            service['time'] = 100;
            service.playerScore = 100;
            service['isOrganizer'] = true;
            service.isTestingMode = true;
            service.isLastQuestion = true;
            service['isRoomLocked'] = true;
            playersServiceSpy.isGameStarted = true;
            service.rank = 1;
            service['roomId'] = '1234';

            service.resetGame();

            expect(service['time']).toEqual(0);
            expect(service.playerScore).toEqual(0);
            expect(service['isOrganizer']).toBeFalse();
            expect(service.isTestingMode).toBeFalse();
            expect(service.isLastQuestion).toBeFalse();
            expect(service['isRoomLocked']).toBeFalse();
            expect(service['roomId']).toEqual('');
            expect(service.rank).toEqual(0);
            expect(playersServiceSpy.isGameStarted).toBeFalse();
            expect(service.resetStatsOnNewQuestion).toHaveBeenCalled();
            expect(chatServiceSpy.resetChats).toHaveBeenCalled();
            expect(audioServiceSpy.pauseAudio).toHaveBeenCalled();
        });
    });

    describe('hasEnoughSelectedChoices', () => {
        it('should return true if selected choices greater than 0', () => {
            service.selectedChoiceIndexes = [1];
            expect(service.hasEnoughSelectedChoices()).toBeTrue();
        });

        it('should return false if selected choices are smaller or equal than 0', () => {
            service.selectedChoiceIndexes = [];
            expect(service.hasEnoughSelectedChoices()).toBeFalse();
        });
    });

    describe('hasValidLongAnswer', () => {
        it('should return true if long answer is not empty', () => {
            service.longAnswer = 'test';
            expect(service.hasValidLongAnswer()).toBeTrue();
        });

        it('should return false if long answer is empty', () => {
            service.longAnswer = '';
            expect(service.hasValidLongAnswer()).toBeFalse();
        });

        it('should return false if long answer is only spaces', () => {
            service.longAnswer = '   ';
            expect(service.hasValidLongAnswer()).toBeFalse();
        });
    });

    describe('handleJoinGame', () => {
        it('should set the roomId value correctly', () => {
            const ROOM_ID = '1234';
            service.handleJoinGame(ROOM_ID);
            expect(service['roomId']).toEqual(ROOM_ID);
        });
    });

    describe('handleLeaveGame', () => {
        it('should navigate to game creation if testing', () => {
            spyOn(service, 'resetGame');
            spyOn(service, 'getGameState').and.returnValue(GameState.QuizResults);
            spyOn(service, 'getIsOrganizer').and.returnValue(false);
            service['playersService'].playerList = ['a'] as any;

            service.isTestingMode = true;

            service.handleLeaveGame();

            expect(service.resetGame).toHaveBeenCalled();
        });

        it('should navigate to home if not testing', () => {
            spyOn(service, 'resetGame');
            spyOn(service, 'getGameState').and.returnValue(GameState.QuizResults);
            spyOn(service, 'getIsOrganizer').and.returnValue(false);
            service['playersService'].playerList = ['a'] as any;
            service.isTestingMode = false;

            service.handleLeaveGame();

            expect(service.resetGame).toHaveBeenCalled();
        });
    });

    describe('forceQuit', () => {
        it('should navigate to home if not in testing mode', () => {
            routerSpy.navigate.and.resolveTo(true);
            service.isTestingMode = false;
            service.forceQuit();
            expect(routerSpy.navigate).toHaveBeenCalledWith([AppRoutes.Home]);
        });

        it('should navigate to game creation if in testing mode', () => {
            routerSpy.navigate.and.resolveTo(true);
            service.isTestingMode = true;
            service.forceQuit();
            expect(routerSpy.navigate).toHaveBeenCalledWith([AppRoutes.GameCreation]);
        });
    });

    describe('openConfirmationDialog', () => {
        it('should open the dialog correctly if organizer', () => {
            service['isOrganizer'] = true;
            spyOn(service['dialog'], 'open');
            service.openConfirmationDialog();
            expect(service['dialog'].open).toHaveBeenCalledWith(ConfirmationModalComponent, {
                panelClass: 'mat-dialog',
                enterAnimationDuration: 0,
                exitAnimationDuration: 0,
                data: { title: jasmine.any(String), message: jasmine.any(String) },
            });
        });

        it('should open the dialog correctly if not organizer', () => {
            service['isOrganizer'] = false;
            spyOn(service['dialog'], 'open');
            service.openConfirmationDialog();
            expect(service['dialog'].open).toHaveBeenCalledWith(ConfirmationModalComponent, {
                panelClass: 'mat-dialog',
                enterAnimationDuration: 0,
                exitAnimationDuration: 0,
                data: { title: jasmine.any(String), message: jasmine.any(String) },
            });
        });
    });

    describe('canExitWithoutConfirmation', () => {
        it('should return true if in waiting room and not organizer', () => {
            service['isOrganizer'] = false;
            playersServiceSpy.playerList = ['a'] as any;
            service.isRandomMode = false;
            service.isTestingMode = false;
            service['assertLeaveGame'] = false;
            service['gameState'] = GameState.WaitingRoom;
            expect(service.canExitWithoutConfirmation()).toBeTrue();
        });

        it('should return true if in waiting room and in random mode as organizer', () => {
            service['isOrganizer'] = true;
            playersServiceSpy.playerList = ['a'] as any;
            service.isRandomMode = true;
            service.isTestingMode = false;
            service['assertLeaveGame'] = false;
            service['gameState'] = GameState.WaitingRoom;
            expect(service.canExitWithoutConfirmation()).toBeTrue();
        });

        it('should return true if playerList is empty', () => {
            service['isOrganizer'] = false;
            playersServiceSpy.playerList = [];
            service.isRandomMode = false;
            service.isTestingMode = false;
            service['assertLeaveGame'] = false;
            service['gameState'] = GameState.Answering;
            expect(service.canExitWithoutConfirmation()).toBeTrue();
        });

        it('should return true if is testing mode', () => {
            service['isOrganizer'] = false;
            playersServiceSpy.playerList = ['a'] as any;
            service.isRandomMode = false;
            service.isTestingMode = true;
            service['assertLeaveGame'] = false;
            service['gameState'] = GameState.Answering;
            expect(service.canExitWithoutConfirmation()).toBeTrue();
        });

        it('should return true if assertLeaveGame is true', () => {
            service['isOrganizer'] = false;
            playersServiceSpy.playerList = ['a'] as any;
            service.isRandomMode = false;
            service.isTestingMode = false;
            service['assertLeaveGame'] = true;
            service['gameState'] = GameState.Answering;
            expect(service.canExitWithoutConfirmation()).toBeTrue();
        });

        it('should return true if game state is QuizResults', () => {
            service['isOrganizer'] = false;
            playersServiceSpy.playerList = ['a'] as any;
            service.isRandomMode = false;
            service.isTestingMode = false;
            service['assertLeaveGame'] = false;
            service['gameState'] = GameState.QuizResults;
            expect(service.canExitWithoutConfirmation()).toBeTrue();
        });

        it('should return false if none of the other conditions are met', () => {
            service['isOrganizer'] = false;
            playersServiceSpy.playerList = ['a'] as any;
            service.isRandomMode = false;
            service.isTestingMode = false;
            service['assertLeaveGame'] = false;
            service['gameState'] = GameState.Answering;
            expect(service.canExitWithoutConfirmation()).toBeFalse();
        });
    });

    describe('canDeactivate', () => {
        it('should return true if canExitWithoutConfirmation returns true', () => {
            spyOn(service, 'canExitWithoutConfirmation').and.returnValue(true);
            const handleLeaveGameSpy = spyOn(service, 'handleLeaveGame');

            expect(service.canDeactivate()).toBeTrue();
            expect(handleLeaveGameSpy).toHaveBeenCalled();
        });

        it('should return dialog response if canExitWithoutConfirmation returns false', () => {
            const observable = of(true);
            spyOn(service, 'canExitWithoutConfirmation').and.returnValue(false);
            spyOn(service, 'openConfirmationDialog').and.returnValue({ afterClosed: () => observable } as any);
            expect(service.canDeactivate()).toEqual(observable);
        });
    });

    describe('navigateExit', () => {
        it('should navigate to the correct route if in testing mode', () => {
            service.isTestingMode = true;
            routerSpy.navigate.and.resolveTo(true);
            service.navigateExit();
            expect(routerSpy.navigate).toHaveBeenCalledWith([AppRoutes.GameCreation]);
        });

        it('should navigate to the correct route if not in testing mode', () => {
            service.isTestingMode = false;
            routerSpy.navigate.and.resolveTo(true);
            service.navigateExit();
            expect(routerSpy.navigate).toHaveBeenCalledWith([AppRoutes.Home]);
        });
    });

    describe('leaveGame', () => {
        it('should send event leave game', () => {
            service.leaveGame();
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.LeaveGame);
        });
    });

    describe('lockChoices', () => {
        it('should set isLockedChoices to true immediately', () => {
            service.lockAnswer();
            expect(service.isLocked).toBeTrue();
        });

        it('should send event lock choices', () => {
            service.lockAnswer();
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.LockAnswer, {}, jasmine.any(Function));
            const callback = socketCommunicationServiceSpy.callbacks.get(WebSocketEvents.LockAnswer);
            (callback as any)(false);
            expect(service.isLocked).toBeFalse();
        });
    });

    describe('actionButton', () => {
        it('should send the ActionButton event', () => {
            service.actionButton();
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.ActionButton);
        });
    });

    describe('onChoiceSelect', () => {
        it('should not send selected choices if choices are locked', () => {
            service.isLocked = true;
            service.onChoiceSelect(1);
            expect(socketCommunicationServiceSpy.send).not.toHaveBeenCalled();
        });

        it('should send updated selected choices if choices are not locked', () => {
            service.isLocked = false;
            service.onChoiceSelect(1);
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(
                WebSocketEvents.ChangeSelectedChoices,
                {
                    selectedChoiceIndexes: [1],
                },
                jasmine.any(Function),
            );
            expect(socketCommunicationServiceSpy.callbacks.get(WebSocketEvents.ChangeSelectedChoices)).toBeDefined();
            const callback = socketCommunicationServiceSpy.callbacks.get(WebSocketEvents.ChangeSelectedChoices);

            expect((callback as (arg0: any) => any)({ selectedChoiceIndexes: [1] }));
            expect(service.selectedChoiceIndexes).toEqual([1]);
        });
    });

    describe('onLongAnswerChange', () => {
        it('should send updated answer if not locked', () => {
            service.isLocked = false;
            service.onLongAnswerChange('test');
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.ChangeLongAnswer, {
                longAnswer: 'test',
            });
            expect(service.longAnswer).toEqual('test');
        });

        it('should not send updated answer if locked', () => {
            service.isLocked = true;
            service.onLongAnswerChange('test');
            expect(socketCommunicationServiceSpy.send).not.toHaveBeenCalled();
        });
    });

    describe('onLockRoom', () => {
        it('should toggle isRoomLocked and send the updated state', () => {
            service['isRoomLocked'] = true;
            service.onLockRoom();
            expect(service['isRoomLocked']).toBeFalse();
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.ChangeLockRoom, { locked: false });
        });
    });

    describe('pauseTime', () => {
        it('should send the PauseTime event', () => {
            service.isGamePaused = false;
            service.pauseTime();
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.GamePaused, { paused: false });
        });
    });

    describe('panicMode', () => {
        it('should send the PanicMode event', () => {
            service.panicMode();
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.StartPanic);
        });

        it('should not send the panic mode event if isPanicOn', () => {
            service.isPanicOn = true;
            service.panicMode();
            expect(socketCommunicationServiceSpy.send).not.toHaveBeenCalled();
        });
    });

    describe('getQuizTitle', () => {
        it('should return the quiz title correctly', () => {
            const QUIZ_TITLE = 'test';
            service['quizTitle'] = QUIZ_TITLE;
            expect(service.getQuizTitle()).toEqual(QUIZ_TITLE);
        });
    });

    describe('toggleChoiceSelect', () => {
        it('should add the choice if not already selected', () => {
            service.selectedChoiceIndexes = [1];
            service.toggleChoiceSelect(2);
            expect(service.selectedChoiceIndexes).toEqual([1, 2]);
        });

        it('should remove the choice if already selected', () => {
            service.selectedChoiceIndexes = [1, 2];
            service.toggleChoiceSelect(2);
            expect(service.selectedChoiceIndexes).toEqual([1]);
        });
    });

    describe('requestCreateGame', () => {
        it('should send the correct request and handle response', () => {
            service.requestCreateGame('quizId', true, false);

            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.CreateGame, {
                quizId: 'quizId',
                isTest: true,
                isRandom: false,
            });
        });
    });

    describe('onPanicButtonAvailable', () => {
        it('should set isPanicAvailable to true', () => {
            service.isPanicAvailable = false;

            service.onPanicButtonAvailable();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.PanicAvailable, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PanicAvailable)).toContain(jasmine.any(Function));
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PanicAvailable);
            (callbacks as ((arg: boolean) => void)[])[0](true);
            expect(service.isPanicAvailable).toBeTrue();
        });
    });

    describe('onStartPanicMode', () => {
        it('should set isPanicOn to true', () => {
            service.isPanicOn = false;
            service.isGamePaused = true;

            service.onStartPanicMode();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.PanicModeStarted, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PanicModeStarted)).toContain(jasmine.any(Function));
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PanicModeStarted);
            (callbacks as ((arg: boolean) => void)[])[0](true);
            expect(service.isPanicOn).toBeTrue();
            expect(audioServiceSpy.playAudio).not.toHaveBeenCalled();
        });

        it('should start audio if game is not paused', () => {
            spyOn(service, 'pauseTime');
            service.isPanicOn = false;
            service.isGamePaused = false;

            service.onStartPanicMode();

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PanicModeStarted);
            (callbacks as ((arg: boolean) => void)[])[0](true);
            expect(audioServiceSpy.playAudio).toHaveBeenCalled();
        });
    });

    describe('onPauseRequest', () => {
        it('should set isGamePaused to false and play audio if panic mode is on', () => {
            service.isGamePaused = true;
            service.isPanicOn = true;

            service.onPauseRequest();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.PauseRequest, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PauseRequest)).toContain(jasmine.any(Function));
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PauseRequest);
            (callbacks as ((arg: boolean) => void)[])[0](false);
            expect(service.isGamePaused).toBeFalse();
            expect(audioServiceSpy.playAudio).toHaveBeenCalled();
        });

        it('should set isGamePaused to true if panic mode is off', () => {
            service.isGamePaused = false;
            service.isPanicOn = false;

            service.onPauseRequest();

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PauseRequest);
            (callbacks as ((arg: boolean) => void)[])[0](true);
            expect(service.isGamePaused).toBeTrue();
            expect(audioServiceSpy.playAudio).not.toHaveBeenCalled();
        });

        it('should set isGamePaused to true and pause audio', () => {
            service.isGamePaused = false;
            service.isPanicOn = true;

            service.onPauseRequest();

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PauseRequest);
            (callbacks as ((arg: boolean) => void)[])[0](true);
            expect(service.isGamePaused).toBeTrue();
            expect(audioServiceSpy.pauseAudio).toHaveBeenCalled();
        });
    });

    describe('gradeQuestion', () => {
        it('should send the grade question request', () => {
            const grade = 0;
            service.gradeQuestion(grade);
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.GradingResponse, { grade });
        });
    });

    describe('onNewQuestion', () => {
        it('should register handler and update state on new question', () => {
            spyOn(service, 'resetStatsOnNewQuestion');
            const data: NewQuestionRes = jasmine.createSpyObj('NewQuestionRes', ['question', 'duration', 'isLastQuestion']);
            data.question = { text: 'test', type: QuestionType.MULTIPLE_CHOICE, choices: [], _id: '1', points: 10 };
            data.isLastQuestion = true;

            service.onNewQuestion();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.NewQuestion, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.NewQuestion)).toContain(jasmine.any(Function));
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.NewQuestion);
            (callbacks as ((arg: NewQuestionRes) => void)[])[0](data);
            expect(service.resetStatsOnNewQuestion).toHaveBeenCalled();
            expect(service['question']).toEqual(data.question);
            expect(service['isLastQuestion']).toEqual(data.isLastQuestion);
        });
    });

    describe('onQuestionAnswers', () => {
        it('should call nothing if question is not Qcm on receiving QuestionAnswers event', () => {
            service.question = mockQuiz.questions[0];
            expect(service.question.type).not.toEqual(QuestionType.MULTIPLE_CHOICE);
            const data: number[] = [];

            service.onQuestionAnswers();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.QuestionAnswers, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuestionAnswers)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuestionAnswers);
            (callbacks as ((arg: number[]) => void)[])[0](data);

            expect(data).toEqual([]);
        });

        it('should update the data with a call to the QuestionAnswers event', () => {
            service.question = mockQuiz.questions[1];
            expect(service.question.type).toEqual(QuestionType.MULTIPLE_CHOICE);
            const data: number[] = [1];

            service.onQuestionAnswers();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.QuestionAnswers, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuestionAnswers)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuestionAnswers);
            (callbacks as ((arg: number[]) => void)[])[0](data);

            expect((service.question as Qcm).choices).toEqual([
                Object({ text: 'Paris', isCorrect: false }),
                Object({ text: 'London', isCorrect: true }),
            ]);
        });
    });

    describe('onKickPlayer', () => {
        it('should call handleLeaveGame on receiving KickPlayer event', () => {
            spyOn(service, 'forceQuit');
            routerSpy.navigate.and.resolveTo(true);
            const data: KickPlayerRes = jasmine.createSpyObj('KickPlayerRes', ['KickPlayerReason']);
            data.kickPlayerReason = KickPlayerReason.AllPlayersLeft;
            service.onKickPlayer();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.KickPlayer, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.KickPlayer)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.KickPlayer);
            (callbacks as ((arg: KickPlayerRes) => void)[])[0](data);
            expect(service.forceQuit).toHaveBeenCalled();
        });

        it("should display a notification with the correct message for 'AllPlayersLeft' reason", () => {
            spyOn(service, 'forceQuit');
            routerSpy.navigate.and.resolveTo(true);
            const data: KickPlayerRes = jasmine.createSpyObj('KickPlayerRes', ['KickPlayerReason']);
            data.kickPlayerReason = KickPlayerReason.AllPlayersLeft;
            service.onKickPlayer();
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.KickPlayer);
            (callbacks as ((arg: KickPlayerRes) => void)[])[0](data);
            expect(notificationServiceSpy.showBanner).toHaveBeenCalledWith(
                jasmine.objectContaining({ message: 'Tous les joueurs ont quitté la partie', type: NotificationType.Info }),
            );
        });

        it("should display a notification with the correct message for 'GameEnded' reason", () => {
            spyOn(service, 'forceQuit');
            routerSpy.navigate.and.resolveTo(true);
            const data: KickPlayerRes = jasmine.createSpyObj('KickPlayerRes', ['KickPlayerReason']);
            data.kickPlayerReason = KickPlayerReason.GameEnded;
            service.onKickPlayer();
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.KickPlayer);
            (callbacks as ((arg: KickPlayerRes) => void)[])[0](data);
            expect(notificationServiceSpy.showBanner).toHaveBeenCalledWith(
                jasmine.objectContaining({ message: 'La partie est terminée', type: NotificationType.Info }),
            );
        });

        it("should display a notification with the correct message for 'OrganizerLeft' reason", () => {
            spyOn(service, 'forceQuit');
            routerSpy.navigate.and.resolveTo(true);
            const data: KickPlayerRes = jasmine.createSpyObj('KickPlayerRes', ['KickPlayerReason']);
            data.kickPlayerReason = KickPlayerReason.OrganizerLeft;
            service.onKickPlayer();
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.KickPlayer);
            (callbacks as ((arg: KickPlayerRes) => void)[])[0](data);
            expect(notificationServiceSpy.showBanner).toHaveBeenCalledWith(
                jasmine.objectContaining({ message: "L'organisateur a quitté la partie", type: NotificationType.Info }),
            );
        });

        it("should display a notification with the correct message for 'PlayerBanned' reason", () => {
            spyOn(service, 'forceQuit');
            routerSpy.navigate.and.resolveTo(true);
            const data: KickPlayerRes = jasmine.createSpyObj('KickPlayerRes', ['KickPlayerReason']);
            data.kickPlayerReason = KickPlayerReason.PlayerBanned;
            service.onKickPlayer();
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.KickPlayer);
            (callbacks as ((arg: KickPlayerRes) => void)[])[0](data);
            expect(notificationServiceSpy.showBanner).toHaveBeenCalledWith(
                jasmine.objectContaining({ message: 'Vous avez été banni de la partie', type: NotificationType.Info }),
            );
        });
    });

    describe('onJoinGame', () => {
        it('should update service state on receiving JoinGame event', () => {
            spyOn(service, 'resetStatsOnNewQuestion');
            const data = jasmine.createSpyObj('JoinGameRes', ['playerName', 'isTestingMode', 'isOrganizer', 'gameState']);
            service.onJoinGame();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.JoinGame, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.JoinGame)).toContain(jasmine.any(Function));
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.JoinGame);
            (callbacks as ((arg: JoinGameRes) => void)[])[0](data);
            expect(service.resetStatsOnNewQuestion).toHaveBeenCalled();
            expect(service['quizTitle']).toEqual(data.quizTitle);
            expect(service['playerName']).toEqual(data.playerName);
            expect(service['roomId']).toEqual(data.roomId);
            expect(service['isTestingMode']).toEqual(data.isTestingMode);
            expect(service['isOrganizer']).toEqual(data.isOrganizer);
            expect(service['gameState']).toEqual(data.gameState);
            expect(routerSpy.navigate).toHaveBeenCalledWith([AppRoutes.Play]);
        });
    });

    describe('onGameStateUpdate', () => {
        it('should update gameState when receiving a GameStateUpdate event', () => {
            spyOn(service, 'checkIfGameStarted');
            const data = GameState.Answering;
            service.onGameStateUpdate();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.GameStateUpdate, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.GameStateUpdate)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.GameStateUpdate);
            (callbacks as ((arg: GameState) => void)[])[0](data);
            expect(service['gameState']).toEqual(data);
            expect(service.checkIfGameStarted).toHaveBeenCalled();
        });
    });

    describe('onStartTimer', () => {
        it('should update duration when receiving a StartTimer event', () => {
            service.onStartTimer();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.StartTimer, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.StartTimer)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.StartTimer);
            (callbacks as ((arg: number) => void)[])[0](3);
            expect(service['duration']).toEqual(3);
        });
    });

    describe('onTimeUpdate', () => {
        it('should update time when receiving a TimeUpdate event', () => {
            service.onTimeUpdate();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.TimeUpdate, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.TimeUpdate)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.TimeUpdate);
            (callbacks as ((arg: number) => void)[])[0](3);
            expect(service['time']).toEqual(3);
        });
    });

    describe('onQuestionResults', () => {
        it('should update service state on receiving QuestionResults event', () => {
            const data = jasmine.createSpyObj('QuestionResultsRes', ['questionResult', 'isBonus', 'rank']);
            data.questionResult = 100;
            data.isBonus = true;
            data.rank = 1;
            service.playerScore = 0;
            service.onQuestionResults();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.QuestionResults, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuestionResults)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuestionResults);
            (callbacks as ((arg: QuestionResultsRes) => void)[])[0](data);
            expect(service.questionResult).toEqual(data.questionResult);
            expect(service.bonus).toEqual(data.isBonus);
            expect(service.playerScore).toEqual(data.questionResult);
            expect(service.isLocked).toBeTrue();
            expect(service.rank).toEqual(data.rank);
        });
    });

    describe('onGradingRequest', () => {
        it('should update service state on receiving GradingRequest event', () => {
            service.onGradingRequest();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.GradingRequest, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.GradingRequest)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.GradingRequest);
            const gradingRequest = { answer: 'a' } as any;
            (callbacks as ((arg: GradeQuestionReq) => void)[])[0](gradingRequest);
            expect(service['gradeQuestionRequest']).toEqual(gradingRequest);
        });
    });

    describe('onChangeOrganizerStatus', () => {
        it('should update service state on receiving ChangeOrganizerStatus event', () => {
            service.onChangeOrganizerStatus();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.ChangeOrganizerStatus, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.ChangeOrganizerStatus)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.ChangeOrganizerStatus);
            (callbacks as ((arg: ChangeOrganizerStatusRes) => void)[])[0]({ isOrganizer: true });
            expect(service['isOrganizer']).toBeTrue();
        });
    });
});
