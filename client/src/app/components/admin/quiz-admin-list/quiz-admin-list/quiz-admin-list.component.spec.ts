import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { ImportExportService } from '@app/services/import-export/import-export.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { Quiz } from '@common/interfaces/quiz.dto';
import { of, throwError } from 'rxjs';
import { QuizAdminListComponent } from './quiz-admin-list.component';

describe('QuizAdminListComponent', () => {
    let component: QuizAdminListComponent;
    let fixture: ComponentFixture<QuizAdminListComponent>;
    let quizCommunicationService: QuizCommunicationService;
    let importExportService: ImportExportService;
    let quizValidatorService: QuizValidatorService;
    let notificationService: NotificationService;
    let router: Router;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            declarations: [QuizAdminListComponent],
            providers: [
                HttpClient,
                HttpHandler,
                QuizCommunicationService,
                ImportExportService,
                { provide: MatDialog, useValue: matDialogSpy },
                NotificationService,
                Router,
            ],
            imports: [AppMaterialModule],
        });
        fixture = TestBed.createComponent(QuizAdminListComponent);
        component = fixture.componentInstance;
        quizCommunicationService = TestBed.inject(QuizCommunicationService);
        importExportService = TestBed.inject(ImportExportService);
        quizValidatorService = TestBed.inject(QuizValidatorService);
        notificationService = TestBed.inject(NotificationService);
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch all quizzes on initialization', () => {
        const mockQuizzes: Quiz[] = [
            { _id: '1', title: 'Quiz 1', description: 'Quiz 1', duration: 30, lastModification: new Date(), visible: true, questions: [] },
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 50, lastModification: new Date(), visible: true, questions: [] },
        ];

        spyOn(quizCommunicationService, 'fetchAllQuizzes').and.returnValue(of(mockQuizzes));

        component.ngOnInit();

        expect(component.quizzes).toEqual(mockQuizzes);
        expect(component.isLoading).toBeFalse();
    });

    it('should delete a quiz', fakeAsync(() => {
        const mockQuizId = '1';
        const mockQuizzes: Quiz[] = [
            { _id: '1', title: 'Quiz 1', description: 'Quiz 1', duration: 30, lastModification: new Date(), visible: true, questions: [] },
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 50, lastModification: new Date(), visible: true, questions: [] },
        ];
        component.quizzes = mockQuizzes;

        spyOn(quizCommunicationService, 'deleteQuiz').and.returnValue(of(undefined));
        spyOn(notificationService, 'showBanner');
        spyOn(component, 'reloadData');

        component.deleteQuiz(mockQuizId);
        tick();

        expect(component.quizzes).toEqual([
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 50, lastModification: new Date(), visible: true, questions: [] },
        ]);
        expect(quizCommunicationService.deleteQuiz).toHaveBeenCalledWith(mockQuizId);
        expect(component.reloadData).toHaveBeenCalled();
        expect(notificationService.showBanner).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: 'Quiz supprimé avec succès', type: 'success' }),
        );
    }));

    it('should display error message if server error occurs on delete', fakeAsync(() => {
        const mockQuizId = '1';
        const mockQuizzes: Quiz[] = [
            { _id: '1', title: 'Quiz 1', description: 'Quiz 1', duration: 30, lastModification: new Date(), visible: true, questions: [] },
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 50, lastModification: new Date(), visible: true, questions: [] },
        ];
        component.quizzes = mockQuizzes;

        spyOn(quizCommunicationService, 'deleteQuiz').and.returnValue(throwError(() => new Error('Server error')));
        spyOn(notificationService, 'showBanner');

        component.deleteQuiz(mockQuizId);
        tick();

        expect(component.quizzes).toEqual([
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 50, lastModification: new Date(), visible: true, questions: [] },
        ]);
        expect(quizCommunicationService.deleteQuiz).toHaveBeenCalledWith(mockQuizId);
        expect(notificationService.showBanner).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: 'Erreur lors de la suppression: Server error', type: 'error' }),
        );
    }));

    describe('onDeleteQuiz', () => {
        it('should open dialog', () => {
            spyOn(component, 'deleteQuiz');
            /* disabled no-explicit-any to make test more concised */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            component.onDeleteQuiz('1');
            expect(matDialogSpy.open).toHaveBeenCalled();
        });

        it('should call deleteQuiz if dialog is confirmed', () => {
            spyOn(component, 'deleteQuiz');
            /* disabled no-explicit-any to make test more concised */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
            component.onDeleteQuiz('1');
            expect(component.deleteQuiz).toHaveBeenCalledWith('1');
        });

        it('should not call deleteQuiz if dialog is not confirmed', () => {
            spyOn(component, 'deleteQuiz');
            /* disabled no-explicit-any to make test more concised */
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
            component.onDeleteQuiz('1');
            expect(component.deleteQuiz).not.toHaveBeenCalled();
        });
    });

    it('should redirect to quiz creation page when add button is clicked', () => {
        spyOn(router, 'navigate');

        component.addQuiz();

        expect(router.navigate).toHaveBeenCalledWith(['/quiz', 'new']);
    });

    it('should import a quiz', fakeAsync(() => {
        const mockFile = new File([''], 'quiz.json', { type: 'application/json' });
        const mockImportedQuiz = {
            _id: '1',
            title: 'Quiz 1',
            description: 'Quiz 1',
            duration: 30,
            lastModification: new Date(),
            visible: true,
            questions: [],
        };

        const mockQuizzes: Quiz[] = [
            { _id: '1', title: 'Quiz 1', description: 'Quiz 1', duration: 30, lastModification: new Date(), visible: true, questions: [] },
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 50, lastModification: new Date(), visible: true, questions: [] },
        ];
        component.quizzes = mockQuizzes;

        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(mockFile));

        matDialogSpy.open.and.returnValue(mockDialogRef);
        spyOn(importExportService, 'importFromJson').and.returnValue(Promise.resolve(mockImportedQuiz));
        spyOn(quizCommunicationService, 'addQuiz').and.returnValue(of(mockImportedQuiz));
        spyOn(notificationService, 'showBanner');
        spyOn(quizValidatorService, 'isTitleUnique').and.returnValue(Promise.resolve(true));

        component.importQuiz();
        tick();

        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(importExportService.importFromJson).toHaveBeenCalledWith(mockFile);
        expect(notificationService.showBanner).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: 'Quiz importé avec succès', type: 'success' }),
        );
    }));

    it('should ask for new name after importing if name already in use', fakeAsync(() => {
        const mockFile = new File([''], 'quiz.json', { type: 'application/json' });
        const mockImportedQuiz = {
            _id: '1',
            title: 'Quiz 1',
            description: 'Quiz 1',
            duration: 30,
            lastModification: new Date(),
            visible: true,
            questions: [],
        };

        const mockQuizzes: Quiz[] = [
            { _id: '1', title: 'Quiz 1', description: 'Quiz 1', duration: 30, lastModification: new Date(), visible: true, questions: [] },
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 50, lastModification: new Date(), visible: true, questions: [] },
        ];
        component.quizzes = mockQuizzes;

        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValues(of(mockFile), of('Quiz 3'));

        matDialogSpy.open.and.returnValue(mockDialogRef);
        spyOn(importExportService, 'importFromJson').and.returnValue(Promise.resolve(mockImportedQuiz));
        spyOn(quizCommunicationService, 'addQuiz').and.returnValue(of(mockImportedQuiz));
        spyOn(notificationService, 'showBanner');
        spyOn(quizValidatorService, 'isTitleUnique').and.returnValues(Promise.resolve(false), Promise.resolve(true));

        component.importQuiz();
        tick();

        expect(matDialogSpy.open).toHaveBeenCalledTimes(2);
        expect(importExportService.importFromJson).toHaveBeenCalledWith(mockFile);
        expect(notificationService.showBanner).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: 'Quiz importé avec succès', type: 'success' }),
        );
    }));

    it('should display error message if server error occurs on import', fakeAsync(() => {
        const mockFile = new File([''], 'quiz.json', { type: 'application/json' });
        const mockImportedQuiz = {
            _id: '1',
            title: 'Quiz 1',
            description: 'Quiz 1',
            duration: 30,
            lastModification: new Date(),
            visible: true,
            questions: [],
        };

        const mockQuizzes: Quiz[] = [
            { _id: '1', title: 'Quiz 1', description: 'Quiz 1', duration: 30, lastModification: new Date(), visible: true, questions: [] },
            { _id: '2', title: 'Quiz 2', description: 'Quiz 2', duration: 50, lastModification: new Date(), visible: true, questions: [] },
        ];
        component.quizzes = mockQuizzes;

        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(mockFile));

        matDialogSpy.open.and.returnValue(mockDialogRef);
        spyOn(importExportService, 'importFromJson').and.returnValue(Promise.resolve(mockImportedQuiz));
        spyOn(quizCommunicationService, 'addQuiz').and.returnValue(throwError(() => new Error('Server error')));
        spyOn(notificationService, 'showBanner');
        spyOn(quizValidatorService, 'isTitleUnique').and.returnValue(Promise.resolve(true));

        component.importQuiz();
        tick();

        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(importExportService.importFromJson).toHaveBeenCalledWith(mockFile);
        expect(notificationService.showBanner).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: "Erreur lors de l'import: Server error", type: 'error' }),
        );
    }));

    it('should display error message if import error occurs', fakeAsync(() => {
        const mockFile = new File([''], 'quiz.json', { type: 'application/json' });
        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(mockFile));

        matDialogSpy.open.and.returnValue(mockDialogRef);
        spyOn(importExportService, 'importFromJson').and.throwError(new Error('Import error'));
        spyOn(notificationService, 'showBanner');

        component.importQuiz();
        tick();

        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(importExportService.importFromJson).toHaveBeenCalledWith(mockFile);
        expect(notificationService.showBanner).toHaveBeenCalledWith(
            jasmine.objectContaining({ message: 'Erreur dans le format du fichier: Import error', type: 'error' }),
        );
    }));

    describe('onDownloadQuiz', () => {
        it('should call exportAsJson with the correct parameters', () => {
            const mockQuiz = {
                _id: '1',
                title: 'Quiz 1',
                description: 'Quiz 1',
                duration: 30,
                lastModification: new Date(),
                visible: true,
                questions: [],
            };

            spyOn(importExportService, 'exportAsJson');

            component.onDownloadQuiz(mockQuiz);

            expect(importExportService.exportAsJson).toHaveBeenCalledWith(mockQuiz, 'Quiz', component['downloadComponent']);
        });
    });
});
