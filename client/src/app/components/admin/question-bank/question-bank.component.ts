import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { QCM_ICON, QRL_ICON } from '@app/constants/common/icons.constants';
import { SUCCESS_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuestionCommunicationService } from '@app/services/question-communication/question-communication.service';
import { QuestionValidatorService } from '@app/services/question-validator/question-validator.service';
import { Question, QuestionType } from '@common/interfaces/question.dto';

@Component({
    selector: 'app-question-bank',
    templateUrl: './question-bank.component.html',
    styleUrls: ['./question-bank.component.scss'],
})
export class QuestionBankComponent implements OnInit {
    @Input() isEditable: boolean;
    readonly qrlIcon = QRL_ICON;
    readonly qcmIcon = QCM_ICON;
    showQrl = true;
    showQcm = true;

    // To accommodate the specific requirements of this component we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(
        private questionBankService: QuestionBankService,
        private questionValidator: QuestionValidatorService,
        private questionCommunicationService: QuestionCommunicationService,
        private notificationService: NotificationService,
        private changeDetector: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.questionBankService.reloadData();
    }

    addQuestion() {
        this.questionBankService.createNewQuestion();
        this.changeDetector.detectChanges();
        window.scrollTo(0, document.body.scrollHeight);
    }

    removeQuestion(questionIndex: number) {
        this.questionBankService.removeQuestionFromBankPrompt(questionIndex);
    }

    getQuestions(): Question[] {
        return this.questionBankService.questions.filter((question) => this.showQuestion(question));
    }

    getLoading(): boolean {
        return this.questionBankService.isLoading;
    }
    saveQuestion(question: Question) {
        if (this.questionValidator.isValidQuestion(question)) {
            if (question._id) {
                this.questionCommunicationService.saveQuestion(question).subscribe((newQuestion) => {
                    this.notificationService.showBanner(
                        new NotificationContent('La question est sauvegardée', NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
                    );
                    question.hasChanged = false;
                    question.lastModification = newQuestion.lastModification;
                });
            } else {
                this.questionCommunicationService.addQuestion(question).subscribe((newQuestion) => {
                    this.notificationService.showBanner(
                        new NotificationContent('La question est sauvegardée', NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
                    );
                    question._id = newQuestion._id;
                    question.hasChanged = false;
                    question.lastModification = newQuestion.lastModification;
                });
            }
        }
    }

    toggleShowQcm() {
        this.showQcm = !this.showQcm;
    }

    toggleShowQrl() {
        this.showQrl = !this.showQrl;
    }

    showQuestion(question: Question): boolean {
        return (question.type === QuestionType.MULTIPLE_CHOICE && this.showQcm) || (question.type === QuestionType.LONG_ANSWER && this.showQrl);
    }
}
