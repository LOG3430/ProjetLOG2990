import { ConnectToGameErrorType } from '@common/enums/connect-to-game-error-type.enum';

export interface ConnectionReq {
    roomId: string;
    playerName: string;
}

export interface ConnectionRes {
    success: boolean;
    errorType?: ConnectToGameErrorType;
}
