import { Component } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/player-info';
import { GameService } from '@app/services/game/game.service';
import { PlayersService } from '@app/services/players/players.service';
import { GameState } from '@common/enums/game-state.enum';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent {
    selectedSortOrder: string = 'scoreDesc';
    sortOrders = [
        { value: 'scoreDesc', text: 'Score descendant', icon: 'arrow_downward' },
        { value: 'scoreAsc', text: 'Score ascendant', icon: 'arrow_upward' },
        { value: 'stateDesc', text: 'En jeu en premier', icon: 'sports_esports' },
        { value: 'stateAsc', text: 'Déconnexions en premier', icon: 'logout' },
        { value: 'alphabeticalDown', text: 'Alphabétique Descendant', icon: 'text_decrease' },
        { value: 'alphabeticalUp', text: 'Alphabétique Ascendant', icon: 'text_increase' },
    ];

    constructor(
        private playersService: PlayersService,
        private gameService: GameService,
    ) {}

    changeSortOrder(sortOrder: string) {
        this.selectedSortOrder = sortOrder;
        switch (sortOrder) {
            case 'scoreDesc':
                this.orderByScoreDesc();
                break;
            case 'scoreAsc':
                this.orderByScoreAsc();
                break;
            case 'stateDesc':
                this.orderByPlayerStateDesc();
                break;
            case 'stateAsc':
                this.orderByPlayerStateAsc();
                break;
            case 'alphabeticalDown':
                this.orderAlphabeticallyDesc();
                break;
            case 'alphabeticalUp':
                this.orderAlphabeticallyAsc();
                break;
            default:
                break;
        }
    }

    getPlayerList(): PlayerInfo[] {
        return this.playersService.playerList;
    }

    getIsInGame(): boolean {
        return this.gameService.getGameState() !== GameState.WaitingRoom;
    }

    getPlayerRank(playerName: string): number {
        return [...this.playersService.playerList].sort((a, b) => b.score - a.score).findIndex((player) => playerName === player.name) + 1;
    }

    getIsOrganizer(): boolean {
        return this.gameService.getIsOrganizer();
    }

    orderByScoreAsc(): void {
        this.playersService.orderByScore(false);
    }

    orderByScoreDesc(): void {
        this.playersService.orderByScore(true);
    }

    orderByPlayerStateDesc(): void {
        this.playersService.orderByPlayerState(true);
    }
    orderByPlayerStateAsc(): void {
        this.playersService.orderByPlayerState(false);
    }
    orderAlphabeticallyAsc(): void {
        this.playersService.orderAlphabeticallyInGame(false);
    }
    orderAlphabeticallyDesc(): void {
        this.playersService.orderAlphabeticallyInGame(true);
    }
}
