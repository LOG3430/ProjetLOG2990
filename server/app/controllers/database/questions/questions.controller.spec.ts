import { QuestionDatabaseService } from '@app/services/database/question/question.service';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionDatabaseController } from './questions.controller';

describe('DatabaseController', () => {
    let controller: QuestionDatabaseController;
    let dbService: QuestionDatabaseService;
    let questions: Question[];

    beforeEach(async () => {
        questions = [
            {
                _id: '123',
                type: QuestionType.MULTIPLE_CHOICE,
                text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                points: 40,
                choices: [
                    {
                        text: 'var',
                        isCorrect: true,
                    },
                    {
                        text: 'self',
                        isCorrect: false,
                    },
                    {
                        text: 'this',
                        isCorrect: true,
                    },
                    {
                        text: 'int',
                        isCorrect: false,
                    },
                ],
            },
            {
                _id: '123',
                type: QuestionType.LONG_ANSWER,
                text: "Donnez la différence entre 'let' et 'var' pour la déclaration d'une variable en JS ?",
                points: 60,
            },
            {
                _id: '123',
                type: QuestionType.MULTIPLE_CHOICE,
                text: "Est-ce qu'on le code suivant lance une erreur : const a = 1/NaN; ? ",
                points: 20,
                choices: [
                    {
                        text: 'Non',
                        isCorrect: true,
                    },
                    {
                        text: 'Oui',
                        isCorrect: null,
                    },
                ],
            },
        ];

        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuestionDatabaseController],
            providers: [
                {
                    provide: QuestionDatabaseService,
                    useValue: {
                        getAllQuestions: jest.fn(),
                        getQuestionById: jest.fn(),
                        addQuestion: jest.fn(),
                        saveQuestion: jest.fn(),
                        deleteQuestion: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<QuestionDatabaseController>(QuestionDatabaseController);
        dbService = module.get<QuestionDatabaseService>(QuestionDatabaseService);
    });

    describe('getAllQuestions', () => {
        it('should return an array of QMCDocument', async () => {
            const spy = jest.spyOn(dbService, 'getAllQuestions');
            spy.mockResolvedValue(questions);

            const result = await controller.getAllQuestions();

            expect(result).toEqual(questions);
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('getQuestionById', () => {
        it('should return a QMCDocument by id', async () => {
            const questionId = '123';
            jest.spyOn(dbService, 'getQuestionById').mockResolvedValue(questions[0]);

            const result = await controller.getQuestionById(questionId);

            expect(result).toEqual(questions[0]);
            expect(dbService.getQuestionById).toHaveBeenCalledWith(questionId);
        });
    });

    describe('saveQuestion', () => {
        it('should save a QMCDocument and return the updated QMCDocument', async () => {
            const updatedQuestion: Question = {
                _id: '123',
                type: QuestionType.MULTIPLE_CHOICE,
                text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                points: 40,
                choices: [
                    {
                        text: 'var',
                        isCorrect: true,
                    },
                    {
                        text: 'self',
                        isCorrect: false,
                    },
                    {
                        text: 'this',
                        isCorrect: true,
                    },
                    {
                        text: 'int',
                        isCorrect: false,
                    },
                ],
            };
            await controller.saveQuestion(updatedQuestion._id, updatedQuestion);

            expect(dbService.saveQuestion).toHaveBeenCalledWith(updatedQuestion._id, updatedQuestion);
        });
    });

    describe('addQuestion', () => {
        it('should add a new question and return the created QMCDocument', async () => {
            const createdQuestion: Question = {
                _id: '123',
                type: QuestionType.MULTIPLE_CHOICE,
                text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                points: 40,
                choices: [
                    {
                        text: 'var',
                        isCorrect: true,
                    },
                    {
                        text: 'self',
                        isCorrect: false,
                    },
                    {
                        text: 'this',
                        isCorrect: true,
                    },
                    {
                        text: 'int',
                        isCorrect: false,
                    },
                ],
            };

            jest.spyOn(dbService, 'addQuestion').mockResolvedValue(createdQuestion);

            const result = await controller.addQuestion(createdQuestion);

            expect(result).toEqual(createdQuestion);
            expect(dbService.addQuestion).toHaveBeenCalledWith(createdQuestion);
        });
    });

    describe('deleteQuestion', () => {
        it('should delete a question by id', async () => {
            const questionId = '123';
            await controller.deleteQuestion(questionId);

            expect(dbService.deleteQuestion).toHaveBeenCalledWith(questionId);
        });
    });
});
