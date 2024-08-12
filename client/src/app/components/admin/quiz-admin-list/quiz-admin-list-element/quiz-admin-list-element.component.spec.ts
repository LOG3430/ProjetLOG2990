import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { DateService } from '@app/services/date/date.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { of } from 'rxjs';
import { QuizAdminListElementComponent } from './quiz-admin-list-element.component';
import { quizMock } from './quiz.mock';

describe('QuizAdminListElementComponent', () => {
    let component: QuizAdminListElementComponent;
    let fixture: ComponentFixture<QuizAdminListElementComponent>;
    let quizCommunicationServiceSpy: jasmine.SpyObj<QuizCommunicationService>;
    let dateServiceSpy: jasmine.SpyObj<DateService>;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;
    let httpHandlerSpy: jasmine.SpyObj<HttpHandler>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        dateServiceSpy = jasmine.createSpyObj('DateService', ['getDateFormatted', 'getTimeSinceLastModificationMessage']);
        quizCommunicationServiceSpy = jasmine.createSpyObj('QuizCommunicationService', ['updateVisible']);
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['post', 'get', 'delete', 'put']);
        httpHandlerSpy = jasmine.createSpyObj('HttpHandler', ['handle']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            declarations: [QuizAdminListElementComponent],
            imports: [AppMaterialModule],
            providers: [
                { provide: QuizCommunicationService, useValue: quizCommunicationServiceSpy },
                { provide: DateService, useValue: dateServiceSpy },
                { provide: HttpClient, useValue: httpClientSpy },
                { provide: HttpHandler, useValue: httpHandlerSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(QuizAdminListElementComponent);
        component = fixture.componentInstance;
        component.quiz = JSON.parse(JSON.stringify(quizMock));
        component.quiz.lastModification = new Date(component.quiz.lastModification);
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display quiz title', () => {
        fixture.detectChanges();
        const titleElement = fixture.nativeElement.querySelector('#title');
        expect(titleElement.textContent).toContain('Test Quiz');
    });
    it('should display the correct visibility button when quiz is visible', () => {
        fixture.detectChanges();
        const visibilityButton = fixture.nativeElement.querySelector('.visibility');
        expect(visibilityButton.textContent).toContain('visibility');
    });

    it('should display the correct visibility button when quiz is not visible', () => {
        component.quiz.visible = false;

        fixture.detectChanges();
        const visibilityButton = fixture.nativeElement.querySelector('.visibility');
        expect(visibilityButton.textContent).toContain('visibility_off');
    });

    it('should have the not-visible class when quiz is not visible', () => {
        component.quiz.visible = false;

        fixture.detectChanges();
        const container = fixture.nativeElement.querySelector('.container');
        expect(container.classList).toContain('not-visible');
    });

    it('should call editQuiz method when edit button is clicked', () => {
        spyOn(component, 'editQuiz');
        fixture.detectChanges();

        const editButton = fixture.nativeElement.querySelector('#edit');
        editButton.click();
        expect(component.editQuiz).toHaveBeenCalled();
    });

    it('should call deleteQuiz method when delete button is clicked', () => {
        spyOn(component, 'deleteQuiz');
        fixture.detectChanges();

        const deleteButton = fixture.nativeElement.querySelector('#delete');
        deleteButton.click();
        expect(component.deleteQuiz).toHaveBeenCalled();
    });

    it('should call exportQuiz method when export button is clicked', () => {
        spyOn(component, 'exportQuiz');
        fixture.detectChanges();

        const exportButton = fixture.nativeElement.querySelector('#export');
        exportButton.click();
        expect(component.exportQuiz).toHaveBeenCalled();
    });

    it('should toggle visibility', () => {
        quizCommunicationServiceSpy.updateVisible.and.returnValue(of(quizMock));

        component.toggleVisibility();

        expect(component.quiz.visible).toBeTrue();
        expect(quizCommunicationServiceSpy.updateVisible).toHaveBeenCalledWith(quizMock._id, false);
        expect(component.quiz).toEqual(quizMock);
    });

    it('should emit deleteQuizSignal', () => {
        const quizId = 'qwer';
        component.quiz._id = quizId;
        spyOn(component.deleteQuizSignal, 'emit');

        component.deleteQuiz();

        expect(component.deleteQuizSignal.emit).toHaveBeenCalledWith(quizId);
    });

    it('should emit downloadQuizSignal', () => {
        spyOn(component.downloadQuizSignal, 'emit');
        component.exportQuiz();
        expect(component.downloadQuizSignal.emit).toHaveBeenCalled();
    });

    it('should navigate to the edit page for the quiz', () => {
        const testRoute = 'qwer';
        component.quiz._id = testRoute;
        component.editQuiz();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/quiz', testRoute]);
    });

    it('should return time since last modification if component is loaded', () => {
        const expectedMessage = 'Il y a une minute';
        component.componentHasLoaded = true;
        dateServiceSpy.getTimeSinceLastModificationMessage.and.returnValue(expectedMessage);

        const message = component.getTimeSinceLastModificationMessage();

        expect(message).toEqual(expectedMessage);
        expect(dateServiceSpy.getTimeSinceLastModificationMessage).toHaveBeenCalled();
    });

    it('should not return time since last modification if component is loading', () => {
        component.componentHasLoaded = false;

        const message = component.getTimeSinceLastModificationMessage();

        expect(message).toEqual('');
        expect(dateServiceSpy.getTimeSinceLastModificationMessage).toHaveBeenCalled();
    });
});
