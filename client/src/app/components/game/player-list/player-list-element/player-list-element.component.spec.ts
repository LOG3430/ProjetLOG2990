import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatService } from '@app/services/chat-client/chat-client.service';
import { GameService } from '@app/services/game/game.service';
import { PlayersService } from '@app/services/players/players.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { GameState } from '@common/enums/game-state.enum';
import { PlayerListElementComponent } from './player-list-element.component';
import { ORGANIZER_NAME } from '@app/constants/common/organizer.constants';

describe('PlayerListElementComponent', () => {
    let component: PlayerListElementComponent;
    let fixture: ComponentFixture<PlayerListElementComponent>;
    let playersServiceSpy: jasmine.SpyObj<PlayersService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;

    beforeEach(() => {
        playersServiceSpy = jasmine.createSpyObj('GameClientService', ['banPlayer']);
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['toggleMute']);
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['connect', 'disconnect', 'on', 'emit']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getIsOrganizer', 'getGameState']);
        TestBed.configureTestingModule({
            declarations: [PlayerListElementComponent],
            imports: [AppMaterialModule],
            providers: [
                HttpClient,
                HttpHandler,
                { provide: PlayersService, useValue: playersServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(PlayerListElementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('banPlayer', () => {
        it('should call banPlayer on PlayersService with the correct name', () => {
            component.name = 'allo';
            component.banPlayer();
            expect(playersServiceSpy.banPlayer).toHaveBeenCalledWith('allo');
        });
    });

    describe('getIsOrganizer', () => {
        it('should return true if the user is an organizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            expect(component.getIsOrganizer()).toBeTrue();
        });

        it('should return false if the user is not an organizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(false);
            expect(component.getIsOrganizer()).toBeFalse();
        });
    });

    describe('getRankClass', () => {
        it('should return an empty string if the rank is greater than 3', () => {
            component.rank = 4;
            expect(component.getRankClass()).toEqual('');
        });

        it('should return an empty string if the user is not in game', () => {
            spyOn(component, 'getIsInGame').and.returnValue(false);
            expect(component.getRankClass()).toEqual('');
        });

        it('should return a rank class if the users rank is valid and he is in game', () => {
            component.rank = 1;
            spyOn(component, 'getIsInGame').and.returnValue(true);
            expect(component.getRankClass()).toEqual('rank-1');
        });

        it('should return `rank-X-end` if in quiz results', () => {
            spyOn(component, 'getIsInGame').and.returnValue(true);
            spyOn(component, 'getIsInQuizResults').and.returnValue(true);
            component.rank = 2;
            expect(component.getRankClass()).toEqual('rank-2-end');
        });
    });

    describe('isNeutralColor', () => {
        it('should return true if the game is in the waiting room', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            expect(component.isNeutralColor()).toBeTrue();
        });

        it('should return true if the game is in the quiz results and the rank is greater than 3', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuizResults);
            component.rank = 4;
            expect(component.isNeutralColor()).toBeTrue();
        });

        it('should return false if the game is in the quiz results and the rank is less than 3', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuizResults);
            component.rank = 2;
            expect(component.isNeutralColor()).toBeFalse();
        });

        it('should return false if the game is not in the waiting room or quiz result', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            expect(component.isNeutralColor()).toBeFalse();
        });
    });

    describe('getIsInGame', () => {
        it('should return true if the game is not in the waiting room', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            expect(component.getIsInGame()).toBeTrue();
        });

        it('should return false if the game is in the waiting room', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            expect(component.getIsInGame()).toBeFalse();
        });
    });

    describe('getIsInQuizResults', () => {
        it('should return true if the game is in the quiz results', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuizResults);
            expect(component.getIsInQuizResults()).toBeTrue();
        });

        it('should return false if the game is not in the quiz results', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            expect(component.getIsInQuizResults()).toBeFalse();
        });
    });

    describe('showGavelIcon', () => {
        it('should return true if the user is an organizer in the waiting room but not for random mode', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            spyOn(component, 'getIsInGame').and.returnValue(false);

            expect(component.showGavelIcon()).toBeTrue();
        });

        it('should return false if the user is not an organizer or in game state or player name is Organisateur in random mode', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(false);
            spyOn(component, 'getIsInGame').and.returnValue(false);
            component.name = ORGANIZER_NAME;
            expect(component.showGavelIcon()).toBeFalse();
        });

        it('should return false if the user is not the organizer', () => {
            spyOn(component, 'getIsOrganizer').and.returnValue(false);
            spyOn(component, 'getIsInGame').and.returnValue(false);
            component.name = 'joe';

            expect(component.showGavelIcon()).toBeFalse();
        });

        it('should return false if the user is in game', () => {
            spyOn(component, 'getIsOrganizer').and.returnValue(true);
            spyOn(component, 'getIsInGame').and.returnValue(true);
            component.name = 'joe';

            expect(component.showGavelIcon()).toBeFalse();
        });

        it('should return false if the user name is ORGANIZER_NAME', () => {
            spyOn(component, 'getIsOrganizer').and.returnValue(true);
            spyOn(component, 'getIsInGame').and.returnValue(false);
            component.name = ORGANIZER_NAME;

            expect(component.showGavelIcon()).toBeFalse();
        });
    });

    describe('showMuteIcon', () => {
        it('should return true if the user is an organizer in the waiting room but not for random mode and not in quiz result', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            component.name = 'joe';

            expect(component.showMuteIcon()).toBeTrue();
        });

        it('should return false if the user is not the organizer', () => {
            spyOn(component, 'getIsOrganizer').and.returnValue(false);
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            component.name = 'joe';

            expect(component.showMuteIcon()).toBeFalse();
        });

        it('should return false if in random mode', () => {
            spyOn(component, 'getIsOrganizer').and.returnValue(true);
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.isRandomMode = true;
            component.name = 'joe';

            expect(component.showMuteIcon()).toBeFalse();
        });

        it('should return false if the user name is ORGANIZER_NAME', () => {
            spyOn(component, 'getIsOrganizer').and.returnValue(true);
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            component.name = ORGANIZER_NAME;

            expect(component.showMuteIcon()).toBeFalse();
        });

        it('should return false if the game is in quiz results', () => {
            spyOn(component, 'getIsOrganizer').and.returnValue(true);
            gameServiceSpy.getGameState.and.returnValue(GameState.QuizResults);
            component.name = 'joe';

            expect(component.showMuteIcon()).toBeFalse();
        });
    });

    describe('toggleMute', () => {
        it('should call chatService.toggleMute with the correct name', () => {
            component.name = 'joe';
            component.toggleMute();
            expect(chatServiceSpy.toggleMute).toHaveBeenCalledWith({ name: 'joe' });
        });
    });
});
