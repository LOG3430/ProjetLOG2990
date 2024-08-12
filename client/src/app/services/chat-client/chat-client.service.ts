import { Injectable } from '@angular/core';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { ChatMessageReq, ChatMessageRes } from '@common/websockets/chat-message.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { MuteReq, MuteRes } from '@common/websockets/mute.dto';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    chats: ChatMessageRes[];
    isNewMessageReceived: boolean;
    newChat$: Observable<void>;
    private chatSource: Subject<void>;
    private isMuted: boolean;

    constructor(private socketCommunicationService: SocketCommunicationService) {
        this.chatSource = new Subject<void>();
        this.newChat$ = this.chatSource.asObservable();
        this.resetChats();
        this.initializeChatListener();
        this.onToggleMute();
    }

    resetChats() {
        this.chats = [];
        this.isNewMessageReceived = false;
    }

    initializeChatListener(): void {
        this.socketCommunicationService.on(WebSocketEvents.SendChatMessage, (chat: ChatMessageRes) => {
            this.chats.push(chat);
            this.isNewMessageReceived = true;
            this.chatSource.next();
        });
    }

    onToggleMute(): void {
        this.socketCommunicationService.on(WebSocketEvents.OnToggleMute, (res: MuteRes) => {
            this.chats.push(res.message);
            this.isNewMessageReceived = true;
            this.isMuted = res.isMuted;
        });
    }

    getIsMuted(): boolean {
        return this.isMuted;
    }

    readMessages(): void {
        this.isNewMessageReceived = false;
    }

    sendChat(newChat: string): void {
        if (!newChat.trim()) {
            return;
        }

        const message: ChatMessageReq = { message: newChat.trim() };
        this.socketCommunicationService.send(WebSocketEvents.SendChatMessage, message);
    }

    toggleMute(playerName: MuteReq): void {
        this.socketCommunicationService.send(WebSocketEvents.ToggleMute, playerName);
    }
}
