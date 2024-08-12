import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ChoiceComponent } from '@app/components/admin/choice/choice.component';
import { QuestionComponent } from '@app/components/admin/question/question.component';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { AppMaterialModule } from '@app/modules/material.module';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuestionValidatorService } from '@app/services/question-validator/question-validator.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { of } from 'rxjs';
import { QuizComponent } from './quiz.component';

// disabled max-lines because this is a test file
/* eslint-disable max-lines*/

describe('QuizComponent', () => {
    let component: QuizComponent;
    let fixture: ComponentFixture<QuizComponent>;
    let mockQuestionBankService: jasmine.SpyObj<QuestionBankService>;
    let mockQuizCommunicationService: jasmine.SpyObj<QuizCommunicationService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockQuizValidatorService: jasmine.SpyObj<QuizValidatorService>;
    let mockQuestionValidatorService: jasmine.SpyObj<QuestionValidatorService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        mockQuestionBankService = jasmine.createSpyObj('QuestionBankService', ['addQuestionToBank']);
        mockQuizCommunicationService = jasmine.createSpyObj('QuizCommunicationService', ['fetchQuizById', 'saveQuestion', 'saveQuiz', 'addQuiz']);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['showBanner']);
        mockQuizValidatorService = jasmine.createSpyObj('QuizValidatorService', {
            isValidQuiz: undefined,
            isTitleUnique: undefined,
            getIdenticalQuestionsIndex: [],
        });
        mockQuestionValidatorService = jasmine.createSpyObj('QuestionValidatorService', [
            'isValidQuestion',
            'hasAppropriateNumberChoices',
            'hasTrueAndFalseChoices',
            'getIdenticalQuestionsIndex',
        ]);
        mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);

        await TestBed.configureTestingModule({
            declarations: [QuizComponent, QuestionComponent, ChoiceComponent],
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule],
            providers: [
                { provide: QuestionBankService, useValue: mockQuestionBankService },
                { provide: QuizCommunicationService, useValue: mockQuizCommunicationService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: QuizValidatorService, useValue: mockQuizValidatorService },
                { provide: QuestionValidatorService, useValue: mockQuestionValidatorService },
                { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => 'mockQuizId' }) } },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuizComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('unloadNotification', () => {
        it("should set event.returnValue to 'You have unsaved changes. Are you sure you want to leave?' if data has changed", () => {
            const mockEvent = { returnValue: '1' };

            component.data.hasChanged = true;
            component.unloadNotification(mockEvent as BeforeUnloadEvent);

            expect(mockEvent.returnValue).toBe('You have unsaved changes. Are you sure you want to leave?');
        });

        it("should not set event.returnValue to 'You have unsaved changes. Are you sure you want to leave?' if data has not changed", () => {
            const mockEvent = { returnValue: '' };

            component.data.hasChanged = false;
            component.unloadNotification(mockEvent as BeforeUnloadEvent);

            expect(mockEvent.returnValue).toBe('');
        });
    });

    describe('ngOnInit', () => {
        it('should call reloadData with quizId from route', () => {
            spyOn(component, 'reloadData');
            const mockQuizId = 'mockQuizId';

            component.ngOnInit();

            expect(component.reloadData).toHaveBeenCalledWith(mockQuizId);
        });
    });

    describe('reloadData', () => {
        it('should reload data for existing quiz', () => {
            const mockQuizId = 'mockQuizId';
            const mockQuiz: Quiz = {
                _id: mockQuizId,
                title: 'Quiz 1',
                description: 'Quiz 1',
                duration: 30,
                lastModification: new Date(),
                visible: true,
                questions: [],
            };
            mockQuizCommunicationService.fetchQuizById.and.returnValue(of(mockQuiz));

            component.reloadData(mockQuizId);

            expect(mockQuizCommunicationService.fetchQuizById).toHaveBeenCalledWith(mockQuizId);
            expect(component.data).toEqual(mockQuiz);
        });

        it('should reload data for new quiz', () => {
            const mockNewQuizId = 'new';
            const mockEmptyQuiz: Quiz = {
                _id: mockNewQuizId,
                title: 'Quiz 1',
                description: 'Quiz 1',
                duration: 30,
                lastModification: new Date(),
                visible: true,
                questions: [],
            };

            component.reloadData(mockNewQuizId);

            expect(component.data).not.toEqual(mockEmptyQuiz);
            expect(component.isInNewQuiz).toBe(true);
            expect(mockQuestionBankService.currentQuiz).not.toEqual(mockEmptyQuiz);
        });

        it('should redirect to home if quiz does not exist', () => {
            const mockQuizId = 'mockQuizId';
            mockQuizCommunicationService.fetchQuizById.and.returnValue(of(undefined as unknown as Quiz));

            component.reloadData(mockQuizId);

            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(AppRoutes.Home);
        });

        it("should get empty quiz if quizId is 'new'", () => {
            const mockNewQuizId = 'new';
            const mockEmptyQuiz: Quiz = {
                _id: '',
                title: '',
                description: '',
                questions: [
                    {
                        _id: '',
                        text: '',
                        points: 100,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [
                            { text: '', isCorrect: true },
                            { text: '', isCorrect: false },
                        ],
                    },
                ],
                visible: false,
                duration: 10,
                lastModification: new Date(),
            };

            component.reloadData(mockNewQuizId);

            expect({ ...component.data, lastModification: undefined }).toEqual({ ...mockEmptyQuiz, lastModification: undefined });
            expect(component.isInNewQuiz).toBe(true);
            expect({ ...mockQuestionBankService.currentQuiz, lastModification: undefined }).toEqual({
                ...mockEmptyQuiz,
                lastModification: undefined,
            });
        });
    });

    describe('addQuestion', () => {
        it('should add question to quiz', () => {
            const mockQuestion: Question = {
                text: 'test',
                _id: '1',
                type: QuestionType.MULTIPLE_CHOICE,
                points: 1,
                choices: [{ text: 'test', isCorrect: true }],
            };

            component.addQuestion(mockQuestion);

            expect(component.data.questions).toContain(mockQuestion);
        });

        it('should add empty question to quiz if no question is provided', () => {
            const mockEmptyQuestion: Question = {
                _id: '',
                text: '',
                points: 100,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [
                    { text: '', isCorrect: true },
                    { text: '', isCorrect: false },
                ],
            };

            component.addQuestion();

            expect(component.data.questions).toContain(mockEmptyQuestion);
        });
    });

    describe('openQuestionBank', () => {
        it('should open question bank', () => {
            spyOn(component.openDrawerSignal, 'emit');
            component.openQuestionBank();
            expect(component.openDrawerSignal.emit).toHaveBeenCalled();
        });
    });

    describe('removeQuestion', () => {
        it('should remove question from quiz', () => {
            const mockQuestionIndexToRemove = 0;
            const mockQuestionArray = [
                { text: 'test', _id: '1', type: QuestionType.MULTIPLE_CHOICE, points: 1, choices: [{ text: 'test', isCorrect: true }] },
            ];
            component.data.questions = [
                { text: 'test', _id: '1', type: QuestionType.MULTIPLE_CHOICE, points: 1, choices: [{ text: 'test', isCorrect: true }] },
            ];

            component.removeQuestion(mockQuestionIndexToRemove);

            expect(component.data.questions.length).toBe(mockQuestionArray.length - 1);
            expect(component.data.questions).not.toContain(mockQuestionArray[mockQuestionIndexToRemove]);
        });
    });

    describe('drop', () => {
        it('should drop question within quiz', () => {
            const mockQuestionArray = [
                { text: 'test', _id: '1', type: QuestionType.MULTIPLE_CHOICE, points: 1, choices: [{ text: 'test', isCorrect: true }] },
                { text: 'test', _id: '2', type: QuestionType.MULTIPLE_CHOICE, points: 1, choices: [{ text: 'test', isCorrect: true }] },
            ];
            component.data.questions = [
                { text: 'test', _id: '1', type: QuestionType.MULTIPLE_CHOICE, points: 1, choices: [{ text: 'test', isCorrect: true }] },
                { text: 'test', _id: '2', type: QuestionType.MULTIPLE_CHOICE, points: 1, choices: [{ text: 'test', isCorrect: true }] },
            ];
            const mockPreviousIndex = 0;
            const mockCurrentIndex = 1;

            // disabled no-any because this makes the test more concise
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            component.drop({ previousIndex: mockPreviousIndex, currentIndex: mockCurrentIndex } as any);

            expect(component.data.questions[0]).toEqual(mockQuestionArray[1]);
            expect(component.data.questions[1]).toEqual(mockQuestionArray[0]);
        });
    });

    describe('onInputChange', () => {
        it('should set hasChanged to true', () => {
            component.data.hasChanged = false;
            component.onInputChange();
            expect(component.data.hasChanged).toBe(true);
        });
    });

    describe('getSaveDisabledMessage', () => {
        it('should return message if no changes have been made', () => {
            component.data.hasChanged = false;

            const result = component.getSaveDisabledMessage();

            expect(result).toBe('Aucune modification apportée');
        });

        it('should return message if quiz is invalid', () => {
            component.data.hasChanged = true;
            spyOn(component, 'isValidQuiz').and.returnValue(false);
            const result = component.getSaveDisabledMessage();

            expect(result).toBe('Le quiz est invalide');
        });

        it('should return message if quiz contains indentical questions', () => {
            component.data.hasChanged = true;
            component.identicalQuestionsIndex.length = 1;
            const result = component.getSaveDisabledMessage();
            expect(result).toBe('Le quiz contient des questions identiques');
        });

        it('should return empty string if quiz is valid and has changed', () => {
            component.data.hasChanged = true;
            spyOn(component, 'isValidQuiz').and.returnValue(true);
            const result = component.getSaveDisabledMessage();

            expect(result).toBe('');
        });
    });

    describe('save', () => {
        it('should save quiz', fakeAsync(() => {
            const mockNewQuiz: Quiz = {
                _id: '',
                title: 'Quiz 1',
                description: 'Quiz 1',
                duration: 30,
                lastModification: new Date(),
                visible: true,
                questions: [],
            };
            component.data = mockNewQuiz;
            spyOn(component, 'isValidQuiz').and.returnValue(true);
            mockQuizValidatorService.isTitleUnique.and.returnValue(Promise.resolve(true));
            mockQuizCommunicationService.addQuiz.and.returnValue(of(mockNewQuiz));
            mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));
            spyOn(component, 'reloadData').and.returnValue();

            component.save();
            tick();

            expect(mockQuizCommunicationService.addQuiz).toHaveBeenCalledWith(mockNewQuiz);
            expect(mockNotificationService.showBanner).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith([AppRoutes.Admin]);
            expect(component.data).toBe(mockNewQuiz);
        }));

        it('should handle save when quiz title is not unique', fakeAsync(() => {
            const mockNewQuiz: Quiz = {
                _id: '',
                title: 'Quiz 1',
                description: 'Quiz 1',
                duration: 30,
                lastModification: new Date(),
                visible: true,
                questions: [],
            };
            component.data = mockNewQuiz;
            spyOn(component, 'isValidQuiz').and.returnValue(true);
            mockQuizValidatorService.isTitleUnique.and.returnValue(Promise.resolve(false));
            mockQuizCommunicationService.saveQuiz.and.returnValue(of(mockNewQuiz));

            component.save();
            tick();

            expect(mockNotificationService.showBanner).toHaveBeenCalled();
            expect(component.data.lastModification).toBe(mockNewQuiz.lastModification);
        }));

        it('should do nothing if quiz is invalid', fakeAsync(() => {
            spyOn(component, 'isValidQuiz').and.returnValue(false);
            expect(mockQuizValidatorService.isTitleUnique).not.toHaveBeenCalled();
        }));

        it("should save quiz if quiz has an id and it's valid", fakeAsync(() => {
            const mockNewQuiz: Quiz = {
                _id: '1',
                title: 'Quiz 1',
                description: 'Quiz 1',
                duration: 30,
                lastModification: new Date(),
                visible: true,
                questions: [],
            };
            component.data = mockNewQuiz;
            spyOn(component, 'isValidQuiz').and.returnValue(true);
            mockQuizValidatorService.isTitleUnique.and.returnValue(Promise.resolve(true));
            mockQuizCommunicationService.saveQuiz.and.returnValue(of(mockNewQuiz));
            spyOn(component, 'quizHasSaved').and.callThrough();

            component.save();
            tick();

            expect(component.quizHasSaved).toHaveBeenCalled();
            expect(mockQuizCommunicationService.saveQuiz).toHaveBeenCalledWith(mockNewQuiz);
            expect(mockNotificationService.showBanner).toHaveBeenCalled();
            expect(component.data).toEqual(mockNewQuiz);
        }));
    });

    describe('quizHasSaved', () => {
        it('should set hasChanged to false and hasChanged to false for each question', () => {
            component.data = {
                _id: '1',
                title: 'Quiz 1',
                description: 'Quiz 1',
                duration: 30,
                lastModification: new Date(),
                visible: true,
                questions: [],
                hasChanged: true,
            };
            component.data.questions = [
                {
                    _id: '1',
                    text: 'test',
                    points: 1,
                    type: QuestionType.MULTIPLE_CHOICE,
                    choices: [{ text: 'test', isCorrect: true }],
                    hasChanged: true,
                },
            ];

            component.quizHasSaved();

            expect(component.data.hasChanged).toBe(false);
            component.data.questions.forEach((q) => {
                expect(q.hasChanged).toBe(false);
            });
        });
    });

    describe('isValidQuiz', () => {
        it('should return true if quiz is valid', () => {
            mockQuizValidatorService.getIdenticalQuestionsIndex.and.returnValue([]);
            mockQuizValidatorService.isValidQuiz.and.returnValue(true);
            expect(component.isValidQuiz()).toBeTrue();
        });

        it('should return false if quiz is invalid', () => {
            mockQuizValidatorService.isValidQuiz.and.returnValue(false);
            expect(component.isValidQuiz()).toBeFalse();
        });

        it('should return false if quiz has identical questions', () => {
            mockQuizValidatorService.getIdenticalQuestionsIndex.and.returnValue([1]);
            expect(component.isValidQuiz()).toBeFalse();
        });
    });
});
