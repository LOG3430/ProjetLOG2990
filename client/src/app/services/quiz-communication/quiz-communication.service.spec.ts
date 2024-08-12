import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { QuizCommunicationService } from './quiz-communication.service';

describe('QuizCommunicationService', () => {
    let service: QuizCommunicationService;
    let httpMock: HttpTestingController;
    let baseUrl: string;
    let apiPath: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [HttpCommunicationService, QuizCommunicationService],
        });
        service = TestBed.inject(QuizCommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        apiPath = service['apiPath'];

        const communicationService = TestBed.inject(HttpCommunicationService);
        baseUrl = communicationService['baseUrl'] + '/' + apiPath;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch all quizzes', () => {
        const dummyQuizzes = [
            { _id: '1', title: 'Quiz 1', description: 'Quiz 1', duration: 30, lastModification: new Date(), visible: true, questions: [] },
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 30, lastModification: new Date(), visible: true, questions: [] },
        ];

        service.fetchAllQuizzes().subscribe((quizzes) => {
            expect(quizzes).toEqual(dummyQuizzes);
        });

        const req = httpMock.expectOne(baseUrl);
        expect(req.request.method).toBe('GET');
        req.flush(dummyQuizzes);
    });

    it('should fetch quiz by id', () => {
        const dummyQuiz = {
            _id: '1',
            title: 'Quiz 1',
            description: 'Quiz 1',
            duration: 30,
            lastModification: new Date(),
            visible: true,
            questions: [],
        };
        const quizId = '1';

        service.fetchQuizById(quizId).subscribe((quiz) => {
            expect(quiz).toEqual(dummyQuiz);
        });

        const req = httpMock.expectOne(`${baseUrl}/${quizId}`);
        expect(req.request.method).toBe('GET');
        req.flush(dummyQuiz);
    });

    it('should add a quiz', () => {
        const dummyQuiz = {
            _id: '1',
            title: 'Quiz 1',
            description: 'Quiz 1',
            duration: 30,
            lastModification: new Date(),
            visible: true,
            questions: [],
        };

        service.addQuiz(dummyQuiz).subscribe((quiz) => {
            expect(quiz).toEqual(dummyQuiz);
        });

        const req = httpMock.expectOne(baseUrl);
        expect(req.request.method).toBe('POST');
        req.flush(dummyQuiz);
    });

    it('should update quiz visibility', () => {
        const quizId = '1';
        const newValue = true;

        service.updateVisible(quizId, newValue).subscribe((quiz) => {
            expect(quiz.visible).toBe(newValue);
        });

        const req = httpMock.expectOne(`${baseUrl}/${quizId}`);
        expect(req.request.method).toBe('PATCH');
        req.flush({ visible: newValue });
    });

    it('should delete a quiz', () => {
        const quizId = '1';

        service.deleteQuiz(quizId).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/${quizId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });

    it('should save a quiz', () => {
        const dummyQuiz = {
            _id: '1',
            title: 'Quiz 1',
            description: 'Quiz 1',
            duration: 30,
            lastModification: new Date(),
            visible: true,
            questions: [],
        };

        service.saveQuiz(dummyQuiz).subscribe((quiz) => {
            expect(quiz).toEqual(dummyQuiz);
        });

        const req = httpMock.expectOne(`${baseUrl}/${dummyQuiz._id}`);
        expect(req.request.method).toBe('PUT');
        req.flush(dummyQuiz);
    });
});
