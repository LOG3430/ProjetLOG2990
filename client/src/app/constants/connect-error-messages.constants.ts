import { ConnectToGameErrorType } from '@common/enums/connect-to-game-error-type.enum';

export const CONNECT_ERROR_MESSAGE = new Map<ConnectToGameErrorType, string>([
    [ConnectToGameErrorType.RoomLocked, 'La salle est verrouillée'],
    [ConnectToGameErrorType.BannedName, 'Ce nom est banni'],
    [ConnectToGameErrorType.InvalidGame, "La salle n'existe pas"],
    [ConnectToGameErrorType.NameTaken, 'Ce nom est déjà pris'],
]);
