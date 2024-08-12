import { TestBed } from '@angular/core/testing';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { Choice } from '@common/interfaces/choice.dto';
import { Qcm, Qrl, QuestionType } from '@common/interfaces/question.dto';
import { QuestionValidatorService } from './question-validator.service';

// disabled no-any to spy on private method
/* eslint-disable  @typescript-eslint/no-explicit-any */

describe('QuestionValidatorService', () => {
    let service: QuestionValidatorService;
    let questionQcm: Qcm;
    let questionQrl: Qrl;
    let choices: Choice[];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [HttpClient, HttpHandler],
        });
        service = TestBed.inject(QuestionValidatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('isValidText', () => {
        it('should return true if text exists', () => {
            const text = 'something';

            const isValidTextSpy = spyOn<any>(service, 'isValidText').and.callThrough();
            expect(isValidTextSpy.call(service, text)).toBeTrue();
        });

        it('should return false if text is empty string', () => {
            const emptyString = '';

            const isValidTextSpy = spyOn<any>(service, 'isValidText').and.callThrough();
            expect(isValidTextSpy.call(service, emptyString)).toBeFalse();
        });

        it('should return false if text is only whitespaces', () => {
            const whiteSpaceText = '   ';

            const isValidTextSpy = spyOn<any>(service, 'isValidText').and.callThrough();
            expect(isValidTextSpy.call(service, whiteSpaceText)).toBeFalse();
        });
    });

    describe('hasAppropriateNumberChoices', () => {
        it('should return false if question has no choice', () => {
            choices = [];
            expect(service.hasAppropriateNumberChoices(choices)).toBeFalse();
        });

        it('should return false if question has 1 choice', () => {
            choices = [{ text: 'text', isCorrect: false }];
            expect(service.hasAppropriateNumberChoices(choices)).toBeFalse();
        });

        it('should return true if question has between 2 and 4 choices', () => {
            choices = [
                { text: 'text', isCorrect: false },
                { text: 'text', isCorrect: true },
            ];
            expect(service.hasAppropriateNumberChoices(choices)).toBeTrue();
            choices.push({ text: 'text', isCorrect: false });
            expect(service.hasAppropriateNumberChoices(choices)).toBeTrue();
            choices.push({ text: 'text', isCorrect: true });
            expect(service.hasAppropriateNumberChoices(choices)).toBeTrue();
        });

        it('should return false if question has more than 4 choices', () => {
            choices = [
                { text: 'text', isCorrect: false },
                { text: 'text', isCorrect: false },
                { text: 'text', isCorrect: true },
                { text: 'text', isCorrect: false },
                { text: 'text', isCorrect: true },
            ];
            expect(service.hasAppropriateNumberChoices(choices)).toBeFalse();
        });
    });

    describe('isValidPointsAmount', () => {
        // disabled no-magic-numbers because this is a test file
        /* eslint-disable @typescript-eslint/no-magic-numbers */
        it('should return false if points are below minimal points value', () => {
            expect(service.isValidPointsAmount(0)).toBeFalse();
        });

        it('should return false if points are over maximal points value', () => {
            expect(service.isValidPointsAmount(110)).toBeFalse();
        });

        it('should return true if points are between minimal and maximal points value and multiples of 10', () => {
            expect(service.isValidPointsAmount(10)).toBeTrue();
            expect(service.isValidPointsAmount(40)).toBeTrue();
            expect(service.isValidPointsAmount(100)).toBeTrue();
        });

        it('should return false if points are between minimal and maximal points value but not multiples of 10', () => {
            expect(service.isValidPointsAmount(69)).toBeFalse();
            expect(service.isValidPointsAmount(81)).toBeFalse();
        });
    });

    describe('hasTrueAndFalseChoices', () => {
        it('should return false if choices is empty', () => {
            choices = [];
            expect(service.hasTrueAndFalseChoices(choices)).toBeFalse();
        });

        it('should return false if question has 1 choice', () => {
            choices = [{ text: 'text', isCorrect: false }];
            expect(service.hasTrueAndFalseChoices(choices)).toBeFalse();
        });

        it('should return true if question has 1 true and 1 false choice or more', () => {
            choices = [
                { text: 'text', isCorrect: false },
                { text: 'text', isCorrect: true },
            ];
            expect(service.hasTrueAndFalseChoices(choices)).toBeTrue();
            choices.push({ text: 'text', isCorrect: false });
            expect(service.hasTrueAndFalseChoices(choices)).toBeTrue();
            choices.push({ text: 'text', isCorrect: true });
            expect(service.hasTrueAndFalseChoices(choices)).toBeTrue();
        });

        it('should return false if question only has false choices', () => {
            choices = [
                { text: 'text', isCorrect: false },
                { text: 'text', isCorrect: false },
                { text: 'text', isCorrect: false },
                { text: 'text', isCorrect: false },
            ];
            expect(service.hasTrueAndFalseChoices(choices)).toBeFalse();
        });

        it('should return false if question only has true choices', () => {
            choices = [
                { text: 'text', isCorrect: true },
                { text: 'text', isCorrect: true },
                { text: 'text', isCorrect: true },
                { text: 'text', isCorrect: true },
            ];
            expect(service.hasTrueAndFalseChoices(choices)).toBeFalse();
        });
    });

    describe('isValidChoices', () => {
        it('should return false if it does not have appropriate number of choices', () => {
            choices = [{ text: '', isCorrect: false }];
            const fakeHasAppropriateNumberChoices = () => {
                return false;
            };
            const spyHasAppropriateNumberChoices = spyOn<QuestionValidatorService>(service, 'hasAppropriateNumberChoices').and.callFake(
                fakeHasAppropriateNumberChoices,
            );
            expect(service.isValidChoices(choices)).toBeFalse();
            expect(spyHasAppropriateNumberChoices).toHaveBeenCalled();
        });

        it('should return false if it has an inappropriate choice', () => {
            choices = [{ text: '', isCorrect: false }];

            const fakeHasAppropriateNumberChoices = () => {
                return true;
            };
            const fakeIsValidText = () => {
                return false;
            };
            const spyHasAppropriateNumberChoices = spyOn<QuestionValidatorService>(service, 'hasAppropriateNumberChoices').and.callFake(
                fakeHasAppropriateNumberChoices,
            );
            const spyIsValidText = spyOn<any>(service, 'isValidText').and.callFake(fakeIsValidText);
            expect(service.isValidChoices(choices)).toBeFalse();
            expect(spyHasAppropriateNumberChoices).toHaveBeenCalled();
            expect(spyIsValidText).toHaveBeenCalled();
        });

        it('should return false if it does not have 1 true and 1 false choice', () => {
            choices = [{ text: '', isCorrect: false }];
            const fakeTrue = () => {
                return true;
            };
            const fakeHasTrueAndFalseChoices = () => {
                return false;
            };
            const spyHasAppropriateNumberChoices = spyOn<QuestionValidatorService>(service, 'hasAppropriateNumberChoices').and.callFake(fakeTrue);
            const spyIsValidText = spyOn<any>(service, 'isValidText').and.callFake(fakeTrue);
            const spyHasTrueAndFalseChoices = spyOn<QuestionValidatorService>(service, 'hasTrueAndFalseChoices').and.callFake(
                fakeHasTrueAndFalseChoices,
            );
            expect(service.isValidChoices(choices)).toBeFalse();
            expect(spyHasAppropriateNumberChoices).toHaveBeenCalled();
            expect(spyIsValidText).toHaveBeenCalled();
            expect(spyHasTrueAndFalseChoices).toHaveBeenCalled();
        });

        it('should return true if it has an appropriate number of choices, each choice is valid and it has 1 true and 1 false choice', () => {
            choices = [{ text: '', isCorrect: false }];
            const fakeTrue = () => {
                return true;
            };
            const spyHasAppropriateNumberChoices = spyOn<QuestionValidatorService>(service, 'hasAppropriateNumberChoices').and.callFake(fakeTrue);
            const spyIsValidText = spyOn<any>(service, 'isValidText').and.callFake(fakeTrue);
            const spyHasTrueAndFalseChoices = spyOn<QuestionValidatorService>(service, 'hasTrueAndFalseChoices').and.callFake(fakeTrue);
            expect(service.isValidChoices(choices)).toBeTrue();
            expect(spyHasAppropriateNumberChoices).toHaveBeenCalled();
            expect(spyIsValidText).toHaveBeenCalled();
            expect(spyHasTrueAndFalseChoices).toHaveBeenCalled();
        });
    });

    describe('isValidQuestion', () => {
        it('should return false if it is a QMC and it does not have valid choices', () => {
            questionQcm = {
                _id: '0',
                text: '',
                points: 0,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [{ text: '', isCorrect: false }],
            };
            const fakeIsValidChoices = () => {
                return false;
            };
            const spyIsValidChoices = spyOn<any>(service, 'isValidChoices').and.callFake(fakeIsValidChoices);
            expect(service.isValidQuestion(questionQcm)).toBeFalse();
            expect(spyIsValidChoices).toHaveBeenCalled();
        });

        it('should return false if it does not have a valid text', () => {
            questionQcm = {
                _id: '0',
                text: '',
                points: 0,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [{ text: '', isCorrect: false }],
            };
            const fakeIsValidChoices = () => {
                return true;
            };
            const fakeIsValidText = () => {
                return false;
            };

            const spyIsValidChoices = spyOn<any>(service, 'isValidChoices').and.callFake(fakeIsValidChoices);
            const spyIsValidText = spyOn<any>(service, 'isValidText').and.callFake(fakeIsValidText);
            const spyisValidPointsAmount = spyOn<QuestionValidatorService>(service, 'isValidPointsAmount');

            expect(service.isValidQuestion(questionQcm)).toBeFalse();
            expect(spyIsValidChoices).toHaveBeenCalled();
            expect(spyIsValidText).toHaveBeenCalled();
            expect(spyisValidPointsAmount).not.toHaveBeenCalled();
        });

        it('should return false if it does not have a valid points amount', () => {
            questionQcm = {
                _id: '0',
                text: '',
                points: 0,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [{ text: '', isCorrect: false }],
            };

            const fakeTrue = () => {
                return true;
            };

            const fakeIsValidPointsAmount = () => {
                return false;
            };

            const spyIsValidChoices = spyOn<any>(service, 'isValidChoices').and.callFake(fakeTrue);
            const spyIsValidText = spyOn<any>(service, 'isValidText').and.callFake(fakeTrue);
            const spyisValidPointsAmount = spyOn<QuestionValidatorService>(service, 'isValidPointsAmount').and.callFake(fakeIsValidPointsAmount);

            expect(service.isValidQuestion(questionQcm)).toBeFalse();
            expect(spyIsValidChoices).toHaveBeenCalled();
            expect(spyIsValidText).toHaveBeenCalled();
            expect(spyisValidPointsAmount).toHaveBeenCalled();
        });

        it('should return true if it has a valid text and a valid points amount and it is a Qrl', () => {
            questionQrl = {
                _id: '0',
                text: '',
                points: 0,
                type: QuestionType.LONG_ANSWER,
            };

            const fakeTrue = () => {
                return true;
            };

            const spyIsValidText = spyOn<any>(service, 'isValidText').and.callFake(fakeTrue);
            const spyisValidPointsAmount = spyOn<QuestionValidatorService>(service, 'isValidPointsAmount').and.callFake(fakeTrue);

            expect(service.isValidQuestion(questionQrl)).toBeTrue();
            expect(spyIsValidText).toHaveBeenCalled();
            expect(spyisValidPointsAmount).toHaveBeenCalled();
        });

        it('should return true if it has valid choices, a valid text and a valid points amount and it is a QMC', () => {
            questionQcm = {
                _id: '0',
                text: '',
                points: 0,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [{ text: '', isCorrect: false }],
            };

            const fakeTrue = () => {
                return true;
            };

            const spyIsValidChoices = spyOn<any>(service, 'isValidChoices').and.callFake(fakeTrue);
            const spyIsValidText = spyOn<any>(service, 'isValidText').and.callFake(fakeTrue);
            const spyisValidPointsAmount = spyOn<QuestionValidatorService>(service, 'isValidPointsAmount').and.callFake(fakeTrue);

            expect(service.isValidQuestion(questionQcm)).toBeTrue();
            expect(spyIsValidChoices).toHaveBeenCalled();
            expect(spyIsValidText).toHaveBeenCalled();
            expect(spyisValidPointsAmount).toHaveBeenCalled();
        });
    });
});
