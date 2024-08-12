import { TestBed } from '@angular/core/testing';
import { SocketCommunicationService } from './socket-communication.service';
import { WebSocketEvents } from '@common/websockets/events/websocket-events.enum';

describe('SocketCommunicationService', () => {
    let service: SocketCommunicationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SocketCommunicationService],
        });
        service = TestBed.inject(SocketCommunicationService);
        service.connect();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have a socket', () => {
        expect(service.socket).toBeDefined();
    });

    describe('isSocketAlive', () => {
        it('should return true if there is a socket and it is connected', () => {
            service.socket.connected = true;
            expect(service.isSocketAlive()).toBeTrue();
        });
    });

    describe('connect', () => {
        it('should connect if the socket is not alive', () => {
            expect(service.socket).toBeDefined();
            const initialSocket = service.socket.connect();
            spyOn(service, 'isSocketAlive').and.returnValue(false);
            service.connect();
            expect(service.isSocketAlive).toHaveBeenCalled();
            expect(service.socket).not.toBe(initialSocket);
        });
        it('should not connect if the socket is alive', () => {
            expect(service.socket).toBeDefined();
            const initialSocket = service.socket.connect();
            spyOn(service, 'isSocketAlive').and.returnValue(true);
            service.connect();
            expect(service.isSocketAlive).toHaveBeenCalled();
            expect(service.socket).toBe(initialSocket);
        });
    });

    describe('disconnect', () => {
        it('should disconnect the socket', () => {
            spyOn(service.socket, 'disconnect');
            service.disconnect();
            expect(service.socket.disconnect).toHaveBeenCalled();
        });
    });

    describe('on', () => {
        it('should call the on event with the event and action given', () => {
            spyOn(service.socket, 'on');

            const testEvent = WebSocketEvents.ActionButton;
            const actionSpy = jasmine.createSpy('action');

            service.on(testEvent, actionSpy);

            expect(service.socket.on).toHaveBeenCalledWith(testEvent, actionSpy);
        });
    });

    describe('send', () => {
        it('should call emit with the given event and data ', () => {
            spyOn(service.socket, 'emit');

            const testEvent = WebSocketEvents.ActionButton;

            service.send(testEvent);

            expect(service.socket.emit).toHaveBeenCalledWith(testEvent);
        });
    });
});
