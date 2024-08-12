import { GameState } from '@common/enums/game-state.enum';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { GradeQuestionReq } from '@common/websockets/grade-question.dto';
import { NewQuestionRes } from '@common/websockets/new-question.dto';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class ClientCommunicationService {
    private io: Server | undefined;

    setServer(io: Server) {
        this.io = io;
    }

    sendToRoom<T>(roomId: string, event: WebSocketEvents, data: T) {
        if (this.io) {
            this.io.to(roomId).emit(event, data);
        }
    }

    // To accommodate the specific requirements of this method we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    sendToRoomExcept<T>(roomId: string, playerExceptionId: string, event: WebSocketEvents, data: T) {
        if (this.io) {
            this.io.to(roomId).except(playerExceptionId).emit(event, data);
        }
    }

    sendToPlayer<T>(playerId: string, event: WebSocketEvents, data: T) {
        if (this.io) {
            this.io.to(playerId).emit(event, data);
        }
    }

    sendTimerUpdate(roomId: string, timeRemaining: number) {
        this.sendToRoom(roomId, WebSocketEvents.TimeUpdate, timeRemaining);
    }

    sendStartTimer(roomId: string, duration: number) {
        this.sendToRoom(roomId, WebSocketEvents.StartTimer, duration);
    }

    sendGameStateUpdate(roomId: string, gameState: GameState) {
        this.sendToRoom(roomId, WebSocketEvents.GameStateUpdate, gameState);
    }

    sendQuestionToPlayers(roomId: string, organizerId: string, newQuestion: NewQuestionRes) {
        this.sendToRoomExcept(roomId, organizerId, WebSocketEvents.NewQuestion, newQuestion);
    }

    sendAnswersToPlayers(roomId: string, organizerId: string, answer: number[]) {
        this.sendToRoomExcept(roomId, organizerId, WebSocketEvents.QuestionAnswers, answer);
    }

    sendPauseRequest(roomId: string, paused: boolean) {
        this.sendToRoom(roomId, WebSocketEvents.PauseRequest, paused);
    }

    sendQuestionToOrganizer(roomId: string, organizerId: string, newQuestion: NewQuestionRes) {
        this.sendToPlayer(organizerId, WebSocketEvents.NewQuestion, newQuestion);
    }

    sendPanicModeAvailable(roomId: string, available: boolean) {
        this.sendToRoom(roomId, WebSocketEvents.PanicAvailable, available);
    }

    sendPanicModeStarted(roomId: string, started: boolean) {
        this.sendToRoom(roomId, WebSocketEvents.PanicModeStarted, started);
    }

    // To accommodate the specific requirements of this method we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    sendGradingRequest(organizerId: string, answer: string, playerName: string, gradeIndex: number, gradeTotal: number) {
        this.sendToPlayer<GradeQuestionReq>(organizerId, WebSocketEvents.GradingRequest, { answer, playerName, gradeIndex, gradeTotal });
    }
}
