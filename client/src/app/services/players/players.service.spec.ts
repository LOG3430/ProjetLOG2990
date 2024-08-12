/* eslint-disable max-lines */
// disabled max lines for testing of all service methods
import { HttpClient, HttpHandler } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { STATE_PRIORITY } from '@app/constants/state-priority.constants';
import { ListOrder } from '@app/enums/list-order.enum';
import { PlayerInfo } from '@app/interfaces/player-info';
import { SocketServiceMock } from '@app/mocks/socket.mock';
import { ChatService } from '@app/services/chat-client/chat-client.service';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { ConnectToGameErrorType } from '@common/enums/connect-to-game-error-type.enum';
import { BonusTimesInfo } from '@common/websockets/bonus-times.dto';
import { ConnectionRes } from '@common/websockets/connection.dto';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { MuteRes } from '@common/websockets/mute.dto';
import { PlayerScore } from '@common/websockets/player-score.dto';
import { of } from 'rxjs';
import { PlayersService } from './players.service';

describe('PlayersService', () => {
    let service: PlayersService;
    let socketCommunicationServiceSpy: SocketServiceMock;
    let httpCommunicationServiceSpy: jasmine.SpyObj<HttpCommunicationService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;

    beforeEach(() => {
        socketCommunicationServiceSpy = new SocketServiceMock();
        spyOn(socketCommunicationServiceSpy, 'send').and.callThrough();
        spyOn(socketCommunicationServiceSpy, 'on').and.callThrough();
        httpCommunicationServiceSpy = jasmine.createSpyObj('HttpCommunicationService', ['basicPost', 'basicGet', 'basicPut', 'basicDelete']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showBanner']);
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['chats']);
        TestBed.configureTestingModule({
            providers: [
                HttpClient,
                HttpHandler,
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: HttpCommunicationService, useValue: httpCommunicationServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: ChatService, useValue: chatServiceSpy },
            ],
        });
        service = TestBed.inject(PlayersService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('connectToGame', () => {
        it('should connect to game successfully', async () => {
            const roomId = '123';
            const playerName = 'TestPlayer';

            const res = service.connectToGame(roomId, playerName);

            const callback = socketCommunicationServiceSpy.callbacks.get(WebSocketEvents.ConnectToGame) as (arg0: ConnectionRes) => void;
            callback({ success: true });
            expect(chatServiceSpy.chats.length).toBe(0);
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(
                WebSocketEvents.ConnectToGame,
                { roomId, playerName },
                jasmine.any(Function),
            );
            await expectAsync(res).toBeResolvedTo(true);
        });

        it('should handle connection failure', async () => {
            const roomId = '123';
            const playerName = 'TestPlayer';
            // used for testing hard to reach method
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn<any>(service, 'showConnectError');

            const res = service.connectToGame(roomId, playerName);
            const callback = socketCommunicationServiceSpy.callbacks.get(WebSocketEvents.ConnectToGame) as (arg0: ConnectionRes) => void;
            callback({ success: false });
            expect(service['showConnectError']).toHaveBeenCalled();
            await expectAsync(res).toBeResolvedTo(false);
        });
    });

    describe('validateRoomId', () => {
        it('should validate room ID successfully', async () => {
            const roomId = '789';

            spyOn(service, 'getRoomIdStatus').and.resolveTo({ success: true });

            const res = service.validateRoomId(roomId);

            await expectAsync(res).toBeResolvedTo(true);
        });

        it('should handle validation failure', async () => {
            const roomId = '101112';

            spyOn(service, 'getRoomIdStatus').and.resolveTo({ success: false });

            const res = service.validateRoomId(roomId);

            await expectAsync(res).toBeResolvedTo(false);
        });
        it('should react to connection errors', async () => {
            const roomId = '101112';
            spyOn(service, 'getRoomIdStatus').and.throwError('Error');

            const res = service.validateRoomId(roomId);

            expect(notificationServiceSpy.showBanner).toHaveBeenCalledWith(
                jasmine.objectContaining({ type: 'error', message: "Erreur lors de la validation de l'identifiant!" }),
            );
            await expectAsync(res).toBeResolvedTo(false);
        });
        describe('banPlayer', () => {
            it('should ban a player successfully', () => {
                const playerName = 'BannedPlayer';
                service.banPlayer(playerName);
                expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(WebSocketEvents.BanName, { playerName });
            });
        });

        describe('getPlayerScoreByName', () => {
            it('should return player score if player exists', () => {
                /* eslint-disable @typescript-eslint/no-magic-numbers*/
                const playerList: PlayerInfo[] = [
                    { name: 'Player1', score: 100 },
                    { name: 'Player2', score: 200 },
                    { name: 'Player3', score: 300 },
                ] as PlayerInfo[];
                service.playerList = playerList;

                expect(service.getPlayerScoreByName('Player2')).toBe(200);
            });

            it('should return 0 if player does not exist', () => {
                const playerList: PlayerInfo[] = [
                    { name: 'Player1', score: 100 },
                    { name: 'Player2', score: 200 },
                    { name: 'Player3', score: 300 },
                ] as PlayerInfo[];
                service.playerList = playerList;

                expect(service.getPlayerScoreByName('NonExistentPlayer')).toBe(0);
            });

            it('should return 0 if player list is empty', () => {
                service.playerList = [];

                expect(service.getPlayerScoreByName('AnyPlayer')).toBe(0);
            });
        });
    });

    describe('getRoomIdStatus', () => {
        it('should return connection response from HTTP request', async () => {
            const roomId = '123';
            const connectionRes = { success: true };
            httpCommunicationServiceSpy.basicPost.and.returnValue(of(connectionRes));

            const result = await service.getRoomIdStatus(roomId);

            expect(result).toEqual(connectionRes);
        });

        it('should handle HTTP request error', async () => {
            const roomId = '456';
            const connectionRes = { success: false };
            httpCommunicationServiceSpy.basicPost.and.returnValue(of(connectionRes));

            const result = await service.getRoomIdStatus(roomId);

            expect(result).toEqual({ success: false });
        });
    });

    describe('initialisePlayerList', () => {
        it('should initialise player list', () => {
            service.playerList = [];
            spyOn(service, 'getIsMutedByName').and.returnValue(false);
            spyOn(service, 'getPlayerScoreByName').and.returnValue(0);
            service['initialisePlayerList'](['Player1', 'Player2', 'Player3']);

            expect(service.playerList).toEqual([
                { name: 'Player1', hasLeft: false, hasLockedAnswer: false, hasInteracted: false, isMuted: false, score: 0, bonusTimes: 0 },
                { name: 'Player2', hasLeft: false, hasLockedAnswer: false, hasInteracted: false, isMuted: false, score: 0, bonusTimes: 0 },
                { name: 'Player3', hasLeft: false, hasLockedAnswer: false, hasInteracted: false, isMuted: false, score: 0, bonusTimes: 0 },
            ]);
        });

        it('should set list order to ListOrder.ScoreDesc', () => {
            service.playerList = [];
            spyOn(service, 'getIsMutedByName').and.returnValue(false);
            spyOn(service, 'getPlayerScoreByName').and.returnValue(0);
            service['initialisePlayerList'](['Player1', 'Player2', 'Player3']);

            expect(service.listOrder).toEqual(ListOrder.ScoreDesc);
        });
    });

    describe('onUpdateScores', () => {
        it('should update player scores', () => {
            const playerScoreList: PlayerScore[] = [
                { name: 'Player1', score: 100 },
                { name: 'Player2', score: 200 },
                { name: 'Player3', score: 300 },
            ] as PlayerScore[];
            service.playerList = playerScoreList.map((player) => ({ name: player.name, score: 0 })) as PlayerInfo[];
            service['onUpdateScores']();
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.UpdateScores) as any)[0]([
                ...playerScoreList,
                { name: 'other', score: 3 },
            ]);

            expect(service.playerList as PlayerInfo[]).toContain({ name: 'Player1', score: 100 } as PlayerInfo);
        });
    });

    describe('onBonusTimesInfo', () => {
        it('should update player bonus times', () => {
            const bonusTimesInfoList: BonusTimesInfo[] = [
                { name: 'Player1', bonusTimes: 1 },
                { name: 'Player2', bonusTimes: 2 },
                { name: 'Player3', bonusTimes: 3 },
            ] as BonusTimesInfo[];
            service.playerList = bonusTimesInfoList.map((player) => ({ name: player.name, bonusTimes: 0 })) as PlayerInfo[];

            service['onBonusTimesInfo']();

            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.BonusTimesInfo) as any)[0]([
                ...bonusTimesInfoList,
                { name: 'other', bonusTime: 3 },
            ]);

            expect(service.playerList as PlayerInfo[]).toEqual(jasmine.arrayWithExactContents(bonusTimesInfoList));
        });
    });

    describe('getPlayerStatePriority', () => {
        it('should return hasLeft priority when player has left', () => {
            const player = { hasLeft: true } as PlayerInfo;
            const priority = service.getPlayerStatePriority(player);
            expect(priority).toEqual(STATE_PRIORITY.hasLeft);
        });

        it('should return hasLockedAnswer priority when player has locked choices', () => {
            const player = { hasLockedAnswer: true, hasLeft: false } as PlayerInfo;
            const priority = service.getPlayerStatePriority(player);
            expect(priority).toEqual(STATE_PRIORITY.hasLockedAnswer);
        });

        it('should return hasInteracted priority when player has selected choice', () => {
            const player = { hasInteracted: true, hasLockedAnswer: false, hasLeft: false } as PlayerInfo;
            const priority = service.getPlayerStatePriority(player);
            expect(priority).toEqual(STATE_PRIORITY.hasInteracted);
        });

        it('should return default priority when player does not have any specific state', () => {
            const player = { hasInteracted: false, hasLockedAnswer: false, hasLeft: false } as PlayerInfo;
            const priority = service.getPlayerStatePriority(player);
            expect(priority).toEqual(STATE_PRIORITY.default);
        });
    });

    describe('orderAlphabeticallyInGame', () => {
        it('should sort players alphabetically in descending order when isDescending is true', () => {
            service.playerList = [{ name: 'A' }, { name: 'C' }, { name: 'B' }] as PlayerInfo[];

            service.orderAlphabeticallyInGame(true);

            expect(service.listOrder).toEqual(ListOrder.AlphabeticalDown);
            expect(service.playerList.map((player) => player.name)).toEqual(['C', 'B', 'A']);
        });

        it('should sort players alphabetically in ascending order when isDescending is false', () => {
            service.playerList = [{ name: 'C' }, { name: 'A' }, { name: 'B' }] as PlayerInfo[];
            spyOn(service, 'orderAlphabetically').and.callThrough();

            service.orderAlphabeticallyInGame(false);

            expect(service.listOrder).toEqual(ListOrder.AlphabeticalUp);
            expect(service.orderAlphabetically).toHaveBeenCalled();
            expect(service.playerList.map((player) => player.name)).toEqual(['A', 'B', 'C']);
        });
    });

    describe('orderByScore', () => {
        it('should order players by score in descending order when isDescending is true', () => {
            spyOn(service, 'orderAlphabetically');
            service.playerList = [
                { name: 'Player1', score: 100 },
                { name: 'Player2', score: 200 },
                { name: 'Player3', score: 300 },
            ] as PlayerInfo[];

            service.orderByScore(true);

            expect(service.orderAlphabetically).toHaveBeenCalled();
            expect(service.playerList[0].score).toBe(300);
            expect(service.playerList[1].score).toBe(200);
            expect(service.playerList[2].score).toBe(100);
        });

        it('should order players by score in ascending order when isDescending is false', () => {
            spyOn(service, 'orderAlphabetically');
            service.playerList = [
                { name: 'Player1', score: 300 },
                { name: 'Player2', score: 200 },
                { name: 'Player3', score: 100 },
            ] as PlayerInfo[];

            service.orderByScore(false);

            expect(service.orderAlphabetically).toHaveBeenCalled();
            expect(service.playerList[0].score).toBe(100);
            expect(service.playerList[1].score).toBe(200);
            expect(service.playerList[2].score).toBe(300);
        });
    });

    describe('orderAlphabetically', () => {
        it('should order players alphabetically', () => {
            const playerList: PlayerInfo[] = [
                { name: 'Player3', score: 100 },
                { name: 'Player1', score: 200 },
                { name: 'Player2', score: 300 },
            ] as PlayerInfo[];
            service.playerList = playerList;

            service['orderAlphabetically']();

            expect(service.playerList.map((player) => player.name)).toEqual(['Player1', 'Player2', 'Player3']);
        });
    });

    describe('orderByPlayerState', () => {
        it('should sort players by state in descending order and update listOrder accordingly', () => {
            service.playerList = [
                { name: 'Player1', hasLeft: false, hasLockedAnswer: true, hasInteracted: false },
                { name: 'Player2', hasLeft: true, hasLockedAnswer: false, hasInteracted: false },
                { name: 'Player3', hasLeft: false, hasLockedAnswer: false, hasInteracted: true },
                { name: 'Player4', hasLeft: false, hasLockedAnswer: false, hasInteracted: false },
            ] as PlayerInfo[];

            service.orderByPlayerState(true);

            expect(service.listOrder).toEqual(ListOrder.PlayerStateDesc);
            expect(service.playerList.map((player) => player.name)).toEqual(['Player4', 'Player3', 'Player1', 'Player2']);
        });

        it('should sort players by state in ascending order and update listOrder accordingly', () => {
            service.playerList = [
                { name: 'Player1', hasLeft: false, hasLockedAnswer: false, hasInteracted: true },
                { name: 'Player2', hasLeft: true, hasLockedAnswer: false, hasInteracted: false },
                { name: 'Player3', hasLeft: false, hasLockedAnswer: true, hasInteracted: false },
                { name: 'Player4', hasLeft: false, hasLockedAnswer: false, hasInteracted: false },
            ] as PlayerInfo[];

            service.orderByPlayerState(false);

            expect(service.listOrder).toEqual(ListOrder.PlayerStateAsc);
            expect(service.playerList.map((player) => player.name)).toEqual(['Player2', 'Player3', 'Player1', 'Player4']);
        });
    });

    describe('orderList', () => {
        it('should call orderAlphabeticallyInGame with false when listOrder is AlphabeticalUp', () => {
            spyOn(service, 'orderAlphabeticallyInGame');
            service.listOrder = ListOrder.AlphabeticalUp;
            service.orderList();
            expect(service.orderAlphabeticallyInGame).toHaveBeenCalledWith(false);
        });

        it('should call orderAlphabeticallyInGame with true when listOrder is AlphabeticalDown', () => {
            spyOn(service, 'orderAlphabeticallyInGame');
            service.listOrder = ListOrder.AlphabeticalDown;
            service.orderList();
            expect(service.orderAlphabeticallyInGame).toHaveBeenCalledWith(true);
        });

        it('should call orderByScore with false when listOrder is ScoreAsc', () => {
            spyOn(service, 'orderByScore');
            service.listOrder = ListOrder.ScoreAsc;
            service.orderList();
            expect(service.orderByScore).toHaveBeenCalledWith(false);
        });

        it('should call orderByScore with true when listOrder is ScoreDesc', () => {
            spyOn(service, 'orderByScore');
            service.listOrder = ListOrder.ScoreDesc;
            service.orderList();
            expect(service.orderByScore).toHaveBeenCalledWith(true);
        });

        it('should call orderByPlayerState with false when listOrder is PlayerStateAsc', () => {
            spyOn(service, 'orderByPlayerState');
            service.listOrder = ListOrder.PlayerStateAsc;
            service.orderList();
            expect(service.orderByPlayerState).toHaveBeenCalledWith(false);
        });

        it('should call orderByPlayerState with true when listOrder is PlayerStateDesc', () => {
            spyOn(service, 'orderByPlayerState');
            service.listOrder = ListOrder.PlayerStateDesc;
            service.orderList();
            expect(service.orderByPlayerState).toHaveBeenCalledWith(true);
        });
    });

    describe('onPlayerChange', () => {
        it('should mark players who left if game is started', () => {
            const playerList: string[] = ['Player1', 'Player2', 'Player3'];
            service.isGameStarted = true;
            service.playerList = playerList.map((name) => ({
                name,
                hasLeft: false,
                hasInteracted: false,
                hasLockedAnswer: false,
                isMuted: false,
                score: 0,
                bonusTimes: 0,
            }));

            service['onPlayerChange']();
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PlayerChange) as any)[0](playerList.slice(0, 1));

            expect(service.playerList[2].hasLeft).toBeTruthy();
        });

        it('should call getPlayerScoreByName if game is not started', () => {
            const playerList: string[] = ['Player1', 'Player2', 'Player3'];
            spyOn(service, 'getPlayerScoreByName');
            service.isGameStarted = false;
            service.playerList = playerList.map((name) => ({
                name,
                hasLeft: false,
                hasInteracted: false,
                hasLockedAnswer: false,
                isMuted: false,
                score: 0,
                bonusTimes: 0,
            }));

            service['onPlayerChange']();
            const callback = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.PlayerChange);
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (callback as any)[0](playerList.slice(0, 1));

            expect(service.getPlayerScoreByName).toHaveBeenCalled();
        });
    });
    describe('showConnectError', () => {
        it('should not show error banner if there is no error', () => {
            service['showConnectError']();

            expect(notificationServiceSpy.showBanner).not.toHaveBeenCalled();
        });

        it('should show error banner if there is an error', () => {
            service['showConnectError'](ConnectToGameErrorType.BannedName);

            expect(notificationServiceSpy.showBanner).toHaveBeenCalled();
        });
    });

    describe('onUpdateMutedPlayers', () => {
        it('should mute a player when receiving a mute event with isMuted set to true', () => {
            const playerNameToMute = 'PlayerToMute';
            const muteRes: MuteRes = { name: playerNameToMute, isMuted: true } as MuteRes;
            service.playerList = [
                { name: 'Player1', isMuted: false },
                { name: playerNameToMute, isMuted: false },
                { name: 'Player3', isMuted: false },
            ] as PlayerInfo[];
            service['onUpdateMutedPlayers']();

            const callback = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.UpdateMutedPlayers);
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (callback as any)[0](muteRes);

            expect(service.playerList[1].isMuted).toBeTrue();
        });

        it('should unmute a player when receiving a mute event with isMuted set to false', () => {
            const playerNameToUnmute = 'PlayerToUnmute';
            const muteRes: MuteRes = { name: playerNameToUnmute, isMuted: false } as MuteRes;
            service.playerList = [
                { name: 'Player1', isMuted: false },
                { name: playerNameToUnmute, isMuted: true },
                { name: 'Player3', isMuted: false },
            ] as PlayerInfo[];
            service['onUpdateMutedPlayers']();

            const callback = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.UpdateMutedPlayers);
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (callback as any)[0](muteRes);

            expect(service.playerList[1].isMuted).toBeFalse();
        });
    });

    describe('onChangeSelectedChoices', () => {
        it('should update hasInteracted when player selects choice', () => {
            const playerNameToUpdate = 'PlayerToUpdate';
            const selectedChoiceRes = { name: playerNameToUpdate, hasInteracted: true };
            service.playerList = [
                { name: 'Player1', hasInteracted: false },
                { name: playerNameToUpdate, hasInteracted: false },
                { name: 'Player3', hasInteracted: false },
            ] as PlayerInfo[];

            spyOn(service, 'orderList');

            service['onChangeSelectedChoices']();

            const callback = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.OnChangeHasInteracted);
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (callback as any)[0](selectedChoiceRes);

            expect(service.playerList[1].hasInteracted).toBeTrue();
            expect(service.orderList).toHaveBeenCalled();
        });

        it('should update hasInteracted to false when changing questions', () => {
            const playerNameToUpdate = 'PlayerToUpdate';
            const selectedChoiceRes = { name: playerNameToUpdate, hasInteracted: false };
            service.playerList = [
                { name: 'Player1', hasInteracted: false },
                { name: playerNameToUpdate, hasInteracted: true },
                { name: 'Player3', hasInteracted: false },
            ] as PlayerInfo[];

            spyOn(service, 'orderList');

            service['onChangeSelectedChoices']();

            const callback = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.OnChangeHasInteracted);
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (callback as any)[0](selectedChoiceRes);

            expect(service.playerList[1].hasInteracted).toBeFalse();
            expect(service.orderList).toHaveBeenCalled();
        });
    });

    describe('onLockChoices', () => {
        it('should update hasLockedAnswer to true when player locks choices', () => {
            const playerNameToUpdate = 'PlayerToUpdate';
            const lockChoicesRes = { name: playerNameToUpdate, hasLockedAnswer: true };
            service.playerList = [
                { name: 'Player1', hasLockedAnswer: false },
                { name: playerNameToUpdate, hasLockedAnswer: false },
                { name: 'Player3', hasLockedAnswer: false },
            ] as PlayerInfo[];

            spyOn(service, 'orderList');

            service['onLockChoices']();

            const callback = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.OnLockAnswers);
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (callback as any)[0](lockChoicesRes);

            expect(service.playerList[1].hasLockedAnswer).toBeTrue();
            expect(service.orderList).toHaveBeenCalled();
        });

        it('should update hasLockedAnswer to false when changing questions', () => {
            const playerNameToUpdate = 'PlayerToUpdate';
            const lockChoicesRes = { name: playerNameToUpdate, hasLockedAnswer: false };
            service.playerList = [
                { name: 'Player1', hasLockedAnswer: false },
                { name: playerNameToUpdate, hasLockedAnswer: true },
                { name: 'Player3', hasLockedAnswer: false },
            ] as PlayerInfo[];

            spyOn(service, 'orderList');

            service['onLockChoices']();

            const callback = socketCommunicationServiceSpy.eventHandlers.get(WebSocketEvents.OnLockAnswers);
            // used for type coercion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (callback as any)[0](lockChoicesRes);

            expect(service.playerList[1].hasLockedAnswer).toBeFalse();
            expect(service.orderList).toHaveBeenCalled();
        });
    });
});
