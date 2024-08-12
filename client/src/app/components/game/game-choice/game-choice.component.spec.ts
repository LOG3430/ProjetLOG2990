import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';
import { QuestionType } from '@common/interfaces/question.dto';
import { GameChoiceComponent } from './game-choice.component';
import SpyObj = jasmine.SpyObj;

describe('GameChoiceComponent', () => {
    let component: GameChoiceComponent;
    let fixture: ComponentFixture<GameChoiceComponent>;
    let gameServiceSpy: SpyObj<GameService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', [
            'lockChoices',
            'hasEnoughSelectedChoices',
            'getChoices',
            'onChoiceSelect',
            'getGameState',
            'lockAnswer',
        ]);
        gameServiceSpy.question = {
            _id: '1',
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'test',
            choices: [
                { text: 'choice 1', isCorrect: true },
                { text: 'choice 2', isCorrect: false },
            ],
            points: 10,
        };
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GameChoiceComponent],
            imports: [AppMaterialModule, FormsModule],
            providers: [{ provide: GameService, useValue: gameServiceSpy }],
        });
        fixture = TestBed.createComponent(GameChoiceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('lockChoices', () => {
        it('should lock choices if there is enough choices selected', () => {
            gameServiceSpy.hasEnoughSelectedChoices.and.returnValue(true);
            component.lockChoices();
            expect(gameServiceSpy.lockAnswer).toHaveBeenCalled();
        });
    });

    describe('onChoiceSelect', () => {
        it('should call on choice select from game service', () => {
            component.onChoiceSelect(1);
            expect(gameServiceSpy.onChoiceSelect).toHaveBeenCalled();
        });
    });

    describe('isSelected', () => {
        it('should return false when the choice is not in selectedChoices', () => {
            gameServiceSpy.selectedChoiceIndexes = [];
            expect(component.isSelected(1)).toBeFalse();
        });

        it('should return true when the choice is in selectedChoices', () => {
            const choice = 1;
            gameServiceSpy.selectedChoiceIndexes = [choice];
            expect(component.isSelected(choice)).toBeTrue();
        });
    });

    describe('handleKeyPress', () => {
        it('should call selectChoiceByKey if key is 1, 2, 3 or 4', () => {
            spyOn(component, 'selectChoiceByKey');
            const event = new KeyboardEvent('keydown', { key: '1' });

            component.handleKeyPress(event);

            expect(component.selectChoiceByKey).toHaveBeenCalledWith('1');
        });

        it('should call lockChoices if key Enter is pressed', () => {
            spyOn(component, 'lockChoices');
            const event = new KeyboardEvent('keydown', { key: 'Enter' });

            component.handleKeyPress(event);

            expect(component.lockChoices).toHaveBeenCalled();
        });

        it('should not do anything if key pressed is not an allowed key or Enter', () => {
            spyOn(component, 'selectChoiceByKey');
            spyOn(component, 'lockChoices');
            const event = new KeyboardEvent('keydown', { key: '5' });

            component.handleKeyPress(event);

            expect(component.selectChoiceByKey).not.toHaveBeenCalled();
            expect(component.lockChoices).not.toHaveBeenCalled();
        });
    });

    describe('selectChoiceByKey', () => {
        it('should selectChoice if key corresponds to question index', () => {
            const choice = { text: 'choice 1', isCorrect: false };
            spyOn(component, 'onChoiceSelect');
            spyOn(component, 'getChoices').and.returnValue([{ text: 'choice 0', isCorrect: true }, choice]);
            component.selectChoiceByKey('2');
            expect(component.onChoiceSelect).toHaveBeenCalledWith(1);
        });

        it('should not select choice if key does not correspond to question index', () => {
            spyOn(component, 'onChoiceSelect');
            spyOn(component, 'getChoices').and.returnValue([
                { text: 'choice 1', isCorrect: true },
                { text: 'choice 2', isCorrect: false },
            ]);
            component.selectChoiceByKey('4');
            expect(component.onChoiceSelect).not.toHaveBeenCalled();
        });
    });

    describe('getQuestion', () => {
        it('should return the question from the GameService', () => {
            expect(component.getQuestion()).toEqual(gameServiceSpy.question);
        });
    });

    describe('getChoices', () => {
        it('should call getChoices from gameService', () => {
            expect(gameServiceSpy.getChoices).toHaveBeenCalled();
        });
    });

    describe('getIsLocked', () => {
        it('should return true if the choices are locked', () => {
            gameServiceSpy.isLocked = true;
            expect(component.getIsLocked()).toBeTrue();
        });

        it('should return false if the choices are unlocked', () => {
            gameServiceSpy.isLocked = false;
            expect(component.getIsLocked()).toBeFalse();
        });
    });

    describe('showResults', () => {
        it('should return true if game state is QuestionResults and choices are locked', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isLocked = true;
            expect(component.showResults()).toBeTrue();
        });

        it('should return false if game state is not QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.isLocked = true;
            expect(component.showResults()).toBeFalse();
        });

        it('should return false if choices are not locked', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isLocked = false;
            expect(component.showResults()).toBeFalse();
        });
    });
});
