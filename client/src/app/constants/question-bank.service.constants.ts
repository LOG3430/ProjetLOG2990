import { POINT_MAXIMAL_VALUE } from '@app/constants/question-validator.constants';
import { Question, QuestionType } from '@common/interfaces/question.dto';

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

export const getEmptyQuestion = () => {
    const copy = JSON.parse(JSON.stringify(EMPTY_QUESTION));
    copy.lastModification = new Date();
    return copy;
};
