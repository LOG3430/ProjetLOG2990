import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ROOM_ID_LENGHT } from './room.service.constants';

@Injectable()
export class RoomService {
    roomCodes: string[] = [];
    private io: Server;

    setServer(io: Server) {
        this.io = io;
    }

    createRoom(socket: Socket): string {
        const roomCode: string = this.getNewRoomCode();
        this.roomCodes.push(roomCode);
        socket.join(roomCode);
        socket.data.roomCode = roomCode;

        return roomCode;
    }

    joinRoom(roomCode: string, socket: Socket) {
        if (!this.isRoomActive(roomCode)) {
            return;
        }
        socket.join(roomCode);
        socket.data.roomCode = roomCode;
    }

    leaveRoom(roomId: string, socket: Socket) {
        if (!socket) {
            return;
        }
        socket.leave(roomId);
        socket.data = {};
    }

    leaveRoomById(roomId: string, socketId: string) {
        this.leaveRoom(roomId, this.io.sockets.sockets.get(socketId));
    }

    deleteRoom(roomId: string) {
        this.roomCodes = this.roomCodes.filter((code) => code !== roomId);
        this.io.in(roomId).socketsLeave(roomId);
    }

    getRoomId(client: Socket) {
        const roomCode = client.data.roomCode;
        return this.isRoomActive(roomCode) ? roomCode : null;
    }

    isRoomActive(roomId: string) {
        return this.roomCodes.includes(roomId);
    }

    private generateRoomCode() {
        const characters = '0123456789';
        let result = '';
        for (let i = 0; i < ROOM_ID_LENGHT; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    private getNewRoomCode() {
        let roomCode: string;
        do {
            roomCode = this.generateRoomCode();
        } while (this.isRoomActive(roomCode) || roomCode === '0000');
        return roomCode;
    }
}
