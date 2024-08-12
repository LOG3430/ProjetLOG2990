import { Injectable } from '@angular/core';
import { QuizStatisticsHistory } from '@app/interfaces/quiz-statistics-history';
import { GameService } from '@app/services/game/game.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { GameState } from '@common/enums/game-state.enum';
import { Qcm, QuestionType } from '@common/interfaces/question.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { QuizStatisticsHistoryRes } from '@common/websockets/quiz-statistics-history.dto';
import { TotalGrades, TotalIsEditing, TotalSelectedChoices } from '@common/websockets/total-result.dto';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class HistogramService {
    histogramValues: number[];
    histogramTexts: string[];
    histogramRightAnswers: number[];

    quizHistory: QuizStatisticsHistory;

    histogramValues$: Observable<void>;
    private histogramValuesSource: Subject<void>;

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private gameService: GameService,
    ) {
        this.histogramValuesSource = new Subject<void>();
        this.histogramValues$ = this.histogramValuesSource.asObservable();
        this.resetHistogram();
        this.histogramValues = [];
        this.resetQuizHistory();
        this.initializeSocketListeners();
    }

    resetHistogram() {
        this.histogramTexts = this.getHistogramTexts();
        this.histogramRightAnswers = this.getHistogramRightAnswers();
    }

    getHistogramTexts(): string[] {
        let texts: string[] = [];
        if (this.gameService.isQcm()) {
            texts = this.getQcmHistogramTexts();
        } else if (this.gameService.getGameState() === GameState.Answering) {
            texts = this.getEditingQrlHistogramTexts();
        } else if (this.gameService.getGameState() === GameState.QuestionResults) {
            texts = this.getQrlHistogramTexts();
        }
        return texts;
    }

    getQcmHistogramTexts(): string[] {
        return (this.gameService.question as Qcm).choices.map((choice) => choice.text);
    }

    getEditingQrlHistogramTexts(): string[] {
        return ['Inactif', "En train d'écrire"];
    }

    getQrlHistogramTexts(): string[] {
        return ['0%', '50%', '100%'];
    }

    getHistogramRightAnswers(): number[] {
        return this.getRightAnswersIndexes(this.gameService.getChoices().map((choice) => choice.isCorrect));
    }

    initializeSocketListeners() {
        this.onQcmHistogramUpdate();
        this.onEditingQrlHistogramUpdate();
        this.onQrlGradingHistogramUpdate();
        this.onQuizStatisticsHistoryUpdate();
    }

    onQcmHistogramUpdate() {
        this.socketCommunicationService.on<TotalSelectedChoices>(WebSocketEvents.TotalSelectedChoices, (totalSelectedChoices) => {
            this.histogramValues = Object.values(totalSelectedChoices);
            this.onUpdate();
        });
    }

    onEditingQrlHistogramUpdate() {
        this.socketCommunicationService.on<TotalIsEditing>(WebSocketEvents.TotalisEditingLongAnswer, (totalIsEditing) => {
            this.histogramValues = [totalIsEditing.isNotEditing, totalIsEditing.isEditing];
            this.onUpdate();
        });
    }

    onQrlGradingHistogramUpdate() {
        this.socketCommunicationService.on<TotalGrades>(WebSocketEvents.TotalGrades, (totalGrades) => {
            this.histogramValues = [totalGrades.grade0, totalGrades.grade50, totalGrades.grade100];
            this.onUpdate();
        });
    }

    onUpdate() {
        this.resetHistogram();
        this.histogramValuesSource.next();
    }

    onQuizStatisticsHistoryUpdate() {
        this.socketCommunicationService.on<QuizStatisticsHistoryRes>(WebSocketEvents.QuizStatisticsHistory, (quizStatisticsHistoryRes) => {
            this.resetQuizHistory();
            quizStatisticsHistoryRes.totalSelectedChoicesHistory.forEach((totalSelectedChoices) => {
                this.quizHistory.totalSelectedChoicesHistory.push(Object.values(totalSelectedChoices));
            });
            quizStatisticsHistoryRes.quiz.questions.forEach((question) => {
                this.quizHistory.questionHistory.push(question.text);

                const questionTexts =
                    question.type === QuestionType.MULTIPLE_CHOICE
                        ? (question as Qcm).choices.map((choice) => choice.text)
                        : this.getQrlHistogramTexts();
                const rightAnswers =
                    question.type === QuestionType.MULTIPLE_CHOICE ? (question as Qcm).choices.map((choice) => choice.isCorrect) : [];

                this.quizHistory.histogramTextsHistory.push(questionTexts);
                this.quizHistory.rightAnswerHistory.push(this.getRightAnswersIndexes(rightAnswers));
            });
        });
    }

    private resetQuizHistory(): void {
        this.quizHistory = {
            totalSelectedChoicesHistory: [],
            questionHistory: [],
            histogramTextsHistory: [],
            rightAnswerHistory: [],
        };
    }

    private getRightAnswersIndexes(choiceValues: boolean[]): number[] {
        const correctIndexes: number[] = [];
        choiceValues.forEach((choiceValue, index) => {
            if (choiceValue) {
                correctIndexes.push(index);
            }
        });
        return correctIndexes;
    }
}
