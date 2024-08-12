import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';

// any and magic numbers used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-magic-numbers */

const mockSocket: Socket = {
    data: {},
    join: jest.fn(),
    leave: jest.fn(),
} as unknown as Socket;

const mockServer: Server = {
    sockets: { sockets: new Map([['socket', mockSocket]]) },
    in: () => mockServer,
    socketsLeave: jest.fn(),
} as unknown as Server;

describe('RoomService', () => {
    let roomService: RoomService;

    beforeEach(() => {
        roomService = new RoomService();
        mockSocket.data = {};
        roomService.setServer(mockServer);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('setServer', () => {
        it('should set the server', () => {
            roomService.setServer(mockServer);
            expect(roomService['io']).toEqual(mockServer);
        });
    });

    describe('createRoom', () => {
        it('should create a room', () => {
            const mockNewRoomCode = '1234';
            jest.spyOn(roomService as any, 'getNewRoomCode').mockReturnValueOnce(mockNewRoomCode);

            const result = roomService.createRoom(mockSocket);

            expect(roomService.roomCodes).toContain(mockNewRoomCode);
            expect(mockSocket.join).toHaveBeenCalledWith(mockNewRoomCode);
            expect(mockSocket.data.roomCode).toEqual(mockNewRoomCode);
            expect(result).toEqual(mockNewRoomCode);
        });
    });

    describe('joinRoom', () => {
        it('should join a room if room exists', () => {
            const mockRoomCode = '1234';
            roomService.roomCodes.push(mockRoomCode);

            roomService.joinRoom(mockRoomCode, mockSocket);

            expect(mockSocket.join).toHaveBeenCalledWith(mockRoomCode);
            expect(mockSocket.data.roomCode).toEqual(mockRoomCode);
        });

        it('should not join a room if room does not exist', () => {
            const mockRoomCode = '1234';

            roomService.joinRoom(mockRoomCode, mockSocket);

            expect(mockSocket.join).not.toHaveBeenCalled();
            expect(mockSocket.data.roomCode).toBeUndefined();
        });
    });

    describe('leaveRoom', () => {
        it('should leave a room', () => {
            const mockRoomId = '1234';
            mockSocket.data.roomCode = mockRoomId;

            roomService.leaveRoom(mockRoomId, mockSocket);

            expect(mockSocket.leave).toHaveBeenCalledWith(mockRoomId);
            expect(mockSocket.data).toEqual({});
        });

        it('should do nothing if socket is undefined', () => {
            const mockRoomId = '1234';
            roomService.leaveRoom(mockRoomId, undefined);
        });
    });

    describe('deleteRoom', () => {
        it('should delete a room', () => {
            const mockRoomId = '1234';
            roomService.roomCodes.push(mockRoomId);
            roomService.deleteRoom(mockRoomId);

            expect(roomService.roomCodes).not.toContain(mockRoomId);
            expect(mockServer.socketsLeave).toHaveBeenCalledWith(mockRoomId);
        });
    });

    describe('leaveRoomById', () => {
        it('should leave a room by ID', () => {
            const mockRoomId = '1234';
            const mockSocketId = 'socket';
            roomService.leaveRoomById(mockRoomId, mockSocketId);
            expect(mockSocket.leave).toHaveBeenCalledWith(mockRoomId);
        });
    });

    describe('getRoomId', () => {
        it('should return room ID if client is in a room', () => {
            const mockRoomId = 'room123';
            mockSocket.data.roomCode = mockRoomId;
            roomService.roomCodes.push(mockRoomId);

            const result = roomService.getRoomId(mockSocket);

            expect(result).toEqual(mockRoomId);
        });

        it('should return null if client is not in a room', () => {
            const result = roomService.getRoomId(mockSocket);

            expect(result).toBeNull();
        });
    });

    describe('generateRoomCode', () => {
        it('should generate a room code of the specified length', () => {
            const roomCode = roomService['generateRoomCode']();
            expect(roomCode.length).toBe(4);
        });

        it('should generate a unique room code each time', () => {
            const roomCode1 = roomService['generateRoomCode']();
            const roomCode2 = roomService['generateRoomCode']();
            expect(roomCode1).not.toEqual(roomCode2);
        });
    });

    describe('getNewRoomCode', () => {
        it('should return the generated code if unique', () => {
            const mockNewRoomCode = '1234';
            jest.spyOn(roomService as any, 'generateRoomCode').mockReturnValueOnce(mockNewRoomCode);

            const roomCode = roomService['getNewRoomCode']();
            expect(roomCode).toEqual(mockNewRoomCode);
        });

        it('should generate a new code if code is not unique', () => {
            const mockNewRoomCode1 = '1234';
            const mockNewRoomCode2 = '2345';
            roomService.roomCodes.push(mockNewRoomCode1);
            jest.spyOn(roomService as any, 'generateRoomCode')
                .mockReturnValueOnce(mockNewRoomCode1)
                .mockReturnValueOnce(mockNewRoomCode2);

            const roomCode = roomService['getNewRoomCode']();
            expect(roomCode).toEqual(mockNewRoomCode2);
        });

        it('should generate a new code if code is 0000', () => {
            jest.spyOn(roomService as any, 'generateRoomCode')
                .mockReturnValueOnce('0000')
                .mockReturnValueOnce('1234');

            const roomCode = roomService['getNewRoomCode']();
            expect(roomCode).toEqual('1234');
        });
    });
});
