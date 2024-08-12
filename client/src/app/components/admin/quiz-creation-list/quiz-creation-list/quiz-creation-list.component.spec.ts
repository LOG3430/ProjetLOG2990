import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
// import needs to be longer than 150 characters
// eslint-disable-next-line max-len
import { QuizCreationListElementComponent } from '@app/components/admin/quiz-creation-list/quiz-creation-list-element/quiz-creation-list-element.component';
import { getLongQuestionsMock } from '@app/mocks/mock-questions/mock-questions.mock';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { getLongMockQuiz, getMockQuizList } from '@app/services/import-export/import-export.mock';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { of, throwError } from 'rxjs';
import { QuizCreationListComponent } from './quiz-creation-list.component';
import SpyObj = jasmine.SpyObj;

describe('QuizCreationListComponent', () => {
    let component: QuizCreationListComponent;
    let fixture: ComponentFixture<QuizCreationListComponent>;
    let mockQuiz: Quiz;
    let mockList: Quiz[];
    let longMockQuestions: Question[];
    let routerSpy: SpyObj<Router>;
    let gameServiceSpy: SpyObj<GameService>;
    let notificationServiceSpy: SpyObj<NotificationService>;
    let quizCommunicationServiceSpy: SpyObj<QuizCommunicationService>;
    let questionBankServiceSpy: SpyObj<QuestionBankService>;

    beforeEach(() => {
        quizCommunicationServiceSpy = jasmine.createSpyObj('QuizCommunicationService', ['fetchAllQuizzes', 'fetchQuizById']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setCurrentQuiz', 'resetGame', 'setTestingMode', 'requestCreateGame']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showBanner']);
        questionBankServiceSpy = jasmine.createSpyObj('QuestionBankService', ['reloadData', 'getAllQcmQuestions']);
    });
    beforeEach(async () => {
        mockQuiz = getLongMockQuiz();
        mockList = getMockQuizList();
        longMockQuestions = getLongQuestionsMock();

        await TestBed.configureTestingModule({
            declarations: [QuizCreationListComponent, QuizCreationListElementComponent],
            imports: [AppMaterialModule],
            providers: [
                HttpClient,
                HttpHandler,
                { provide: QuizCommunicationService, useValue: quizCommunicationServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: QuestionBankService, useValue: questionBankServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(QuizCreationListComponent);
        component = fixture.componentInstance;
        quizCommunicationServiceSpy.fetchAllQuizzes.and.returnValue(of(mockList));
        questionBankServiceSpy.questions = longMockQuestions;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('selectQuiz', () => {
        it('should set selectedQuiz when selectQuiz is called', () => {
            component.selectQuiz(mockQuiz);
            expect(component.selectedQuiz).toEqual(mockQuiz);
        });

        it('should set selectedQuiz to undefined if the same quiz is selected again', () => {
            component.selectedQuiz = mockQuiz;

            component.selectQuiz(mockQuiz);

            expect(component.selectedQuiz).toBeUndefined();
        });
    });

    describe('initializeComponent', () => {
        it('should initialize component and fetch quizzes', () => {
            spyOn(component, 'filterVisibleQuizzes');

            component.initializeComponent();

            expect(quizCommunicationServiceSpy.fetchAllQuizzes).toHaveBeenCalled();
            expect(component.quizzes).toEqual(mockList);
            expect(component.isLoading).toBeFalse();
            expect(component.filterVisibleQuizzes).toHaveBeenCalled();
        });
    });

    describe('filterVisibleQuizzes', () => {
        it('should filter only visible quizzes', () => {
            component.quizzes = mockList;

            component.filterVisibleQuizzes();

            expect(component.visibleQuizzes.length).toBe(1);
        });
    });

    describe('showQuizFetchError', () => {
        it('should show error notification with message', () => {
            component.showQuizFetchError('Error message');
            expect(notificationServiceSpy.showBanner).toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Error message' }));
        });
    });

    describe('startQuiz', () => {
        it('should do nothing if no quiz is selected', () => {
            component.selectedQuiz = undefined;
            component.startQuiz(false);

            expect(gameServiceSpy.requestCreateGame).not.toHaveBeenCalled();
        });

        it('should request to create game if quiz is available', fakeAsync(() => {
            spyOn(component, 'isQuizAvailable').and.returnValue(Promise.resolve(true));
            component.selectedQuiz = mockList[0];

            component.startQuiz(false);
            flush();

            expect(gameServiceSpy.requestCreateGame).toHaveBeenCalledWith('0', false, false);
        }));

        it('should not request to create game if quiz is not available', fakeAsync(() => {
            spyOn(component, 'isQuizAvailable').and.returnValue(Promise.resolve(false));
            spyOn(component, 'showQuizFetchError');
            component.selectedQuiz = mockList[0];

            component.startQuiz(true);
            flush();

            expect(gameServiceSpy.requestCreateGame).not.toHaveBeenCalled();
            expect(component.showQuizFetchError).toHaveBeenCalledWith("Le quiz n'est plus disponible. Veuillez sélectionner un autre quiz");
        }));
    });

    describe('isQuizAvailable', () => {
        it('should return true if quiz is available and visible', async () => {
            quizCommunicationServiceSpy.fetchQuizById.and.returnValue(of(mockQuiz));

            await expectAsync(component.isQuizAvailable('0')).toBeResolvedTo(true);
        });

        it('should return false if quiz is not available', async () => {
            mockList[0].visible = false;
            quizCommunicationServiceSpy.fetchQuizById.and.returnValue(of(mockList[0]));
            await expectAsync(component.isQuizAvailable('0')).toBeResolvedTo(false);
        });

        it('should return false and show an error if quiz fetch fails', async () => {
            quizCommunicationServiceSpy.fetchQuizById.and.returnValue(throwError(() => new Error('Error')));
            spyOn(component, 'showQuizFetchError');
            spyOn(component, 'initializeComponent');

            await expectAsync(component.isQuizAvailable('0')).toBeResolvedTo(false);
            expect(component.showQuizFetchError).toHaveBeenCalledWith('Erreur lors de la récupération du quiz.');
            expect(component.initializeComponent).toHaveBeenCalled();
        });
    });

    describe('selectRandomQuiz', () => {
        it('should set isRandomQuizSelected to true', () => {
            component.isRandomQuizSelected = false;
            component.selectedQuiz = mockQuiz;

            component.selectRandomQuiz();

            expect(component.isRandomQuizSelected).toBeTrue();
            expect(component.selectedQuiz).toBeUndefined();
        });
    });

    describe('startRandomQuiz', () => {
        it('should not proceed if isRandomQuizSelected is false', fakeAsync(() => {
            questionBankServiceSpy.reloadData.calls.reset();
            component.isRandomQuizSelected = false;

            component.startRandomQuiz();
            flush();

            expect(questionBankServiceSpy.reloadData).not.toHaveBeenCalled();
        }));

        it('should request game creation if canStartRandomQuiz returns true', fakeAsync(() => {
            component.isRandomQuizSelected = true;
            spyOn(component, 'canStartRandomQuiz').and.resolveTo(true);

            component.startRandomQuiz();
            flush();

            expect(gameServiceSpy.requestCreateGame).toHaveBeenCalledWith('', false, true);
        }));

        it('should show error and reinitialize component if canStartRandomQuiz returns false', fakeAsync(() => {
            component.isRandomQuizSelected = true;
            spyOn(component, 'canStartRandomQuiz').and.resolveTo(false);
            spyOn(component, 'showQuizFetchError');
            spyOn(component, 'initializeComponent');

            component.startRandomQuiz();
            flush();

            expect(component.showQuizFetchError).toHaveBeenCalledWith("Le mode aléatoire n'est plus disponible. Veuillez sélectionner un autre quiz");
            expect(component.isRandomQuizSelected).toBeFalse();
            expect(component.initializeComponent).toHaveBeenCalled();
        }));
    });

    describe('canStartRandomQuiz', () => {
        it('should resolve to true is there is enough QCM questions', fakeAsync(() => {
            questionBankServiceSpy.getAllQcmQuestions.and.resolveTo(longMockQuestions);

            const result = component.canStartRandomQuiz();
            flush();

            expectAsync(result).toBeResolvedTo(true);
        }));

        it('should resolve to false is there is not enough QCM questions', fakeAsync(() => {
            questionBankServiceSpy.getAllQcmQuestions.and.resolveTo([{ id: '1' } as unknown as Question]);

            const result = component.canStartRandomQuiz();
            flush();

            expectAsync(result).toBeResolvedTo(false);
        }));
    });

    describe('getBankQuestionQcmLength', () => {
        it('should return number of QCM questions', () => {
            questionBankServiceSpy.questions = longMockQuestions;

            // for verifying length of Qcm questions
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(component.getBankQuestionQcmLength()).toEqual(8);
        });
    });

    describe('showRandomMode', () => {
        it('should return true if there is enough QCM questions to show element', () => {
            spyOn(component, 'getBankQuestionQcmLength').and.returnValue(longMockQuestions.length);

            expect(component.showRandomMode()).toBeTrue();
        });

        it('should return false if there is not enough QCM questions to show element', () => {
            spyOn(component, 'getBankQuestionQcmLength').and.returnValue([{ id: '1' } as unknown as Question].length);

            expect(component.showRandomMode()).toBeFalse();
        });
    });

    describe('isQcm', () => {
        it('should return true if question is QCM', () => {
            const question = longMockQuestions[0];
            expect(component.isQcm(question)).toBeTrue();
        });

        it('should return false if question is not QCM', () => {
            const question = { ...longMockQuestions[0], type: QuestionType.LONG_ANSWER, choices: undefined } as Question;
            expect(component.isQcm(question)).toBeFalse();
        });
    });
});
