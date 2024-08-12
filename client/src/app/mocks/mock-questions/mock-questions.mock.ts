import { Question, QuestionType } from '@common/interfaces/question.dto';

export const mockQuestions: Question[] = [
    {
        _id: '1',
        text: 'Question 1',
        points: 100,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
    {
        _id: '2',
        text: 'Question 2',
        points: 200,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
];

export const longMockQuestions: Question[] = [
    {
        _id: '1',
        text: 'Question 1',
        points: 100,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
    {
        _id: '2',
        text: 'Question 2',
        points: 200,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },

    {
        _id: '3',
        text: 'Question 3',
        points: 100,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
    {
        _id: '4',
        text: 'Question 4',
        points: 200,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
    {
        _id: '5',
        text: 'Question 5',
        points: 100,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
    {
        _id: '6',
        text: 'Question 6',
        points: 200,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
    {
        _id: '7',
        text: 'Question 7',
        points: 100,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
    {
        _id: '8',
        text: 'Question 8',
        points: 200,
        type: QuestionType.MULTIPLE_CHOICE,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
    },
];

export const getQuestionsMock = () => {
    return JSON.parse(JSON.stringify(mockQuestions)) as Question[];
};

export const getLongQuestionsMock = () => {
    return JSON.parse(JSON.stringify(longMockQuestions)) as Question[];
};
