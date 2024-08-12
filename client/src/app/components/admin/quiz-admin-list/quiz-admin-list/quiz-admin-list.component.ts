import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChangeNameModalComponent } from '@app/components/admin/change-name-modal/change-name-modal.component';
import { ConfirmationModalComponent } from '@app/components/admin/confirmation-modal/confirmation-modal.component';
import { ImportModalComponent } from '@app/components/admin/import-modal/import-modal.component';
import { SUCCESS_NOTIFICATION_DURATION, ERROR_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { ImportExportService } from '@app/services/import-export/import-export.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { Quiz } from '@common/interfaces/quiz.dto';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-quiz-admin-list',
    templateUrl: './quiz-admin-list.component.html',
    styleUrls: ['./quiz-admin-list.component.scss'],
})
export class QuizAdminListComponent implements OnInit {
    @ViewChild('downloadComponent') private downloadComponent: ElementRef<HTMLAnchorElement>;
    quizzes: Quiz[];
    isLoading: boolean = true;

    // To accommodate the specific requirements of this component we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(
        private quizCommunicationService: QuizCommunicationService,
        private importExportService: ImportExportService,
        private dialog: MatDialog,
        private notificationService: NotificationService,
        private router: Router,
        private quizValidatorService: QuizValidatorService,
    ) {}

    ngOnInit(): void {
        this.reloadData();
    }

    reloadData() {
        this.quizCommunicationService.fetchAllQuizzes().subscribe((quizzes: Quiz[]) => {
            this.quizzes = quizzes;
            this.isLoading = false;
        });
    }

    onDeleteQuiz(quizId: string) {
        const dialogRef = this.dialog.open(ConfirmationModalComponent, {
            panelClass: 'mat-dialog',
            enterAnimationDuration: 0,
            exitAnimationDuration: 0,
            data: { title: 'Supprimer le quiz', message: 'Êtes-vous sûr de vouloir supprimer le quiz ?' },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.deleteQuiz(quizId);
            }
        });
    }

    deleteQuiz(quizId: string) {
        this.quizzes = this.quizzes.filter((quiz) => quiz._id !== quizId);
        this.quizCommunicationService.deleteQuiz(quizId).subscribe({
            next: () => {
                this.reloadData();
                this.notificationService.showBanner(
                    new NotificationContent('Quiz supprimé avec succès', NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
                );
            },
            error: (error) => {
                this.notificationService.showBanner(
                    new NotificationContent(`Erreur lors de la suppression: ${error.message}`, NotificationType.Error, ERROR_NOTIFICATION_DURATION),
                );
            },
        });
    }

    onDownloadQuiz(quiz: Quiz) {
        this.importExportService.exportAsJson(quiz, quiz.title.split(' ')[0].trim(), this.downloadComponent);
    }

    addQuiz() {
        this.router.navigate([AppRoutes.Quiz, 'new']);
    }

    importQuiz() {
        // disabled no-explicit-any in order to handle the error message
        /* eslint-disable  @typescript-eslint/no-explicit-any */

        const importDialogRef = this.dialog.open(ImportModalComponent, {
            width: '400px',
        });

        importDialogRef.afterClosed().subscribe(async (result: File | undefined) => {
            if (result) {
                try {
                    const newQuiz = await this.importExportService.importFromJson(result);

                    while (!(await this.quizValidatorService.isTitleUnique(newQuiz.title))) {
                        const changeNameDialogRef = this.dialog.open(ChangeNameModalComponent, {
                            width: '400px',
                        });

                        newQuiz.title = await firstValueFrom(changeNameDialogRef.afterClosed());
                    }

                    if (newQuiz.title) {
                        this.saveImportedQuiz(newQuiz);
                    }
                } catch (error: any) {
                    this.notificationService.showBanner(
                        new NotificationContent(
                            `Erreur dans le format du fichier: ${error.message}`,
                            NotificationType.Error,
                            ERROR_NOTIFICATION_DURATION,
                        ),
                    );
                }
            }
        });
    }

    saveImportedQuiz(newQuiz: Quiz) {
        this.isLoading = true;
        this.quizCommunicationService.addQuiz(newQuiz).subscribe({
            next: () => {
                this.reloadData();
                this.notificationService.showBanner(
                    new NotificationContent('Quiz importé avec succès', NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
                );
            },
            error: (error) => {
                this.notificationService.showBanner(
                    new NotificationContent(`Erreur lors de l'import: ${error.message}`, NotificationType.Error, ERROR_NOTIFICATION_DURATION),
                );
            },
        });
    }
}
