import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CHAT_MAXIMUM_LENGTH } from '@app/constants/chatbox.component.constants';
import { ChatService } from '@app/services/chat-client/chat-client.service';
import { GameService } from '@app/services/game/game.service';
import { ChatMessageRes } from '@common/websockets/chat-message.dto';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chatbox',
    templateUrl: './chatbox.component.html',
    styleUrls: ['./chatbox.component.scss'],
})
export class ChatboxComponent implements OnInit, OnDestroy {
    @ViewChild('scrollContainer') scrollContainer: ElementRef;

    isChatVisible: boolean;
    newChat: string = '';
    readonly chatMaximumLength = CHAT_MAXIMUM_LENGTH;
    private newChatSubscription: Subscription = new Subscription();

    constructor(
        private chatService: ChatService,
        private gameService: GameService,
        private changeDetector: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.chatService.resetChats();
        this.startSubscription();
    }

    ngOnDestroy() {
        this.stopSubscription();
    }

    handleSendChat(): void {
        this.chatService.sendChat(this.newChat);
        this.newChat = '';
        this.scrollToBottom();
    }

    handlePropagation(event: KeyboardEvent): void {
        event.stopImmediatePropagation();
    }

    toggleChatVisibility(): void {
        this.isChatVisible = !this.isChatVisible;
        if (this.getNewMessageNotification()) {
            this.chatService.readMessages();
        }
        this.scrollToBottom();
    }

    getMessages(): ChatMessageRes[] {
        return this.chatService.chats;
    }

    getNewMessageNotification(): boolean {
        return this.chatService.isNewMessageReceived;
    }

    getPlayerName(): string {
        return this.gameService.playerName;
    }

    getIsMuted(): boolean {
        return this.chatService.getIsMuted();
    }

    scrollToBottom(): void {
        this.changeDetector.detectChanges();
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }

    getChatTime(chat: ChatMessageRes): string {
        return new Date(chat.date).toLocaleTimeString();
    }

    startSubscription(): void {
        this.newChatSubscription = this.chatService.newChat$.subscribe(() => {
            this.scrollToBottom();
        });
    }

    stopSubscription(): void {
        this.newChatSubscription.unsubscribe();
    }
}
