import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ChoiceComponent } from '@app/components/admin/choice/choice.component';
import { QuestionBankComponent } from '@app/components/admin/question-bank/question-bank.component';
import { QuestionComponent } from '@app/components/admin/question/question.component';
import { QuizComponent } from '@app/components/admin/quiz/quiz.component';
import { SpinnerComponent } from '@app/components/spinner/spinner.component';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { of } from 'rxjs';
import { QuizBankAdminComponent } from './quiz-bank-admin.component';

/* disabled no-explicit-any to make test more concised */
/* eslint-disable  @typescript-eslint/no-explicit-any */

describe('QuizBankAdminComponent', () => {
    let component: QuizBankAdminComponent;
    let fixture: ComponentFixture<QuizBankAdminComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let drawerSpy: jasmine.SpyObj<MatDrawer>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        drawerSpy = jasmine.createSpyObj('MatDrawer', ['open']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QuizBankAdminComponent, QuestionBankComponent, SpinnerComponent, QuizComponent, QuestionComponent, ChoiceComponent],
            imports: [RouterTestingModule, AppMaterialModule, NoopAnimationsModule, FormsModule],
            providers: [
                HttpClient,
                HttpHandler,
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: MatDrawer, useValue: drawerSpy },
                QuizCommunicationService,
                QuestionBankService,
                { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => 'mockQuizId' }) } },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuizBankAdminComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to admin page on exitToAdminPage', () => {
        component.exitToAdminPage();
        expect(routerSpy.navigate).toHaveBeenCalledWith([AppRoutes.Admin]);
    });

    it('should open the drawer on openDrawer', () => {
        component.drawer = drawerSpy;
        component.openDrawer();
        expect(drawerSpy.open).toHaveBeenCalled();
    });

    describe('canDeactivate', () => {
        it('should open dialog if quiz has changed', () => {
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            component.quiz = { data: { hasChanged: true } } as any;
            component.canDeactivate();
            expect(matDialogSpy.open).toHaveBeenCalled();
        });

        it('should return true and not open dialog if quiz has not changed', () => {
            component.quiz = { data: { hasChanged: false } } as any;
            component.canDeactivate();
            expect(matDialogSpy.open).not.toHaveBeenCalled();
            expect(component.canDeactivate()).toBeTrue();
        });

        it('should return true if dialog is confirmed', () => {
            matDialogSpy.open.and.returnValue({ afterClosed: () => true } as any);
            component.quiz = { data: { hasChanged: true } } as any;
            expect(component.canDeactivate()).toBeTrue();
        });

        it('should return false if dialog is not confirmed', () => {
            matDialogSpy.open.and.returnValue({ afterClosed: () => false } as any);
            component.quiz = { data: { hasChanged: true } } as any;
            expect(component.canDeactivate()).toBeFalse();
        });
    });
});
