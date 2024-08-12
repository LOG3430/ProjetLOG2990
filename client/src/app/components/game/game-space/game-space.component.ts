import { Component } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';
@Component({
    selector: 'app-game-space',
    templateUrl: './game-space.component.html',
    styleUrls: ['./game-space.component.scss'],
})
export class GameSpaceComponent {
    constructor(private gameService: GameService) {}

    getQuestionText(): string {
        return this.gameService.question ? this.gameService.question.text : '';
    }

    getPoints(): number {
        return this.gameService.question ? this.gameService.question.points : 0;
    }

    getQuestionResult(): number {
        return this.gameService.questionResult;
    }

    getQuestionResultClass(): string {
        return this.getQuestionResult() === 0 ? 'red' : 'green';
    }

    isBonus(): boolean {
        return this.gameService.bonus;
    }

    isQcm(): boolean {
        return this.gameService.isQcm();
    }

    isInCooldown(): boolean {
        return this.gameService.getGameState() === GameState.Cooldown;
    }

    showQuestionResult(): boolean {
        return (
            this.gameService.getGameState() === GameState.QuestionResults && (!this.gameService.getIsOrganizer() || this.gameService.isTestingMode)
        );
    }

    showPoints(): boolean {
        return !this.showQuestionResult() && this.gameService.getGameState() !== GameState.Grading;
    }

    exitGame(): void {
        this.gameService.navigateExit();
    }

    showQuestionAnswerBox(): boolean {
        return !this.gameService.getIsOrganizer() || this.gameService.isTestingMode;
    }

    showHistogram(): boolean {
        return (
            (this.gameService.getGameState() === GameState.Answering || this.gameService.getGameState() === GameState.QuestionResults) &&
            this.gameService.getIsOrganizer() &&
            !this.gameService.isTestingMode
        );
    }

    showGrading(): boolean {
        return this.gameService.getGameState() === GameState.Grading && this.gameService.getIsOrganizer();
    }
}
