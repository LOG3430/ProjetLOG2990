import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HistoryListMockComponent } from '@app/components/admin/history-list/history-list.mock.component';
import { QuestionBankComponent } from '@app/components/admin/question-bank/question-bank.component';
import { QuizAdminListComponent } from '@app/components/admin/quiz-admin-list/quiz-admin-list/quiz-admin-list.component';
import { QuizComponent } from '@app/components/admin/quiz/quiz.component';
import { SpinnerComponent } from '@app/components/spinner/spinner.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { of } from 'rxjs';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let questionBankServiceSpy: jasmine.SpyObj<QuestionBankService>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        questionBankServiceSpy = jasmine.createSpyObj('QuestionBankService', ['haveQuestionsChanged', 'reloadData']);
        questionBankServiceSpy.questions = [];
        TestBed.configureTestingModule({
            declarations: [
                AdminPageComponent,
                QuestionBankComponent,
                QuizAdminListComponent,
                SpinnerComponent,
                QuizComponent,
                HistoryListMockComponent,
            ],
            imports: [AppMaterialModule, NoopAnimationsModule],
            providers: [
                HttpClient,
                HttpHandler,
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: QuestionBankService, useValue: questionBankServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('canDeactivate', () => {
        it('should open dialog if questions have changed', () => {
            /* disabled no-explicit-any to make test more concised */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            questionBankServiceSpy.haveQuestionsChanged.and.returnValue(true);
            component.canDeactivate();
            expect(matDialogSpy.open).toHaveBeenCalled();
        });

        it('should return true and not open dialog if questions have not changed', () => {
            questionBankServiceSpy.haveQuestionsChanged.and.returnValue(false);
            component.canDeactivate();
            expect(matDialogSpy.open).not.toHaveBeenCalled();
            expect(component.canDeactivate()).toBeTrue();
        });

        it('should return true if dialog is confirmed', () => {
            /* disabled no-explicit-any to make test more concised */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            matDialogSpy.open.and.returnValue({ afterClosed: () => true } as any);
            questionBankServiceSpy.haveQuestionsChanged.and.returnValue(true);
            expect(component.canDeactivate()).toBeTrue();
        });

        it('should return false if dialog is not confirmed', () => {
            /* disabled no-explicit-any to make test more concised */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            matDialogSpy.open.and.returnValue({ afterClosed: () => false } as any);
            questionBankServiceSpy.haveQuestionsChanged.and.returnValue(true);
            expect(component.canDeactivate()).toBeFalse();
        });
    });
});
