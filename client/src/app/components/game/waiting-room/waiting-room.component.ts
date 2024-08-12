import { Component } from '@angular/core';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-waiting-room',
    templateUrl: './waiting-room.component.html',
    styleUrls: ['./waiting-room.component.scss'],
})
export class WaitingRoomComponent {
    roomId: string;
    isChatHidden: boolean;

    constructor(private gameService: GameService) {
        this.roomId = this.gameService.getRoomId();
    }

    getIsOrganizer(): boolean {
        return this.gameService.getIsOrganizer();
    }

    canStartQuiz(): boolean {
        return this.gameService.canStartQuiz();
    }

    startTheQuiz(): void {
        this.gameService.actionButton();
    }

    getTooltipMessage(): string {
        return this.gameService.getTooltipGameStartMessage();
    }

    toggleLockRoom(): void {
        this.gameService.onLockRoom();
    }

    getIsRoomLocked(): boolean {
        return this.gameService.getIsRoomLocked();
    }
}
