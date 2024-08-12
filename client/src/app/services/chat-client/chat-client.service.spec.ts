import { TestBed } from '@angular/core/testing';

import { SocketServiceMock } from '@app/mocks/socket.mock';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { ChatMessageRes } from '@common/websockets/chat-message.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { MuteRes } from '@common/websockets/mute.dto';
import { ChatService } from './chat-client.service';

// magic numbers used for tests
/* eslint-disable  @typescript-eslint/no-magic-numbers */

describe('ChatService', () => {
    let service: ChatService;
    let socketCommunicationServiceSpy: SocketServiceMock;

    beforeEach(() => {
        socketCommunicationServiceSpy = new SocketServiceMock();
        spyOn(socketCommunicationServiceSpy, 'send').and.callThrough();
        spyOn(socketCommunicationServiceSpy, 'on').and.callThrough();
        TestBed.configureTestingModule({
            providers: [{ provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy }],
        });
        service = TestBed.inject(ChatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('resetChats', () => {
        it('should reset the chats', () => {
            const mockDate = new Date(2000, 0, 1);
            const CHAT_MESSAGE: ChatMessageRes = { playerName: 'Test', message: 'test message', date: mockDate };
            service.chats = [CHAT_MESSAGE];

            service.resetChats();

            expect(service.chats).toEqual([]);
        });
        it('should set isNewMessageReceived to false', () => {
            service.isNewMessageReceived = true;
            service.resetChats();
            expect(service.isNewMessageReceived).toBeFalse();
        });
    });

    describe('initializeChatListener', () => {
        it('should push the chat and set isNewMessageReceived to true', () => {
            service.isNewMessageReceived = false;
            const mockDate = new Date(2000, 0, 1);
            const data: ChatMessageRes = { playerName: 'test', message: 'test message', date: mockDate };
            spyOn(service['chatSource'], 'next');

            service.initializeChatListener();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.SendChatMessage, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.SendChatMessage)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.SendChatMessage);
            (callbacks as ((arg: ChatMessageRes) => void)[])[0](data);
            expect(service.chats).toEqual([data]);
            expect(service['chatSource'].next).toHaveBeenCalled();
            expect(service.isNewMessageReceived).toBeTrue();
        });
    });

    describe('readMessages', () => {
        it('should set isNewMessageReceived to false', () => {
            service.isNewMessageReceived = true;
            service.readMessages();
            expect(service.isNewMessageReceived).toBeFalse();
        });
    });

    describe('sendChat', () => {
        it('should return if the new chat is only white spaces', () => {
            const EMPTY_CHAT = '  ';
            service.sendChat(EMPTY_CHAT);
            expect(socketCommunicationServiceSpy.send).not.toHaveBeenCalled();
        });

        it('should call the SendChatEvent with the message if valid', () => {
            const CHAT = 'Test';
            service.sendChat(CHAT);
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.SendChatMessage, Object({ message: 'Test' }));
        });
        it('should trim the message if valid', () => {
            const CHAT = ' Test ';
            service.sendChat(CHAT);
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.SendChatMessage, Object({ message: 'Test' }));
        });
    });

    describe('onToggleMute', () => {
        it('should set isMuted to true and push mute message', () => {
            service.isNewMessageReceived = false;
            const mockDate = new Date(2000, 0, 1);
            const data: MuteRes = { name: 'test', message: { playerName: 'joe', message: 'yo', date: mockDate }, isMuted: true };

            service.onToggleMute();

            expect(socketCommunicationServiceSpy.on).toHaveBeenCalledWith(WebSocketEvents.OnToggleMute, jasmine.any(Function));
            expect(socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.OnToggleMute)).toContain(jasmine.any(Function));

            const callbacks = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.OnToggleMute);
            (callbacks as ((arg: MuteRes) => void)[])[0](data);
            expect(service.chats).toEqual([data.message]);

            expect(service.isNewMessageReceived).toBeTrue();
            expect(service['isMuted']).toBeTrue();
        });
    });

    describe('toggleMute', () => {
        it('should send a toggleMute WebSocketEvent ', () => {
            service.toggleMute({ name: 'joe' });
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.ToggleMute, { name: 'joe' });
        });
    });
});
