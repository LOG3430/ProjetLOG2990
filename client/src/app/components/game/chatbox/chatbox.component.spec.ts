import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatService } from '@app/services/chat-client/chat-client.service';
import { GameService } from '@app/services/game/game.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { ChatMessageRes } from '@common/websockets/chat-message.dto';
import { Observable, Subject } from 'rxjs';
import { ChatboxComponent } from './chatbox.component';

describe('ChatboxComponent', () => {
    let component: ChatboxComponent;
    let fixture: ComponentFixture<ChatboxComponent>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;
    let socketServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['sendChat', 'resetChats', 'readMessages', 'getIsMuted']);
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        socketServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['connect', 'disconnect', 'on', 'emit']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['playerName']);
        TestBed.configureTestingModule({
            providers: [
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: HttpClient, useValue: httpClientSpy },
                { provide: SocketCommunicationService, useValue: socketServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],

            declarations: [ChatboxComponent],
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule, HttpClientModule],
        });

        chatServiceSpy.newChat$ = new Observable();
        fixture = TestBed.createComponent(ChatboxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should reset chats and start subscription', () => {
            spyOn(component, 'startSubscription');
            component.ngOnInit();
            expect(chatServiceSpy.resetChats).toHaveBeenCalled();
            expect(component.startSubscription).toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should stop subscription', () => {
            spyOn(component, 'stopSubscription');
            component.ngOnDestroy();
            expect(component.stopSubscription).toHaveBeenCalled();
        });
    });

    describe('handleSendChat', () => {
        it('should call sendChat on ChatService with newChat content and scroll to bottom', () => {
            spyOn(component, 'scrollToBottom');
            component.newChat = 'alloo';
            component.handleSendChat();
            expect(component.scrollToBottom).toHaveBeenCalled();
            expect(chatServiceSpy.sendChat).toHaveBeenCalledWith('alloo');
            expect(component.newChat).toEqual('');
        });
    });

    describe('toggleChatVisibility', () => {
        it('should toggle chat visibility and call readMessages if there are new messages', () => {
            component.isChatVisible = false;
            spyOn(component, 'scrollToBottom');
            chatServiceSpy.isNewMessageReceived = true;

            component.toggleChatVisibility();

            expect(component.isChatVisible).toBeTrue();
            expect(chatServiceSpy.readMessages).toHaveBeenCalled();
            expect(component.scrollToBottom).toHaveBeenCalled();
        });

        it('should not call readMessages if there are no new messages', () => {
            spyOn(component, 'getNewMessageNotification').and.returnValue(false);

            component.toggleChatVisibility();

            expect(chatServiceSpy.readMessages).not.toHaveBeenCalled();
        });
    });

    describe('handleSendChat', () => {
        it('should scroll to bottom of chat container', () => {
            component.scrollContainer = {
                nativeElement: {
                    scrollTop: 0,
                    scrollHeight: 1000,
                },
            };
            component.scrollToBottom();
            expect(component.scrollContainer.nativeElement.scrollTop).toEqual(component.scrollContainer.nativeElement.scrollHeight);
        });
    });

    describe('handleEventPropagation', () => {
        it('should stop immediate propagation of the event', () => {
            const event = {
                stopImmediatePropagation: jasmine.createSpy('stopImmediatePropagation'),
            } as unknown as KeyboardEvent;

            component.handlePropagation(event);
            expect(event.stopImmediatePropagation).toHaveBeenCalled();
        });
    });

    describe('getPlayerName', () => {
        it('should return player name from GameService', () => {
            gameServiceSpy.playerName = 'Siuuu';
            expect(component.getPlayerName()).toEqual('Siuuu');
        });
    });

    describe('getIsMuted', () => {
        it('should return isMuted status from ChatService', () => {
            chatServiceSpy.getIsMuted.and.returnValue(true);
            expect(component.getIsMuted()).toBeTrue();
        });

        it('should return false if player is not muted', () => {
            chatServiceSpy.getIsMuted.and.returnValue(false);
            expect(component.getIsMuted()).toBeFalse();
        });
    });

    describe('scrollToBottom', () => {
        it('should scroll to the bottom of the chat container', () => {
            component.scrollContainer = {
                nativeElement: {
                    scrollTop: 0,
                    scrollHeight: 1000,
                },
            };
            spyOn(component['changeDetector'], 'detectChanges');
            component.scrollToBottom();
            expect(component['changeDetector'].detectChanges).toHaveBeenCalled();
            expect(component.scrollContainer.nativeElement.scrollTop).toEqual(component.scrollContainer.nativeElement.scrollHeight);
        });
    });

    describe('startSubscription', () => {
        it('should start subscription', () => {
            component.startSubscription();
            expect(component['newChatSubscription']).toBeDefined();
        });

        it('subscribe should scroll to bottom', () => {
            spyOn(component, 'scrollToBottom');
            const newChatSource = new Subject<void>();
            chatServiceSpy.newChat$ = newChatSource.asObservable();
            component.startSubscription();
            newChatSource.next();
            expect(component.scrollToBottom).toHaveBeenCalled();
        });
    });

    describe('stopSubscription', () => {
        it('should stop subscription', () => {
            component.startSubscription();
            component.stopSubscription();
            expect(component['newChatSubscription'].closed).toBeTrue();
        });
    });

    describe('getMessages', () => {
        it('should return chat messages from ChatService', () => {
            chatServiceSpy.chats = [
                {
                    playerName: 'Joey',
                    message: 'Hello',
                    date: new Date(),
                },
                {
                    playerName: 'Joe',
                    message: 'Hey',
                    date: new Date('2024-01-01T12:00:00Z'),
                },
            ];
            expect(component.getMessages()).toEqual(chatServiceSpy.chats);
        });
    });

    describe('getNewMessageNotification', () => {
        it('should return new message received status from ChatService', () => {
            chatServiceSpy.isNewMessageReceived = true;
            expect(component.getNewMessageNotification()).toBeTrue();
        });
    });

    describe('getChatTime', () => {
        it('should return the local time string of the chat date', () => {
            const mockChat: ChatMessageRes = {
                playerName: 'joe',
                message: 'blo',
                date: new Date('2024-01-01T12:00:00Z'),
            };

            const expectedTime = new Date('2024-01-01T12:00:00Z').toLocaleTimeString();
            expect(component.getChatTime(mockChat)).toEqual(expectedTime);
        });
    });
});
