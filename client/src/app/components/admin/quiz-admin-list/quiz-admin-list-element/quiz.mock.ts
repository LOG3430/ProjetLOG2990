import { QuestionType } from '@common/interfaces/question.dto';

export const quizMock = {
    _id: 'qwer',
    lastModification: new Date(),
    title: 'Test Quiz',
    description: 'kafgh',
    duration: 50,
    visible: true,
    questions: [
        {
            _id: '',
            text: 'q1',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 20,
            choices: [
                { text: 'c1', isCorrect: true },
                { text: 'c2', isCorrect: false },
                { text: 'c3', isCorrect: false },
                { text: 'c4', isCorrect: false },
            ],
        },
    ],
};
