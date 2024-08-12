import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';

export class SocketServiceMock {
    // keep a generic type of Function for the eventHandlers, used for tests only
    /* eslint-disable @typescript-eslint/ban-types*/
    eventHandlers: Map<WebSocketEvents, Function[]> = new Map();
    callbacks: Map<WebSocketEvents, Function> = new Map();

    send<T, G>(event: WebSocketEvents, data?: T, callback?: (arg: G) => void): void {
        this.emit(event, ...[data, callback].filter((x) => x));
        if (callback) {
            this.callbacks.set(event, callback);
        }
    }

    emit(event: WebSocketEvents, ...args: unknown[]): void {
        const functions = this.eventHandlers.get(event);
        if (functions !== undefined) {
            functions.forEach((handler) => handler(...args));
        }
    }

    on(event: WebSocketEvents, handler: Function): void {
        let functions = this.eventHandlers.get(event);
        if (!functions) {
            this.eventHandlers.set(event, []);
            functions = this.eventHandlers.get(event);
        } else {
            functions.push(handler);
        }
    }
}
