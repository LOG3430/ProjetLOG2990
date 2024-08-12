import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerListElementComponent } from '@app/components/game/player-list/player-list-element/player-list-element.component';
import { PlayersService } from '@app/services/players/players.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { PlayerListComponent } from './player-list.component';
import { PlayerInfo } from '@app/interfaces/player-info';
import { AppMaterialModule } from '@app/modules/material.module';

describe('PlayerListComponent', () => {
    let component: PlayerListComponent;
    let fixture: ComponentFixture<PlayerListComponent>;
    let playersServiceSpy: jasmine.SpyObj<PlayersService>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;

    beforeEach(() => {
        playersServiceSpy = jasmine.createSpyObj('GameClientService', [
            'playerList',
            'orderByScore',
            'orderByPlayerState',
            'orderAlphabeticallyInGame',
        ]);
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['connect', 'disconnect', 'on', 'emit']);
        playersServiceSpy.playerList = [
            { name: 'allo', hasLeft: false, isMuted: false, score: 0, bonusTimes: 0 } as PlayerInfo,
            { name: 'player 2', hasLeft: true, isMuted: false, score: 0, bonusTimes: 0 } as PlayerInfo,
        ];

        TestBed.configureTestingModule({
            declarations: [PlayerListComponent, PlayerListElementComponent],
            imports: [AppMaterialModule],
            providers: [
                { provide: PlayersService, useValue: playersServiceSpy },
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(PlayerListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getPlayerList', () => {
        it('should return player list from PlayersService', () => {
            expect(component.getPlayerList()).toEqual(playersServiceSpy.playerList);
        });
    });

    describe('changeSortOrder', () => {
        beforeEach(() => {
            spyOn(component, 'orderByScoreDesc');
            spyOn(component, 'orderByScoreAsc');
            spyOn(component, 'orderByPlayerStateDesc');
            spyOn(component, 'orderByPlayerStateAsc');
            spyOn(component, 'orderAlphabeticallyDesc');
            spyOn(component, 'orderAlphabeticallyAsc');
        });

        it('should set selectedSortOrder to scoreDesc and call orderByScoreDesc', () => {
            component.changeSortOrder('scoreDesc');
            expect(component.selectedSortOrder).toEqual('scoreDesc');
            expect(component.orderByScoreDesc).toHaveBeenCalled();
        });

        it('should set selectedSortOrder to scoreAsc and call orderByScoreAsc', () => {
            component.changeSortOrder('scoreAsc');
            expect(component.selectedSortOrder).toEqual('scoreAsc');
            expect(component.orderByScoreAsc).toHaveBeenCalled();
        });

        it('should set selectedSortOrder to stateDesc and call orderByPlayerStateDesc', () => {
            component.changeSortOrder('stateDesc');
            expect(component.selectedSortOrder).toEqual('stateDesc');
            expect(component.orderByPlayerStateDesc).toHaveBeenCalled();
        });

        it('should set selectedSortOrder to stateAsc and call orderByPlayerStateAsc', () => {
            component.changeSortOrder('stateAsc');
            expect(component.selectedSortOrder).toEqual('stateAsc');
            expect(component.orderByPlayerStateAsc).toHaveBeenCalled();
        });

        it('should set selectedSortOrder to alphabeticalDown and call orderAlphabeticallyDesc', () => {
            component.changeSortOrder('alphabeticalDown');
            expect(component.selectedSortOrder).toEqual('alphabeticalDown');
            expect(component.orderAlphabeticallyDesc).toHaveBeenCalled();
        });

        it('should set selectedSortOrder to alphabeticalUp and call orderAlphabeticallyAsc', () => {
            component.changeSortOrder('alphabeticalUp');
            expect(component.selectedSortOrder).toEqual('alphabeticalUp');
            expect(component.orderAlphabeticallyAsc).toHaveBeenCalled();
        });

        it('should not call any sorting methods for an unrecognized sortOrder', () => {
            component.changeSortOrder('JOE ASCENDING');
            expect(component.selectedSortOrder).toEqual('JOE ASCENDING');
            expect(component.orderByScoreDesc).not.toHaveBeenCalled();
            expect(component.orderByScoreAsc).not.toHaveBeenCalled();
            expect(component.orderByPlayerStateDesc).not.toHaveBeenCalled();
            expect(component.orderByPlayerStateAsc).not.toHaveBeenCalled();
            expect(component.orderAlphabeticallyDesc).not.toHaveBeenCalled();
            expect(component.orderAlphabeticallyAsc).not.toHaveBeenCalled();
        });
    });

    describe('orderByScoreAsc', () => {
        it('should call orderByScore with false', () => {
            component.orderByScoreAsc();
            expect(playersServiceSpy.orderByScore).toHaveBeenCalledWith(false);
        });
    });

    describe('orderByScoreDesc', () => {
        it('should call orderByScore with true', () => {
            component.orderByScoreDesc();
            expect(playersServiceSpy.orderByScore).toHaveBeenCalledWith(true);
        });
    });

    describe('orderByPlayerStateDesc', () => {
        it('should call orderByPlayerState with true', () => {
            component.orderByPlayerStateDesc();
            expect(playersServiceSpy.orderByPlayerState).toHaveBeenCalledWith(true);
        });
    });

    describe('orderByPlayerStateAsc', () => {
        it('should call orderByPlayerState with false', () => {
            component.orderByPlayerStateAsc();
            expect(playersServiceSpy.orderByPlayerState).toHaveBeenCalledWith(false);
        });
    });

    describe('orderAlphabeticallyAsc', () => {
        it('should call orderAlphabeticallyInGame with false', () => {
            component.orderAlphabeticallyAsc();
            expect(playersServiceSpy.orderAlphabeticallyInGame).toHaveBeenCalledWith(false);
        });
    });

    describe('orderAlphabeticallyDesc', () => {
        it('should call orderAlphabeticallyInGame with true', () => {
            component.orderAlphabeticallyDesc();
            expect(playersServiceSpy.orderAlphabeticallyInGame).toHaveBeenCalledWith(true);
        });
    });
});
