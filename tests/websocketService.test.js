import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createMockDb, resetAllMocks } from './testUtils.js';

const mockDb = createMockDb();

const mockSocket = {
    id: 'test-socket-id'
};

const mockIo = {
    on: jest.fn(),
    emit: jest.fn(),
};

const MockIOServer = jest.fn(() => mockIo);

jest.unstable_mockModule('../src/config/db.js', () => ({
    default: mockDb,
}));

jest.unstable_mockModule('socket.io', () => ({
    Server: MockIOServer,
}));

jest.unstable_mockModule('onoff', () => ({
    Gpio: jest.fn(() => ({
        writeSync: jest.fn(),
        readSync: jest.fn(),
        unexport: jest.fn(),
    })),
}));

const websocketService = (await import('../src/services/websocketService.js')).default;
const Zone = (await import('../src/models/zone.js')).default;

describe('websocketService', () => {
    beforeEach(() => {
        resetAllMocks(mockDb);
        mockIo.on.mockClear();
        mockIo.emit.mockClear();
        MockIOServer.mockClear();
        websocketService.io = null;
    });

    describe('initSocket', () => {
        it('should initialize socket.io server with CORS', () => {
            const mockServer = {};

            const result = websocketService.initSocket(mockServer);

            expect(MockIOServer).toHaveBeenCalledWith(mockServer, { cors: { origin: '*' } });
            expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
            expect(result).toBe(mockIo);
        });

        it('should return existing io instance if already initialized', () => {
            const mockServer1 = {};
            const mockServer2 = {};

            const result1 = websocketService.initSocket(mockServer1);
            const result2 = websocketService.initSocket(mockServer2);

            expect(MockIOServer).toHaveBeenCalledTimes(1);
            expect(result1).toBe(result2);
        });

        it('should log socket connection', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const mockServer = {};

            websocketService.initSocket(mockServer);

            const connectionCallback = mockIo.on.mock.calls[0][1];
            connectionCallback(mockSocket);

            expect(consoleSpy).toHaveBeenCalledWith('Socket connected', 'test-socket-id');
            consoleSpy.mockRestore();
        });
    });

    describe('broadcastUpdate', () => {
        it('should emit update with zones when io is initialized', () => {
            const mockZones = [
                { id: 1, name: 'Zone A', gpio_pin: 17, active: 0 },
                { id: 2, name: 'Zone B', gpio_pin: 27, active: 1 },
            ];

            mockDb.mockAll.mockReturnValue(mockZones);

            websocketService.initSocket({});

            websocketService.broadcastUpdate();

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM zones ORDER BY name');
            expect(mockDb.mockAll).toHaveBeenCalled();
            expect(mockIo.emit).toHaveBeenCalledWith('update', expect.arrayContaining([
                expect.any(Zone),
                expect.any(Zone),
            ]));
        });

        it('should not emit when io is not initialized', () => {
            websocketService.io = null;

            websocketService.broadcastUpdate();

            expect(mockIo.emit).not.toHaveBeenCalled();
        });

        it('should handle empty zones list', () => {
            mockDb.mockAll.mockReturnValue([]);

            websocketService.initSocket({});

            websocketService.broadcastUpdate();

            expect(mockIo.emit).toHaveBeenCalledWith('update', []);
        });
    });
});
