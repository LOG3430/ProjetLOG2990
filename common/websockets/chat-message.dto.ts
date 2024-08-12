export interface ChatMessageReq {
    message: string;
}

export interface ChatMessageRes {
    playerName: string;
    message: string;
    date: Date;
}
