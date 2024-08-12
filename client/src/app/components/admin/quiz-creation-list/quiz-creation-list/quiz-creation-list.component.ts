import { Component, OnInit } from '@angular/core';
import { QCM_ICON, QRL_ICON } from '@app/constants/common/icons.constants';
import { INFO_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { GameService } from '@app/services/game/game.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { MINIMUM_NUMBER_QCM } from '@common/constants/random-mode.constants';
import { Question, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-quiz-creation-list',
    templateUrl: './quiz-creation-list.component.html',
    styleUrls: ['./quiz-creation-list.component.scss'],
})
export class QuizCreationListComponent implements OnInit {
    quizzes: Quiz[];
    selectedQuiz: Quiz | undefined;
    isLoading: boolean = true;
    visibleQuizzes: Quiz[] = [];
    isRandomQuizSelected: boolean;

    readonly qcmIcon = QCM_ICON;
    readonly qrlIcon = QRL_ICON;

    // To accommodate the specific requirements of this component we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(
        private quizCommunicationService: QuizCommunicationService,
        private gameService: GameService,
        private notificationService: NotificationService,
        private questionBankService: QuestionBankService,
    ) {}

    ngOnInit(): void {
        this.initializeComponent();
        this.questionBankService.reloadData();
    }

    selectQuiz(quiz: Quiz): void {
        this.selectedQuiz = this.selectedQuiz === quiz ? undefined : quiz;
        this.isRandomQuizSelected = false;
    }

    selectRandomQuiz(): void {
        this.isRandomQuizSelected = true;
        this.selectedQuiz = undefined;
    }

    filterVisibleQuizzes(): void {
        this.visibleQuizzes = this.quizzes.filter((quiz) => quiz.visible);
    }

    initializeComponent(): void {
        this.quizCommunicationService.fetchAllQuizzes().subscribe((quizzes: Quiz[]) => {
            this.quizzes = quizzes;
            this.isLoading = false;
            this.filterVisibleQuizzes();
        });
    }

    async startQuiz(isTestingMode: boolean): Promise<void> {
        if (!this.selectedQuiz) {
            return;
        }
        if (await this.isQuizAvailable(this.selectedQuiz._id)) {
            this.gameService.requestCreateGame(this.selectedQuiz._id, isTestingMode, false);
        } else {
            this.showQuizFetchError("Le quiz n'est plus disponible. Veuillez sélectionner un autre quiz");
            this.selectedQuiz = undefined;
            this.initializeComponent();
        }
    }

    async startRandomQuiz(): Promise<void> {
        if (!this.isRandomQuizSelected) {
            return;
        }
        this.questionBankService.reloadData();
        if (await this.canStartRandomQuiz()) {
            this.gameService.requestCreateGame('', false, true);
        } else {
            this.showQuizFetchError("Le mode aléatoire n'est plus disponible. Veuillez sélectionner un autre quiz");
            this.isRandomQuizSelected = false;
            this.initializeComponent();
        }
    }

    async canStartRandomQuiz(): Promise<boolean> {
        const questions = await this.questionBankService.getAllQcmQuestions();
        return questions.length >= MINIMUM_NUMBER_QCM;
    }

    showQuizFetchError(message: string): void {
        this.notificationService.showBanner(new NotificationContent(message, NotificationType.Info, INFO_NOTIFICATION_DURATION));
    }

    async isQuizAvailable(quizId: string): Promise<boolean> {
        try {
            const quiz = await firstValueFrom(this.quizCommunicationService.fetchQuizById(quizId));
            return quiz && quiz.visible;
        } catch {
            this.showQuizFetchError('Erreur lors de la récupération du quiz.');
            this.initializeComponent();
            return false;
        }
    }

    getBankQuestionQcmLength(): number {
        const questions = this.questionBankService.questions;
        return questions.filter((question) => question.type === QuestionType.MULTIPLE_CHOICE).length;
    }

    showRandomMode(): boolean {
        return this.getBankQuestionQcmLength() >= MINIMUM_NUMBER_QCM;
    }

    isQcm(question: Question): boolean {
        return question.type === QuestionType.MULTIPLE_CHOICE;
    }
}
