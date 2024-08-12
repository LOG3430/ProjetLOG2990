import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { GameTimerComponent } from './game-timer.component';

describe('GameTimerComponent', () => {
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let component: GameTimerComponent;
    let fixture: ComponentFixture<GameTimerComponent>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getTime', 'getDuration', 'getQuizTitle']);
        TestBed.configureTestingModule({
            declarations: [GameTimerComponent],
            providers: [{ useValue: gameServiceSpy, provide: GameService }],
            imports: [AppMaterialModule],
        });
        fixture = TestBed.createComponent(GameTimerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
