import { Question } from '../interfaces/question.dto';
export interface NewQuestionRes {
    question: Question;
    duration: number;
    isLastQuestion: boolean;
}
