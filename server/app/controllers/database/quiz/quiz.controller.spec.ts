import { QuizDatabaseService } from '@app/services/database/quiz/quiz.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Quiz } from '@common/interfaces/quiz.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { QuizDatabaseController } from './quiz.controller';

describe('QuizDatabaseController', () => {
    let controller: QuizDatabaseController;
    let quizDatabaseService: QuizDatabaseService;
    let quizService: QuizService;

    const mockQuizzes: Quiz[] = [
        {
            _id: '1',
            title: 'Quiz 1',
            description: 'Quiz 1',
            duration: 30,
            lastModification: new Date(),
            visible: true,
            questions: [],
        },
        {
            _id: '2',
            title: 'Quiz 2',
            description: 'Quiz 2',
            duration: 50,
            lastModification: new Date(),
            visible: true,
            questions: [],
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuizDatabaseController],
            providers: [
                {
                    provide: QuizDatabaseService,
                    useValue: {
                        getAllQuizzes: jest.fn(),
                        addQuiz: jest.fn(),
                        updateQuiz: jest.fn(),
                        deleteQuiz: jest.fn(),
                    },
                },

                {
                    provide: QuizService,
                    useValue: {
                        getQuizById: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<QuizDatabaseController>(QuizDatabaseController);
        quizDatabaseService = module.get<QuizDatabaseService>(QuizDatabaseService);
        quizService = module.get<QuizService>(QuizService);
    });

    describe('getAllQuizzes', () => {
        it('should return an array of quizzes', async () => {
            await controller.getAllQuizzes();
            expect(quizDatabaseService.getAllQuizzes).toHaveBeenCalledTimes(1);
        });
    });

    describe('getQuizById', () => {
        it('should return a quiz by id', async () => {
            await controller.getQuizById('1');
            expect(quizService.getQuizById).toHaveBeenCalledTimes(1);
        });
    });
    describe('addQuiz', () => {
        it('should add a new quiz', async () => {
            const quiz: Quiz = mockQuizzes[0];
            await controller.addQuiz(quiz);

            expect(quizDatabaseService.addQuiz).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateQuizWithDate', () => {
        it('should try to update a quiz by id', async () => {
            await controller.updateQuizWithDate('1', mockQuizzes[0]);
            expect(quizDatabaseService.updateQuiz).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateQuizWithoutDate', () => {
        it('should try to update a quiz by id', async () => {
            await controller.updateQuizWithoutDate('1', mockQuizzes[0]);
            expect(quizDatabaseService.updateQuiz).toHaveBeenCalledWith('1', mockQuizzes[0], false);
        });
    });

    describe('deleteQuiz', () => {
        it('should delete a quiz by id', async () => {
            await controller.deleteQuiz('1');
            expect(quizDatabaseService.deleteQuiz).toHaveBeenCalledTimes(1);
        });
    });
});
