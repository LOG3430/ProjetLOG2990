import { Component } from '@angular/core';
import { PERCENTAGE } from '@app/constants/game-footer.component.constants';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';

@Component({
    selector: 'app-game-footer',
    templateUrl: './game-footer.component.html',
    styleUrls: ['./game-footer.component.scss'],
})
export class GameFooterComponent {
    constructor(private gameService: GameService) {}

    actionButton(): void {
        this.gameService.actionButton();
    }

    handleLockChoices(): void {
        if (this.canLockChoices()) {
            this.gameService.lockAnswer();
        }
    }

    handleLockLongAnswer(): void {
        if (this.canLockLongAnswer()) {
            this.gameService.lockAnswer();
        }
    }

    hasEnoughSelectedChoices(): boolean {
        return this.gameService.hasEnoughSelectedChoices();
    }

    hasValidLongAnswer(): boolean {
        return this.gameService.hasValidLongAnswer();
    }

    isInCooldown(): boolean {
        return this.gameService.getGameState() === GameState.Cooldown;
    }

    canLockChoices(): boolean {
        return this.gameService.getGameState() === GameState.Answering && !this.gameService.isLocked && this.gameService.isQcm();
    }

    canLockLongAnswer(): boolean {
        return this.gameService.getGameState() === GameState.Answering && !this.gameService.isLocked && !this.gameService.isQcm();
    }

    getSpinnerValue(): number {
        return (this.gameService.getTime() * PERCENTAGE) / this.gameService.getDuration();
    }

    getRemainingTime(): number {
        return this.gameService.getTime();
    }

    getPlayerScore(): number {
        return this.gameService.playerScore;
    }

    showEndQuestionButton(): boolean {
        return this.gameService.getGameState() === GameState.QuestionResults && this.gameService.isLastQuestion && this.isOrganizingGame();
    }

    canGoToNextQuestion(): boolean {
        return this.gameService.getGameState() === GameState.QuestionResults && this.isOrganizingGame();
    }

    showSpinner(): boolean {
        return (
            this.gameService.getGameState() === GameState.Answering ||
            (this.gameService.getGameState() === GameState.QuestionResults && (this.gameService.isTestingMode || this.gameService.isRandomMode))
        );
    }
    isGameStateAnswering() {
        return this.gameService.getGameState() === GameState.Answering;
    }

    getIsOrganizer(): boolean {
        return this.gameService.getIsOrganizer();
    }

    getIsGamePaused(): boolean {
        return this.gameService.isGamePaused;
    }

    getIsPanicModeAvailable(): boolean {
        return this.gameService.isPanicAvailable;
    }

    getIsPanicOn(): boolean {
        return this.gameService.isPanicOn;
    }

    getPanicButtonTooltipText(): string {
        if (this.getIsPanicOn()) {
            return 'Impossible de désactiver le mode panique';
        } else return this.getIsPanicModeAvailable() ? 'Activer le mode panique' : 'Mode panique non disponible';
    }

    isOrganizingGame(): boolean {
        return this.getIsOrganizer() && !this.gameService.isTestingMode;
    }

    isTestingMode(): boolean {
        return this.gameService.isTestingMode;
    }

    isRandomMode(): boolean {
        return this.gameService.isRandomMode;
    }

    getRank(): number {
        return this.gameService.rank + 1;
    }

    isWaitingForOrganizer() {
        return (
            this.gameService.getGameState() === GameState.QuestionResults && !this.isOrganizingGame() && !this.isTestingMode() && !this.isRandomMode()
        );
    }

    isWaitingForGrading() {
        return this.gameService.getGameState() === GameState.Grading && !this.isOrganizingGame();
    }

    handlePauseButton(): void {
        this.gameService.pauseTime();
    }

    handlePanicButton(): void {
        this.gameService.panicMode();
    }
}
