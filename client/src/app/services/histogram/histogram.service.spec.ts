import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { SocketServiceMock } from '@app/mocks/socket.mock';
import { GameService } from '@app/services/game/game.service';
import { getMockQuiz } from '@app/services/import-export/import-export.mock';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { GameState } from '@common/enums/game-state.enum';
import { Qcm, QuestionType } from '@common/interfaces/question.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { QuizStatisticsHistoryRes } from '@common/websockets/quiz-statistics-history.dto';
import { TotalSelectedChoices } from '@common/websockets/total-result.dto';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HistogramService } from './histogram.service';

// any and magic numbers used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-magic-numbers */
describe('HistogramService', () => {
    let service: HistogramService;
    let socketCommunicationServiceSpy: SocketServiceMock;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        socketCommunicationServiceSpy = new SocketServiceMock();
        spyOn(socketCommunicationServiceSpy, 'send').and.callThrough();
        spyOn(socketCommunicationServiceSpy, 'on').and.callThrough();
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getChoices', 'isQcm', 'getGameState']);
        TestBed.configureTestingModule({
            imports: [NgApexchartsModule],
            providers: [
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: HttpClient, useValue: httpClientSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        });
        gameServiceSpy.question = {
            text: 'test',
            type: QuestionType.MULTIPLE_CHOICE,
            choices: [
                { text: 'Choice 1', isCorrect: false },
                { text: 'Choice 2', isCorrect: true },
                { text: 'Choice 3', isCorrect: false },
                { text: 'Choice 4', isCorrect: false },
            ],
            _id: '1',
            points: 10,
        };

        gameServiceSpy.getChoices.and.returnValue([
            { text: 'Choice 1', isCorrect: false },
            { text: 'Choice 2', isCorrect: true },
            { text: 'Choice 3', isCorrect: false },
            { text: 'Choice 4', isCorrect: false },
        ]);

        service = TestBed.inject(HistogramService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('resetHistogram', () => {
        it('should get the texts from getHistogramTexts', () => {
            spyOn(service, 'getHistogramTexts').and.returnValue(['test']);
            service.resetHistogram();
            expect(service.histogramTexts).toEqual(['test']);
        });
        it('should get the answers from getHistogramAnswers', () => {
            spyOn(service, 'getHistogramRightAnswers').and.returnValue([1, 2, 3, 4]);
            service.resetHistogram();
            expect(service.histogramRightAnswers).toEqual([1, 2, 3, 4]);
        });
    });

    describe('getHistogramTexts', () => {
        it('should return getQcmHistogramTexts if its a QCM', () => {
            spyOn(service, 'getQcmHistogramTexts').and.returnValue(['test']);
            gameServiceSpy.isQcm.and.returnValue(true);

            expect(service.getHistogramTexts()).toEqual(['test']);
        });

        it('should call getEditingQrlHistogramTooltipTexts if not a Qcm and gamestate is answering', () => {
            gameServiceSpy.isQcm.and.returnValue(false);
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            spyOn(service, 'getEditingQrlHistogramTexts').and.returnValue(['test edit']);
            expect(service.getHistogramTexts()).toEqual(['test edit']);
        });
        it('should call getQrlHistogramTooltipTexts if not a Qcm and gamestate is QuestionResults', () => {
            gameServiceSpy.isQcm.and.returnValue(false);
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);

            spyOn(service, 'getQrlHistogramTexts').and.returnValue(['test qrl']);
            expect(service.getHistogramTexts()).toEqual(['test qrl']);
        });
    });

    describe('getQcmHistogramTexts', () => {
        it('should return the QCM question choices text', () => {
            expect(service.getQcmHistogramTexts()).toEqual((gameServiceSpy.question as Qcm).choices.map((choice) => choice.text));
        });
    });
    describe('getEditingQrlHistogramTexts', () => {
        it('should return the QCM question choices text', () => {
            expect(service.getEditingQrlHistogramTexts()).toEqual(['Inactif', "En train d'écrire"]);
        });
    });
    describe('getQrlHistogramTexts', () => {
        it('should return the Qrl question result text', () => {
            expect(service.getQrlHistogramTexts()).toEqual(['0%', '50%', '100%']);
        });
    });

    describe('getHistogramRightAnswers', () => {
        it('should return the histogram right answers', () => {
            const rightAnswersIndexes = [1, 2, 3, 4];

            const getRightAnswersIndexesSpy = spyOn<any>(service, 'getRightAnswersIndexes');
            getRightAnswersIndexesSpy.and.returnValue(rightAnswersIndexes);

            expect(service.getHistogramRightAnswers()).toEqual(rightAnswersIndexes);
        });
    });

    describe('initializeSocketListener', () => {
        it('should call onQcmHistogramUpdate', () => {
            spyOn(service, 'onQcmHistogramUpdate');
            service.initializeSocketListeners();
            expect(service.onQcmHistogramUpdate).toHaveBeenCalled();
        });
        it('should call onEditingQrlHistogramUpdate', () => {
            spyOn(service, 'onEditingQrlHistogramUpdate');
            service.initializeSocketListeners();
            expect(service.onEditingQrlHistogramUpdate).toHaveBeenCalled();
        });
        it('should call onQrlGradingHistogramUpdate', () => {
            spyOn(service, 'onQrlGradingHistogramUpdate');
            service.initializeSocketListeners();
            expect(service.onQrlGradingHistogramUpdate).toHaveBeenCalled();
        });
        it('should call onQuizStatisticsHistoryUpdate', () => {
            spyOn(service, 'onQuizStatisticsHistoryUpdate');
            service.initializeSocketListeners();
            expect(service.onQuizStatisticsHistoryUpdate).toHaveBeenCalled();
        });
    });

    describe('onQcmHistogramUpdate', () => {
        it('should register handler and update histogram stats on event', () => {
            spyOn(service, 'onUpdate');
            service.onQcmHistogramUpdate();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.TotalSelectedChoices, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.TotalSelectedChoices)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.TotalSelectedChoices);
            (callbacks as ((arg: [1, 2, 3, 4]) => void)[])[0]([1, 2, 3, 4]);
            expect(service.histogramValues).toEqual([1, 2, 3, 4]);
            expect(service.onUpdate).toHaveBeenCalled();
        });
    });

    describe('onEditingQrlHistogramUpdate', () => {
        it('should register handler and update histogram stats on event', () => {
            spyOn(service, 'onUpdate');
            service.onEditingQrlHistogramUpdate();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.TotalisEditingLongAnswer, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.TotalisEditingLongAnswer)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.TotalisEditingLongAnswer);
            (callbacks as ((arg: [10, 5]) => void)[])[0]([10, 5]);
            expect(service.histogramValues.length).toEqual(2);
            expect(service.onUpdate).toHaveBeenCalled();
        });
    });

    describe('onQrlGradingHistogramUpdate', () => {
        it('should register handler and update histogram stats on event', () => {
            spyOn(service, 'onUpdate');
            service.onQrlGradingHistogramUpdate();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.TotalGrades, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.TotalGrades)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.TotalGrades);
            (callbacks as ((arg: [10, 5, 1]) => void)[])[0]([10, 5, 1]);
            expect(service.histogramValues.length).toEqual(3);
            expect(service.onUpdate).toHaveBeenCalled();
        });
    });

    describe('onUpdate', () => {
        it('should call resetHistogram', () => {
            spyOn(service, 'resetHistogram');
            service.onUpdate();
            expect(service.resetHistogram).toHaveBeenCalled();
        });
        it('should call histogramvaluesSource next', () => {
            const histogramValuesSourceSpy = spyOn<any>(service['histogramValuesSource'], 'next');
            service.onUpdate();
            expect(histogramValuesSourceSpy).toHaveBeenCalled();
        });
    });

    describe('onQuizStatisticsHistoryUpdate', () => {
        it('should call resetQuiz history, add the question text and the selected choices', () => {
            const resetQuizHistorySpy = spyOn<any>(service, 'resetQuizHistory');
            const SELECTED_CHOICES: TotalSelectedChoices = {
                choice0: 10,
                choice1: 20,
                choice2: 30,
            };
            const data: QuizStatisticsHistoryRes = {
                totalSelectedChoicesHistory: [SELECTED_CHOICES],
                quiz: getMockQuiz(),
            };

            service.onQuizStatisticsHistoryUpdate();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.QuizStatisticsHistory, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuizStatisticsHistory)).toContain(jasmine.any(Function));
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuizStatisticsHistory);
            (callbacks as ((arg: QuizStatisticsHistoryRes) => void)[])[0](data);

            expect(service.quizHistory.totalSelectedChoicesHistory).toEqual([[10, 20, 30]]);
            expect(service.quizHistory.questionHistory).toEqual(['What is the capital of France?', 'What is the capital of France?']);
            expect(service.quizHistory.histogramTextsHistory).toEqual([
                ['0%', '50%', '100%'],
                ['Paris', 'London'],
            ]);
            expect(resetQuizHistorySpy).toHaveBeenCalled();
        });
        it('should correctly process multiple choice questions', () => {
            spyOn<any>(service, 'getRightAnswersIndexes').and.returnValue([1, 2]);

            const data: QuizStatisticsHistoryRes = {
                totalSelectedChoicesHistory: [],
                quiz: getMockQuiz(),
            };

            service.onQuizStatisticsHistoryUpdate();
            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.QuizStatisticsHistory, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuizStatisticsHistory)).toContain(jasmine.any(Function));
            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.QuizStatisticsHistory);
            (callbacks as ((arg: QuizStatisticsHistoryRes) => void)[])[0](data);
            expect(service.quizHistory.histogramTextsHistory).toEqual([
                ['0%', '50%', '100%'],
                ['Paris', 'London'],
            ]);
            expect(service.quizHistory.rightAnswerHistory).toEqual([
                [1, 2],
                [1, 2],
            ]);
        });
    });

    describe('resetQuizHistory', () => {
        it('should reset all arrays of the quiz history', () => {
            service.quizHistory.totalSelectedChoicesHistory = [[1, 2, 3]];
            service.quizHistory.questionHistory = ['initial question'];
            service.quizHistory.histogramTextsHistory = [['1', '2']];

            service['resetQuizHistory']();

            expect(service.quizHistory.totalSelectedChoicesHistory).toEqual([]);
            expect(service.quizHistory.questionHistory).toEqual([]);
            expect(service.quizHistory.histogramTextsHistory).toEqual([]);
        });
    });

    describe('getRightAnswersIndexes', () => {
        it('should return right answer indexes', () => {
            const choicesAnswers = [true, false, false, true];

            service['getRightAnswersIndexes'](choicesAnswers);

            expect(service['getRightAnswersIndexes'](choicesAnswers)).toEqual([0, 3]);
        });
    });
});
