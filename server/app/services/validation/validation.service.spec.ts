import { Choice } from '@common/interfaces/choice.dto';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
    const stubChoices = [
        { text: 'a', isCorrect: false },
        { text: 'b', isCorrect: true },
        { text: 'c', isCorrect: true },
        { text: 'd', isCorrect: false },
    ];

    describe('validateAnswer', () => {
        it('should return true when all and only correct choices are selected', () => {
            const selectedChoiceIndexes = [1, 2];
            expect(ValidationService.validateAnswer(stubChoices, selectedChoiceIndexes)).toBe(true);
        });

        it('should return false when not all correct choices are selected', () => {
            const selectedChoiceIndexes = [1];
            expect(ValidationService.validateAnswer(stubChoices, selectedChoiceIndexes)).toBe(false);
        });

        it('should return false when an incorrect choice is selected', () => {
            const selectedChoiceIndexes = [0, 1, 2];
            expect(ValidationService.validateAnswer(stubChoices, selectedChoiceIndexes)).toBe(false);
        });

        it('should return false when no choices are selected', () => {
            const selectedChoiceIndexes: number[] = [];
            expect(ValidationService.validateAnswer(stubChoices, selectedChoiceIndexes)).toBe(false);
        });

        it('should return false when choices list is empty', () => {
            const emptyChoices: Choice[] = [];
            const selectedChoiceIndexes = [0, 1];
            expect(ValidationService.validateAnswer(emptyChoices, selectedChoiceIndexes)).toBe(false);
        });
    });

    describe('getNumberOfGoodAnswers', () => {
        it('should return the right number of good answers', () => {
            expect(ValidationService.getNumberOfGoodAnswers(stubChoices.slice(0, 2))).toEqual(1);
            expect(ValidationService.getNumberOfGoodAnswers(stubChoices.slice(1, 3))).toEqual(2);
            expect(ValidationService.getNumberOfGoodAnswers(stubChoices)).toEqual(2);
        });
    });
});
