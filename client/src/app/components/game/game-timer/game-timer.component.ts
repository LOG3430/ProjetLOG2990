import { Component } from '@angular/core';
import { PERCENTAGE } from '@app/constants/game-footer.component.constants';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-game-timer',
    templateUrl: './game-timer.component.html',
    styleUrls: ['./game-timer.component.scss'],
})
export class GameTimerComponent {
    constructor(private gameService: GameService) {}

    getQuizTitle(): string {
        return this.gameService.getQuizTitle();
    }

    getSpinnerValue(): number {
        return (this.gameService.getTime() * PERCENTAGE) / this.gameService.getDuration();
    }

    getRemainingTime(): number {
        return this.gameService.getTime();
    }
}
