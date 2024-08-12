import { Injectable } from '@angular/core';
import { API_PATH } from '@app/constants/question-communication.service.constants';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { Question } from '@common/interfaces/question.dto';

@Injectable({
    providedIn: 'root',
})
export class QuestionCommunicationService {
    constructor(private communicationService: HttpCommunicationService) {}

    fetchAllQuestions() {
        return this.communicationService.basicGet<Question[]>(API_PATH);
    }

    fetchQuestionById(id: string) {
        return this.communicationService.basicGet<Question>(`${API_PATH}/${id}`);
    }

    addQuestion(question: Question) {
        return this.communicationService.basicPost<Question, Question>(API_PATH, question);
    }

    saveQuestion(question: Question) {
        return this.communicationService.basicPut<Question, Question>(`${API_PATH}/${question._id}`, question);
    }

    deleteQuestion(id: string) {
        return this.communicationService.basicDelete(`${API_PATH}/${id}`);
    }
}
