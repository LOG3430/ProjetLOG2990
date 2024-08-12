import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChoiceComponent } from '@app/components/admin/choice/choice.component';
import { QuestionComponent } from '@app/components/admin/question/question.component';
import { SpinnerComponent } from '@app/components/spinner/spinner.component';
import { getQuestionsMock } from '@app/mocks/mock-questions/mock-questions.mock';
import { AppMaterialModule } from '@app/modules/material.module';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuestionCommunicationService } from '@app/services/question-communication/question-communication.service';
import { QuestionValidatorService } from '@app/services/question-validator/question-validator.service';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { of } from 'rxjs';
import { QuestionBankComponent } from './question-bank.component';
import SpyObj = jasmine.SpyObj;

describe('QuestionBankComponent', () => {
    let component: QuestionBankComponent;
    let fixture: ComponentFixture<QuestionBankComponent>;

    let questionValidatorMock: jasmine.SpyObj<QuestionValidatorService>;
    let questionCommunicationServiceMock: jasmine.SpyObj<QuestionCommunicationService>;
    let notificationServiceMock: jasmine.SpyObj<NotificationService>;

    let questionBankServiceSpy: SpyObj<QuestionBankService>;

    beforeEach(() => {
        questionBankServiceSpy = jasmine.createSpyObj('QuestionBankService', [
            'reloadData',
            'createNewQuestion',
            'removeQuestionFromBank',
            'removeQuestionFromBankPrompt',
        ]);
        questionValidatorMock = jasmine.createSpyObj('QuestionValidator', [
            'isValidQuestion',
            'hasAppropriateNumberChoices',
            'hasTrueAndFalseChoices',
        ]);
        questionCommunicationServiceMock = jasmine.createSpyObj('QuestionCommunicationService', ['saveQuestion', 'addQuestion']);
        notificationServiceMock = jasmine.createSpyObj('NotificationService', ['showBanner']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionBankComponent, QuestionComponent, ChoiceComponent, SpinnerComponent],
            imports: [AppMaterialModule, NoopAnimationsModule],
            providers: [
                HttpClient,
                HttpHandler,
                { provide: QuestionBankService, useValue: questionBankServiceSpy },
                { provide: NotificationService, useValue: notificationServiceMock },
                { provide: QuestionValidatorService, useValue: questionValidatorMock },
                { provide: QuestionCommunicationService, useValue: questionCommunicationServiceMock },
            ],
        });
        fixture = TestBed.createComponent(QuestionBankComponent);
        component = fixture.componentInstance;
        questionBankServiceSpy.questions = getQuestionsMock();

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should fetch all questions on component initialization', () => {
            component.ngOnInit();

            expect(questionBankServiceSpy.reloadData).toHaveBeenCalled();
            expect(component.getQuestions()[1]._id).toEqual('2');
        });
    });

    describe('addQuestion', () => {
        it('should add a question', () => {
            component.addQuestion();
            expect(questionBankServiceSpy.createNewQuestion).toHaveBeenCalled();
        });

        it('should scroll to the bottom of the page', () => {
            const scrollToSpy = spyOn(window, 'scrollTo');
            spyOn(component['changeDetector'], 'detectChanges');
            component.addQuestion();
            expect(component['changeDetector'].detectChanges).toHaveBeenCalled();
            expect(scrollToSpy).toHaveBeenCalledWith(0, document.body.scrollHeight);
        });
    });

    describe('removeQuestion', () => {
        it('should remove a question', () => {
            component.removeQuestion(0);
            expect(questionBankServiceSpy.removeQuestionFromBankPrompt).toHaveBeenCalledWith(0);
        });
    });

    describe('getQuestions', () => {
        it('should return questions', () => {
            expect(component.getQuestions()).toEqual(questionBankServiceSpy.questions);
        });
    });

    describe('getLoading', () => {
        it('should return loading status if true', () => {
            questionBankServiceSpy.isLoading = true;
            expect(component.getLoading()).toBe(true);
        });

        it('should return loading status if false', () => {
            questionBankServiceSpy.isLoading = false;
            expect(component.getLoading()).toBe(false);
        });
    });

    describe('saveQuestion', () => {
        it('should save existing question when valid', () => {
            const question: Question = {
                _id: '1',
                text: 'Question 1',
                points: 100,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [],
                lastModification: new Date(),
            };
            questionValidatorMock.isValidQuestion.and.returnValue(true);
            questionCommunicationServiceMock.saveQuestion.and.returnValue(of(question));

            component.saveQuestion(question);

            expect(questionValidatorMock.isValidQuestion).toHaveBeenCalledWith(question);
            expect(questionCommunicationServiceMock.saveQuestion).toHaveBeenCalledWith(question);
            expect(notificationServiceMock.showBanner).toHaveBeenCalled();
            expect(question.hasChanged).toBe(false);
        });

        it('should add new question when valid', () => {
            const question: Question = {
                _id: '',
                text: 'Question 1',
                points: 100,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [],
                lastModification: new Date(),
            };
            questionValidatorMock.isValidQuestion.and.returnValue(true);
            questionCommunicationServiceMock.addQuestion.and.returnValue(of(question));

            component.saveQuestion(question);

            expect(questionValidatorMock.isValidQuestion).toHaveBeenCalledWith(question);
            expect(questionCommunicationServiceMock.addQuestion).toHaveBeenCalledWith(question);
            expect(notificationServiceMock.showBanner).toHaveBeenCalled();
            expect(question.hasChanged).toBe(false);
        });
    });

    describe('toggleShowQcm', () => {
        it('should toggle showQcm when true', () => {
            component.showQcm = true;
            component.toggleShowQcm();
            expect(component.showQcm).toBe(false);
        });

        it('should toggle showQcm when false', () => {
            component.showQcm = false;
            component.toggleShowQcm();
            expect(component.showQcm).toBe(true);
        });
    });

    describe('toggleShowQrl', () => {
        it('should toggle showQrl when true', () => {
            component.showQrl = true;
            component.toggleShowQrl();
            expect(component.showQrl).toBe(false);
        });

        it('should toggle showQrl when false', () => {
            component.showQrl = false;
            component.toggleShowQrl();
            expect(component.showQrl).toBe(true);
        });
    });

    describe('showQuestion', () => {
        it('should show question when type is multiple choice and showQcm is true', () => {
            component.showQcm = true;
            component.showQrl = false;
            const question: Question = {
                _id: '1',
                text: 'Question 1',
                points: 100,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [],
                lastModification: new Date(),
            };

            expect(component.showQuestion(question)).toBe(true);
        });

        it('should show question when type is long answer and showQrl is true', () => {
            component.showQcm = false;
            component.showQrl = true;
            const question: Question = {
                _id: '1',
                text: 'Question 1',
                points: 100,
                type: QuestionType.LONG_ANSWER,
                choices: [],
                lastModification: new Date(),
            };

            expect(component.showQuestion(question)).toBe(true);
        });

        it('should not show question when type is multiple choice and showQcm is false', () => {
            component.showQcm = false;
            component.showQrl = false;
            const question: Question = {
                _id: '1',
                text: 'Question 1',
                points: 100,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [],
                lastModification: new Date(),
            };

            expect(component.showQuestion(question)).toBe(false);
        });

        it('should not show question when type is long answer and showQrl is false', () => {
            component.showQcm = false;
            component.showQrl = false;
            const question: Question = {
                _id: '1',
                text: 'Question 1',
                points: 100,
                type: QuestionType.LONG_ANSWER,
                choices: [],
                lastModification: new Date(),
            };

            expect(component.showQuestion(question)).toBe(false);
        });
    });
});
