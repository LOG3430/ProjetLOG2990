import { Injectable } from '@angular/core';
import {
    ERROR_NOTIFICATION_DURATION,
    SUCCESS_NOTIFICATION_DURATION,
    WARNING_NOTIFICATION_DURATION,
} from '@app/constants/common/notifications.constants';
import { CONNECT_ERROR_MESSAGE } from '@app/constants/connect-error-messages.constants';
import { STATE_PRIORITY } from '@app/constants/state-priority.constants';
import { ListOrder } from '@app/enums/list-order.enum';
import { NotificationContent, NotificationType } from '@app/interfaces/notification-content';
import { PlayerInfo } from '@app/interfaces/player-info';
import { ChatService } from '@app/services/chat-client/chat-client.service';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { ConnectToGameErrorType } from '@common/enums/connect-to-game-error-type.enum';
import { RoomId } from '@common/http/roomId.dto';
import { BanNameReq } from '@common/websockets/ban-name.dto';
import { BonusTimesInfo } from '@common/websockets/bonus-times.dto';
import { ConnectionReq, ConnectionRes } from '@common/websockets/connection.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { HasInteractedInfo } from '@common/websockets/has-interacted.dto';
import { HasLockedAnswerInfo } from '@common/websockets/has-locked-answer.dto';
import { MuteRes } from '@common/websockets/mute.dto';
import { PlayerScore } from '@common/websockets/player-score.dto';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PlayersService {
    playerList: PlayerInfo[];
    isGameStarted: boolean;
    hasGameFinished: boolean;
    listOrder: ListOrder;

    isStateOrder: boolean;
    isScoreAscendingOrder: boolean;
    isScoreDescendingOrder: boolean;

    // To accommodate the specific requirements of this service we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(
        private socketService: SocketCommunicationService,
        private httpCommunicationService: HttpCommunicationService,
        private notificationService: NotificationService,
        private chatService: ChatService,
    ) {
        this.initialiseListeners();
        this.playerList = [];
        this.isGameStarted = false;
        this.hasGameFinished = false;
    }

    async connectToGame(roomId: string, playerName: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.socketService.send<ConnectionReq, ConnectionRes>(WebSocketEvents.ConnectToGame, { roomId, playerName }, (res: ConnectionRes) => {
                if (res.success) {
                    this.chatService.chats = [];
                    resolve(true);
                } else {
                    this.showConnectError(res.errorType);
                    resolve(false);
                }
            });
        });
    }

    async validateRoomId(roomId: string): Promise<boolean> {
        try {
            const { success, errorType } = await this.getRoomIdStatus(roomId);
            if (success) {
                this.notificationService.showBanner(
                    new NotificationContent("L'identifiant est correct", NotificationType.Success, SUCCESS_NOTIFICATION_DURATION),
                );
            } else {
                this.showConnectError(errorType);
            }
            return success;
        } catch (error) {
            this.notificationService.showBanner(
                new NotificationContent("Erreur lors de la validation de l'identifiant!", NotificationType.Error, ERROR_NOTIFICATION_DURATION),
            );
            return false;
        }
    }

    banPlayer(playerName: string): void {
        this.socketService.send<BanNameReq, void>(WebSocketEvents.BanName, { playerName });
    }

    getPlayerScoreByName(name: string): number {
        return this.playerList.find((player) => player.name === name)?.score || 0;
    }

    getIsMutedByName(name: string): boolean {
        return this.playerList.find((player) => player.name === name)?.isMuted || false;
    }

    getPlayerStatePriority(player: PlayerInfo): number {
        if (player.hasLeft) {
            return STATE_PRIORITY.hasLeft;
        } else if (player.hasLockedAnswer) {
            return STATE_PRIORITY.hasLockedAnswer;
        } else if (player.hasInteracted) {
            return STATE_PRIORITY.hasInteracted;
        } else {
            return STATE_PRIORITY.default;
        }
    }

    orderList(): void {
        if (this.listOrder === 'AlphabeticalUp') {
            this.orderAlphabeticallyInGame(false);
        }
        if (this.listOrder === 'AlphabeticalDown') {
            this.orderAlphabeticallyInGame(true);
        }
        if (this.listOrder === 'ScoreAsc') {
            this.orderByScore(false);
        }
        if (this.listOrder === 'ScoreDesc') {
            this.orderByScore(true);
        }
        if (this.listOrder === 'PlayerStateAsc') {
            this.orderByPlayerState(false);
        }
        if (this.listOrder === 'PlayerStateDesc') {
            this.orderByPlayerState(true);
        }
    }

    orderAlphabetically(): void {
        this.playerList.sort((a, b) => a.name.localeCompare(b.name, 'fr-CA', { sensitivity: 'base' }));
    }

    orderAlphabeticallyInGame(isDescending: boolean): void {
        if (isDescending) {
            this.listOrder = ListOrder.AlphabeticalDown;
            this.playerList.sort((a, b) => b.name.localeCompare(a.name, 'fr-CA', { sensitivity: 'base' }));
        } else {
            this.listOrder = ListOrder.AlphabeticalUp;
            this.orderAlphabetically();
        }
    }

    orderByScore(isDescending: boolean): void {
        this.orderAlphabetically();
        if (isDescending) {
            this.listOrder = ListOrder.ScoreDesc;
            this.playerList.sort((a, b) => b.score - a.score);
        } else {
            this.listOrder = ListOrder.ScoreAsc;
            this.playerList.sort((a, b) => a.score - b.score);
        }
    }

    orderByPlayerState(isDescending: boolean): void {
        this.orderAlphabetically();

        if (isDescending) {
            this.listOrder = ListOrder.PlayerStateDesc;
            this.playerList.sort((a, b) => {
                return this.getPlayerStatePriority(a) - this.getPlayerStatePriority(b);
            });
        } else {
            this.listOrder = ListOrder.PlayerStateAsc;
            this.playerList.sort((a, b) => {
                return this.getPlayerStatePriority(b) - this.getPlayerStatePriority(a);
            });
        }
    }

    async getRoomIdStatus(roomId: string): Promise<ConnectionRes> {
        const room: string = roomId;
        return firstValueFrom(this.httpCommunicationService.basicPost<RoomId, ConnectionRes>('validation/rooms', { room }));
    }

    private initialiseListeners(): void {
        this.onPlayerChange();
        this.onUpdateScores();
        this.onUpdateMutedPlayers();
        this.onBonusTimesInfo();
        this.onLockChoices();
        this.onChangeSelectedChoices();
    }

    private initialisePlayerList(playerList: string[]): void {
        this.playerList = playerList.map((name) => ({
            name,
            hasLeft: false,
            hasLockedAnswer: false,
            hasInteracted: false,
            isMuted: this.getIsMutedByName(name),
            score: this.getPlayerScoreByName(name),
            bonusTimes: 0,
        }));
        this.listOrder = ListOrder.ScoreDesc;
    }

    private onUpdateScores() {
        this.socketService.on(WebSocketEvents.UpdateScores, (playerScores: PlayerScore[]) => {
            playerScores.forEach((playerScore) => {
                const playerWithScore = this.playerList.find((player) => player.name === playerScore.name);
                if (!playerWithScore) {
                    return;
                }
                playerWithScore.score = playerScore.score;
            });
            this.orderList();
        });
    }

    private onBonusTimesInfo() {
        this.socketService.on(WebSocketEvents.BonusTimesInfo, (bonusTimesInfos: BonusTimesInfo[]) => {
            bonusTimesInfos.forEach((bonusTimesInfo) => {
                const playerWithBonus = this.playerList.find((player) => player.name === bonusTimesInfo.name);
                if (!playerWithBonus) {
                    return;
                }
                playerWithBonus.bonusTimes = bonusTimesInfo.bonusTimes;
            });
        });
    }

    private onUpdateMutedPlayers() {
        this.socketService.on(WebSocketEvents.UpdateMutedPlayers, (res: MuteRes) => {
            this.playerList.forEach((player) => {
                if (res.name === player.name) {
                    player.isMuted = res.isMuted;
                }
            });
        });
    }

    private onChangeSelectedChoices() {
        this.socketService.on(WebSocketEvents.OnChangeHasInteracted, (res: HasInteractedInfo) => {
            this.playerList.forEach((player) => {
                if (res.name === player.name) {
                    player.hasInteracted = res.hasInteracted;
                }
            });
            this.orderList();
        });
    }

    private onPlayerChange() {
        this.socketService.on<string[]>(WebSocketEvents.PlayerChange, (playerList) => {
            if (this.isGameStarted) {
                this.playerList.forEach((player) => {
                    if (!playerList.includes(player.name) && !this.hasGameFinished) {
                        player.hasLeft = true;
                        this.orderList();
                    }
                });
            } else {
                this.initialisePlayerList(playerList);
            }
        });
    }

    private onLockChoices() {
        this.socketService.on(WebSocketEvents.OnLockAnswers, (res: HasLockedAnswerInfo) => {
            this.playerList.forEach((player) => {
                if (res.name === player.name) {
                    player.hasLockedAnswer = res.hasLockedAnswer;
                }
            });
            this.orderList();
        });
    }

    private showConnectError(errorType?: ConnectToGameErrorType): void {
        if (!errorType) {
            return;
        }
        this.notificationService.showBanner(
            new NotificationContent(CONNECT_ERROR_MESSAGE.get(errorType), NotificationType.Warning, WARNING_NOTIFICATION_DURATION),
        );
    }
}
