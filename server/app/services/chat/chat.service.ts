import { Player } from '@app/classes/player/player';
import { ORGANIZER_NAME } from '@app/constants/organizer.constants';
import { ClientCommunicationService } from '@app/services/client-communication/client-communication.service';
import { GameService } from '@app/services/game/game.service';
import { ChatMessageRes } from '@common/websockets/chat-message.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
    constructor(
        private clientCommunicationService: ClientCommunicationService,
        private gameService: GameService,
    ) {}

    sendMessageInternally(roomId: string, playerName: string, message: string) {
        const messageObject = this.createMessage(playerName, message);
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.SendChatMessage, messageObject);
    }

    sendMessageFromPlayer(roomId: string, player: Player, message: string): void {
        if (player && !player.isMuted) {
            this.sendMessageInternally(roomId, player.name, message);
        }
    }

    // To accommodate the specific requirements of this method we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    sendMessage(roomId: string, player: Player, message: string, isOrganizer: boolean): void {
        if (isOrganizer) {
            this.sendMessageInternally(roomId, ORGANIZER_NAME, message);
        } else {
            this.sendMessageFromPlayer(roomId, player, message);
        }
    }

    toggleMute(player: Player, roomId: string): void {
        player.isMuted = !player.isMuted;
        this.sendMuteMessage(player, roomId);
    }

    notifyOrganizer(player: Player, roomId: string) {
        const game = this.gameService.getGame(roomId);
        this.clientCommunicationService.sendToPlayer(game.getOrganizerId(), WebSocketEvents.UpdateMutedPlayers, {
            name: player.name,
            message: player.name + ' muted',
            isMuted: player.isMuted,
        });
    }

    unmuteAllPlayers(roomId: string): void {
        const game = this.gameService.getGame(roomId);
        game.getPlayers()
            .filter((player) => player.isMuted)
            .forEach((player) => {
                player.isMuted = false;
                this.sendMuteMessage(player, roomId);
            });
    }

    private createMessage(playerName: string, message: string): ChatMessageRes {
        return { playerName, message, date: new Date() };
    }

    private sendMuteMessage(player: Player, roomId: string) {
        const messageContent = player.isMuted
            ? "L'organisateur vous a retiré vos privilèges de clavardage"
            : "L'organisateur vous a redonné vos privilèges de clavardage";
        const systemMessage = this.createMessage('MESSAGE SYSTÈME', messageContent);
        this.clientCommunicationService.sendToPlayer(player.id, WebSocketEvents.OnToggleMute, {
            name: player.name,
            message: systemMessage,
            isMuted: player.isMuted,
        });
        this.notifyOrganizer(player, roomId);
    }
}
