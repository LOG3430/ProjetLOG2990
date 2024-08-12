import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerListComponent } from '@app/components/game/player-list/player-list/player-list.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { PlayersService } from '@app/services/players/players.service';
import { Subject } from 'rxjs';
import { PlayerListBoxComponent } from './player-list-box.component';

describe('PlayerListBoxComponent', () => {
    let component: PlayerListBoxComponent;
    let fixture: ComponentFixture<PlayerListBoxComponent>;

    let httpClientSpy: jasmine.SpyObj<HttpClient>;
    let httpHandler: jasmine.SpyObj<HttpHandler>;
    let playersServiceSpy: jasmine.SpyObj<PlayersService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let quizResultSource: Subject<void>;
    beforeEach(() => {
        playersServiceSpy = jasmine.createSpyObj('PlayersService', ['playerList']);
        playersServiceSpy.playerList = [];
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getGameState', 'quizResult$', 'getIsOrganizer']);
        quizResultSource = new Subject<void>();
        gameServiceSpy.quizResult$ = quizResultSource.asObservable();
        TestBed.configureTestingModule({
            declarations: [PlayerListBoxComponent, PlayerListComponent],
            imports: [AppMaterialModule],
            providers: [
                { provide: HttpClient, useValue: httpClientSpy },
                { provide: HttpHandler, useValue: httpHandler },
                { provide: PlayersService, useValue: playersServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(PlayerListBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('togglePlayerListVisibility', () => {
        it('should toggle isPlayerListVisible from false to true', () => {
            component.isPlayerListVisible = false;
            component.togglePlayerListVisibility();
            expect(component.isPlayerListVisible).toBeTrue();
        });

        it('should toggle isPlayerListVisible from true to false', () => {
            component.isPlayerListVisible = true;
            component.togglePlayerListVisibility();
            expect(component.isPlayerListVisible).toBeFalse();
        });
    });

    describe('startSubscription', () => {
        it('should set isPlayerListVisible to true when quizResult$ emits', () => {
            component.isPlayerListVisible = false;

            component.startSubscription();
            quizResultSource.next();

            expect(component.isPlayerListVisible).toBeTrue();
        });
    });

    describe('stopSubscription', () => {
        it('should unsubscribe from quizResultSubscription', () => {
            const unsubscribeSpy = spyOn(component['quizResultSubscription'], 'unsubscribe');

            component.stopSubscription();

            expect(unsubscribeSpy).toHaveBeenCalled();
        });
    });
});
