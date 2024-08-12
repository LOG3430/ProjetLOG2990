// Game service handles a lot of logic that can't be separated to ensure clarity and maintainability
/* eslint-disable max-lines */
import { Game } from '@app/classes/game/game';
import { Player } from '@app/classes/player/player';
import { ORGANIZER_NAME } from '@app/constants/organizer.constants';
import { ClientCommunicationService } from '@app/services/client-communication/client-communication.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { RoomService } from '@app/services/room/room.service';
import { ConnectToGameErrorType } from '@common/enums/connect-to-game-error-type.enum';
import { GameState } from '@common/enums/game-state.enum';
import { KickPlayerReason } from '@common/enums/kick-player-reason.enum';
import { ConnectionReq, ConnectionRes } from '@common/websockets/connection.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { TotalSelectedChoices } from '@common/websockets/total-result.dto';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GameService {
    games: Map<string, Game>;

    constructor(
        private quizService: QuizService,
        private clientCommunicationService: ClientCommunicationService,
        private roomService: RoomService,
    ) {
        this.games = new Map();
    }

    // To accommodate the specific requirements of this method we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    async createGame(roomId: string, quizId: string, organizerId: string, isTest: boolean, isRandom: boolean) {
        const quiz = await this.quizService.getQuiz(quizId, isRandom);
        const game = new Game(quiz, organizerId, isTest, isRandom);
        this.games.set(roomId, game);
        if (isTest || isRandom) {
            this.addOrganizerAsPlayerToGame(roomId, organizerId);
        }

        this.clientCommunicationService.sendToPlayer(organizerId, WebSocketEvents.JoinGame, {
            quizTitle: game.getQuizTitle(),
            isOrganizer: true,
            isTestingMode: game.getIsTest(),
            isRandomMode: game.getIsRandom(),
            gameState: game.state,
            playerName: ORGANIZER_NAME,
            roomId,
        });
        this.sendNewQuestion(game, roomId);
        this.sendScoresToOrganizer(roomId);
    }

    deleteGame(roomId: string) {
        const game = this.getGame(roomId);
        if (!game) {
            return;
        }
        game.timer.reset();
        this.games.delete(roomId);
        this.roomService.deleteRoom(roomId);
    }

    connectPlayerToGame(client: Socket, connectionReq: ConnectionReq): ConnectionRes {
        const playerName = connectionReq.playerName;
        const game = this.getGame(connectionReq.roomId);

        if (!this.roomService.isRoomActive(connectionReq.roomId)) {
            return { success: false, errorType: ConnectToGameErrorType.InvalidGame };
        }
        if (game.isNameBanned(playerName)) {
            return { success: false, errorType: ConnectToGameErrorType.BannedName };
        }
        if (game.isNameAlreadyTaken(playerName)) {
            return { success: false, errorType: ConnectToGameErrorType.NameTaken };
        }
        if (game.isRoomLocked) {
            return { success: false, errorType: ConnectToGameErrorType.RoomLocked };
        }

        const success = this.addPlayerToGame(connectionReq.roomId, client.id, connectionReq.playerName);
        return success ? { success: true } : { success: false, errorType: ConnectToGameErrorType.InvalidGame };
    }

    addPlayerToGame(roomId: string, playerId: string, playerName: string): boolean {
        const game = this.getGame(roomId);
        if (!game) {
            return false;
        }

        game.addPlayer(playerId, playerName);
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.PlayerChange, game.getPlayerNames());
        this.clientCommunicationService.sendToPlayer(playerId, WebSocketEvents.JoinGame, {
            quizTitle: game.getQuizTitle(),
            isOrganizer: this.isOrganizer(game, playerId),
            isTestingMode: game.getIsTest(),
            isRandomMode: game.getIsRandom(),
            gameState: game.state,
            playerName,
            roomId,
        });
        return true;
    }

    getPlayerId(roomId: string, playerName: string): string | null {
        const game = this.getGame(roomId);
        return game ? game.getPlayers().find((player) => player.name === playerName)?.id : null;
    }

    getPlayerNames(roomId: string): string[] {
        const game = this.getGame(roomId);
        return game ? game.getPlayerNames() : [];
    }

    addOrganizerAsPlayerToGame(roomId: string, organizerId: string) {
        this.addPlayerToGame(roomId, organizerId, ORGANIZER_NAME);
    }

    getPlayerById(roomId: string, playerId: string): Player {
        const game = this.getGame(roomId);
        if (!game) {
            return;
        }
        return game.getPlayers().find((player) => player.id === playerId);
    }

    getPlayerByName(roomId: string, name: string): Player {
        const game = this.getGame(roomId);
        if (!game) {
            return;
        }
        return game.getPlayers().find((player) => player.name === name);
    }

    removePlayerFromGame(roomId: string, playerId: string): Player[] {
        const game = this.getGame(roomId);
        if (!game) {
            return [];
        }

        if (game.state === GameState.QuizResults) {
            return this.removePlayerFromResultsPage(game, roomId, playerId);
        }

        if (game.getOrganizerId() === playerId) {
            return this.removeOrganizerFromGame(game, roomId);
        }

        return this.removePlayerInternally(game, roomId, playerId);
    }

    updateCurrentChoices(roomId: string, playerId: string, selectedChoices: number[]): number[] {
        const game = this.getGame(roomId);
        const player = this.getPlayerById(roomId, playerId);
        player.hasInteracted = true;
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.OnChangeHasInteracted, {
            hasInteracted: player.hasInteracted,
            name: player.name,
        });
        const newChoices = game.updateSelectedChoices(playerId, selectedChoices);
        this.sendSelectedChoicesTotal(game);
        return newChoices;
    }

    getSelectedChoicesTotal(roomId: string): TotalSelectedChoices {
        const game = this.getGame(roomId);
        return game.getSelectedChoicesTotal();
    }

    lockAnswers(roomId: string, playerId: string) {
        const game = this.getGame(roomId);
        if (!this.canLockChoices(game)) {
            return;
        }
        game.lockAnswers(playerId);
        const player = this.getPlayerById(roomId, playerId);
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.OnLockAnswers, {
            hasLockedAnswer: player.hasLockedAnswers,
            name: player.name,
        });
    }

    banName(requesterId: string, roomId: string, name: string) {
        const game = this.getGame(roomId);
        if (!this.isOrganizer(game, requesterId)) {
            return;
        }

        game.banName(name);

        const playerId = this.getPlayerId(roomId, name);
        this.removePlayerFromGame(roomId, playerId);
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.PlayerChange, game.getPlayerNames());
        this.clientCommunicationService.sendToPlayer(playerId, WebSocketEvents.KickPlayer, { kickPlayerReason: KickPlayerReason.PlayerBanned });
    }

    toggleLockRoom(roomId: string, locked: boolean) {
        const game = this.getGame(roomId);
        game.isRoomLocked = locked;
    }

    togglePausedGame(roomId: string, paused: boolean) {
        const game = this.getGame(roomId);

        if (game.state === GameState.Answering) {
            game.isGamePaused = !paused;
        }
        game.pauseGame();
        this.sendPauseRequest(game, roomId);
    }

    startPanicMode(roomId: string) {
        const game = this.getGame(roomId);
        game.startPanicMode();
        this.sendPanicStarted(roomId);
    }

    getGameIdConnectionError(roomId: string): ConnectToGameErrorType | null {
        const game = this.getGame(roomId);
        if (!game) {
            return ConnectToGameErrorType.InvalidGame;
        }
        return game.isRoomLocked ? ConnectToGameErrorType.RoomLocked : null;
    }

    canStartGame(game: Game): boolean {
        return game.getPlayers().length >= 1 && game.isRoomLocked;
    }

    getGame(roomId: string): Game {
        return this.games.get(roomId);
    }

    isOrganizer(game: Game, playerId: string): boolean {
        return game.getOrganizerId() === playerId;
    }

    loadNextQuestion(game: Game, roomId: string) {
        game.nextQuestion();
        this.resetPlayerInteractions(game, roomId);
        this.sendNewQuestion(game, roomId);
    }

    resetPlayerInteractions(game: Game, roomId: string) {
        game.getPlayers().forEach((player) => {
            this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.OnLockAnswers, {
                hasLockedAnswer: player.hasLockedAnswers,
                name: player.name,
            });
            this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.OnChangeHasInteracted, {
                hasInteracted: player.hasInteracted,
                name: player.name,
            });
        });
    }

    sendNewQuestion(game: Game, roomId: string) {
        this.clientCommunicationService.sendQuestionToPlayers(roomId, game.getOrganizerId(), {
            question: game.getCurrentQuestionWithoutAnswers(),
            duration: game.getDuration(),
            isLastQuestion: game.isLastQuestion(),
        });
        this.clientCommunicationService.sendQuestionToOrganizer(roomId, game.getOrganizerId(), {
            question: game.getCurrentQuestion(),
            duration: game.getDuration(),
            isLastQuestion: game.isLastQuestion(),
        });
        if (game.isQcm()) {
            this.sendSelectedChoicesTotal(game);
        } else {
            this.sendEditingLongAnswerTotal(game);
        }
    }

    sendPauseRequest(game: Game, roomId: string) {
        this.clientCommunicationService.sendPauseRequest(roomId, game.getIsGamePaused());
    }

    sendSelectedChoicesTotal(game: Game) {
        this.clientCommunicationService.sendToPlayer(game.getOrganizerId(), WebSocketEvents.TotalSelectedChoices, game.getSelectedChoicesTotal());
    }

    sendEditingLongAnswerTotal(game: Game) {
        this.clientCommunicationService.sendToPlayer(
            game.getOrganizerId(),
            WebSocketEvents.TotalisEditingLongAnswer,
            game.getEditingLongAnswerTotal(),
        );
    }

    sendGradesTotal(game: Game) {
        this.clientCommunicationService.sendToPlayer(game.getOrganizerId(), WebSocketEvents.TotalGrades, game.getLongAnswerTotal());
    }

    sendQuestionResults(game: Game, roomId: string) {
        this.sendAnswersToPlayers(game, roomId);

        const players = game.getPlayersOrderedByScore();
        players.forEach((player, rank) => {
            this.clientCommunicationService.sendToPlayer(player.id, WebSocketEvents.QuestionResults, {
                isBonus: player.lastQuestionIsBonus,
                questionResult: player.lastQuestionResult,
                rank,
            });
        });
    }

    sendAnswersToPlayers(game: Game, roomId: string) {
        this.clientCommunicationService.sendAnswersToPlayers(roomId, game.getOrganizerId(), game.getAnswers());
    }

    sendPanicAvailable(roomId: string, time: number) {
        const game = this.getGame(roomId);
        this.clientCommunicationService.sendPanicModeAvailable(roomId, game.canStartPanicMode(time));
    }

    sendPanicStarted(roomId: string) {
        const game = this.getGame(roomId);
        this.clientCommunicationService.sendPanicModeStarted(roomId, game.isPanicOn);
    }

    sendScoresToOrganizer(roomId: string): void {
        const game = this.getGame(roomId);
        if (!game) {
            return;
        }
        const scores = game.getPlayersScores();
        const organizerId = game.getOrganizerId();
        this.clientCommunicationService.sendToPlayer(organizerId, WebSocketEvents.UpdateScores, scores);
    }

    applyGrading(roomId: string, grade: number) {
        const game = this.getGame(roomId);
        if (!game) {
            return;
        }
        game.addGrade(grade);
    }

    gradeNextPlayer(roomId: string) {
        const game = this.getGame(roomId);
        if (!game) {
            return;
        }
        const playerToGrade = game.getNextPlayerToGrade();
        this.clientCommunicationService.sendGradingRequest(
            game.getOrganizerId(),
            playerToGrade.longAnswer,
            playerToGrade.name,
            game.getGradeIndex(),
            game.nStartPlayers,
        );
    }

    updateLongAnswer(roomId: string, playerId: string, longAnswer: string) {
        const game = this.getGame(roomId);
        if (!game) {
            return;
        }
        game.updateLongAnswer(playerId, longAnswer, this.sendEditingLongAnswerTotal.bind(this, game));
        const player = this.getPlayerById(roomId, playerId);
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.OnChangeHasInteracted, {
            hasInteracted: player.hasInteracted,
            name: player.name,
        });
    }

    private canLockChoices(game: Game): boolean {
        return game.state === GameState.Answering;
    }

    private removeOrganizerFromGame(game: Game, roomId: string): Player[] {
        this.clientCommunicationService.sendToRoomExcept(roomId, game.getOrganizerId(), WebSocketEvents.KickPlayer, {
            kickPlayerReason: KickPlayerReason.OrganizerLeft,
        });
        this.deleteGame(roomId);
        return [];
    }

    private removePlayerFromResultsPage(game: Game, roomId: string, playerId: string): Player[] {
        const newPlayerList = game.removePlayer(playerId);
        this.roomService.leaveRoomById(roomId, playerId);
        if (this.shouldGameBeDeleted(game, playerId, newPlayerList)) {
            this.deleteGame(roomId);
            return [];
        }
        return newPlayerList;
    }

    private removePlayerInternally(game: Game, roomId: string, playerId: string): Player[] {
        const newPlayerList = game.removePlayer(playerId);
        this.roomService.leaveRoomById(roomId, playerId);

        if (newPlayerList.length === 0 && game.state !== GameState.WaitingRoom) {
            this.clientCommunicationService.sendToPlayer(game.getOrganizerId(), WebSocketEvents.KickPlayer, {
                kickPlayerReason: KickPlayerReason.AllPlayersLeft,
            });
            this.deleteGame(roomId);
            return [];
        }
        return newPlayerList;
    }

    private shouldGameBeDeleted(game: Game, playerId: string, playerList: Player[]): boolean {
        return (this.isOrganizer(game, playerId) && playerList.length === 0) || (playerList.length === 1 && game.getOrganizerHasLeft());
    }
}
