import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';
import { Subject } from 'rxjs';
import { GameQrlComponent } from './game-qrl.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('GameQrlComponent', () => {
    let component: GameQrlComponent;
    let fixture: ComponentFixture<GameQrlComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let newQuestionSubject: Subject<void>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getGameState', 'onLongAnswerChange', 'getNewQuestionMessage']);

        newQuestionSubject = new Subject<void>();
        gameServiceSpy.getNewQuestionMessage.and.returnValue(newQuestionSubject.asObservable());
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GameQrlComponent],
            imports: [AppMaterialModule, BrowserAnimationsModule],
            providers: [{ provide: GameService, useValue: gameServiceSpy }],
        });

        fixture = TestBed.createComponent(GameQrlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should set input value to empty string when a new question is received', () => {
        const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('textarea');
        inputElement.value = 'Some answer';

        spyOn(component['newQuestionSubscription'], 'unsubscribe');
        fixture.detectChanges();

        newQuestionSubject.next();
        fixture.detectChanges();

        expect(inputElement.value).toEqual('');
    });

    it('should call gameService.onLongAnswerChange() when onLongAnswerChange() is called with an event', () => {
        const event = { target: { value: 'Some answer' } };
        component.onLongAnswerChange(event as unknown as Event);

        expect(gameServiceSpy.onLongAnswerChange).toHaveBeenCalledWith('Some answer');
    });

    it('should return true when isEditable() is called and game state is GameState.Answering', () => {
        gameServiceSpy.getGameState.and.returnValue(GameState.Answering);

        const result = component.isEditable();

        expect(result).toBeTrue();
    });

    it('should return false when isEditable() is called and game state is not GameState.Answering', () => {
        gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);

        const result = component.isEditable();

        expect(result).toBeFalse();
    });
});
