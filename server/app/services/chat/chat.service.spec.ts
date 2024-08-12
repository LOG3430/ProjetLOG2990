/* eslint-disable @typescript-eslint/no-explicit-any */
// disabled any to spyOn private method
import { Player } from '@app/classes/player/player';
import { ClientCommunicationService } from '@app/services/client-communication/client-communication.service';
import { GameService } from '@app/services/game/game.service';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let service: ChatService;
    let clientCommunicationServiceMock: ClientCommunicationService;
    let gameServiceMock: GameService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatService,
                {
                    provide: ClientCommunicationService,
                    useValue: {
                        sendToRoom: jest.fn(),
                        sendToPlayer: jest.fn(),
                    },
                },
                {
                    provide: GameService,
                    useValue: {
                        getGame: jest.fn().mockReturnValue({
                            getOrganizerId: jest.fn().mockReturnValue('organizerId'),
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<ChatService>(ChatService);
        clientCommunicationServiceMock = module.get<ClientCommunicationService>(ClientCommunicationService);
        gameServiceMock = module.get<GameService>(GameService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendMessageInternally', () => {
        it('should send a chat message to the room', () => {
            const createMessageSpy = jest.spyOn(service as any, 'createMessage');

            service.sendMessageInternally('roomId', 'joe', 'allo');

            expect(createMessageSpy).toHaveBeenCalledWith('joe', 'allo');
            expect(clientCommunicationServiceMock.sendToRoom).toHaveBeenCalledWith(
                'roomId',
                WebSocketEvents.SendChatMessage,
                expect.objectContaining({
                    playerName: 'joe',
                    message: 'allo',
                }),
            );
        });
    });

    describe('createMessage', () => {
        it('should create a chat message with the correct properties', () => {
            const messageObject = service['createMessage']('joe', 'allo');

            expect(messageObject.playerName).toBe('joe');
            expect(messageObject.message).toBe('allo');
            expect(messageObject).toHaveProperty('date');
            expect(messageObject.date).toBeInstanceOf(Date);
        });
    });

    describe('sendMessageFromPlayer', () => {
        it('should call sendMessage if player is not muted', () => {
            const player = { name: 'joe', isMuted: false } as Player;
            const roomId = 'roomId';
            const message = 'yo';
            const sendMessageSpy = jest.spyOn(service, 'sendMessageInternally');

            service.sendMessageFromPlayer(roomId, player, message);

            expect(sendMessageSpy).toHaveBeenCalledWith(roomId, player.name, message);
        });

        it('should not call sendMessage if player is muted', () => {
            const player = { name: 'joe', isMuted: true } as Player;
            const roomId = 'roomId';
            const message = 'yo';
            const sendMessageSpy = jest.spyOn(service, 'sendMessageInternally');

            service.sendMessageFromPlayer(roomId, player, message);

            expect(sendMessageSpy).not.toHaveBeenCalled();
        });
    });

    describe('sendMessage', () => {
        it('should call sendMessageInternally with the organizer name if isOrganizer is true', () => {
            const player = { name: 'joe', isMuted: false } as Player;
            const roomId = 'roomId';
            const message = 'yo';
            const sendMessageSpy = jest.spyOn(service, 'sendMessageInternally');

            service.sendMessage(roomId, player, message, true);

            expect(sendMessageSpy).toHaveBeenCalledWith(roomId, 'Organisateur', message);
        });

        it('should call sendMessageFromPlayer with the player if isOrganizer is false', () => {
            const player = { name: 'joe', isMuted: false } as Player;
            const roomId = 'roomId';
            const message = 'yo';
            const sendMessageFromPlayerSpy = jest.spyOn(service, 'sendMessageFromPlayer');

            service.sendMessage(roomId, player, message, false);

            expect(sendMessageFromPlayerSpy).toHaveBeenCalledWith(roomId, player, message);
        });
    });

    describe('toggleMute', () => {
        it('should toggle the player mute status and send a message', () => {
            const player = { name: 'joe', isMuted: false } as Player;
            const roomId = 'roomId';
            const sendMuteMessageSpy = jest.spyOn(service as any, 'sendMuteMessage');

            service.toggleMute(player, roomId);

            expect(player.isMuted).toBe(true);
            expect(sendMuteMessageSpy).toHaveBeenCalledWith(player, roomId);
        });
    });

    describe('notifyOrganizer', () => {
        it('should notify the organizer with the muted player information', () => {
            const player = { name: 'PlayerName', isMuted: true } as Player;
            const roomId = 'roomId';

            service.notifyOrganizer(player, roomId);

            expect(gameServiceMock.getGame).toHaveBeenCalledWith(roomId);
            expect(clientCommunicationServiceMock.sendToPlayer).toHaveBeenCalledWith('organizerId', WebSocketEvents.UpdateMutedPlayers, {
                name: player.name,
                message: player.name + ' muted',
                isMuted: player.isMuted,
            });
        });
    });

    describe('sendMuteMessage', () => {
        it('should send a system mute message', () => {
            const mockPlayer = { id: 'player1', name: 'joe', isMuted: true } as Player;

            const roomId = '123';

            jest.spyOn(service as any, 'createMessage');
            jest.spyOn(service, 'notifyOrganizer');

            service['sendMuteMessage'](mockPlayer, roomId);

            expect(service['createMessage']).toHaveBeenCalledWith('MESSAGE SYSTÈME', "L'organisateur vous a retiré vos privilèges de clavardage");
            expect(clientCommunicationServiceMock.sendToPlayer).toHaveBeenCalledWith(
                mockPlayer.id,
                WebSocketEvents.OnToggleMute,
                expect.objectContaining({
                    name: mockPlayer.name,
                    isMuted: true,
                }),
            );
            expect(service.notifyOrganizer).toHaveBeenCalledWith(mockPlayer, roomId);
        });
    });

    describe('unmuteAllPlayers', () => {
        it('should unmute all players and send a message', () => {
            const player1 = { name: 'joe', isMuted: true } as Player;
            const player2 = { name: 'bob', isMuted: true } as Player;
            gameServiceMock.getGame = jest.fn().mockReturnValue({
                getPlayers: jest.fn().mockReturnValue([player1, player2]),
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
            });

            const roomId = 'roomId';
            const sendMuteMessageSpy = jest.spyOn(service as any, 'sendMuteMessage');

            service.unmuteAllPlayers(roomId);

            expect(player1.isMuted).toBe(false);
            expect(player2.isMuted).toBe(false);
            expect(sendMuteMessageSpy).toHaveBeenCalledTimes(2);
        });

        it('should not unmute players that are not muted', () => {
            const player1 = { name: 'joe', isMuted: false } as Player;
            const player2 = { name: 'bob', isMuted: true } as Player;
            gameServiceMock.getGame = jest.fn().mockReturnValue({
                getPlayers: jest.fn().mockReturnValue([player1, player2]),
                getOrganizerId: jest.fn().mockReturnValue('organizerId'),
            });
            const roomId = 'roomId';
            const sendMuteMessageSpy = jest.spyOn(service as any, 'sendMuteMessage');

            service.unmuteAllPlayers(roomId);

            expect(player1.isMuted).toBe(false);
            expect(player2.isMuted).toBe(false);
            expect(sendMuteMessageSpy).toHaveBeenCalledTimes(1);
        });
    });
});
