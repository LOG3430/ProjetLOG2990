import { Injectable } from '@angular/core';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { Quiz } from '@common/interfaces/quiz.dto';

@Injectable({
    providedIn: 'root',
})
export class QuizCommunicationService {
    apiPath: string = 'db/quiz';

    constructor(private communicationService: HttpCommunicationService) {}

    fetchAllQuizzes() {
        return this.communicationService.basicGet<Quiz[]>(this.apiPath);
    }

    fetchQuizById(id: string) {
        return this.communicationService.basicGet<Quiz>(`${this.apiPath}/${id}`);
    }

    addQuiz(quiz: Quiz) {
        return this.communicationService.basicPost<Quiz, Quiz>(this.apiPath, quiz);
    }

    saveQuiz(quiz: Quiz) {
        return this.communicationService.basicPut<Quiz, Quiz>(`${this.apiPath}/${quiz._id}`, quiz);
    }

    updateVisible(id: string, newValue: boolean) {
        return this.communicationService.basicPatch<{ visible: boolean }, Quiz>(`${this.apiPath}/${id}`, { visible: newValue });
    }

    deleteQuiz(id: string) {
        return this.communicationService.basicDelete(`${this.apiPath}/${id}`);
    }
}
