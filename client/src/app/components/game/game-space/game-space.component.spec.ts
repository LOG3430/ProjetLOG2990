import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GameQrlComponent } from '@app/components/game/game-qrl/game-qrl.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';
import { QuestionType } from '@common/interfaces/question.dto';
import { of } from 'rxjs';
import { GameSpaceComponent } from './game-space.component';

// magic numbers used for tests
/* eslint-disable  @typescript-eslint/no-magic-numbers */

describe('GameSpaceComponent', () => {
    let component: GameSpaceComponent;
    let fixture: ComponentFixture<GameSpaceComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', [
            'getGameState',
            'getDuration',
            'getTime',
            'isQcm',
            'getIsOrganizer',
            'leaveGame',
            'handleLeaveGame',
            'getNewQuestionMessage',
            'navigateExit',
        ]);
        gameServiceSpy.getNewQuestionMessage.and.returnValue(of());

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
        TestBed.configureTestingModule({
            imports: [AppMaterialModule, BrowserAnimationsModule],
            declarations: [GameSpaceComponent, GameQrlComponent],
            providers: [{ provide: GameService, useValue: gameServiceSpy }],
        });
        fixture = TestBed.createComponent(GameSpaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getQuestionText', () => {
        it('should return question text', () => {
            expect(component.getQuestionText()).toEqual('test');
        });
    });

    describe('getPoints', () => {
        it('should return 0 if the question is not defined', () => {
            Object.defineProperty(gameServiceSpy, 'question', { value: undefined });

            fixture.detectChanges();

            expect(component.getPoints()).toEqual(0);
        });

        it('should return question points if the question is defined', () => {
            expect(component.getPoints()).toEqual(10);
        });
    });

    describe('getQuestionResult', () => {
        it('should return question result', () => {
            gameServiceSpy.questionResult = 10;
            expect(component.getQuestionResult()).toEqual(10);
        });
    });

    describe('getQuestionResultClass', () => {
        it('should return "green" for positive results', () => {
            gameServiceSpy.questionResult = 10;
            expect(component.getQuestionResultClass()).toEqual('green');
        });

        it('should return "red" for zero or negative results', () => {
            gameServiceSpy.questionResult = 0;
            expect(component.getQuestionResultClass()).toEqual('red');
        });
    });

    describe('isBonus', () => {
        it('should return false if it is bonus', () => {
            gameServiceSpy.bonus = false;
            expect(component.isBonus()).toBeFalse();
        });

        it('should return true it is bonus', () => {
            gameServiceSpy.bonus = true;
            expect(component.isBonus()).toBeTrue();
        });
    });

    describe('isQcm', () => {
        it('should return if it is Qcm', () => {
            gameServiceSpy.isQcm.and.returnValue(true);
            expect(component.isQcm()).toBeTrue();
        });

        it('should return false if it is not Qcm', () => {
            gameServiceSpy.isQcm.and.returnValue(false);
            expect(component.isQcm()).toBeFalse();
        });
    });

    describe('isInCooldown', () => {
        it('should return true if it is in cooldown', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Cooldown);
            expect(component.isInCooldown()).toBeTrue();
        });

        it('should return false if it is not in cooldown', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            expect(component.isInCooldown()).toBeFalse();
        });
    });

    describe('showQuestionResult', () => {
        it('should return true if game state is QuestionResults and player is not organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.getIsOrganizer.and.returnValue(false);

            expect(component.showQuestionResult()).toBeTrue();
        });

        it('should return false if game state is not QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Cooldown);
            gameServiceSpy.getIsOrganizer.and.returnValue(false);

            expect(component.showQuestionResult()).toBeFalse();
        });

        it('should return true if game state is QuestionResults and player is organizer in testing mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = true;

            expect(component.showQuestionResult()).toBeTrue();
        });
    });

    describe('showPoints', () => {
        it('should return true if game state is not Grading and not showQuestionResult', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);

            expect(component.showPoints()).toBeTrue();
        });

        it('should return false if it showQuestionResult', () => {
            component.showQuestionResult = () => true;

            expect(component.showPoints()).toBeFalse();
        });

        it('should return false if game state is Grading', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Grading);

            expect(component.showPoints()).toBeFalse();
        });
    });

    describe('exitGame', () => {
        it('should call navigateExit', () => {
            component.exitGame();

            expect(gameServiceSpy.navigateExit).toHaveBeenCalled();
        });
    });

    describe('showQuestionAnswerBox', () => {
        it('should return true if player is not organizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(false);

            expect(component.showQuestionAnswerBox()).toBeTrue();
        });

        it('should return true if player is organizer in testing mode', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = true;

            expect(component.showQuestionAnswerBox()).toBeTrue();
        });

        it('should return false if player is organizer and not in testing mode', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = false;

            expect(component.showQuestionAnswerBox()).toBeFalse();
        });
    });
    describe('showHistogram', () => {
        it('should return true if game state is Answering and player is organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = false;

            expect(component.showHistogram()).toBeTrue();
        });

        it('should return true if game state is QuestionResults and player is organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = false;

            expect(component.showHistogram()).toBeTrue();
        });

        it('should return false if game state is not Answering or QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Cooldown);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = false;

            expect(component.showHistogram()).toBeFalse();
        });

        it('should return false if player is not organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.getIsOrganizer.and.returnValue(false);
            gameServiceSpy.isTestingMode = false;

            expect(component.showHistogram()).toBeFalse();
        });

        it('should return false if player is organizer in testing mode', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            gameServiceSpy.isTestingMode = true;

            expect(component.showHistogram()).toBeFalse();
        });
    });

    describe('showGrading', () => {
        it('should return true if game state is Answering and player is organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Grading);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);

            expect(component.showGrading()).toBeTrue();
        });

        it('should return false if game state is Answering and player is not organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Grading);
            gameServiceSpy.getIsOrganizer.and.returnValue(false);

            expect(component.showGrading()).toBeFalse();
        });

        it('should return false if game state is not Grading', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Cooldown);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);

            expect(component.showGrading()).toBeFalse();
        });

        it('should return false if player is not organizer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Grading);
            gameServiceSpy.getIsOrganizer.and.returnValue(false);

            expect(component.showGrading()).toBeFalse();
        });
    });
});
