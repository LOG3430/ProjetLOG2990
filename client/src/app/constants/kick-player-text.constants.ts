import { KickPlayerReason } from '@common/enums/kick-player-reason.enum';

export const KICK_PLAYER_TEXT = new Map<KickPlayerReason, string>([
    [KickPlayerReason.AllPlayersLeft, 'Tous les joueurs ont quitté la partie'],
    [KickPlayerReason.GameEnded, 'La partie est terminée'],
    [KickPlayerReason.OrganizerLeft, "L'organisateur a quitté la partie"],
    [KickPlayerReason.PlayerBanned, 'Vous avez été banni de la partie'],
]);
