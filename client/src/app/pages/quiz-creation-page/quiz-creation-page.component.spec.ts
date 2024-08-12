import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { ChoiceComponent } from '@app/components/admin/choice/choice.component';
import { QuestionBankComponent } from '@app/components/admin/question-bank/question-bank.component';
import { QuestionComponent } from '@app/components/admin/question/question.component';
import { QuizBankAdminComponent } from '@app/components/admin/quiz-bank-admin/quiz-bank-admin.component';
import { QuizComponent } from '@app/components/admin/quiz/quiz.component';
import { SpinnerComponent } from '@app/components/spinner/spinner.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { of } from 'rxjs';
import { QuizCreationPageComponent } from './quiz-creation-page.component';

/* disabled no-explicit-any to make test more concised */
/* eslint-disable  @typescript-eslint/no-explicit-any */

describe('QuizCreationPageComponent', () => {
    let component: QuizCreationPageComponent;
    let fixture: ComponentFixture<QuizCreationPageComponent>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let questionBankServiceSpy: jasmine.SpyObj<QuestionBankService>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        questionBankServiceSpy = jasmine.createSpyObj('QuestionBankService', ['currentQuiz', 'reloadData']);
        questionBankServiceSpy.questions = [];
        TestBed.configureTestingModule({
            declarations: [
                QuizCreationPageComponent,
                QuizBankAdminComponent,
                QuestionBankComponent,
                SpinnerComponent,
                QuizComponent,
                QuestionComponent,
                ChoiceComponent,
            ],
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule],
            providers: [
                HttpClient,
                HttpHandler,
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: QuestionBankService, useValue: questionBankServiceSpy },
                { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => 'mockQuizId' }) } },
            ],
        });
        fixture = TestBed.createComponent(QuizCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('canDeactivate', () => {
        it('should open dialog if quiz has changed', () => {
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            questionBankServiceSpy.currentQuiz = { hasChanged: true } as any;
            component.canDeactivate();
            expect(matDialogSpy.open).toHaveBeenCalled();
        });

        it('should return true and not open dialog if quiz has not changed', () => {
            questionBankServiceSpy.currentQuiz = { hasChanged: false } as any;
            component.canDeactivate();
            expect(matDialogSpy.open).not.toHaveBeenCalled();
            expect(component.canDeactivate()).toBeTrue();
        });

        it('should return true if dialog is confirmed', () => {
            matDialogSpy.open.and.returnValue({ afterClosed: () => true } as any);
            questionBankServiceSpy.currentQuiz = { hasChanged: true } as any;
            expect(component.canDeactivate()).toBeTrue();
        });

        it('should return false if dialog is not confirmed', () => {
            matDialogSpy.open.and.returnValue({ afterClosed: () => false } as any);
            questionBankServiceSpy.currentQuiz = { hasChanged: true } as any;
            expect(component.canDeactivate()).toBeFalse();
        });
    });
});
