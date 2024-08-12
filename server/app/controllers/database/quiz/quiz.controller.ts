import { QuizDatabaseService } from '@app/services/database/quiz/quiz.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Quiz } from '@common/interfaces/quiz.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';

@Controller('/db/quiz')
export class QuizDatabaseController {
    constructor(
        private readonly quizCommunicationService: QuizDatabaseService,
        private readonly quizService: QuizService,
    ) {}

    @Get('/')
    async getAllQuizzes() {
        return this.quizCommunicationService.getAllQuizzes();
    }

    @Get('/:id')
    async getQuizById(@Param('id') id: string) {
        return this.quizService.getQuizById(id);
    }

    @Post('/')
    async addQuiz(@Body() quiz: Quiz) {
        return this.quizCommunicationService.addQuiz(quiz);
    }

    @Patch('/:id')
    async updateQuizWithoutDate(@Param('id') id: string, @Body() quiz: Partial<Quiz>) {
        return this.quizCommunicationService.updateQuiz(id, quiz, false);
    }

    @Put('/:id')
    async updateQuizWithDate(@Param('id') id: string, @Body() quiz: Partial<Quiz>) {
        return this.quizCommunicationService.updateQuiz(id, quiz);
    }

    @Delete('/:id')
    async deleteQuiz(@Param('id') id: string): Promise<boolean> {
        return this.quizCommunicationService.deleteQuiz(id);
    }
}
