import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_PATH } from '@app/constants/question-communication.service.constants';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { QuestionType } from '@common/interfaces/question.dto';
import { QuestionCommunicationService } from './question-communication.service';

describe('QuestionCommunicationService', () => {
    let service: QuestionCommunicationService;
    let httpMock: HttpTestingController;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [QuestionCommunicationService, HttpCommunicationService],
        });
        service = TestBed.inject(QuestionCommunicationService);
        httpMock = TestBed.inject(HttpTestingController);

        const communicationService = TestBed.inject(HttpCommunicationService);
        baseUrl = communicationService['baseUrl'] + '/' + API_PATH;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch all questions', () => {
        const dummyQuestions = [
            { _id: '1', text: 'Question 1', description: 'Question 1', points: 10, type: QuestionType.MULTIPLE_CHOICE, choices: [] },
            { _id: '2', text: 'Question 2', description: 'Question 2', points: 10, type: QuestionType.MULTIPLE_CHOICE, choices: [] },
        ];

        service.fetchAllQuestions().subscribe((questions) => {
            expect(questions.length).toBe(2);
            expect(questions).toEqual(dummyQuestions);
        });

        const req = httpMock.expectOne(`${baseUrl}`);
        expect(req.request.method).toBe('GET');
        req.flush(dummyQuestions);
    });

    it('should fetch question by id', () => {
        const dummyQuestion = {
            _id: '1',
            text: 'Question 1',
            description: 'Question 1',
            points: 10,
            type: QuestionType.MULTIPLE_CHOICE,
            choices: [],
        };
        const questionId = dummyQuestion._id;

        service.fetchQuestionById(questionId).subscribe((question) => {
            expect(question).toEqual(dummyQuestion);
        });

        const req = httpMock.expectOne(`${baseUrl}/${dummyQuestion._id}`);
        expect(req.request.method).toBe('GET');
        req.flush(dummyQuestion);
    });

    it('should add a question', () => {
        const dummyQuestion = {
            _id: '1',
            text: 'Question 1',
            description: 'Question 1',
            points: 10,
            type: QuestionType.MULTIPLE_CHOICE,
            choices: [],
        };

        service.addQuestion(dummyQuestion).subscribe((question) => {
            expect(question).toEqual(dummyQuestion);
        });

        const req = httpMock.expectOne(`${baseUrl}`);
        expect(req.request.method).toBe('POST');
        req.flush(dummyQuestion);
    });

    it('should save a question', () => {
        const dummyQuestion = {
            _id: '1',
            text: 'Question 1',
            description: 'Question 1',
            points: 10,
            type: QuestionType.MULTIPLE_CHOICE,
            choices: [],
        };

        service.saveQuestion(dummyQuestion).subscribe((question) => {
            expect(question).toEqual(dummyQuestion);
        });

        const req = httpMock.expectOne(`${baseUrl}/${dummyQuestion._id}`);
        expect(req.request.method).toBe('PUT');
        req.flush(dummyQuestion);
    });

    it('should delete a question', () => {
        const questionId = '1';

        service.deleteQuestion(questionId).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/${questionId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });
});
