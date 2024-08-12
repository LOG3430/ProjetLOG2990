import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerListComponent } from '@app/components/game/player-list/player-list/player-list.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { PlayersService } from '@app/services/players/players.service';
import { WaitingRoomComponent } from './waiting-room.component';

describe('WaitingRoomComponent', () => {
    let component: WaitingRoomComponent;
    let fixture: ComponentFixture<WaitingRoomComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;
    let httpHandler: jasmine.SpyObj<HttpHandler>;
    let playersServiceSpy: jasmine.SpyObj<PlayersService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', [
            'getRoomId',
            'getIsOrganizer',
            'canStartQuiz',
            'actionButton',
            'getTooltipGameStartMessage',
            'onLockRoom',
            'getIsRoomLocked',
            'getGameState',
        ]);

        playersServiceSpy = jasmine.createSpyObj('PlayersService', ['playerList']);
        playersServiceSpy.playerList = [];

        TestBed.configureTestingModule({
            declarations: [WaitingRoomComponent, PlayerListComponent],
            imports: [AppMaterialModule],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: HttpClient, useValue: httpClientSpy },
                { provide: HttpHandler, useValue: httpHandler },
                { provide: PlayersService, useValue: playersServiceSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(WaitingRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('constructor', () => {
        it('should set roomId to the value of gameService.getRoomId', () => {
            gameServiceSpy.getRoomId.and.returnValue('123');
            component = new WaitingRoomComponent(gameServiceSpy);
            expect(component.roomId).toEqual('123');
        });
    });

    describe('getIsOrganizer', () => {
        it('should return the value true of gameService.getIsOrganizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            expect(component.getIsOrganizer()).toBeTrue();
        });

        it('should return the value false of gameService.getIsOrganizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(false);
            expect(component.getIsOrganizer()).toBeFalse();
        });
    });

    describe('canStartQuiz', () => {
        it('should return the value true of gameService.canStartQuiz', () => {
            gameServiceSpy.canStartQuiz.and.returnValue(true);
            expect(component.canStartQuiz()).toBeTrue();
        });

        it('should return the value false of gameService.canStartQuiz', () => {
            gameServiceSpy.canStartQuiz.and.returnValue(false);
            expect(component.canStartQuiz()).toBeFalse();
        });
    });

    describe('startTheQuiz', () => {
        it('should call gameService.actionButton', () => {
            component.startTheQuiz();
            expect(gameServiceSpy.actionButton).toHaveBeenCalled();
        });
    });

    describe('getTooltipMessage', () => {
        it('should return the message to have more than one player to start of gameService.getTooltipGameStartMessage', () => {
            gameServiceSpy.getTooltipGameStartMessage.and.returnValue('Il faut au moins un joueur pour commencer');
            expect(component.getTooltipMessage()).toEqual('Il faut au moins un joueur pour commencer');
        });
        it('should return the message to lock the room to start the game of gameService.getTooltipGameStartMessage', () => {
            gameServiceSpy.getTooltipGameStartMessage.and.returnValue('Il faut verrouiller la salle pour commencer');
            expect(component.getTooltipMessage()).toEqual('Il faut verrouiller la salle pour commencer');
        });
    });

    describe('toggleLockRoom', () => {
        it('should call gameService.onLockRoom', () => {
            component.toggleLockRoom();
            expect(gameServiceSpy.onLockRoom).toHaveBeenCalled();
        });
    });

    describe('getIsRoomLocked', () => {
        it('should return the value true of gameService.getIsRoomLocked', () => {
            gameServiceSpy.getIsRoomLocked.and.returnValue(true);
            expect(component.getIsRoomLocked()).toBeTrue();
        });

        it('should return the value false of gameService.getIsRoomLocked', () => {
            gameServiceSpy.getIsRoomLocked.and.returnValue(false);
            expect(component.getIsRoomLocked()).toBeFalse();
        });
    });
});
