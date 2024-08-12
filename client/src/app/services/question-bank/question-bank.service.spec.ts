import { HttpClient, HttpHandler } from '@angular/common/http';
import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { getQuestionsMock, mockQuestions } from '@app/mocks/mock-questions/mock-questions.mock';
import { getMockQuiz } from '@app/services/import-export/import-export.mock';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionCommunicationService } from '@app/services/question-communication/question-communication.service';
import { Qcm, QuestionType } from '@common/interfaces/question.dto';
import { of } from 'rxjs';
import { QuestionBankService } from './question-bank.service';
import SpyObj = jasmine.SpyObj;

// disabled no-any to make the tests more concise
/* eslint-disable  @typescript-eslint/no-explicit-any */

describe('QuestionBankService', () => {
    let service: QuestionBankService;
    let questionCommunicationSpy: SpyObj<QuestionCommunicationService>;
    let notificationServiceSpy: SpyObj<NotificationService>;
    let matDialogSpy: SpyObj<MatDialog>;

    beforeEach(() => {
        questionCommunicationSpy = jasmine.createSpyObj('QuestionCommunicationService', ['fetchAllQuestions', 'deleteQuestion', 'addQuestion']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showBanner']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                HttpClient,
                HttpHandler,
                { provide: QuestionCommunicationService, useValue: questionCommunicationSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
            ],
        });
        service = TestBed.inject(QuestionBankService);
        service.questions = getQuestionsMock();
        questionCommunicationSpy.fetchAllQuestions.and.returnValue(of(getQuestionsMock()));
        questionCommunicationSpy.deleteQuestion.and.returnValue(of({} as any));
        questionCommunicationSpy.addQuestion.and.returnValue(of({} as any));
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('reloadData', () => {
        it('should fetch all questions', () => {
            service.reloadData();
            expect(questionCommunicationSpy.fetchAllQuestions).toHaveBeenCalled();
            expect(service.questions).toEqual(mockQuestions);
        });

        it('should set isLoading to false', () => {
            service.questions[0].lastModification = new Date();
            service.questions[1].lastModification = new Date();
            service.reloadData();
            expect(service.isLoading).toBeFalse();
        });

        it("should work if questions don't have a last modification", () => {
            service.questions[0].lastModification = undefined;
            service.reloadData();
            expect(service.isLoading).toBeFalse();
        });
    });

    describe('getAllQcmQuestions', () => {
        it('should return all questions of type QCM', async () => {
            const questions = await service.getAllQcmQuestions();
            expect(questions).toEqual(mockQuestions.filter((question) => question.type === QuestionType.MULTIPLE_CHOICE));
        });
    });

    describe('addQuestionToQuiz', () => {
        it('should add question to currentQuiz', () => {
            service.currentQuiz = { questions: [] } as any;
            service.addQuestionToQuiz(mockQuestions[0]);
            expect(service.currentQuiz.questions).toContain(mockQuestions[0]);
        });

        it('should show success banner', fakeAsync(() => {
            service.currentQuiz = { questions: [] } as any;
            service.addQuestionToQuiz(mockQuestions[0]);
            flush();
            expect(notificationServiceSpy.showBanner).toHaveBeenCalled();
        }));
    });

    describe('haveQuestionsChanged', () => {
        it('should return true if at least one question has changed', () => {
            service.questions[0].hasChanged = true;
            expect(service.haveQuestionsChanged()).toBeTrue();
        });

        it('should return false if no question has changed', () => {
            expect(service.haveQuestionsChanged()).toBeFalse();
        });
    });

    describe('removeQuestionFromBankPrompt', () => {
        it('should open dialog', () => {
            spyOn(service, 'removeQuestionFromBank');
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            service.removeQuestionFromBankPrompt(0);
            expect(matDialogSpy.open).toHaveBeenCalled();
        });

        it('should call removeQuestionFromBank if dialog is confirmed', () => {
            spyOn(service, 'removeQuestionFromBank');
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            service.removeQuestionFromBankPrompt(0);
            expect(service.removeQuestionFromBank).toHaveBeenCalledWith(0);
        });

        it('should not call removeQuestionFromBank if dialog is not confirmed', () => {
            spyOn(service, 'removeQuestionFromBank');
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
            service.removeQuestionFromBankPrompt(0);
            expect(service.removeQuestionFromBank).not.toHaveBeenCalled();
        });
    });

    describe('removeQuestionFromBank', () => {
        it('should remove question from bank', () => {
            spyOn(service, 'reloadData');
            service.removeQuestionFromBank(0);
            expect(service.questions).not.toContain(mockQuestions[0]);
        });

        it('should show success banner', fakeAsync(() => {
            service.removeQuestionFromBank(0);
            flush();
            expect(notificationServiceSpy.showBanner).toHaveBeenCalled();
        }));

        it("should call questionCommunicationService's deleteQuestion", () => {
            service.removeQuestionFromBank(0);
            expect(questionCommunicationSpy.deleteQuestion).toHaveBeenCalledWith(mockQuestions[0]._id);
        });

        it('should call reloadData', fakeAsync(() => {
            spyOn(service, 'reloadData');
            service.removeQuestionFromBank(0);
            flush();
            expect(service.reloadData).toHaveBeenCalled();
        }));

        it("should not call questionCommunicationService's deleteQuestion if question has no id", () => {
            service.questions[0]._id = '';
            service.removeQuestionFromBank(0);
            expect(questionCommunicationSpy.deleteQuestion).not.toHaveBeenCalled();
        });
    });

    describe('addQuestionToBank', () => {
        it('should call reloadData', () => {
            spyOn(service, 'reloadData');
            service.addQuestionToBank(mockQuestions[0]);
            expect(service.reloadData).toHaveBeenCalled();
        });

        it('should show error banner if question is already in bank', fakeAsync(() => {
            spyOn(service, 'isQuestionInBank').and.returnValue(Promise.resolve(true));
            service.addQuestionToBank(mockQuestions[0]);
            flush();
            expect(notificationServiceSpy.showBanner).toHaveBeenCalled();
            expect(questionCommunicationSpy.addQuestion).not.toHaveBeenCalled();
        }));

        it('should call questionCommunicationService addQuestion', fakeAsync(() => {
            spyOn(service, 'isQuestionInBank').and.returnValue(Promise.resolve(false));
            service.addQuestionToBank(mockQuestions[0]);
            flush();
            expect(questionCommunicationSpy.addQuestion).toHaveBeenCalledWith(mockQuestions[0]);
        }));

        it('should show success banner', fakeAsync(() => {
            spyOn(service, 'isQuestionInBank').and.returnValue(Promise.resolve(false));
            service.addQuestionToBank(mockQuestions[0]);
            flush();
            expect(notificationServiceSpy.showBanner).toHaveBeenCalled();
        }));

        it('should add question to questions', fakeAsync(() => {
            spyOn(service, 'isQuestionInBank').and.returnValue(Promise.resolve(false));
            const initialLength = service.questions.length;
            service.addQuestionToBank(mockQuestions[0]);
            flush();
            expect(service.questions.length).toEqual(initialLength + 1);
        }));
    });

    describe('isQuestionInBank', () => {
        it('should return true if question is in bank', async () => {
            const question = mockQuestions[0];
            const result = await service.isQuestionInBank(question);
            expect(result).toBeTrue();
        });

        it('should return false if question is not in bank', async () => {
            const question = { ...mockQuestions[0], text: 'question 3' };
            const result = await service.isQuestionInBank(question);
            expect(result).toBeFalse();
        });
    });

    describe('deepCopy', () => {
        it('should return deep copy of question', () => {
            const question = mockQuestions[0];
            const deepCopy = service.deepCopy(question);
            expect(deepCopy).toEqual(question);
            expect(deepCopy).not.toBe(question);
        });
    });

    describe('createNewQuestion', () => {
        it('should add new question to questions', () => {
            const initialLength = service.questions.length;
            service.createNewQuestion();
            expect(service.questions.length).toEqual(initialLength + 1);
            expect(service.questions[initialLength]._id).toBe('');
            expect(service.questions[initialLength].text).toBe('');

            // disabled no-magic-numbers because this is a test file
            /* eslint-disable  @typescript-eslint/no-magic-numbers */
            expect(service.questions[initialLength].points).toBe(100);
            expect(service.questions[initialLength].type).toBe(QuestionType.MULTIPLE_CHOICE);
            expect((service.questions[initialLength] as Qcm).choices.length).toBe(2);
            expect((service.questions[initialLength] as Qcm).choices[0].text).toBe('');
            expect((service.questions[initialLength] as Qcm).choices[0].isCorrect).toBeTrue();
            expect((service.questions[initialLength] as Qcm).choices[1].text).toBe('');
            expect((service.questions[initialLength] as Qcm).choices[1].isCorrect).toBeFalse();
        });
    });

    describe('compareByDate', () => {
        it('should return 0 if there are no lastModification date for the questions ', () => {
            const mockQuestionOne = getMockQuiz().questions[0];
            const mockQuestionTwo = getMockQuiz().questions[1];

            expect(mockQuestionOne.lastModification).not.toBeDefined();
            expect(mockQuestionTwo.lastModification).not.toBeDefined();

            expect(service['compareByDate'](mockQuestionOne, mockQuestionTwo)).toEqual(0);
        });
        it('should return the difference in time between the last modification dates of the questions', () => {
            const mockQuestionOne = { ...getMockQuiz().questions[0], lastModification: new Date('2020-01-01') };
            const mockQuestionTwo = { ...getMockQuiz().questions[1], lastModification: new Date('2021-01-01') };
            const timeDifference = mockQuestionTwo.lastModification.getTime() - mockQuestionOne.lastModification.getTime();

            expect(service['compareByDate'](mockQuestionOne, mockQuestionTwo)).toEqual(timeDifference);
        });
    });
});
