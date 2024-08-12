import { Component, HostListener } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';
import { Choice } from '@common/interfaces/choice.dto';
import { Question } from '@common/interfaces/question.dto';

@Component({
    selector: 'app-game-choice',
    templateUrl: './game-choice.component.html',
    styleUrls: ['./game-choice.component.scss'],
})
export class GameChoiceComponent {
    readonly baseChoiceClassName = 'choice-';

    constructor(private gameService: GameService) {}

    @HostListener('window:keydown', ['$event'])
    handleKeyPress(event: KeyboardEvent): void {
        const key = event.key;
        const allowedKeys = ['1', '2', '3', '4'];
        if (allowedKeys.includes(key)) {
            this.selectChoiceByKey(key);
        } else if (key === 'Enter') {
            this.lockChoices();
        }
    }

    lockChoices(): void {
        if (this.gameService.hasEnoughSelectedChoices()) {
            this.gameService.lockAnswer();
        }
    }

    getQuestion(): Question {
        return this.gameService.question;
    }

    getChoices(): Choice[] {
        return this.gameService.getChoices();
    }

    getIsLocked(): boolean {
        return this.gameService.isLocked;
    }

    showResults(): boolean {
        return this.gameService.getGameState() === GameState.QuestionResults && this.gameService.isLocked;
    }

    onChoiceSelect(choiceIndex: number): void {
        this.gameService.onChoiceSelect(choiceIndex);
    }

    isSelected(choiceIndex: number): boolean {
        return this.gameService.selectedChoiceIndexes.includes(choiceIndex);
    }

    selectChoiceByKey(key: string): void {
        const index = parseInt(key, 10) - 1;
        if (index >= 0 && index < this.getChoices().length) {
            this.onChoiceSelect(index);
        }
    }
}
