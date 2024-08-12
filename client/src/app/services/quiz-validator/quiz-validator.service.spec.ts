import { TestBed } from '@angular/core/testing';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { QuestionType } from '@common/interfaces/question.dto';
import { of } from 'rxjs';
import { QuizValidatorService } from './quiz-validator.service';

// magic numbers and max lines used for tests
/* eslint-disable  @typescript-eslint/no-magic-numbers */
/* eslint-disable  max-lines */

describe('QuizValidatorService', () => {
    let service: QuizValidatorService;
    let quizCommunicationServiceMock: jasmine.SpyObj<QuizCommunicationService>;

    beforeEach(() => {
        quizCommunicationServiceMock = jasmine.createSpyObj('QuizCommunicationService', ['fetchAllQuizzes']);
        TestBed.configureTestingModule({
            providers: [HttpClient, HttpHandler, { provide: QuizCommunicationService, useValue: quizCommunicationServiceMock }],
        });
        service = TestBed.inject(QuizValidatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('isValidQuiz', () => {
        it('should return false if quiz title is empty', () => {
            const quiz = {
                _id: '0',
                title: '',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [{ text: 'asdf', isCorrect: false }],
                    },
                ],
            };

            expect(service.isValidQuiz(quiz)).toBeFalse();
        });

        it('should return true if quiz title is valid', () => {
            const quiz = {
                _id: '0',
                title: 'asdf',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [
                            { text: 'asdf', isCorrect: false },
                            { text: 'asdf', isCorrect: true },
                        ],
                    },
                ],
            };

            expect(service.isValidQuiz(quiz)).toBeTrue();
        });
    });

    describe('isDurationValid', () => {
        it('should return true if duration is valid', () => {
            expect(service.isDurationValid(30)).toBeTrue();
        });

        it('should return false if duration is inferior to 10', () => {
            expect(service.isDurationValid(5)).toBeFalse();
        });

        it('should return false if duration is superior to 60', () => {
            expect(service.isDurationValid(65)).toBeFalse();
        });
    });

    describe('isTitleUnique', () => {
        it('should return true when usedTitles is undefined and title is unique', async () => {
            const title = 'New Quiz Title';
            const _id = '0';
            const existingQuizzes = [
                {
                    _id,
                    title,
                    description: 'This is a test quiz.',
                    duration: 30,
                    visible: true,
                    lastModification: new Date(),
                    questions: [],
                },
                {
                    _id: '1',
                    title: 'asdf',
                    description: 'This is a test quiz.',
                    duration: 30,
                    visible: true,
                    lastModification: new Date(),
                    questions: [],
                },
            ];

            quizCommunicationServiceMock.fetchAllQuizzes.and.returnValue(of(existingQuizzes));

            const result = await service.isTitleUnique(title, _id);

            expect(result).toBe(true);
        });

        it('should return false when usedTitles is undefined and title is non-unique', async () => {
            const title = 'New Quiz Title';
            const _id = '0';
            const existingQuizzes = [
                {
                    _id,
                    title,
                    description: 'This is a test quiz.',
                    duration: 30,
                    visible: true,
                    lastModification: new Date(),
                    questions: [],
                },
                {
                    _id: '1',
                    title,
                    description: 'This is a test quiz.',
                    duration: 30,
                    visible: true,
                    lastModification: new Date(),
                    questions: [],
                },
            ];

            quizCommunicationServiceMock.fetchAllQuizzes.and.returnValue(of(existingQuizzes));

            const result = await service.isTitleUnique(title, _id);

            expect(result).toBe(false);
        });
    });

    describe('validityTests', () => {
        it('should throw an error if quiz has no title', async () => {
            const quiz = {
                _id: '0',
                title: '',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [{ text: 'asdf', isCorrect: false }],
                    },
                ],
            };

            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError('Le titre du quiz ne peut être vide');
        });
        it('should throw an error if quiz has no description', async () => {
            const quiz = {
                _id: '0',
                title: 'Title',
                description: '',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [{ text: 'asdf', isCorrect: false }],
                    },
                ],
            };

            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError('La description du quiz ne peut être vide');
        });
        it('should throw an error if quiz has no questions', async () => {
            const quiz = {
                _id: '0',
                title: 'Title',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [],
            };

            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError('Le quiz doit contenir au moins une question');
        });
        it('should throw an error if duration is invalid', async () => {
            const quiz = {
                _id: '0',
                title: 'title',
                description: 'This is a test quiz.',
                duration: 0,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [{ text: 'asdf', isCorrect: false }],
                    },
                ],
            };

            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError('La durée du quiz doit être comprise entre 10 et 60 minutes');
        });
        it('should throw an error if quiz has question with invalid text', async () => {
            const quiz = {
                _id: '0',
                title: 'title',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: '',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [{ text: 'asdf', isCorrect: false }],
                    },
                ],
            };

            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError('Une question ne peut être vide');
        });
        it('should throw an error if quiz has question with invalid points', async () => {
            const quiz = {
                _id: '0',
                title: 'Title',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 0,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [{ text: 'asdf', isCorrect: false }],
                    },
                ],
            };

            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError(
                'Une question doit valoir un nombre de points multiple de 10 et compris entre 10 et 100',
            );
        });
        it('should throw an error if Qcm has question with no choices', async () => {
            const quiz = {
                _id: '0',
                title: 'Title',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [],
                    },
                ],
            };

            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError('Une question à choix multiple doit contenir entre 2 et 4 choix');
        });
        it('should throw an error if quiz has Qcm with only false choices', async () => {
            const quiz = {
                _id: '0',
                title: 'Title',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [
                            { text: 'asdf', isCorrect: false },
                            { text: 'asdf', isCorrect: false },
                        ],
                    },
                ],
            };
            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError(
                'Une question à choix multiple doit contenir au moins une réponse vraie et une réponse fausse',
            );
        });
        it('should throw an error if quiz has question with empty choice', async () => {
            const quiz = {
                _id: '0',
                title: 'title',
                description: 'This is a test quiz.',
                duration: 30,
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '0',
                        text: 'asdf',
                        points: 10,
                        type: QuestionType.MULTIPLE_CHOICE,
                        choices: [
                            { text: '', isCorrect: false },
                            { text: '', isCorrect: false },
                        ],
                    },
                ],
            };
            await expectAsync(service.testQuiz(quiz)).toBeRejectedWithError('Un choix doit contenir du texte');
        });
    });

    describe('getIdenticalQuestionsIndex', () => {
        it('should return an empty array if there are no identical questions', () => {
            const questions = [
                {
                    _id: '0',
                    text: 'Question 1',
                    points: 100,
                    type: QuestionType.MULTIPLE_CHOICE,
                    choices: [],
                    lastModification: new Date(),
                },
                {
                    _id: '1',
                    text: 'Question 2',
                    points: 100,
                    type: QuestionType.MULTIPLE_CHOICE,
                    choices: [],
                    lastModification: new Date(),
                },
            ];

            expect(service.getIdenticalQuestionsIndex(questions)).toEqual([]);
        });

        it('should return an array with the indexes of the identical questions', () => {
            const questions = [
                {
                    _id: '0',
                    text: 'Question 1',
                    points: 100,
                    type: QuestionType.MULTIPLE_CHOICE,
                    choices: [],
                    lastModification: new Date(),
                },
                {
                    _id: '1',
                    text: 'Question 2',
                    points: 100,
                    type: QuestionType.MULTIPLE_CHOICE,
                    choices: [],
                    lastModification: new Date(),
                },
                {
                    _id: '2',
                    text: 'Question 1',
                    points: 100,
                    type: QuestionType.MULTIPLE_CHOICE,
                    choices: [],
                    lastModification: new Date(),
                },
            ];

            expect(service.getIdenticalQuestionsIndex(questions)).toEqual([0, 2]);
        });
    });
});
