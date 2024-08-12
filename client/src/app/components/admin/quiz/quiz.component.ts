import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ERROR_NOTIFICATION_DURATION, SUCCESS_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';
import { TEXT_NOT_NULL_OR_WHITESPACE_PATTERN } from '@app/constants/common/pattern.constants';
import { getEmptyQuestion, getEmptyQuiz } from '@app/constants/quiz.component.constants';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { Question } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';

@Component({
    selector: 'app-quiz',
    templateUrl: './quiz.component.html',
    styleUrls: ['./quiz.component.scss'],
})
export class QuizComponent implements OnInit {
    @Input() data: Quiz = getEmptyQuiz();
    @Output() openDrawerSignal = new EventEmitter<void>();
    identicalQuestionsIndex: number[] = [];
    isInNewQuiz = false;

    readonly textNotNullOrWhitespacePattern = TEXT_NOT_NULL_OR_WHITESPACE_PATTERN;

    // To accommodate the specific requirements of this component we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(
        private quizCommunicationService: QuizCommunicationService,
        private questionBankService: QuestionBankService,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private quizValidatorService: QuizValidatorService,
        private router: Router,
    ) {}

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: BeforeUnloadEvent) {
        if (this.data.hasChanged) {
            $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe((params) => {
            const quizId = params.get('id');
            this.reloadData(quizId);
        });
    }

    reloadData(id: string | null) {
        if (id && id !== 'new') {
            this.data.hasChanged = false;
            this.quizCommunicationService.fetchQuizById(id).subscribe((quiz: Quiz) => {
                if (quiz) {
                    this.data = quiz;
                    this.questionBankService.currentQuiz = this.data;
                } else {
                    this.router.navigateByUrl(AppRoutes.Home);
                }
            });
        } else {
            this.data.hasChanged = true;
            this.isInNewQuiz = true;
            this.data = getEmptyQuiz();
            this.questionBankService.currentQuiz = this.data;
        }
    }

    addQuestion(question: Question = getEmptyQuestion()) {
        this.data.questions.push(question);
        this.onInputChange();
    }

    openQuestionBank() {
        this.openDrawerSignal.emit();
    }

    removeQuestion(questionIndex: number) {
        this.data.questions.splice(questionIndex, 1);
        this.onInputChange();
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.data.questions, event.previousIndex, event.currentIndex);
        this.onInputChange();
    }

    onInputChange() {
        this.data.hasChanged = true;
    }

    getSaveDisabledMessage(): string {
        if (!this.data.hasChanged) {
            return 'Aucune modification apportée';
        } else if (this.identicalQuestionsIndex.length !== 0) {
            return 'Le quiz contient des questions identiques';
        }
        return this.isValidQuiz() ? '' : 'Le quiz est invalide';
    }

    async save(): Promise<void> {
        if (this.isValidQuiz()) {
            if (!(await this.quizValidatorService.isTitleUnique(this.data.title, this.data._id))) {
                this.notificationService.showBanner(
                    new NotificationContent('Le titre du quiz doit être unique', NotificationType.Error, ERROR_NOTIFICATION_DURATION),
                );
            } else {
                this.data.visible = false;
                if (this.data._id) {
                    this.quizCommunicationService.saveQuiz(this.data).subscribe((quiz) => {
                        this.notificationService.showBanner(
                            new NotificationContent('Le quiz a été sauvegardé', NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
                        );
                        this.quizHasSaved();
                        this.data.lastModification = quiz.lastModification;
                        this.router.navigate([AppRoutes.Admin]);
                    });
                } else {
                    this.quizCommunicationService.addQuiz(this.data).subscribe((quiz) => {
                        this.data = quiz;
                        this.questionBankService.currentQuiz = this.data;
                        this.notificationService.showBanner(
                            new NotificationContent('La quiz a été ajouté', NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
                        );
                        this.quizHasSaved();
                        this.router.navigate([AppRoutes.Admin]);
                        this.reloadData(quiz._id);
                    });
                }
            }
        }
    }

    quizHasSaved() {
        this.data.hasChanged = false;
        this.data.questions.forEach((q) => (q.hasChanged = false));
    }

    isValidQuiz(): boolean {
        this.identicalQuestionsIndex = this.quizValidatorService.getIdenticalQuestionsIndex(this.data.questions);
        if (this.identicalQuestionsIndex.length !== 0) {
            return false;
        }
        return this.quizValidatorService.isValidQuiz(this.data);
    }

    isQuestionUnique(index: number) {
        return !this.identicalQuestionsIndex.includes(index);
    }
}
