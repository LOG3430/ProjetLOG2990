import { Injectable } from '@angular/core';
import { MAXIMUM_NUMBER_CHOICES, MINIMUM_NUMBER_CHOICES } from '@app/constants/common/choices.constants';
import { POINT_STEP, POINT_MINIMAL_VALUE, POINT_MAXIMAL_VALUE } from '@app/constants/question-validator.constants';
import { Choice } from '@common/interfaces/choice.dto';
import { Qcm, Question, QuestionType } from '@common/interfaces/question.dto';

@Injectable({
    providedIn: 'root',
})
export class QuestionValidatorService {
    testQuestion(question: Question) {
        if (!this.isValidText(question.text)) throw new Error('Une question ne peut être vide');
        if (!this.isValidPointsAmount(question.points))
            throw new Error('Une question doit valoir un nombre de points multiple de 10 et compris entre 10 et 100');
        if (question.type === QuestionType.MULTIPLE_CHOICE) this.testChoices((question as Qcm).choices);
    }

    testChoices(choices: Choice[]) {
        if (!this.hasAppropriateNumberChoices(choices)) throw new Error('Une question à choix multiple doit contenir entre 2 et 4 choix');
        for (const choice of choices) {
            if (!this.isValidText(choice.text)) throw new Error('Un choix doit contenir du texte');
        }
        if (!this.hasTrueAndFalseChoices(choices))
            throw new Error('Une question à choix multiple doit contenir au moins une réponse vraie et une réponse fausse');
        return true;
    }

    isValidQuestion(question: Question): boolean {
        if (question.type === QuestionType.MULTIPLE_CHOICE) {
            if (!this.isValidChoices((question as Qcm).choices)) return false;
        }
        return this.isValidText(question.text) && this.isValidPointsAmount(question.points);
    }

    isValidChoices(choices: Choice[]) {
        if (!this.hasAppropriateNumberChoices(choices)) return false;
        for (const choice of choices) {
            if (!this.isValidText(choice.text)) {
                return false;
            }
        }
        return this.hasTrueAndFalseChoices(choices);
    }

    hasTrueAndFalseChoices(choices: Choice[]): boolean {
        let hasTrue = false;
        let hasFalse = false;
        for (const choice of choices) {
            if (choice.isCorrect) {
                hasTrue = true;
            } else {
                hasFalse = true;
            }
            if (hasTrue && hasFalse) {
                return true;
            }
        }
        return false;
    }

    hasAppropriateNumberChoices(choices: Choice[]) {
        return choices.length <= MAXIMUM_NUMBER_CHOICES && choices.length >= MINIMUM_NUMBER_CHOICES;
    }

    isValidPointsAmount(nPoints: number): boolean {
        const isMultipleOfTen: boolean = nPoints % POINT_STEP === 0;
        const isBetweenAppropriateValues: boolean = nPoints >= POINT_MINIMAL_VALUE && nPoints <= POINT_MAXIMAL_VALUE;
        return isMultipleOfTen && isBetweenAppropriateValues;
    }

    private isValidText(text: string): boolean {
        return !!text && !!text.trim();
    }
}
