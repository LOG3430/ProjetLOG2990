import { Component, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-player-list-box',
    templateUrl: './player-list-box.component.html',
    styleUrls: ['./player-list-box.component.scss'],
})
export class PlayerListBoxComponent implements OnInit, OnDestroy {
    isPlayerListVisible: boolean;
    private quizResultSubscription: Subscription = new Subscription();

    constructor(private gameService: GameService) {}

    ngOnInit() {
        this.startSubscription();
        if (!this.gameService.getIsOrganizer()) {
            this.isPlayerListVisible = true;
        }
    }

    ngOnDestroy() {
        this.stopSubscription();
    }

    togglePlayerListVisibility(): void {
        this.isPlayerListVisible = !this.isPlayerListVisible;
    }

    startSubscription() {
        this.quizResultSubscription = this.gameService.quizResult$.subscribe(() => {
            this.isPlayerListVisible = true;
        });
    }

    stopSubscription() {
        this.quizResultSubscription.unsubscribe();
    }
}
