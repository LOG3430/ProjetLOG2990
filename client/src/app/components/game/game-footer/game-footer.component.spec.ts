/* eslint-disable max-lines */
// necessary to test all game-footer methods
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PERCENTAGE } from '@app/constants/game-footer.component.constants';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';
import { GameFooterComponent } from './game-footer.component';

describe('GameFooterComponent', () => {
    let component: GameFooterComponent;
    let fixture: ComponentFixture<GameFooterComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', [
            'actionButton',
            'lockChoices',
            'hasEnoughSelectedChoices',
            'getGameState',
            'getTime',
            'getDuration',
            'getIsOrganizer',
            'isQcm',
            'lockAnswer',
            'hasValidLongAnswer',
            'pauseTime',
            'panicMode',
        ]);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GameFooterComponent],
            imports: [AppMaterialModule],
            providers: [{ provide: GameService, useValue: gameServiceSpy }],
        });
        fixture = TestBed.createComponent(GameFooterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('actionButton', () => {
        it('should call actionButton', () => {
            component.actionButton();
            expect(gameServiceSpy.actionButton).toHaveBeenCalled();
        });
    });

    describe('hasEnoughSelectedChoices', () => {
        it('should return true if there are selected choices', () => {
            gameServiceSpy.hasEnoughSelectedChoices.and.returnValue(true);
            expect(component.hasEnoughSelectedChoices()).toBeTrue();
        });

        it('should return false if there are no selected choices', () => {
            gameServiceSpy.hasEnoughSelectedChoices.and.returnValue(false);
            expect(component.hasEnoughSelectedChoices()).toBeFalse();
        });
    });

    describe('isInCooldown', () => {
        it('should return true if the game is in cooldown', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Cooldown);
            expect(component.isInCooldown()).toBeTrue();
        });

        it('should return false if the game is not in cooldown', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            expect(component.isInCooldown()).toBeFalse();
        });
    });

    describe('handleLockChoices', () => {
        it('should call lock choices if it can lock choices', () => {
            spyOn(component, 'canLockChoices').and.returnValue(true);
            component.handleLockChoices();
            expect(gameServiceSpy.lockAnswer).toHaveBeenCalled();
        });

        it('should not call lock choices if it cannot lock choices', () => {
            spyOn(component, 'canLockChoices').and.returnValue(false);
            component.handleLockChoices();
            expect(gameServiceSpy.lockAnswer).not.toHaveBeenCalled();
        });
    });

    describe('canLockChoices', () => {
        it('should allow locking choices if game state is Answering and choices are not locked', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.isQcm.and.returnValue(true);
            gameServiceSpy.isLocked = false;

            expect(component.canLockChoices()).toBeTrue();
        });

        it('should not allow locking choices if game state is not Answering', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Cooldown);

            expect(component.canLockChoices()).toBeFalse();
        });

        it('should not allow locking choices if choices are already locked', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.isLocked = true;

            expect(component.canLockChoices()).toBeFalse();
        });
    });

    describe('getSpinnerValue', () => {
        it('should calculate spinner value based on time and duration', () => {
            const mockTime = 30;
            const mockDuration = 60;
            const expectedSpinnerValue = (mockTime * PERCENTAGE) / mockDuration;

            gameServiceSpy.getTime.and.returnValue(mockTime);
            gameServiceSpy.getDuration.and.returnValue(mockDuration);

            const spinnerValue = component.getSpinnerValue();

            expect(spinnerValue).toEqual(expectedSpinnerValue);
        });
    });

    describe('getRemainingTime', () => {
        it('should return the remaining time from the game service', () => {
            const expectedTime = 50;
            gameServiceSpy.getTime.and.returnValue(expectedTime);

            const remainingTime = component.getRemainingTime();

            expect(remainingTime).toEqual(expectedTime);
            expect(gameServiceSpy.getTime).toHaveBeenCalled();
        });
    });

    describe('getPlayerScore', () => {
        it('should return player score from the game service', () => {
            gameServiceSpy.playerScore = 120;
            expect(component.getPlayerScore()).toEqual(gameServiceSpy.playerScore);
        });
    });

    describe('getIsOrganizer', () => {
        it('should return true if the game service indicates the user is an organizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);

            expect(component.getIsOrganizer()).toBeTrue();
        });

        it('should return false if the game service indicates the user is not an organizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(false);

            expect(component.getIsOrganizer()).toBeFalse();
        });
    });

    describe('showEndQuestionButton', () => {
        it('should return true when game state is QuestionResults, user is organising game', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isLastQuestion = true;
            spyOn(component, 'isOrganizingGame').and.returnValue(true);

            expect(component.showEndQuestionButton()).toBeTrue();
        });

        it('should return false when game state is not QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            gameServiceSpy.isLastQuestion = true;
            spyOn(component, 'isOrganizingGame').and.returnValue(true);

            expect(component.showEndQuestionButton()).toBeFalse();
        });

        it('should return false when user is not organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isLastQuestion = true;
            spyOn(component, 'isOrganizingGame').and.returnValue(false);

            expect(component.showEndQuestionButton()).toBeFalse();
        });

        it('should return false when it is not the last question', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isLastQuestion = false;
            spyOn(component, 'isOrganizingGame').and.returnValue(true);

            expect(component.showEndQuestionButton()).toBeFalse();
        });

        it('should return false when user is not organising game', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isLastQuestion = true;
            spyOn(component, 'isOrganizingGame').and.returnValue(false);

            expect(component.showEndQuestionButton()).toBeFalse();
        });
    });

    describe('canGoToNextQuestion', () => {
        it('should return true when game state is QuestionResults, user is organizer, and not in testing mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(true);

            expect(component.canGoToNextQuestion()).toBeTrue();
        });

        it('should return false when game state is not QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            spyOn(component, 'isOrganizingGame').and.returnValue(true);

            expect(component.canGoToNextQuestion()).toBeFalse();
        });

        it('should return false when user is not organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);

            expect(component.canGoToNextQuestion()).toBeFalse();
        });

        it('should return false when in testing mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);

            expect(component.canGoToNextQuestion()).toBeFalse();
        });
    });

    describe('showSpinner', () => {
        it('should return true when game state is Answering', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.isTestingMode = false;

            expect(component.showSpinner()).toBeTrue();
        });

        it('should return true when game state is QuestionResults and in testing mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isTestingMode = true;
            gameServiceSpy.isRandomMode = false;

            expect(component.showSpinner()).toBeTrue();
        });

        it('should return true when game state is QuestionResults and in random mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isTestingMode = false;
            gameServiceSpy.isRandomMode = true;

            expect(component.showSpinner()).toBeTrue();
        });

        it('should return false when game state is not Answering or QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            gameServiceSpy.isTestingMode = false;

            expect(component.showSpinner()).toBeFalse();
        });

        it('should return false when game state is QuestionResults but not in testing mode or random mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.isTestingMode = false;
            gameServiceSpy.isRandomMode = false;

            expect(component.showSpinner()).toBeFalse();
        });
    });

    describe('isOrganisingGame', () => {
        it('should return true if the user is an organizer and not in testing mode', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = false;

            expect(component.isOrganizingGame()).toBeTrue();
        });

        it('should return false if the user is not an organizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(false);

            expect(component.isOrganizingGame()).toBeFalse();
        });

        it('should return false if the user is in testing mode', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = true;

            expect(component.isOrganizingGame()).toBeFalse();
        });
    });

    describe('isTestingMode', () => {
        it('should return true if the game service is in testing mode', () => {
            gameServiceSpy.isTestingMode = true;
            expect(component.isTestingMode()).toBeTrue();
        });

        it('should return false if the game service is not in testing mode', () => {
            gameServiceSpy.isTestingMode = false;
            expect(component.isTestingMode()).toBeFalse();
        });
    });

    describe('isRandomMode', () => {
        it('should return true if the game service is in random mode', () => {
            gameServiceSpy.isRandomMode = true;
            expect(component.isRandomMode()).toBeTrue();
        });

        it('should return false if the game service is not in random mode', () => {
            gameServiceSpy.isRandomMode = false;
            expect(component.isRandomMode()).toBeFalse();
        });
    });

    describe('getRank', () => {
        it('should return one more than the rank from the game service', () => {
            gameServiceSpy.rank = 0;
            expect(component.getRank()).toEqual(1);
        });
    });

    describe('handleLockLongAnswer', () => {
        it('should call lockAnswer when canLockLongAnswer is true', () => {
            spyOn(component, 'canLockLongAnswer').and.returnValue(true);

            component.handleLockLongAnswer();

            expect(gameServiceSpy.lockAnswer).toHaveBeenCalled();
        });

        it('should not call lockAnswer when canLockLongAnswer is false', () => {
            spyOn(component, 'canLockLongAnswer').and.returnValue(false);

            component.handleLockLongAnswer();

            expect(gameServiceSpy.lockAnswer).not.toHaveBeenCalled();
        });
    });

    describe('hasValidLongAnswer', () => {
        it('should call hasValidLongAnswer methid from gameService', () => {
            component.hasValidLongAnswer();

            expect(gameServiceSpy.hasValidLongAnswer).toHaveBeenCalled();
        });
    });

    describe('isGameStateAnswering', () => {
        it('should return true if gameState is Answering', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            component.isGameStateAnswering();

            expect(component.isGameStateAnswering()).toBeTrue();
        });

        it('should return false if gameState is not Answering', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            component.isGameStateAnswering();

            expect(component.isGameStateAnswering()).toBeFalse();
        });
    });

    describe('getIsGamePaused', () => {
        it('should return true when the game is paused', () => {
            gameServiceSpy.isGamePaused = true;
            expect(component.getIsGamePaused()).toBeTrue();
        });

        it('should return false when the game is not paused', () => {
            gameServiceSpy.isGamePaused = false;
            expect(component.getIsGamePaused()).toBeFalse();
        });
    });

    describe('getIsPanicModeAvailable', () => {
        it('should return true when panic mode is available', () => {
            gameServiceSpy.isPanicAvailable = true;
            expect(component.getIsPanicModeAvailable()).toBeTrue();
        });

        it('should return false when panic mode is not available', () => {
            gameServiceSpy.isPanicAvailable = false;
            expect(component.getIsPanicModeAvailable()).toBeFalse();
        });
    });

    describe('getIsPanicOn', () => {
        it('should return true when panic mode is on', () => {
            gameServiceSpy.isPanicOn = true;
            expect(component.getIsPanicOn()).toBeTrue();
        });

        it('should return false when panic mode is off', () => {
            gameServiceSpy.isPanicOn = false;
            expect(component.getIsPanicOn()).toBeFalse();
        });
    });

    describe('getPanicButtonTooltipText', () => {
        it('should return "Impossible de désactiver le mode panique" when panic mode is on', () => {
            spyOn(component, 'getIsPanicOn').and.returnValue(true);
            expect(component.getPanicButtonTooltipText()).toEqual('Impossible de désactiver le mode panique');
        });

        it('should return "Activer le mode panique" when panic mode is available', () => {
            spyOn(component, 'getIsPanicOn').and.returnValue(false);
            spyOn(component, 'getIsPanicModeAvailable').and.returnValue(true);
            expect(component.getPanicButtonTooltipText()).toEqual('Activer le mode panique');
        });

        it('should return "Mode panique non disponible" when panic mode is not available', () => {
            spyOn(component, 'getIsPanicOn').and.returnValue(false);
            spyOn(component, 'getIsPanicModeAvailable').and.returnValue(false);
            expect(component.getPanicButtonTooltipText()).toEqual('Mode panique non disponible');
        });
    });

    describe('handlePauseButton', () => {
        it('should call pauseTime on gameService', () => {
            component.handlePauseButton();
            expect(gameServiceSpy.pauseTime).toHaveBeenCalled();
        });
    });

    describe('handlePanicButton', () => {
        it('should call panicMode on gameService', () => {
            component.handlePanicButton();
            expect(gameServiceSpy.panicMode).toHaveBeenCalled();
        });
    });

    describe('canLockLongAnswer', () => {
        beforeEach(() => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.isLocked = false;
            gameServiceSpy.isQcm.and.returnValue(false);
        });

        it('should return true when the game state is Answering, not locked, and not a QCM', () => {
            expect(component.canLockLongAnswer()).toBeTrue();
        });

        it('should return false when the game state is not Answering', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            expect(component.canLockLongAnswer()).toBeFalse();
        });

        it('should return false when the answers are locked', () => {
            gameServiceSpy.isLocked = true;
            expect(component.canLockLongAnswer()).toBeFalse();
        });

        it('should return false when it is a QCM', () => {
            gameServiceSpy.isQcm.and.returnValue(true);
            expect(component.canLockLongAnswer()).toBeFalse();
        });
    });

    describe('isWaitingForOrganizer', () => {
        it('should return true when game state is QuestionResults, not organising the game, and not in testing mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);
            spyOn(component, 'isTestingMode').and.returnValue(false);

            expect(component.isWaitingForOrganizer()).toBeTrue();
        });

        it('should return false when game state is not QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);
            spyOn(component, 'isTestingMode').and.returnValue(false);

            expect(component.isWaitingForOrganizer()).toBeFalse();
        });

        it('should return false when organising the game', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(true);
            spyOn(component, 'isTestingMode').and.returnValue(false);

            expect(component.isWaitingForOrganizer()).toBeFalse();
        });

        it('should return false when in testing mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);
            spyOn(component, 'isTestingMode').and.returnValue(true);

            expect(component.isWaitingForOrganizer()).toBeFalse();
        });
    });

    describe('isWaitingForGrading', () => {
        it('should return true when game state is Grading and not organising the game', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Grading);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);

            expect(component.isWaitingForGrading()).toBeTrue();
        });

        it('should return false when game state is not Grading', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);

            expect(component.isWaitingForGrading()).toBeFalse();
        });

        it('should return false when organising the game', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Grading);
            spyOn(component, 'isOrganizingGame').and.returnValue(true);

            expect(component.isWaitingForGrading()).toBeFalse();
        });
    });

    describe('isWaitingForOrganizer', () => {
        it('should return true when game state is QuestionResults, not organizing game, not in testing mode, and not in random mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);
            gameServiceSpy.isTestingMode = false;
            gameServiceSpy.isRandomMode = false;

            expect(component.isWaitingForOrganizer()).toBeTrue();
        });

        it('should return false when game state is not QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);
            gameServiceSpy.isTestingMode = false;
            gameServiceSpy.isRandomMode = false;

            expect(component.isWaitingForOrganizer()).toBeFalse();
        });

        it('should return false when user is organizing game', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(true);
            gameServiceSpy.isTestingMode = false;
            gameServiceSpy.isRandomMode = false;

            expect(component.isWaitingForOrganizer()).toBeFalse();
        });

        it('should return false when in testing mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);
            gameServiceSpy.isTestingMode = true;
            gameServiceSpy.isRandomMode = false;

            expect(component.isWaitingForOrganizer()).toBeFalse();
        });

        it('should return false when in random mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            spyOn(component, 'isOrganizingGame').and.returnValue(false);
            gameServiceSpy.isTestingMode = false;
            gameServiceSpy.isRandomMode = true;

            expect(component.isWaitingForOrganizer()).toBeFalse();
        });
    });
});
