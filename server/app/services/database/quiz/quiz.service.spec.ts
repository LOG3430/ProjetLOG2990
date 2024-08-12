import { QuizDto, quizSchema } from '@app/model/schema/quiz.schema';
import { objectOptions } from '@app/services/database/database.constants';
import { Quiz } from '@common/interfaces/quiz.dto';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model, mongo } from 'mongoose';
import { QuizDatabaseService } from './quiz.service';
describe('QuizDatabaseService', () => {
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

    const newQuiz: Quiz = {
        _id: new mongo.ObjectId().toString(),
        title: 'New Quiz',
        description: 'New Quiz',
        duration: 30,
        lastModification: new Date(),
        visible: true,
        questions: [],
    };

    let service: QuizDatabaseService;
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
            providers: [QuizDatabaseService, { provide: getModelToken(QuizDto.name), useValue: quizModel }],
        }).compile();

        service = module.get<QuizDatabaseService>(QuizDatabaseService);
        await quizModel.deleteMany({});
        await quizModel.insertMany(quizzes);
    });

    describe('getAllQuizzes', () => {
        it('should return an array of quizzes', async () => {
            jest.spyOn(quizModel, 'find');
            const result = await service.getAllQuizzes();
            expect(result).toBeInstanceOf(Array<Quiz>);
            expect(quizModel.find).toHaveBeenCalled();
        });
    });

    describe('addQuiz', () => {
        it('should add a new quiz to the database', async () => {
            jest.spyOn(quizModel.prototype, 'save');
            const result = await service.addQuiz(newQuiz);

            expect(result.title).toEqual(newQuiz.title);
            expect(quizModel.prototype.save).toHaveBeenCalledWith();
        });

        it('should generate a new id if none is provided', async () => {
            newQuiz._id = undefined;
            const result = await service.addQuiz(newQuiz);
            expect(result._id).toBeDefined();
        });
    });

    describe('updateQuiz', () => {
        it('should update a quiz by its id', async () => {
            const quizId = quizzes[0]._id;
            jest.spyOn(quizModel, 'findByIdAndUpdate');
            const result = await service.updateQuiz(quizId, newQuiz);
            expect(result.title).toEqual(newQuiz.title);
        });

        it('should create the quiz if it has been deleted', async () => {
            jest.spyOn(service, 'addQuiz');
            const deletedQuiz: Quiz = (await quizModel.findByIdAndDelete(quizzes[0]._id)).toObject(objectOptions);
            await service.updateQuiz(deletedQuiz._id, newQuiz);
            expect(service.addQuiz).toHaveBeenCalledWith(newQuiz);
        });
    });

    describe('deleteQuiz', () => {
        it('should delete a quiz by its id', async () => {
            const quizId = quizzes[0]._id;
            jest.spyOn(quizModel, 'findByIdAndDelete');

            await service.deleteQuiz(quizId);

            expect(quizModel.findByIdAndDelete).toHaveBeenCalledWith(quizId);
        });
        it('should return true if the quiz was deleted', async () => {
            const quizId = quizzes[0]._id;
            const result = await service.deleteQuiz(quizId);
            expect(result).toBe(true);
        });
        it('should return false if the quiz was not deleted', async () => {
            const quizId = new mongo.ObjectId().toString();
            const result = await service.deleteQuiz(quizId);
            expect(result).toBe(false);
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });
});
