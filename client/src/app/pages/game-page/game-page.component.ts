import { Component, OnDestroy, OnInit } from '@angular/core';
import { CanComponentDeactivate } from '@app/interfaces/can-component-deactivate';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy, CanComponentDeactivate {
    constructor(private gameService: GameService) {}

    ngOnInit(): void {
        if (!this.gameService.getRoomId()) {
            this.gameService.forceQuit();
        }
    }

    canDeactivate() {
        return this.gameService.canDeactivate();
    }

    ngOnDestroy() {
        if (this.gameService.getRoomId()) {
            this.gameService.leaveGame();
        }
        this.gameService.resetGame();
    }

    getTime(): number {
        return this.gameService.getTime();
    }

    getPlayerScore(): number {
        return this.gameService.playerScore;
    }

    isLockedChoices(): boolean {
        return this.gameService.isLocked;
    }

    showQuestions(): boolean {
        return (
            this.gameService.getGameState() === GameState.Answering ||
            this.gameService.getGameState() === GameState.QuestionResults ||
            this.gameService.getGameState() === GameState.Grading
        );
    }

    isTimerOn(): boolean {
        return this.gameService.getGameState() === GameState.InitialTimer || this.gameService.getGameState() === GameState.Cooldown;
    }

    isWaitingRoom(): boolean {
        return this.gameService.getGameState() === GameState.WaitingRoom;
    }

    isResultsPage(): boolean {
        return this.gameService.getGameState() === GameState.QuizResults;
    }

    shouldDisplayFooter(): boolean {
        return !this.isTimerOn() && !this.isWaitingRoom() && !this.isResultsPage();
    }

    shouldDisplayPlayerBox(): boolean {
        return ((!this.isWaitingRoom() && this.gameService.getIsOrganizer()) || this.isResultsPage()) && !this.gameService.isTestingMode;
    }
}
