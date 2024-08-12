import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '@app/components/admin/confirmation-modal/confirmation-modal.component';
import { ERROR_NOTIFICATION_DURATION, SUCCESS_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';
import { getEmptyQuestion } from '@app/constants/question-bank.service.constants';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionCommunicationService } from '@app/services/question-communication/question-communication.service';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class QuestionBankService {
    currentQuiz: Quiz;
    questions: Question[] = [];
    isLoading: boolean = true;

    constructor(
        private questionCommunicationService: QuestionCommunicationService,
        private notificationService: NotificationService,
        public dialog: MatDialog,
    ) {}

    reloadData() {
        this.questionCommunicationService.fetchAllQuestions().subscribe((questions: Question[]) => {
            this.questions = questions.sort(this.compareByDate);
            this.isLoading = false;
        });
    }

    async getAllQcmQuestions(): Promise<Question[]> {
        const questions = await firstValueFrom(this.questionCommunicationService.fetchAllQuestions());
        return questions.filter((question) => question.type === QuestionType.MULTIPLE_CHOICE);
    }

    addQuestionToQuiz(question: Question) {
        this.currentQuiz.questions.push(this.deepCopy(question));
        this.currentQuiz.hasChanged = true;
        this.notificationService.showBanner(
            new NotificationContent('Question ajoutée au quiz avec succès', NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
        );
    }

    haveQuestionsChanged(): boolean {
        return this.questions.some((question) => question.hasChanged);
    }

    removeQuestionFromBankPrompt(questionIndex: number) {
        const dialogRef = this.dialog.open(ConfirmationModalComponent, {
            panelClass: 'mat-dialog',
            enterAnimationDuration: 0,
            exitAnimationDuration: 0,
            data: { title: 'Supprimer la question', message: 'Êtes-vous sûr de vouloir supprimer la question ?' },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.removeQuestionFromBank(questionIndex);
            }
        });
    }

    removeQuestionFromBank(questionIndex: number) {
        const removedQuestion = this.questions.splice(questionIndex, 1)[0];
        if (!removedQuestion._id) {
            return;
        }
        this.questionCommunicationService.deleteQuestion(removedQuestion._id).subscribe(() => {
            this.reloadData();
            this.notificationService.showBanner(
                new NotificationContent('Question supprimée avec succès', NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
            );
        });
    }

    async addQuestionToBank(question: Question) {
        this.reloadData();
        if (await this.isQuestionInBank(question)) {
            this.notificationService.showBanner(
                new NotificationContent('La question est déjà dans la banque de questions', NotificationType.Error, ERROR_NOTIFICATION_DURATION),
            );
            return;
        }

        this.questionCommunicationService.addQuestion(question).subscribe(() => {
            this.questions.unshift(this.deepCopy(question));
            this.notificationService.showBanner(
                new NotificationContent(
                    'Question ajoutée à la banque de questions avec succès',
                    NotificationType.Success,
                    SUCCESS_NOTIFICATION_DURATION,
                ),
            );
        });
    }

    async isQuestionInBank(question: Question): Promise<boolean> {
        const questionsInBank = await firstValueFrom(this.questionCommunicationService.fetchAllQuestions());
        return questionsInBank.some((q) => q.text === question.text);
    }

    deepCopy(question: Question): Question {
        return JSON.parse(JSON.stringify(question)) as Question;
    }

    createNewQuestion() {
        this.questions.push(getEmptyQuestion());
    }

    private compareByDate(a: Question, b: Question) {
        if (!a.lastModification || !b.lastModification) {
            return 0;
        }
        return new Date(b.lastModification).getTime() - new Date(a.lastModification).getTime();
    }
}
