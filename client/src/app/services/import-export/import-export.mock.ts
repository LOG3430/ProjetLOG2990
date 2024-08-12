import { Choice } from '@common/interfaces/choice.dto';
import { QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';

export const mockIncompleteQuiz: unknown = {
    _id: '0',
    title: 'Test Quiz',
    description: 'This is a test quiz.',
    duration: 30,
    visible: true,
    lastModification: new Date(),
    questions: [{ title: 'aaa' }],
};
export const mockWrongFormat: unknown = {
    hoho: 'hoho',
};

export const mockChoice: Choice = {
    text: 'Paris',
    isCorrect: true,
};

export const mockFakeChoice: Choice = {
    text: 'London',
    isCorrect: false,
};

export const mockQcmQuestion = {
    _id: '0',
    text: 'What is the capital of France?',
    points: 50,
    type: QuestionType.MULTIPLE_CHOICE,
    choices: [mockChoice, mockFakeChoice],
};

export const mockQrlQuestion = {
    _id: '0',
    text: 'What is the capital of France?',
    points: 50,
    type: QuestionType.LONG_ANSWER,
};

export const mockQuiz: Quiz = {
    _id: '0',
    title: 'Test Quiz',
    description: 'This is a test quiz.',
    duration: 30,
    visible: true,
    lastModification: new Date(),
    questions: [mockQrlQuestion, mockQcmQuestion],
};

const longMockQuiz: Quiz = {
    _id: '1',
    title: 'MOCKQUIZ FOR TESTING PURPOSE',
    description: 'A quiz to test your general knowledge across various topics.',
    duration: 45,
    visible: true,
    lastModification: new Date('2024-02-01'),
    questions: [
        {
            _id: '1',
            text: 'QUESTION 1/5',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 10,
            choices: [
                { text: 'Choice 1.1', isCorrect: false },
                { text: 'Choice 1.2', isCorrect: true },
                { text: 'Choice 1.3', isCorrect: false },
                { text: 'Choice 1.4', isCorrect: false },
            ],
        },
        {
            _id: '2',
            text: 'QUESTION 2/5',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 10,
            choices: [
                { text: 'Choice 2.1', isCorrect: false },
                { text: 'Choice 2.2', isCorrect: true },
                { text: 'Choice 2.3', isCorrect: false },
                { text: 'Choice 2.4', isCorrect: false },
            ],
        },
        {
            _id: '3',
            text: 'QUESTION 3/5',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 30,
            choices: [
                { text: 'Choice 3.1', isCorrect: true },
                { text: 'Choice 3.2', isCorrect: false },
                { text: 'Choice 3.3', isCorrect: false },
                { text: 'Choice 3.4', isCorrect: false },
            ],
        },
        {
            _id: '4',
            text: 'QUESTION 4/5',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 40,
            choices: [
                { text: 'Choice 4.1', isCorrect: false },
                { text: 'Choice 4.2', isCorrect: false },
                { text: 'Choice 4.3', isCorrect: true },
                { text: 'Choice 4.4', isCorrect: false },
            ],
        },

        {
            _id: '5',
            text: 'QUESTION 5/5',
            type: QuestionType.LONG_ANSWER,
            points: 20,
        },
    ],
};

const mockQuizList: Quiz[] = [
    {
        _id: '0',
        title: 'Test Quiz 1',
        description: 'This is a test quiz.',
        duration: 30,
        visible: true,
        lastModification: new Date(),
        questions: [mockQrlQuestion, mockQcmQuestion],
    },
    {
        _id: '1',
        title: 'Test Quiz 2',
        description: 'This is a test quiz.',
        duration: 30,
        visible: false,
        lastModification: new Date(),
        questions: [mockQrlQuestion, mockQcmQuestion],
    },
];

export const getLongMockQuiz = () => {
    return JSON.parse(JSON.stringify(longMockQuiz));
};

export const getMockQuiz = () => {
    return JSON.parse(JSON.stringify(mockQuiz));
};

export const getMockQuizList = () => {
    return JSON.parse(JSON.stringify(mockQuizList));
};
