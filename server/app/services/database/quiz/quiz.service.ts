import { QuizDocument, QuizDto } from '@app/model/schema/quiz.schema';
import { objectOptions } from '@app/services/database/database.constants';
import { Quiz } from '@common/interfaces/quiz.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
@Injectable()
export class QuizDatabaseService {
    constructor(@InjectModel(QuizDto.name) private readonly quizModel: Model<QuizDocument>) {}

    async getAllQuizzes(): Promise<Quiz[]> {
        return this.quizModel
            .find()
            .exec()
            .then((quizzes) => quizzes.map((quiz) => quiz.toObject(objectOptions)));
    }

    async addQuiz(quiz: Partial<Quiz>): Promise<Quiz> {
        quiz._id = new mongo.ObjectId().toString();
        quiz.lastModification = new Date();
        const newQuiz = new this.quizModel(quiz);
        return newQuiz.save().then((q) => q.toObject(objectOptions));
    }

    async updateQuiz(id: string, updatedQuiz: Partial<Quiz>, shouldUpdateDate: boolean = true): Promise<Quiz> {
        if (shouldUpdateDate) {
            updatedQuiz.lastModification = new Date();
        }
        updatedQuiz._id = id;
        return this.quizModel
            .findByIdAndUpdate(id, updatedQuiz, { new: true })
            .exec()
            .then(async (quiz) => {
                return quiz ? quiz.toObject(objectOptions) : this.addQuiz(updatedQuiz);
            });
    }

    async deleteQuiz(id: string): Promise<boolean> {
        return await this.quizModel
            .findByIdAndDelete(id)
            .exec()
            .then((q) => {
                return !(q === null);
            });
    }
}
