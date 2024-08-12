import { QcmDocument, QcmDto } from '@app/model/schema/qcm.schema';
import { objectOptions } from '@app/services/database/database.constants';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';

@Injectable()
export class QuestionDatabaseService {
    constructor(@InjectModel(QcmDto.name) private readonly qmcModel: Model<QcmDocument>) {}

    async getAllQuestions(): Promise<Question[]> {
        return this.qmcModel
            .find()
            .exec()
            .then((questions) => questions.map((question) => question.toObject(objectOptions)));
    }

    async getAllQcmQuestions(): Promise<Question[]> {
        return this.qmcModel
            .find({ type: QuestionType.MULTIPLE_CHOICE })
            .exec()
            .then((questions) => questions.map((question) => question.toObject(objectOptions)));
    }

    async getQuestionById(id: string): Promise<Question> {
        return this.qmcModel
            .findById(id)
            .exec()
            .then((question) => question.toObject(objectOptions));
    }

    async addQuestion(question: Question): Promise<Question> {
        question._id = new mongo.ObjectId().toString();
        question.lastModification = new Date();
        const questionModel = new this.qmcModel(question);
        return questionModel.save().then((newQuestion) => newQuestion.toObject(objectOptions));
    }

    async saveQuestion(id: string, question: Question): Promise<Question> {
        question.lastModification = new Date();
        question._id = id;
        await this.qmcModel
            .findByIdAndUpdate(id, question)
            .exec()
            .then((newQuestion) => newQuestion.toObject(objectOptions));
        return this.getQuestionById(id);
    }

    async deleteQuestion(id: string): Promise<boolean> {
        return await this.qmcModel
            .findByIdAndDelete(id)
            .exec()
            .then((question) => !(question === null));
    }
}
