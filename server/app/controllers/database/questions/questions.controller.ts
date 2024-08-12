import { QuestionDatabaseService } from '@app/services/database/question/question.service';
import { Question } from '@common/interfaces/question.dto';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

@Controller('db/questions')
export class QuestionDatabaseController {
    constructor(private readonly dbService: QuestionDatabaseService) {}
    @Get('/')
    async getAllQuestions(): Promise<Question[]> {
        return this.dbService.getAllQuestions();
    }

    @Get('/:id')
    async getQuestionById(@Param('id') id: string): Promise<Question> {
        return this.dbService.getQuestionById(id);
    }

    @Put('/:id')
    async saveQuestion(@Param('id') id: string, @Body() question: Question): Promise<Question> {
        return this.dbService.saveQuestion(id, question);
    }

    @Post('/')
    async addQuestion(@Body() question: Question): Promise<Question> {
        return this.dbService.addQuestion(question);
    }

    @Delete('/:id')
    async deleteQuestion(@Param('id') id: string): Promise<boolean> {
        return this.dbService.deleteQuestion(id);
    }
}
