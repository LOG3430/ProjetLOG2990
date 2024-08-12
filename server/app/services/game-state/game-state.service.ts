import { Game } from '@app/classes/game/game';
import { GameAction } from '@app/enums/game-action.enum';
import { ChatService } from '@app/services/chat/chat.service';
import { ClientCommunicationService } from '@app/services/client-communication/client-communication.service';
import { HistoryService } from '@app/services/database/history/history.service';
import { GameService } from '@app/services/game/game.service';
import { DELAY_BEFORE_GAME_STARTS, DELAY_COOLDOWN, DELAY_QUESTION_RESULT } from '@app/services/game/game.service.constants';
import { GameState } from '@common/enums/game-state.enum';
import { KickPlayerReason } from '@common/enums/kick-player-reason.enum';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameStateService {
    // To accommodate the specific requirements of this service we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameService,
        private clientCommunicationService: ClientCommunicationService,
        private historyService: HistoryService,
        private chatService: ChatService,
    ) {}

    handleState(roomId: string, action: GameAction, playerId: string) {
        if (!this.gameService.isOrganizer(this.gameService.getGame(roomId), playerId)) {
            return;
        }
        this.handleStateInternally(roomId, action);
    }

    checkAllLockedChoices(roomId: string) {
        const game = this.gameService.getGame(roomId);
        if (game.state === GameState.Answering && game.isAllChoicesLocked()) {
            this.handleState(roomId, GameAction.EndTimer, game.getOrganizerId());
        }
    }

    private handleStateInternally(roomId: string, action: GameAction): void {
        const game = this.gameService.getGame(roomId);

        switch (game.state) {
            case GameState.WaitingRoom:
                this.handleWaitingRoomStateActions(game, action, roomId);
                break;
            case GameState.InitialTimer:
                this.handleInitialTimerStateActions(game, action, roomId);
                break;
            case GameState.Answering:
                this.handleAnsweringStateActions(game, action, roomId);
                break;
            case GameState.QuestionResults:
                this.handleQuestionResultsStateActions(game, action, roomId);
                break;
            case GameState.Grading:
                this.handleGradingStateActions(game, action, roomId);
                break;
            case GameState.Cooldown:
                this.handleCooldownStateActions(game, action, roomId);
                break;
        }
    }

    private handleWaitingRoomStateActions(game: Game, action: GameAction, roomId: string) {
        if (action === GameAction.SkipStateOnTestMode && game.getIsTest()) {
            game.state = GameState.Answering;
            this.startTimer(game, game.getDuration(), roomId);
        } else if (action === GameAction.ActionButton && !game.getIsTest()) {
            if (!this.gameService.canStartGame(game)) {
                return;
            }
            if (game.getIsRandom()) {
                this.clientCommunicationService.sendToPlayer(game.getOrganizerId(), WebSocketEvents.ChangeOrganizerStatus, { isOrganizer: false });
                game.removeOrganizer();
            }

            this.switchToInitialTimerState(game, roomId);
        }

        this.sendGameStateUpdate(game, roomId);
        this.gameService.sendNewQuestion(game, roomId);
    }

    private handleInitialTimerStateActions(game: Game, action: GameAction, roomId: string) {
        if (action !== GameAction.EndTimer) {
            return;
        }

        this.switchToAnsweringState(game, roomId);
    }

    private handleAnsweringStateActions(game: Game, action: GameAction, roomId: string) {
        if (action === GameAction.ActionButton) {
            return;
        }

        if (!game.getIsTest() && !game.isQcm()) {
            game.state = GameState.Grading;
            game.timer.reset();
            this.sendGameStateUpdate(game, roomId);
            this.gameService.gradeNextPlayer(roomId);
            return;
        }

        this.switchToQuestionResultsState(game, roomId);
    }

    private handleQuestionResultsStateActions(game: Game, action: GameAction, roomId: string) {
        if (action === GameAction.ActionButton && game.getIsTest()) {
            return;
        }
        if (action === GameAction.EndTimer && !(game.getIsTest() || game.getIsRandom())) {
            return;
        }

        if (game.getIsTest()) {
            this.handleQuestionResultsStateActionsForTest(game, roomId);
        } else {
            this.handleQuestionResultsStateActionsForGame(game, roomId);
        }
    }

    private handleQuestionResultsStateActionsForTest(game: Game, roomId: string) {
        if (game.isLastQuestion()) {
            this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.KickPlayer, { kickPlayerReason: KickPlayerReason.GameEnded });
            this.gameService.deleteGame(roomId);
            this.gameService.resetPlayerInteractions(game, roomId);
        } else {
            this.gameService.loadNextQuestion(game, roomId);
            game.state = GameState.Answering;
            this.startTimer(game, game.getDuration(), roomId);
        }
        this.sendGameStateUpdate(game, roomId);
    }

    private handleQuestionResultsStateActionsForGame(game: Game, roomId: string) {
        if (game.isLastQuestion()) {
            game.state = GameState.QuizResults;
            game.nextQuestion();
            this.sendGameStateUpdate(game, roomId);
            this.gameService.resetPlayerInteractions(game, roomId);
            this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.QuizStatisticsHistory, {
                totalSelectedChoicesHistory: game.getTotalResultHistory(),
                quiz: game.getQuiz(),
            });

            this.historyService.addHistory(game.getHistoryInfo());
            this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.UpdateScores, game.getPlayersScores());
            this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.BonusTimesInfo, game.getPlayerBonusTimes());
            this.chatService.unmuteAllPlayers(roomId);
        } else {
            game.state = GameState.Cooldown;
            this.startTimer(game, DELAY_COOLDOWN, roomId);
            this.sendGameStateUpdate(game, roomId);
            this.gameService.loadNextQuestion(game, roomId);
        }
    }

    private handleGradingStateActions(game: Game, action: GameAction, roomId: string) {
        if (action !== GameAction.GradingFinished) {
            return;
        }

        if (game.areGradingsFinished()) {
            this.switchToQuestionResultsState(game, roomId);
            this.gameService.sendGradesTotal(game);
        } else {
            this.gameService.gradeNextPlayer(roomId);
        }
    }

    private handleCooldownStateActions(game: Game, action: GameAction, roomId: string) {
        if (action !== GameAction.EndTimer) {
            return;
        }

        this.switchToAnsweringState(game, roomId);
    }

    private switchToInitialTimerState(game: Game, roomId: string) {
        game.state = GameState.InitialTimer;
        this.startTimer(game, DELAY_BEFORE_GAME_STARTS, roomId);

        game.orderPlayersAlphabetically();
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.PlayerChange, game.getPlayerNames());

        game.nStartPlayers = game.getPlayers().length;
        game.startDateTime = new Date();
    }

    private switchToQuestionResultsState(game: Game, roomId: string) {
        game.state = GameState.QuestionResults;
        game.lockAllRemainingPlayersAnswers();
        game.endAllPlayersTimers();
        game.updatePlayersScore();
        this.gameService.sendQuestionResults(game, roomId);
        this.gameService.sendScoresToOrganizer(roomId);
        this.sendGameStateUpdate(game, roomId);
        game.timer.reset();

        if (game.getIsTest() || game.getIsRandom()) {
            this.startTimer(game, DELAY_QUESTION_RESULT, roomId);
        }
    }

    private switchToAnsweringState(game: Game, roomId: string) {
        game.state = GameState.Answering;
        this.sendGameStateUpdate(game, roomId);

        this.startTimer(game, game.getDuration(), roomId);
        if (game.isQcm()) {
            this.gameService.sendSelectedChoicesTotal(game);
        } else {
            this.gameService.sendEditingLongAnswerTotal(game);
        }
    }

    private startTimer(game: Game, duration: number, roomId: string) {
        this.gameService.sendPanicAvailable(roomId, duration);
        this.clientCommunicationService.sendStartTimer(roomId, duration);
        game.timer.start(duration, this.handleStateInternally.bind(this, roomId, GameAction.EndTimer), this.sendTimerUpdate.bind(this, roomId));
    }

    private sendTimerUpdate(roomId: string, timeRemaining: number) {
        this.gameService.sendPanicAvailable(roomId, timeRemaining);
        this.clientCommunicationService.sendTimerUpdate(roomId, timeRemaining);
    }

    private sendGameStateUpdate(game: Game, roomId: string) {
        this.clientCommunicationService.sendGameStateUpdate(roomId, game.state);
    }
}
