import { QcmDocument, QcmDto, qcmSchema } from '@app/model/schema/qcm.schema';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model, mongo } from 'mongoose';
import { QuestionDatabaseService } from './question.service';

describe('DatabaseService', () => {
    let service: QuestionDatabaseService;
    let qmcModel: Model<QcmDto>;
    let mongodb: MongoMemoryServer;
    const stubQuestions: Question[] = [
        {
            _id: new mongo.ObjectId().toString(),
            text: 'test',
            points: 10,
            type: QuestionType.LONG_ANSWER,
            choices: [],
        },
        {
            _id: new mongo.ObjectId().toString(),
            text: 'test2',
            points: 50,
            type: QuestionType.MULTIPLE_CHOICE,
            choices: [
                { text: 'test', isCorrect: true },
                { text: 'test2', isCorrect: false },
            ],
        },
        {
            _id: new mongo.ObjectId().toString(),
            text: 'test3',
            points: 20,
            type: QuestionType.LONG_ANSWER,
            choices: [],
        },
    ];

    beforeAll(async () => {
        mongodb = await MongoMemoryServer.create();
        const mongoUri = mongodb.getUri();
        await mongoose.connect(mongoUri);
        qmcModel = mongoose.model(QcmDto.name, qcmSchema);
    });
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [QuestionDatabaseService, { provide: getModelToken(QcmDto.name), useValue: qmcModel }],
        }).compile();

        service = module.get<QuestionDatabaseService>(QuestionDatabaseService);
        qmcModel = module.get<Model<QcmDocument>>(getModelToken(QcmDto.name));

        await qmcModel.deleteMany({});
        await qmcModel.insertMany(stubQuestions);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        mongodb.stop();
    });

    describe('getAllQuestions', () => {
        it('should return an array of Question', async () => {
            const result = await service.getAllQuestions();
            expect(result).toEqual(stubQuestions);
        });
    });

    describe('getAllQcmQuestions', () => {
        it('should return only questions of type MULTIPLE_CHOICE', async () => {
            const result = await service.getAllQcmQuestions();
            const expectedQuestions = stubQuestions.filter((question) => question.type === QuestionType.MULTIPLE_CHOICE);

            expect(result).toEqual(expectedQuestions);
        });
    });

    describe('getQuestionById', () => {
        it('should return a Question by id', async () => {
            const result = await service.getQuestionById(stubQuestions[0]._id);
            expect(result).toEqual(stubQuestions[0]);
        });
    });

    describe('addQuestion', () => {
        it('should add a new question and return the added Question', async () => {
            const newQuestion: Question = {
                _id: new mongo.ObjectId().toString(),
                text: 'test',
                points: 10,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [],
            };
            const result = await service.addQuestion(newQuestion);
            expect(result).toEqual(newQuestion);
        });

        it('should generate a new id if none is provided', async () => {
            const newQuestion: Question = {
                _id: undefined,
                text: 'test',
                points: 10,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [],
            };
            const result = await service.addQuestion(newQuestion);
            expect(result._id).toBeDefined();
        });
    });

    describe('saveQuestion', () => {
        it('should update a question and return the updated Question', async () => {
            const updatedQuestion: Question = {
                _id: stubQuestions[0]._id,
                text: 'updated',
                points: 20,
                type: QuestionType.LONG_ANSWER,
                choices: [],
            };
            const result = await service.saveQuestion(stubQuestions[0]._id, updatedQuestion);
            expect(result).toEqual(updatedQuestion);
        });

        it("should save the question id to the new id if they don't match", async () => {
            const updatedQuestion: Question = {
                _id: new mongo.ObjectId().toString(),
                text: 'updated',
                points: 20,
                type: QuestionType.LONG_ANSWER,
                choices: [],
            };
            const result = await service.saveQuestion(stubQuestions[0]._id, updatedQuestion);
            expect(result._id).toEqual(stubQuestions[0]._id);
        });
    });

    describe('deleteQuestion', () => {
        it('should delete a question by id', async () => {
            await service.deleteQuestion(stubQuestions[0]._id);
            const result = await service.getAllQuestions();
            expect(result).toEqual(stubQuestions.slice(1));
        });

        it('should return true if the question was deleted', async () => {
            const result = await service.deleteQuestion(stubQuestions[0]._id);
            expect(result).toBe(true);
        });

        it('should return false if the question was not deleted', async () => {
            const result = await service.deleteQuestion(new mongo.ObjectId().toString());
            expect(result).toBe(false);
        });
    });
});
