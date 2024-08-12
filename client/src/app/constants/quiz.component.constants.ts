import { POINT_MAXIMAL_VALUE } from './question-validator.constants';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';

const EMPTY_QUESTION: Question = {
    _id: '',
    text: '',
    points: POINT_MAXIMAL_VALUE,
    type: QuestionType.MULTIPLE_CHOICE,
    choices: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
    ],
};

const EMPTY_QUIZ: Quiz = {
    _id: '',
    title: '',
    description: '',
    questions: [EMPTY_QUESTION],
    visible: false,
    duration: 10,
    lastModification: new Date(),
};

export const getEmptyQuiz = () => {
    return JSON.parse(JSON.stringify(EMPTY_QUIZ));
};

export const getEmptyQuestion = () => {
    return JSON.parse(JSON.stringify(EMPTY_QUESTION));
};
