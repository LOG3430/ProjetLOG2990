import { QuizDocument, QuizDto } from '@app/model/schema/quiz.schema';
import { objectOptions } from '@app/services/database/database.constants';
import { QuestionDatabaseService } from '@app/services/database/question/question.service';
import { MINIMUM_NUMBER_QCM } from '@common/constants/random-mode.constants';
import { Question } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';

@Injectable()
export class QuizService {
    constructor(
        @InjectModel(QuizDto.name) private readonly quizModel: Model<QuizDocument>,
        private questionDatabaseService: QuestionDatabaseService,
    ) {}

    async getQuizById(id: string): Promise<Quiz> {
        return this.quizModel
            .findById(id)
            .exec()
            .then((quiz) => {
                return quiz ? quiz.toObject(objectOptions) : null;
            });
    }

    async getRandomQuiz(): Promise<Quiz> {
        return {
            _id: new mongo.ObjectId().toString(),
            title: 'Mode aléatoire',
            description: 'Ceci est un quiz aléatoire',
            duration: 20,
            visible: true,
            lastModification: new Date(),
            questions: await this.generateRandomQuestions(),
        };
    }

    async generateRandomQuestions(): Promise<Question[]> {
        const questions = await this.questionDatabaseService.getAllQcmQuestions();

        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }

        return questions.slice(0, MINIMUM_NUMBER_QCM);
    }

    async getQuiz(id: string, isRandom: boolean): Promise<Quiz> {
        return isRandom ? this.getRandomQuiz() : this.getQuizById(id);
    }
}
