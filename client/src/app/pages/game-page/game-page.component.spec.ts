import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChatboxComponent } from '@app/components/game/chatbox/chatbox.component';
import { GameFooterComponent } from '@app/components/game/game-footer/game-footer.component';
import { GameQrlComponent } from '@app/components/game/game-qrl/game-qrl.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { GameState } from '@common/enums/game-state.enum';
import { QuestionType } from '@common/interfaces/question.dto';
import { GamePageComponent } from './game-page.component';
import SpyObj = jasmine.SpyObj;

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;

    let gameServiceSpy: SpyObj<GameService>;
    let socketCommunicationServiceSpy: SpyObj<SocketCommunicationService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', [
            'getTime',
            'isQcm',
            'getGameState',
            'leaveGame',
            'getDuration',
            'getRoomId',
            'handleLeaveGame',
            'getIsOrganizer',
            'resetGame',
            'forceQuit',
            'canDeactivate',
        ]);

        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['on', 'emit']);

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
            declarations: [GamePageComponent, GameQrlComponent, GameFooterComponent, ChatboxComponent],
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should call handleLeaveGame if there is no room ID', () => {
            gameServiceSpy.getRoomId.and.returnValue('');
            component.ngOnInit();
            expect(gameServiceSpy.forceQuit).toHaveBeenCalled();
        });

        it('should not call handleLeaveGame if there is a room ID', () => {
            gameServiceSpy.handleLeaveGame.calls.reset();
            gameServiceSpy.getRoomId.and.returnValue('1234');
            component.ngOnInit();
            expect(gameServiceSpy.handleLeaveGame).not.toHaveBeenCalled();
        });
    });

    describe('canDeactivate', () => {
        it('should return true for canDeactivate from the game service', () => {
            gameServiceSpy.canDeactivate.and.returnValue(true);
            expect(component.canDeactivate()).toBeTrue();
        });
        it('should return false for canDeactivate from the game service', () => {
            gameServiceSpy.canDeactivate.and.returnValue(false);
            expect(component.canDeactivate()).toBeFalse();
        });
    });

    describe('ngOnDestroy', () => {
        it('should call leaveGame and resetGame if there is a room ID', () => {
            gameServiceSpy.getRoomId.and.returnValue('1234');
            component.ngOnDestroy();
            expect(gameServiceSpy.leaveGame).toHaveBeenCalled();
            expect(gameServiceSpy.resetGame).toHaveBeenCalled();
        });

        it('should only call resetGame if there is no room ID', () => {
            gameServiceSpy.getRoomId.and.returnValue('');
            component.ngOnDestroy();
            expect(gameServiceSpy.leaveGame).not.toHaveBeenCalled();
            expect(gameServiceSpy.resetGame).toHaveBeenCalled();
        });
    });

    describe('getTime', () => {
        it('should return the time left', () => {
            component.getTime();
            expect(gameServiceSpy.getTime).toHaveBeenCalled();
        });
    });
    describe('isLockedChoices', () => {
        it('should return if the choices are locked', () => {
            gameServiceSpy.isLocked = true;
            expect(component.isLockedChoices()).toBeTrue();
        });

        it('should return if the choices are not locked', () => {
            gameServiceSpy.isLocked = false;
            expect(component.isLockedChoices()).toBeFalse();
        });
    });

    describe('getPlayerScore', () => {
        it('should return the player score from the game service', () => {
            const score = 10;
            gameServiceSpy.playerScore = score;
            expect(component.getPlayerScore()).toEqual(score);
        });
    });

    describe('showQuestions', () => {
        it('should return true if game state is Answering', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Answering);
            expect(component.showQuestions()).toBeTrue();
        });

        it('should return true if game state is QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuestionResults);
            expect(component.showQuestions()).toBeTrue();
        });

        it('should return false if game state is not Answering or QuestionResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            expect(component.showQuestions()).toBeFalse();
        });
    });

    describe('isTimerOn', () => {
        it('should return true when game state is InitialTimer', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.InitialTimer);
            expect(component.isTimerOn()).toBeTrue();
        });

        it('should return true when game state is Cooldown', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Cooldown);
            expect(component.isTimerOn()).toBeTrue();
        });

        it('should return false for other states', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            expect(component.isTimerOn()).toBeFalse();
        });
    });

    describe('isWaitingRoom', () => {
        it('should return true when game state is WaitingRoom', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.WaitingRoom);
            expect(component.isWaitingRoom()).toBeTrue();
        });

        it('should return false for other states', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.InitialTimer);
            expect(component.isWaitingRoom()).toBeFalse();
        });
    });

    describe('isResultsPage', () => {
        it('should return true when game state is QuizResults', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.QuizResults);
            expect(component.isResultsPage()).toBeTrue();
        });

        it('should return false for other states', () => {
            gameServiceSpy.getGameState.and.returnValue(GameState.Cooldown);
            expect(component.isResultsPage()).toBeFalse();
        });
    });

    describe('shouldDisplayFooter', () => {
        it('should return false when in timer state', () => {
            spyOn(component, 'isTimerOn').and.returnValue(true);
            expect(component.shouldDisplayFooter()).toBeFalse();
        });

        it('should return false when in waiting room state', () => {
            spyOn(component, 'isWaitingRoom').and.returnValue(true);
            expect(component.shouldDisplayFooter()).toBeFalse();
        });

        it('should return false when in results page state', () => {
            spyOn(component, 'isResultsPage').and.returnValue(true);
            expect(component.shouldDisplayFooter()).toBeFalse();
        });

        it('should return true for other states', () => {
            spyOn(component, 'isTimerOn').and.returnValue(false);
            spyOn(component, 'isWaitingRoom').and.returnValue(false);
            spyOn(component, 'isResultsPage').and.returnValue(false);
            expect(component.shouldDisplayFooter()).toBeTrue();
        });
    });

    describe('shouldDisplayPlayerBox', () => {
        it('should return false when the game state is WaitingRoom', () => {
            spyOn(component, 'isWaitingRoom').and.returnValue(true);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            expect(component.shouldDisplayPlayerBox()).toBeFalse();
        });

        it('should return true when not in WaitingRoom and the user is an organizer', () => {
            spyOn(component, 'isWaitingRoom').and.returnValue(false);
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            expect(component.shouldDisplayPlayerBox()).toBeTrue();
        });

        it('should return false when not in WaitingRoom but user is not an organizer', () => {
            spyOn(component, 'isWaitingRoom').and.returnValue(false);
            gameServiceSpy.getIsOrganizer.and.returnValue(false);
            expect(component.shouldDisplayPlayerBox()).toBeFalse();
        });
    });
});
