/* eslint-disable max-lines */
/* test file can go beyond 350 lines if necessary */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChoiceComponent } from '@app/components/admin/choice/choice.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { DateService } from '@app/services/date/date.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuestionCommunicationService } from '@app/services/question-communication/question-communication.service';
import { QuestionValidatorService } from '@app/services/question-validator/question-validator.service';
import { Qcm, QuestionType } from '@common/interfaces/question.dto';
import { QuestionComponent } from './question.component';
import SpyObj = jasmine.SpyObj;
import { QCM_ICON, QRL_ICON } from '@app/constants/common/icons.constants';

const INVALID_INFERIOR_INDEX = -1;
const INVALID_SUPERIOR_INDEX = 4;

describe('QuestionComponent', () => {
    let component: QuestionComponent;
    let fixture: ComponentFixture<QuestionComponent>;
    let questionValidatorSpy: SpyObj<QuestionValidatorService>;
    let questionCommunicationSpy: SpyObj<QuestionCommunicationService>;
    let notificationServiceSpy: SpyObj<NotificationService>;
    let dateServiceSpy: SpyObj<DateService>;
    let questionBankServiceMock: SpyObj<QuestionBankService>;

    beforeEach(() => {
        questionValidatorSpy = jasmine.createSpyObj('QuestionValidatorService', [
            'isValidQuestion',
            'hasAppropriateNumberChoices',
            'hasTrueAndFalseChoices',
        ]);
        questionCommunicationSpy = jasmine.createSpyObj('QuestionCommunicationService', ['saveQuestion', 'addQuestion']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showBanner']);
        dateServiceSpy = jasmine.createSpyObj('DateService', ['getTimeSinceLastModificationMessage', 'getDateFormatted']);
        questionBankServiceMock = jasmine.createSpyObj('QuestionBankService', ['addQuestionToBank', 'addQuestionToQuiz']);
    });
    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionComponent, ChoiceComponent],
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule],
            providers: [
                { provide: QuestionValidatorService, useValue: questionValidatorSpy },
                { provide: QuestionCommunicationService, useValue: questionCommunicationSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: DateService, useValue: dateServiceSpy },
                { provide: QuestionBankService, useValue: questionBankServiceMock },
            ],
        });
        fixture = TestBed.createComponent(QuestionComponent);
        component = fixture.componentInstance;
        component.question = { text: 'test', _id: '1', type: QuestionType.MULTIPLE_CHOICE, points: 1, choices: [{ text: 'test', isCorrect: true }] };
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should set hasChanged to true if question id is empty', () => {
        component.question._id = '';
        spyOn(component, 'checkQuestionValidity');
        component.ngOnInit();
        expect(component.question.hasChanged).toBeTrue();
        expect(component.checkQuestionValidity).toHaveBeenCalled();
    });
    it('should call checkQuestionValidity', () => {
        spyOn(component, 'checkQuestionValidity');
        component.ngOnInit();
        expect(component.checkQuestionValidity).toHaveBeenCalled();
    });
    describe('getTimeSinceLastModificationMessage', () => {
        it('should return time since last modification message if component is loaded', () => {
            const lastModification = new Date();
            const lastModificationMessage = 'Il y a 3 jours';
            component.componentHasLoaded = true;
            component.question.lastModification = lastModification;
            dateServiceSpy.getTimeSinceLastModificationMessage.and.returnValue(lastModificationMessage);
            const result = component.getTimeSinceLastModificationMessage();
            expect(result).toBeDefined();
            expect(dateServiceSpy.getTimeSinceLastModificationMessage).toHaveBeenCalledWith(lastModification);
        });
        it('should not return time since last modification message if component is loading', () => {
            const lastModification = new Date();
            component.componentHasLoaded = false;
            component.question.lastModification = lastModification;
            const result = component.getTimeSinceLastModificationMessage();
            expect(result).toEqual('');
            expect(dateServiceSpy.getTimeSinceLastModificationMessage).not.toHaveBeenCalled();
        });
        it('should set lastModification to current date if it is not provided', () => {
            component.question.lastModification = undefined;
            dateServiceSpy.getTimeSinceLastModificationMessage.and.returnValue('');
            component.getTimeSinceLastModificationMessage();
            expect(component.question.lastModification).toBeDefined();
        });
    });
    describe('getTimeMessage', () => {
        it('should return formatted date message when lastModification is present', () => {
            const lastModification = new Date('2024-02-08T12:00:00');
            component.question.lastModification = lastModification;
            dateServiceSpy.getDateFormatted.and.returnValue('February 8, 2024');
            const result = component.getDateMessage();
            expect(result).toBe('February 8, 2024');
            expect(dateServiceSpy.getDateFormatted).toHaveBeenCalledWith(lastModification);
            expect(notificationServiceSpy.showBanner).not.toHaveBeenCalled();
        });
        it('should return new Date if there is no date on the object', () => {
            const lastModification = undefined;
            component.question.lastModification = lastModification;
            dateServiceSpy.getDateFormatted.and.returnValue('February 8, 2024');
            const result = component.getDateMessage();
            expect(result).toBe('February 8, 2024');
            expect(dateServiceSpy.getDateFormatted).toHaveBeenCalled();
            expect(notificationServiceSpy.showBanner).not.toHaveBeenCalled();
        });
    });
    describe('checkQuestionValidity', () => {
        it('should set isValidQuestion to false if question is invalid', () => {
            questionValidatorSpy.isValidQuestion.and.returnValue(false);
            component.checkQuestionValidity();
            expect(component.isValidQuestion).toBeFalse();
        });

        it('should set isValidQuestion to true if question is valid', () => {
            questionValidatorSpy.isValidQuestion.and.returnValue(true);
            component.checkQuestionValidity();
            expect(component.isValidQuestion).toBeTrue();
        });

        it('should set hasAppropriateNumberChoices to false if question has inappropriate number of choices', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            questionValidatorSpy.hasAppropriateNumberChoices.and.returnValue(false);
            component.checkQuestionValidity();
            expect(component.hasAppropriateNumberChoices).toBeFalse();
        });

        it('should set hasAppropriateNumberChoices to true if question has appropriate number of choices', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            questionValidatorSpy.hasAppropriateNumberChoices.and.returnValue(true);
            component.checkQuestionValidity();
            expect(component.hasAppropriateNumberChoices).toBeTrue();
        });

        it('should set hasTrueAndFalseChoices to false if question has no true and false choices', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            questionValidatorSpy.hasTrueAndFalseChoices.and.returnValue(false);
            component.checkQuestionValidity();
            expect(component.hasTrueAndFalseChoices).toBeFalse();
        });

        it('should set hasTrueAndFalseChoices to true if question has true and false choices', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            questionValidatorSpy.hasTrueAndFalseChoices.and.returnValue(true);
            component.checkQuestionValidity();
            expect(component.hasTrueAndFalseChoices).toBeTrue();
        });

        it('should set hasTooManyChoicesToAddMore to true if question has too many choices', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            (component.question as Qcm).choices = [
                { text: 'test', isCorrect: true },
                { text: 'test', isCorrect: true },
                { text: 'test', isCorrect: true },
                { text: 'test', isCorrect: true },
            ];
            component.checkQuestionValidity();
            expect(component.hasTooManyChoicesToAddMore).toBeTrue();
        });

        it('should set hasTooManyChoicesToAddMore to false if question does not have too many choices', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            (component.question as Qcm).choices = [
                { text: 'test', isCorrect: true },
                { text: 'test', isCorrect: true },
                { text: 'test', isCorrect: true },
            ];
            component.checkQuestionValidity();
            expect(component.hasTooManyChoicesToAddMore).toBeFalse();
        });

        it('should set attributes to true if question is not a QCM', () => {
            spyOn(component, 'isQcm').and.returnValue(false);
            component.checkQuestionValidity();
            expect(component.hasAppropriateNumberChoices).toBeTrue();
            expect(component.hasTrueAndFalseChoices).toBeTrue();
            expect(component.hasTooManyChoicesToAddMore).toBeTrue();
        });
    });
    describe('deleteChoice', () => {
        it('should remove correct choice from question', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            (component.question as Qcm).choices = [
                { text: 'test0', isCorrect: true },
                { text: 'test1', isCorrect: true },
                { text: 'test2', isCorrect: false },
            ];
            component.deleteChoice(1);
            expect((component.question as Qcm).choices.length).toEqual(2);
            expect((component.question as Qcm).choices).toEqual([
                { text: 'test0', isCorrect: true },
                { text: 'test2', isCorrect: false },
            ]);
        });

        it('should call checkQuestionValidity on valid delete request', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            spyOn(component, 'checkQuestionValidity');
            (component.question as Qcm).choices = [{ text: 'test', isCorrect: true }];
            component.deleteChoice(0);
            expect(component.checkQuestionValidity).toHaveBeenCalled();
        });

        it('should not remove choice if index is negative', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            (component.question as Qcm).choices = [
                { text: 'test0', isCorrect: true },
                { text: 'test1', isCorrect: true },
                { text: 'test2', isCorrect: false },
            ];
            component.deleteChoice(INVALID_INFERIOR_INDEX);
            expect((component.question as Qcm).choices.length).toEqual(3);
        });

        it('should not remove choice if index is greater than length', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            (component.question as Qcm).choices = [
                { text: 'test0', isCorrect: true },
                { text: 'test1', isCorrect: true },
                { text: 'test2', isCorrect: false },
            ];
            component.deleteChoice(3);
            expect((component.question as Qcm).choices.length).toEqual(3);
        });

        it('should not call checkQuestionValidity if index is out of bounds', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            spyOn(component, 'checkQuestionValidity');
            (component.question as Qcm).choices = [{ text: 'test', isCorrect: true }];
            component.deleteChoice(1);
            expect(component.checkQuestionValidity).not.toHaveBeenCalled();
        });

        it('should not call checkQuestionValidity if index is negative', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            spyOn(component, 'checkQuestionValidity');
            (component.question as Qcm).choices = [{ text: 'test', isCorrect: true }];
            component.deleteChoice(INVALID_INFERIOR_INDEX);
            expect(component.checkQuestionValidity).not.toHaveBeenCalled();
        });

        it('should do nothing if question is not a QCM', () => {
            spyOn(component, 'isQcm').and.returnValue(false);
            (component.question as Qcm).choices = [
                { text: 'test0', isCorrect: true },
                { text: 'test1', isCorrect: true },
            ];
            component.deleteChoice(1);
            expect((component.question as Qcm).choices.length).toEqual(2);
        });
    });
    describe('newChoice', () => {
        it('should add new choice to question', () => {
            (component.question as Qcm).choices = [{ text: 'test', isCorrect: true }];
            component.newChoice();
            expect((component.question as Qcm).choices.length).toEqual(2);
        });

        it('should call checkQuestionValidity on valid new choice request', () => {
            spyOn(component, 'checkQuestionValidity');
            component.newChoice();
            expect(component.checkQuestionValidity).toHaveBeenCalled();
        });

        it('should not add new choice if there are too many choices', () => {
            (component.question as Qcm).choices = [
                { text: 'test0', isCorrect: true },
                { text: 'test1', isCorrect: true },
                { text: 'test2', isCorrect: true },
            ];
            component.newChoice();
            component.newChoice();
            expect((component.question as Qcm).choices.length).toEqual(INVALID_SUPERIOR_INDEX);
        });

        it('should not call checkQuestionValidity if there are too many choices', () => {
            spyOn(component, 'checkQuestionValidity');
            component.hasTooManyChoicesToAddMore = true;
            component.newChoice();
            expect(component.checkQuestionValidity).not.toHaveBeenCalled();
        });
    });
    describe('choiceChange', () => {
        it('should call checkQuestionValidity on choice change', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            spyOn(component, 'checkQuestionValidity');
            component.choiceChange({ text: 'test', isCorrect: true }, 0);
            expect(component.checkQuestionValidity).toHaveBeenCalled();
        });

        it('should update choice in question', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            (component.question as Qcm).choices = [{ text: 'test', isCorrect: true }];
            component.choiceChange({ text: 'test2', isCorrect: false }, 0);
            expect((component.question as Qcm).choices[0]).toEqual({ text: 'test2', isCorrect: false });
        });

        it("should not update choice if it's not a QCM", () => {
            spyOn(component, 'isQcm').and.returnValue(false);
            spyOn(component, 'onInputChange');
            (component.question as Qcm).choices = [{ text: 'test', isCorrect: true }];
            component.choiceChange({ text: 'test2', isCorrect: false }, 0);
            expect((component.question as Qcm).choices[0]).toEqual({ text: 'test', isCorrect: true });
            expect(component.onInputChange).not.toHaveBeenCalled();
        });
    });
    describe('emitDelete', () => {
        it('should emit delete event', () => {
            spyOn(component.removeQuestionSignal, 'emit');

            component.questionIndex = 0;
            component.emitDelete(new MouseEvent('click'));
            expect(component.removeQuestionSignal.emit).toHaveBeenCalledWith(0);
        });
    });
    describe('saveQuestion', () => {
        it('should not save question if it is invalid', () => {
            component.isInBank = false;
            questionValidatorSpy.isValidQuestion.and.returnValue(false);
            component.saveQuestion();
            expect(questionCommunicationSpy.saveQuestion).not.toHaveBeenCalled();
            expect(questionCommunicationSpy.addQuestion).not.toHaveBeenCalled();
        });

        it('should save question modifications if it is valid', fakeAsync(() => {
            const emitSpy = spyOn(component.saveQuestionSignal, 'emit');
            component.saveQuestion();
            expect(emitSpy).toHaveBeenCalled();
        }));
    });
    describe('drop', () => {
        it('should switch item order', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            (component.question as Qcm).choices = [
                { text: 'test0', isCorrect: true },
                { text: 'test1', isCorrect: true },
            ];
            // disabled no-any because this makes the test more concise
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            const dragEvent: CdkDragDrop<string[]> = { previousIndex: 0, currentIndex: 1 } as any;
            component.drop(dragEvent);
            expect((component.question as Qcm).choices).toEqual([
                { text: 'test1', isCorrect: true },
                { text: 'test0', isCorrect: true },
            ]);
        });

        it('should not switch item order if question is not a QCM', () => {
            spyOn(component, 'isQcm').and.returnValue(false);
            const dragEvent: CdkDragDrop<string[]> = { previousIndex: 0, currentIndex: 1 } as any;
            component.drop(dragEvent);
            expect((component.question as Qcm).choices).toEqual([{ text: 'test', isCorrect: true }]);
        });
    });
    describe('getSaveDisabledMessage', () => {
        it('should return "Aucune modification apportée" when hasChanged is false', () => {
            component.question.hasChanged = false;
            const result = component.getSaveDisabledMessage();
            expect(result).toBe('Aucune modification apportée');
        });

        it('should return "La question est invalide" when isValidQuestion is false', () => {
            component.question.hasChanged = true;
            component.isValidQuestion = false;
            const result = component.getSaveDisabledMessage();
            expect(result).toBe('La question est invalide');
        });

        it('should return an empty string when both hasChanged and isValidQuestion are true', () => {
            component.question.hasChanged = true;
            component.isValidQuestion = true;
            const result = component.getSaveDisabledMessage();
            expect(result).toBe('');
        });
    });
    describe('addQuestion', () => {
        it('should add question to question bank', () => {
            component.addToQuestionBank();
            expect(questionBankServiceMock.addQuestionToBank).toHaveBeenCalled();
        });

        it('should add question to current quiz', () => {
            const event = new MouseEvent('click');
            spyOn(event, 'stopPropagation');
            component.addToCurrentQuiz(event);
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(questionBankServiceMock.addQuestionToQuiz).toHaveBeenCalled();
        });
    });

    describe('hasError', () => {
        it('should return true if question is not valid', () => {
            component.isValidQuestion = false;
            component.isUniqueQuestion = true;
            expect(component.hasError()).toBeTrue();
        });
        it('should return true if question is not unique', () => {
            component.isValidQuestion = true;
            component.isUniqueQuestion = false;
            expect(component.hasError()).toBeTrue();
        });
        it('should return false if question is valid and unique', () => {
            component.isValidQuestion = true;
            component.isUniqueQuestion = true;
            expect(component.hasError()).toBeFalse();
        });
    });

    describe('isQcm', () => {
        it('should return true if question is a QCM', () => {
            component.question.type = QuestionType.MULTIPLE_CHOICE;
            expect(component.isQcm()).toBeTrue();
        });

        it('should return false if question is a QRL', () => {
            component.question.type = QuestionType.LONG_ANSWER;
            expect(component.isQcm()).toBeFalse();
        });
    });

    describe('getChoices', () => {
        it('should return choices if question is a QCM', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            (component.question as Qcm).choices = [{ text: 'test', isCorrect: true }];
            expect(component.getChoices()).toEqual([{ text: 'test', isCorrect: true }]);
        });

        it('should return an empty array if question is a QRL', () => {
            spyOn(component, 'isQcm').and.returnValue(false);
            expect(component.getChoices()).toEqual([]);
        });
    });

    describe('getIconText', () => {
        it('should return QCM_ICON if question is a QCM', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            expect(component.getIconText()).toEqual(QCM_ICON);
        });

        it('should return QRL_ICON if question is a QRL', () => {
            spyOn(component, 'isQcm').and.returnValue(false);
            expect(component.getIconText()).toEqual(QRL_ICON);
        });
    });

    describe('getIconTooltip', () => {
        it('should return "Question à choix multiple" if question is a QCM', () => {
            spyOn(component, 'isQcm').and.returnValue(true);
            expect(component.getIconTooltip()).toEqual('Question à choix multiple');
        });

        it('should return "Question à réponse libre" if question is a QRL', () => {
            spyOn(component, 'isQcm').and.returnValue(false);
            expect(component.getIconTooltip()).toEqual('Question à réponse libre');
        });
    });

    describe('onChangeQuestionType', () => {
        it('should change the question type to QCM if it is a QRL', () => {
            component.question = { text: 'test', _id: '1', type: QuestionType.LONG_ANSWER, points: 1 };
            component.onChangeQuestionType();
            expect(component.question.type).toEqual(QuestionType.MULTIPLE_CHOICE);
            expect((component.question as Qcm).choices).toEqual([
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
            ]);
        });

        it('should change the question type to QRL if it is a QCM', () => {
            component.question = {
                text: 'test',
                _id: '1',
                type: QuestionType.MULTIPLE_CHOICE,
                points: 1,
                choices: [
                    { text: '', isCorrect: true },
                    { text: '', isCorrect: false },
                ],
            };
            component.onChangeQuestionType();
            expect(component.question.type).toEqual(QuestionType.LONG_ANSWER);
            expect(component.question.choices).toEqual([]);
        });

        it('should call onInputChange', () => {
            spyOn(component, 'onInputChange');
            component.onChangeQuestionType();
            expect(component.onInputChange).toHaveBeenCalled();
        });
    });

    describe('stopPropagation', () => {
        it('should stop propagation of the event', () => {
            const event = new MouseEvent('click');
            spyOn(event, 'stopPropagation');
            component.stopPropagation(event);
            expect(event.stopPropagation).toHaveBeenCalled();
        });
    });
});
