import { ChatMessageRes } from "./chat-message.dto";

export interface MuteReq {
    name: string;
}

export interface MuteRes {
    name: string;
    message: ChatMessageRes;
    isMuted: boolean;
}