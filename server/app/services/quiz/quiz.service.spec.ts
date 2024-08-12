import { QuizDto, quizSchema } from '@app/model/schema/quiz.schema';
import { MINIMUM_NUMBER_QCM } from '@common/constants/random-mode.constants';
import { Question } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model, mongo } from 'mongoose';
import { QuestionDatabaseService } from '@app/services/database/question/question.service';
import { QuizService } from './quiz.service';

describe('QuizService', () => {
    const quizzes: Quiz[] = [
        {
            _id: new mongo.ObjectId().toString(),
            title: 'Quiz 1',
            description: 'Quiz 1',
            duration: 30,
            lastModification: new Date(),
            visible: true,
            questions: [],
        },
        {
            _id: new mongo.ObjectId().toString(),
            title: 'Quiz 2',
            description: 'Quiz 2',
            duration: 50,
            lastModification: new Date(),
            visible: true,
            questions: [],
        },
    ];
    let service: QuizService;
    let quizModel: Model<QuizDto>;
    let mongodb: MongoMemoryServer;

    beforeAll(async () => {
        mongodb = await MongoMemoryServer.create();
        const mongoUri = mongodb.getUri();
        await mongoose.connect(mongoUri);
        quizModel = mongoose.model(QuizDto.name, quizSchema);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        mongodb.stop();
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizService,
                { provide: getModelToken(QuizDto.name), useValue: quizModel },
                {
                    provide: QuestionDatabaseService,
                    useValue: {
                        getAllQcmQuestions: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<QuizService>(QuizService);
        await quizModel.deleteMany({});
        await quizModel.insertMany(quizzes);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getQuizById', () => {
        it('should return a quiz by its id', async () => {
            const quizId = quizzes[0]._id;

            jest.spyOn(quizModel, 'findById');
            const result = await service.getQuizById(quizId);

            expect(result).toEqual(quizzes[0]);
            expect(quizModel.findById).toHaveBeenCalledWith(quizId);
        });

        it("should return null if the quiz doesn't exist", async () => {
            const quizId = new mongo.ObjectId().toString();

            jest.spyOn(quizModel, 'findById');
            const result = await service.getQuizById(quizId);

            expect(result).toBeNull();
            expect(quizModel.findById).toHaveBeenCalledWith(quizId);
        });
    });

    describe('getRandomQuiz', () => {
        it('should return a random quiz with the expected structure and a set of random questions', async () => {
            jest.spyOn(service, 'generateRandomQuestions').mockResolvedValue([{ title: 'allo' }, { title: 'q2' }] as unknown as Question[]);

            const randomQuiz = await service.getRandomQuiz();

            expect(randomQuiz).toBeDefined();
            expect(randomQuiz._id).toBeDefined();
            expect(randomQuiz.title).toEqual('Mode aléatoire');
            expect(randomQuiz.description).toEqual('Ceci est un quiz aléatoire');
            // to test duration if duration is right
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(randomQuiz.duration).toEqual(20);
            expect(randomQuiz.visible).toBeTruthy();
            expect(randomQuiz.lastModification).toBeDefined();
            expect(service.generateRandomQuestions).toHaveBeenCalled();
        });
    });

    describe('generateRandomQuestions', () => {
        it('should return randomize set of questions from all QCM questions', async () => {
            jest.spyOn(service['questionDatabaseService'], 'getAllQcmQuestions').mockResolvedValue([
                { title: 'allo' },
                { title: 'q2' },
                { title: 'allooo' },
                { title: 'q4' },
                { title: 'q5' },
                { title: 'q6' },
            ] as unknown as Question[]);

            const questions = await service.generateRandomQuestions();

            expect(questions).toHaveLength(MINIMUM_NUMBER_QCM);
        });
    });

    describe('getQuiz', () => {
        it('should call getRandomQuiz if isRandom is true', async () => {
            jest.spyOn(service, 'getRandomQuiz').mockResolvedValueOnce(quizzes[0]);

            await service.getQuiz('123', true);

            expect(service.getRandomQuiz).toHaveBeenCalled();
        });

        it('should call getQuizById if isRandom is false', async () => {
            jest.spyOn(service, 'getQuizById').mockResolvedValueOnce(quizzes[0]);

            await service.getQuiz('123', false);

            expect(service.getQuizById).toHaveBeenCalledWith('123');
        });
    });
});
