import { ORGANIZER_NAME } from '@app/constants/organizer.constants';
import { GameAction } from '@app/enums/game-action.enum';
import { ChatService } from '@app/services/chat/chat.service';
import { ClientCommunicationService } from '@app/services/client-communication/client-communication.service';
import { GameStateService } from '@app/services/game-state/game-state.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { BanNameReq } from '@common/websockets/ban-name.dto';
import { ChangeLongAnswerReq } from '@common/websockets/change-long-answer.dto';
import { ChangeSelectedChoicesReq, ChangeSelectedChoicesRes } from '@common/websockets/change-selected-choices.dto';
import { ChatMessageReq } from '@common/websockets/chat-message.dto';
import { ConnectionReq, ConnectionRes } from '@common/websockets/connection.dto';
import { CreateGameReq } from '@common/websockets/create-game.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { GradeQuestionRes } from '@common/websockets/grade-question.dto';
import { LockRoomReq } from '@common/websockets/lock-room.dto';
import { MuteReq } from '@common/websockets/mute.dto';
import { PausedGameReq } from '@common/websockets/paused-game.dto';
import { OnModuleInit } from '@nestjs/common';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameSocketGateway implements OnModuleInit, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    // To accommodate the specific requirements of this gateway we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameService,
        private gameStateService: GameStateService,
        private roomService: RoomService,
        private clientCommunicationService: ClientCommunicationService,
        private chatService: ChatService,
    ) {}

    @SubscribeMessage(WebSocketEvents.CreateGame)
    async handleGameCreation(client: Socket, data: CreateGameReq) {
        const roomId = this.roomService.createRoom(client);
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.PlayerChange, []);
        await this.gameService.createGame(roomId, data.quizId, client.id, data.isTest, data.isRandom);
        client.data.name = ORGANIZER_NAME;
        this.gameStateService.handleState(roomId, GameAction.SkipStateOnTestMode, client.id);
    }

    @SubscribeMessage(WebSocketEvents.ConnectToGame)
    handleGameJoining(client: Socket, data: ConnectionReq): ConnectionRes {
        this.roomService.joinRoom(data.roomId, client);
        const connectionRes: ConnectionRes = this.gameService.connectPlayerToGame(client, data);
        if (!connectionRes.success) {
            this.roomService.leaveRoom(data.roomId, client);
            return connectionRes;
        }

        client.data.name = data.playerName;
        return connectionRes;
    }

    @SubscribeMessage(WebSocketEvents.LeaveGame)
    handleGameLeaving(client: Socket) {
        const roomId = this.roomService.getRoomId(client);
        this.chatService.sendMessageInternally(roomId, 'MESSAGE SYSTÈME', client.data.name + ' a quitté la partie');
        this.gameService.removePlayerFromGame(roomId, client.id);
        const playerList = this.gameService.getPlayerNames(roomId);
        this.clientCommunicationService.sendToRoom(roomId, WebSocketEvents.PlayerChange, playerList);
    }

    @SubscribeMessage(WebSocketEvents.ActionButton)
    handleActionButton(client: Socket) {
        const roomId = this.roomService.getRoomId(client);
        this.gameStateService.handleState(roomId, GameAction.ActionButton, client.id);
    }

    @SubscribeMessage(WebSocketEvents.ChangeSelectedChoices)
    handleSelectedChoices(client: Socket, data: ChangeSelectedChoicesReq): ChangeSelectedChoicesRes {
        const roomId = this.roomService.getRoomId(client);
        const newChoices = this.gameService.updateCurrentChoices(roomId, client.id, data.selectedChoiceIndexes);

        return { selectedChoiceIndexes: newChoices };
    }

    @SubscribeMessage(WebSocketEvents.ChangeLongAnswer)
    handleLongAnswer(client: Socket, data: ChangeLongAnswerReq) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.updateLongAnswer(roomId, client.id, data.longAnswer);
    }

    @SubscribeMessage(WebSocketEvents.LockAnswer)
    handleLockAnswers(client: Socket): boolean {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.lockAnswers(roomId, client.id);
        this.gameStateService.handleState(roomId, GameAction.SkipStateOnTestMode, client.id);
        this.gameStateService.checkAllLockedChoices(roomId);
        return true;
    }

    @SubscribeMessage(WebSocketEvents.ChangeLockRoom)
    handleLockRoom(client: Socket, { locked }: LockRoomReq) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.toggleLockRoom(roomId, locked);
    }

    @SubscribeMessage(WebSocketEvents.StartPanic)
    handlePanicStart(client: Socket) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.startPanicMode(roomId);
    }

    @SubscribeMessage(WebSocketEvents.GamePaused)
    handlePausedGame(client: Socket, { paused }: PausedGameReq) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.togglePausedGame(roomId, paused);
    }

    @SubscribeMessage(WebSocketEvents.BanName)
    handleBannedNames(client: Socket, data: BanNameReq) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.banName(client.id, roomId, data.playerName);
    }

    @SubscribeMessage(WebSocketEvents.SendChatMessage)
    handleChatMessage(client: Socket, data: ChatMessageReq) {
        const roomId = this.roomService.getRoomId(client);
        const player = this.gameService.getPlayerByName(roomId, client.data.name);

        this.chatService.sendMessage(roomId, player, data.message, this.gameService.isOrganizer(this.gameService.getGame(roomId), client.id));
    }

    @SubscribeMessage(WebSocketEvents.ToggleMute)
    handleToggleMute(client: Socket, data: MuteReq) {
        const roomId = this.roomService.getRoomId(client);
        const player = this.gameService.getPlayerByName(roomId, data.name);

        this.chatService.toggleMute(player, roomId);
    }

    @SubscribeMessage(WebSocketEvents.GradingResponse)
    handleGrade(client: Socket, data: GradeQuestionRes) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.applyGrading(roomId, data.grade);
        this.gameStateService.handleState(roomId, GameAction.GradingFinished, client.id);
    }

    onModuleInit() {
        this.clientCommunicationService.setServer(this.server);
        this.roomService.setServer(this.server);
    }

    handleDisconnect(client: Socket) {
        this.handleGameLeaving(client);
    }
}
