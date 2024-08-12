import { Component, Input } from '@angular/core';
import { ORGANIZER_NAME } from '@app/constants/common/organizer.constants';
import { ChatService } from '@app/services/chat-client/chat-client.service';
import { GameService } from '@app/services/game/game.service';
import { PlayersService } from '@app/services/players/players.service';
import { GameState } from '@common/enums/game-state.enum';

@Component({
    selector: 'app-player-list-element',
    templateUrl: './player-list-element.component.html',
    styleUrls: ['./player-list-element.component.scss'],
})
export class PlayerListElementComponent {
    @Input() name: string;
    @Input() score: number;
    @Input() hasLeft: boolean = false;
    @Input() rank: number;
    @Input() bonusTimes: number;
    @Input() isMuted: boolean;
    @Input() hasLockedAnswer: boolean;
    @Input() hasInteracted: boolean;

    constructor(
        private playersService: PlayersService,
        private gameService: GameService,
        private chatService: ChatService,
    ) {}

    banPlayer() {
        this.playersService.banPlayer(this.name);
    }
    getIsOrganizer(): boolean {
        return this.gameService.getIsOrganizer();
    }

    getRankClass(): string {
        if (this.rank > 3 || !this.getIsInGame()) {
            return '';
        } else if (this.getIsInQuizResults()) {
            return `rank-${this.rank}-end`;
        }
        return `rank-${this.rank}`;
    }

    isNeutralColor(): boolean {
        return (
            this.gameService.getGameState() === GameState.WaitingRoom || (this.gameService.getGameState() === GameState.QuizResults && this.rank > 3)
        );
    }

    getIsInGame(): boolean {
        return this.gameService.getGameState() !== GameState.WaitingRoom;
    }

    getIsInQuizResults(): boolean {
        return this.gameService.getGameState() === GameState.QuizResults;
    }

    showGavelIcon(): boolean {
        return this.getIsOrganizer() && !this.getIsInGame() && this.name !== ORGANIZER_NAME;
    }

    showMuteIcon(): boolean {
        return (
            this.getIsOrganizer() &&
            this.name !== ORGANIZER_NAME &&
            !this.gameService.isRandomMode &&
            this.gameService.getGameState() !== GameState.QuizResults
        );
    }

    toggleMute(): void {
        this.chatService.toggleMute({ name: this.name });
    }
}
