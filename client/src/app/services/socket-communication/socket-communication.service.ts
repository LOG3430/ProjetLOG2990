import { Injectable } from '@angular/core';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketCommunicationService {
    socket: Socket;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        if (!this.isSocketAlive()) {
            this.socket = io(environment.webSocketUrl).connect();
        }
    }

    disconnect() {
        this.socket.disconnect();
    }

    on<T>(event: WebSocketEvents, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    send<T, G>(event: WebSocketEvents, data?: T, callback?: (arg: G) => void): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
