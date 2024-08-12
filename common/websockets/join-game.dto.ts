import { GameState } from '@common/enums/game-state.enum';

export interface JoinGameRes {
    quizTitle: string;
    isTestingMode: boolean;
    isRandomMode: boolean;
    isOrganizer: boolean;
    gameState: GameState;
    playerName: string;
    roomId: string;
}
