import { Injectable } from '@angular/core';
import { DURATION_MAXIMAL_VALUE, DURATION_MINIMAL_VALUE } from '@app/constants/quiz-validator.constants';
import { QuestionValidatorService } from '@app/services/question-validator/question-validator.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { Question } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class QuizValidatorService {
    constructor(
        private questionValidatorService: QuestionValidatorService,
        private quizCommunicationService: QuizCommunicationService,
    ) {}

    async testQuiz(quiz: Quiz) {
        if (!quiz.title) throw new Error('Le titre du quiz ne peut être vide');
        if (!quiz.description) throw new Error('La description du quiz ne peut être vide');
        if (!quiz.questions || quiz.questions.length === 0) throw new Error('Le quiz doit contenir au moins une question');
        if (!quiz.duration || quiz.duration < DURATION_MINIMAL_VALUE || quiz.duration > DURATION_MAXIMAL_VALUE)
            throw new Error('La durée du quiz doit être comprise entre 10 et 60 minutes');
        for (const question of quiz.questions) {
            this.questionValidatorService.testQuestion(question);
        }
    }

    isValidQuiz(quiz: Quiz): boolean {
        const isValid: boolean =
            !!quiz.title &&
            !!quiz.description &&
            quiz.questions.length > 0 &&
            this.isDurationValid(quiz.duration) &&
            quiz.questions.every((question) => this.questionValidatorService.isValidQuestion(question));
        return isValid;
    }

    isDurationValid(duration: number): boolean {
        return duration >= DURATION_MINIMAL_VALUE && duration <= DURATION_MAXIMAL_VALUE;
    }

    async isTitleUnique(title: string, quizId?: string): Promise<boolean> {
        const quizzes = await firstValueFrom(this.quizCommunicationService.fetchAllQuizzes());
        return !quizzes.some((quiz) => quiz.title === title && (!quizId || quiz._id !== quizId));
    }

    getIdenticalQuestionsIndex(questions: Question[]): number[] {
        const answers: number[] = [];
        for (let i = 0; i < questions.length; i++) {
            for (let j = i + 1; j < questions.length; j++) {
                if (questions[i].text === questions[j].text) {
                    answers.push(i, j);
                }
            }
        }
        return Array.from(new Set(answers));
    }
}
