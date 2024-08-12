import { TestBed, fakeAsync } from '@angular/core/testing';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { Choice } from '@common/interfaces/choice.dto';
import { Question } from '@common/interfaces/question.dto';
import { getMockQuiz, mockIncompleteQuiz, mockQcmQuestion, mockQrlQuestion, mockQuiz, mockWrongFormat } from './import-export.mock';
import { ImportExportService } from './import-export.service';

// disable no-explicit-any because we are testing
/* eslint-disable  @typescript-eslint/no-explicit-any */

describe('ImportExportService', () => {
    let importExportService: ImportExportService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [HttpClient, HttpHandler],
        });
        importExportService = TestBed.inject(ImportExportService);
    });

    it('should be created', () => {
        expect(importExportService).toBeTruthy();
    });

    describe('exportAsJson', () => {
        it('should export quiz data as JSON', () => {
            const quizData = getMockQuiz();
            const filename = 'test-quiz.json';
            const url = 'test-url';
            const spyObj = jasmine.createSpyObj('a', ['click']);

            spyOn(window.URL, 'createObjectURL').and.returnValue(url);
            const downloadSpy = spyOn(importExportService, 'downloadFileFromUrl');

            importExportService.exportAsJson(quizData, filename, spyObj);

            expect(downloadSpy).toHaveBeenCalledWith(url, filename, spyObj);
            expect(window.URL.createObjectURL).toHaveBeenCalledWith(jasmine.any(Blob));
        });

        it('should not download a file from a URL if the downloadComponent is not defined', () => {
            const url = 'https://example.com/sample-file.json';
            const filename = 'sample-file.json';

            expect(() => importExportService.downloadFileFromUrl(url, filename, undefined as any)).toThrow();
        });
    });

    describe('importFromJson', () => {
        it('should import quiz data from JSON file', fakeAsync(async () => {
            const json = JSON.stringify(getMockQuiz());
            const blob = new Blob([json], { type: 'application/json' });
            const file = new File([blob], 'test.json', { type: 'application/json' });

            spyOn(JSON, 'parse').and.returnValue(mockQuiz);
            spyOn(importExportService, 'jsonToQuizDto').and.returnValue(getMockQuiz());

            await importExportService.importFromJson(file);

            expect(JSON.parse).toHaveBeenCalledWith(json);
            expect(importExportService.jsonToQuizDto).toHaveBeenCalledWith(getMockQuiz());
        }));

        it('should not import invalid quiz data from JSON file', async () => {
            const json = JSON.stringify(mockWrongFormat);
            const blob = new Blob([json], { type: 'application/json' });
            const file = new File([blob], 'test.json', { type: 'application/json' });

            await expectAsync(importExportService.importFromJson(file)).toBeRejected();
        });

        it('should not import incomplete quiz data from JSON file', async () => {
            const json = JSON.stringify(mockIncompleteQuiz);
            const blob = new Blob([json], { type: 'application/json' });
            const file = new File([blob], 'test.json', { type: 'application/json' });

            spyOn(JSON, 'parse').and.returnValue(mockIncompleteQuiz);

            await expectAsync(importExportService.importFromJson(file)).toBeRejected();
            expect(JSON.parse).toHaveBeenCalledWith(json);
        });
    });

    describe('deepCopy', () => {
        it('should deep copy a quiz', () => {
            const quiz = getMockQuiz();
            const copiedQuiz = importExportService.deepCopy(quiz);

            expect({ ...copiedQuiz, lastModification: undefined }).toEqual({ ...quiz, lastModification: undefined });
            expect(copiedQuiz).not.toBe(quiz);
        });
    });

    describe('downloadFileFromUrl', () => {
        it('should download a file from a URL', () => {
            const url = 'file.json';
            const filename = 'sample-file.json';
            const spyObj = jasmine.createSpyObj('a', ['nativeElement']);
            spyObj.nativeElement.click = jasmine.createSpy();

            importExportService.downloadFileFromUrl(url, filename, spyObj);

            expect(spyObj.nativeElement.href).toEqual(url);
            expect(spyObj.nativeElement.download).toEqual(filename);
            expect(spyObj.nativeElement.click).toHaveBeenCalled();
        });
    });

    describe('jsonToDto', () => {
        it('should convert JSON quiz to QuizDto', () => {
            const json = JSON.stringify(getMockQuiz());

            const quizDto = importExportService.jsonToQuizDto(JSON.parse(json));

            spyOn(importExportService, 'jsonToQuestionDto').and.returnValue({} as Question);

            expect(quizDto.title).toEqual(getMockQuiz().title);
            expect(quizDto.visible).toEqual(false);
        });

        it('should convert JSON question to Qcm QuestionDto', () => {
            // disable no-any because we need to change the type of the question to test the function
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            const mockQuestionWithStringType = mockQcmQuestion as any;
            mockQuestionWithStringType.type = 'QCM';
            const json = JSON.stringify(mockQuestionWithStringType);
            const questionDto = importExportService.jsonToQuestionDto(JSON.parse(json));

            spyOn(importExportService, 'jsonToChoice').and.returnValue({} as Choice);

            expect(questionDto.text).toEqual(mockQcmQuestion.text);
            expect(questionDto.points).toEqual(mockQcmQuestion.points);
        });

        it('should convert JSON question to Qrl QuestionDto', () => {
            // disable no-any because we need to change the type of the question to test the function
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            const mockQuestionWithStringType = mockQrlQuestion as any;
            mockQuestionWithStringType.type = 'QRL';
            const json = JSON.stringify(mockQuestionWithStringType);
            const questionDto = importExportService.jsonToQuestionDto(JSON.parse(json));

            spyOn(importExportService, 'jsonToChoice').and.returnValue({} as Choice);

            expect(questionDto.text).toEqual(mockQcmQuestion.text);
            expect(questionDto.points).toEqual(mockQcmQuestion.points);
        });

        it('should convert JSON choice to Choice', () => {
            const json = JSON.stringify(mockQcmQuestion);
            const choice = importExportService.jsonToChoice(JSON.parse(json));

            expect(choice.text).toEqual(choice.text);
            expect(choice.isCorrect).toEqual(choice.isCorrect);
        });
    });
});
