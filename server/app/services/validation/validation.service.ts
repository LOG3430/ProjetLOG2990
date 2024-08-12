import { Choice } from '@common/interfaces/choice.dto';

export class ValidationService {
    static validateAnswer(choices: Choice[], selectedChoiceIndexes: number[]): boolean {
        if (choices.length === 0 || selectedChoiceIndexes.length === 0) {
            return false;
        }
        return (
            selectedChoiceIndexes.every((choiceIndex) => choices[choiceIndex].isCorrect) &&
            selectedChoiceIndexes.length === this.getNumberOfGoodAnswers(choices)
        );
    }

    static getNumberOfGoodAnswers(choices: Choice[]): number {
        return choices.reduce((count, currentChoice) => {
            return currentChoice.isCorrect ? count + 1 : count;
        }, 0);
    }
}
