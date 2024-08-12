// Game service handles a lot of logic that can't be separated to ensure clarity and maintainability
/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MAX_ANSWER_LENGTH, MIN_PANIC_MODE_START_DURATION } from '@app/constants/answer.constants';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { ChatService } from '@app/services/chat-client/chat-client.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { PlayersService } from '@app/services/players/players.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { GameState } from '@common/enums/game-state.enum';
import { Choice } from '@common/interfaces/choice.dto';
import { Qcm, Question, QuestionType } from '@common/interfaces/question.dto';
import { ChangeOrganizerStatusRes } from '@common/websockets/change-organizer-status.dto';
import { ChangeSelectedChoicesRes } from '@common/websockets/change-selected-choices.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { GradeQuestionReq } from '@common/websockets/grade-question.dto';
import { JoinGameRes } from '@common/websockets/join-game.dto';
import { KickPlayerRes } from '@common/websockets/kick-player.dto';
import { NewQuestionRes } from '@common/websockets/new-question.dto';
import { QuestionResultsRes } from '@common/websockets/question-result.dto';
import { Observable, Subject } from 'rxjs';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '@app/components/admin/confirmation-modal/confirmation-modal.component';
import { INFO_NOTIFICATION_DURATION } from '@app/constants/common/notifications.constants';
import { KICK_PLAYER_TEXT } from '@app/constants/kick-player-text.constants';
import { AudioService } from '@app/services/audio/audio.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    question: Question;
    playerScore: number;
    rank: number;
    playerName: string;
    questionResult: number;
    bonus: boolean;
    isTestingMode: boolean;
    isRandomMode: boolean;
    selectedChoiceIndexes: number[];
    longAnswer: string;
    isLocked: boolean;
    isLastQuestion: boolean;
    isGamePaused: boolean;
    isPanicAvailable: boolean;
    isPanicOn: boolean;
    quizResult$: Observable<void>;

    private quizResultSource: Subject<void>;
    private quizTitle: string;
    private isOrganizer: boolean;
    private gameState: GameState;
    private time: number;
    private duration: number;
    private roomId: string;
    private isRoomLocked: boolean;
    private gradeQuestionRequest: GradeQuestionReq;
    private assertLeaveGame: boolean;

    private newQuestionSubject: Subject<void>;

    // To accommodate the specific requirements of this service we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(
        private router: Router,
        private socketCommunicationService: SocketCommunicationService,
        private playersService: PlayersService,
        private chatService: ChatService,
        private notificationService: NotificationService,
        private audioService: AudioService,
        private dialog: MatDialog,
    ) {
        this.quizResultSource = new Subject<void>();
        this.quizResult$ = this.quizResultSource.asObservable();
        this.newQuestionSubject = new Subject();
        this.resetGame();
        this.initializeSocketListeners();
        this.gameState = GameState.WaitingRoom;
        this.selectedChoiceIndexes = [];
        this.longAnswer = '';
        this.gradeQuestionRequest = { playerName: '', answer: '', gradeIndex: 0, gradeTotal: 0 };
        this.assertLeaveGame = false;
    }

    initializeSocketListeners() {
        this.onNewQuestion();
        this.onKickPlayer();
        this.onJoinGame();
        this.onGameStateUpdate();
        this.onStartTimer();
        this.onTimeUpdate();
        this.onQuestionResults();
        this.onQuestionAnswers();
        this.onChangeOrganizerStatus();
        this.onGradingRequest();
        this.onPauseRequest();
        this.onPanicButtonAvailable();
        this.onStartPanicMode();
    }

    sendNewQuestionMessage() {
        this.newQuestionSubject.next();
    }

    getNewQuestionMessage(): Observable<void> {
        return this.newQuestionSubject.asObservable();
    }

    getChoices(): Choice[] {
        return this.isQcm() ? (this.asQcm() as Qcm).choices : [];
    }

    getQuizTitle(): string {
        return this.quizTitle;
    }

    getTime(): number {
        return this.time;
    }

    getDuration(): number {
        return this.duration;
    }

    getGameState(): GameState {
        return this.gameState;
    }

    getIsOrganizer(): boolean {
        return this.isOrganizer;
    }

    getRoomId(): string {
        return this.roomId;
    }

    getGradeQuestionRequest(): GradeQuestionReq {
        return this.gradeQuestionRequest;
    }

    canStartQuiz(): boolean {
        return this.isRoomLocked && this.isOrganizer && this.playersService.playerList.length >= 1;
    }

    getTooltipGameStartMessage() {
        if (this.playersService.playerList.length < 1) {
            return 'Il faut au moins un joueur pour commencer';
        } else if (!this.isRoomLocked) {
            return 'Il faut verrouiller la salle pour commencer';
        } else {
            return '';
        }
    }

    getIsRoomLocked() {
        return this.isRoomLocked;
    }

    checkIfGameStarted(): void {
        this.playersService.isGameStarted = this.gameState !== GameState.WaitingRoom;
    }

    checkIfGameFinished(): void {
        const hasGameFinished = this.gameState === GameState.QuizResults;
        this.playersService.hasGameFinished = hasGameFinished;
        if (hasGameFinished) {
            this.quizResultSource.next();
        }
    }

    isQcm(): boolean {
        return !!this.question && this.question.type === QuestionType.MULTIPLE_CHOICE;
    }

    asQcm(): Qcm | undefined {
        return this.isQcm() ? (this.question as Qcm) : undefined;
    }

    resetStatsOnNewQuestion(): void {
        this.questionResult = 0;
        this.bonus = false;
        this.selectedChoiceIndexes = [];
        this.longAnswer = '';
        this.isLocked = false;
        this.isGamePaused = false;
        this.isPanicAvailable = this.duration > MIN_PANIC_MODE_START_DURATION;
        this.isPanicOn = false;
    }

    resetGame(): void {
        this.time = 0;
        this.playerScore = 0;
        this.resetStatsOnNewQuestion();
        this.isOrganizer = false;
        this.isTestingMode = false;
        this.isRandomMode = false;
        this.isLastQuestion = false;
        this.isRoomLocked = false;
        this.chatService.resetChats();
        this.playersService.isGameStarted = false;
        this.playersService.hasGameFinished = false;
        this.isGamePaused = false;
        this.rank = 0;
        this.roomId = '';
        this.assertLeaveGame = false;
        this.audioService.pauseAudio();
    }

    hasEnoughSelectedChoices(): boolean {
        return this.selectedChoiceIndexes.length > 0;
    }

    hasValidLongAnswer(): boolean {
        return this.longAnswer.trim().length > 0 && this.longAnswer.length <= MAX_ANSWER_LENGTH;
    }

    handleJoinGame(roomId: string) {
        this.roomId = roomId;
    }

    handleLeaveGame() {
        this.leaveGame();
        this.resetGame();
    }

    forceQuit() {
        this.assertLeaveGame = true;
        const route = this.isTestingMode ? AppRoutes.GameCreation : AppRoutes.Home;
        this.router.navigate([route]).then(() => {
            this.handleLeaveGame();
            this.assertLeaveGame = false;
        });
    }

    openConfirmationDialog(): MatDialogRef<ConfirmationModalComponent> {
        return this.dialog.open(ConfirmationModalComponent, {
            panelClass: 'mat-dialog',
            enterAnimationDuration: 0,
            exitAnimationDuration: 0,
            data: {
                title: 'Voulez-vous vraiment quitter la partie?',
                message: this.getIsOrganizer() ? 'Tous les joueurs seront expulsés' : 'Vous ne pourrez plus rejoindre',
            },
        });
    }

    canExitWithoutConfirmation(): boolean {
        return (
            (this.getGameState() === GameState.WaitingRoom && !this.getIsOrganizer()) ||
            (this.getGameState() === GameState.WaitingRoom && this.isRandomMode && this.playersService.playerList.length === 1) ||
            this.playersService.playerList.length === 0 ||
            this.isTestingMode ||
            this.assertLeaveGame ||
            this.getGameState() === GameState.QuizResults
        );
    }

    canDeactivate(): boolean | Observable<boolean> {
        if (this.canExitWithoutConfirmation()) {
            this.handleLeaveGame();
            return true;
        }

        const dialogRef = this.openConfirmationDialog();

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.handleLeaveGame();
            }
        });
        return dialogRef.afterClosed();
    }

    navigateExit() {
        this.router.navigate(this.isTestingMode ? [AppRoutes.GameCreation] : [AppRoutes.Home]);
    }

    leaveGame() {
        this.socketCommunicationService.send(WebSocketEvents.LeaveGame);
    }

    lockAnswer() {
        this.isLocked = true;
        this.socketCommunicationService.send(WebSocketEvents.LockAnswer, {}, (isLockedAnswer: boolean) => {
            this.isLocked = isLockedAnswer;
        });
    }

    actionButton() {
        this.socketCommunicationService.send(WebSocketEvents.ActionButton);
    }

    onChoiceSelect(choiceIndex: number) {
        if (this.isLocked) {
            return;
        }
        this.toggleChoiceSelect(choiceIndex);
        this.socketCommunicationService.send(
            WebSocketEvents.ChangeSelectedChoices,
            { selectedChoiceIndexes: this.selectedChoiceIndexes },
            (res: ChangeSelectedChoicesRes) => {
                this.selectedChoiceIndexes = res.selectedChoiceIndexes;
            },
        );
    }

    onLongAnswerChange(answer: string) {
        if (this.isLocked) {
            return;
        }
        this.longAnswer = answer;
        this.socketCommunicationService.send(WebSocketEvents.ChangeLongAnswer, { longAnswer: this.longAnswer });
    }

    onLockRoom() {
        this.isRoomLocked = !this.isRoomLocked;
        this.socketCommunicationService.send(WebSocketEvents.ChangeLockRoom, { locked: this.isRoomLocked });
    }

    pauseTime() {
        this.socketCommunicationService.send(WebSocketEvents.GamePaused, { paused: this.isGamePaused });
    }

    panicMode() {
        if (this.isPanicOn) {
            return;
        }
        this.isPanicOn = true;
        this.socketCommunicationService.send(WebSocketEvents.StartPanic);
    }

    toggleChoiceSelect(choiceIndex: number) {
        if (this.selectedChoiceIndexes.includes(choiceIndex)) {
            this.selectedChoiceIndexes = this.selectedChoiceIndexes.filter((c) => c !== choiceIndex);
        } else {
            this.selectedChoiceIndexes.push(choiceIndex);
        }
    }

    requestCreateGame(quizId: string, isTestingMode: boolean, isRandomMode: boolean) {
        this.socketCommunicationService.send(WebSocketEvents.CreateGame, { quizId, isTest: isTestingMode, isRandom: isRandomMode });
    }

    onPanicButtonAvailable() {
        this.socketCommunicationService.on(WebSocketEvents.PanicAvailable, (available: boolean) => {
            this.isPanicAvailable = available;
        });
    }

    onStartPanicMode() {
        this.socketCommunicationService.on(WebSocketEvents.PanicModeStarted, (started: boolean) => {
            this.isPanicOn = started;
            if (!this.isGamePaused) {
                this.audioService.playAudio();
            }
        });
    }

    onPauseRequest() {
        this.socketCommunicationService.on(WebSocketEvents.PauseRequest, (paused: boolean) => {
            this.isGamePaused = paused;
            if (this.isGamePaused) {
                this.audioService.pauseAudio();
                this.notificationService.showBanner(
                    new NotificationContent('La partie est sur pause', NotificationType.Info, INFO_NOTIFICATION_DURATION),
                );
            } else {
                if (this.isPanicOn) {
                    this.audioService.playAudio();
                }
                this.notificationService.showBanner(
                    new NotificationContent('Fin de la pause, au travail!', NotificationType.Info, INFO_NOTIFICATION_DURATION),
                );
            }
        });
    }

    gradeQuestion(grade: number) {
        this.socketCommunicationService.send(WebSocketEvents.GradingResponse, { grade });
    }

    onNewQuestion() {
        this.socketCommunicationService.on(WebSocketEvents.NewQuestion, (newQuestionInfo: NewQuestionRes) => {
            this.resetStatsOnNewQuestion();
            this.question = newQuestionInfo.question;
            this.isLastQuestion = newQuestionInfo.isLastQuestion;
            this.sendNewQuestionMessage();
        });
    }

    onQuestionAnswers() {
        this.socketCommunicationService.on(WebSocketEvents.QuestionAnswers, (answers: number[]) => {
            if (this.question.type === QuestionType.MULTIPLE_CHOICE) {
                (this.question as Qcm).choices = (this.question as Qcm).choices.map((choice, i) => {
                    choice.isCorrect = answers.includes(i);
                    return choice;
                });
            }
        });
    }

    onKickPlayer() {
        this.socketCommunicationService.on(WebSocketEvents.KickPlayer, (kickPlayerRes: KickPlayerRes) => {
            this.forceQuit();
            this.notificationService.showBanner(
                new NotificationContent(KICK_PLAYER_TEXT.get(kickPlayerRes.kickPlayerReason), NotificationType.Info, INFO_NOTIFICATION_DURATION),
            );
        });
    }

    onJoinGame() {
        this.socketCommunicationService.on(WebSocketEvents.JoinGame, (joinGameRes: JoinGameRes) => {
            this.quizTitle = joinGameRes.quizTitle;
            this.playerName = joinGameRes.playerName;
            this.roomId = joinGameRes.roomId;
            this.isTestingMode = joinGameRes.isTestingMode;
            this.isRandomMode = joinGameRes.isRandomMode;
            this.isOrganizer = joinGameRes.isOrganizer;
            this.gameState = joinGameRes.gameState;
            this.resetStatsOnNewQuestion();

            this.router.navigate([AppRoutes.Play]);
        });
    }

    onGameStateUpdate() {
        this.socketCommunicationService.on(WebSocketEvents.GameStateUpdate, (gameState: GameState) => {
            this.gameState = gameState;
            this.isPanicOn = false;
            this.checkIfGameStarted();
            this.checkIfGameFinished();
            this.audioService.pauseAudio();
        });
    }

    onStartTimer() {
        this.socketCommunicationService.on(WebSocketEvents.StartTimer, (duration: number) => {
            this.duration = duration;
        });
    }

    onTimeUpdate() {
        this.socketCommunicationService.on(WebSocketEvents.TimeUpdate, (time: number) => {
            this.time = time;
        });
    }

    onQuestionResults() {
        this.socketCommunicationService.on(WebSocketEvents.QuestionResults, (questionResultInfo: QuestionResultsRes) => {
            this.questionResult = questionResultInfo.questionResult;
            this.bonus = questionResultInfo.isBonus;
            this.rank = questionResultInfo.rank;
            this.playerScore += this.questionResult;
            this.isLocked = true;
        });
    }

    onGradingRequest() {
        this.socketCommunicationService.on(WebSocketEvents.GradingRequest, (gradingRequest: GradeQuestionReq) => {
            this.gradeQuestionRequest = gradingRequest;
        });
    }

    onChangeOrganizerStatus() {
        this.socketCommunicationService.on(WebSocketEvents.ChangeOrganizerStatus, (changeOrganizerStatusRes: ChangeOrganizerStatusRes) => {
            this.isOrganizer = changeOrganizerStatusRes.isOrganizer;
        });
    }
}
