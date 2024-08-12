import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-results-page',
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss'],
})
export class ResultsPageComponent {
    constructor(
        private gameService: GameService,
        private router: Router,
    ) {
        if (!this.gameService.question) {
            this.router.navigate([AppRoutes.Home]);
        }
    }

    getScore() {
        return this.gameService.playerScore;
    }

    getRankText(): string {
        return this.gameService.rank === 0 ? '1er' : `${this.gameService.rank + 1}ième`;
    }

    leaveResultsPage(): void {
        this.gameService.handleLeaveGame();
        this.gameService.navigateExit();
    }

    showResults(): boolean {
        return !this.gameService.getIsOrganizer();
    }
}
