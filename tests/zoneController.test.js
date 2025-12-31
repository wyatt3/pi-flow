import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createMockDb, resetAllMocks } from './testUtils.js';

const mockDb = createMockDb();
const mockZoneService = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
};
const mockPinToLineMap = {
    17: 0,
    27: 2,
    22: 3,
};

jest.unstable_mockModule('../src/config/db.js', () => ({
    default: mockDb,
}));

jest.unstable_mockModule('../src/services/zoneService.js', () => ({
    default: mockZoneService,
}));

jest.unstable_mockModule('../src/config/pinToLineMap.js', () => ({
    default: mockPinToLineMap,
}));

jest.unstable_mockModule('onoff', () => ({
    Gpio: jest.fn(() => ({
        writeSync: jest.fn(),
        readSync: jest.fn(),
        unexport: jest.fn(),
    })),
}));

const ZoneController = (await import('../src/controllers/zoneController.js')).default;
const Zone = (await import('../src/models/zone.js')).default;

describe('ZoneController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        resetAllMocks(mockDb, mockZoneService);

        mockReq = {
            params: {},
            body: {},
        };

        mockRes = {
            json: jest.fn(() => mockRes),
            status: jest.fn(() => mockRes),
        };
    });

    describe('getAll', () => {
        it('should return all zones ordered by name', () => {
            const mockZones = [
                { id: 1, name: 'Zone A', gpio_pin: 17, active: 0 },
                { id: 2, name: 'Zone B', gpio_pin: 27, active: 1 },
                { id: 3, name: 'Zone C', gpio_pin: 22, active: 0 },
            ];

            mockDb.mockAll.mockReturnValue(mockZones);

            ZoneController.getAll(mockReq, mockRes);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM zones ORDER BY name');
            expect(mockDb.mockAll).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(expect.arrayContaining([
                expect.any(Zone),
                expect.any(Zone),
                expect.any(Zone),
            ]));
        });

        it('should return empty array when no zones exist', () => {
            mockDb.mockAll.mockReturnValue([]);

            ZoneController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith([]);
        });

        it('should handle zones that fail to instantiate', () => {
            const mockZones = [
                { id: 1, name: 'Zone A', gpio_pin: 17, active: 0 },
                null
            ];

            mockDb.mockAll.mockReturnValueOnce(mockZones);

            ZoneController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled();
            const result = mockRes.json.mock.calls[0][0];
            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(Zone);
            expect(result[1]).toBe(null);
        });
    });

    describe('create', () => {
        it('should create a new zone with valid data', () => {
            mockReq.body = { name: 'New Zone', gpio_pin: 17 };
            const mockZone = { id: 1, name: 'New Zone', gpio_pin: 17, active: 1 };
            mockZoneService.create.mockReturnValue(mockZone);

            ZoneController.create(mockReq, mockRes);

            expect(mockZoneService.create).toHaveBeenCalledWith('New Zone', 17);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(mockZone);
        });

        it('should return 400 if name is missing', () => {
            mockReq.body = { gpio_pin: 17 };

            ZoneController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('name & gpio_pin required');
            expect(mockZoneService.create).not.toHaveBeenCalled();
        });

        it('should return 400 if gpio_pin is missing', () => {
            mockReq.body = { name: 'New Zone' };

            ZoneController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('name & gpio_pin required');
            expect(mockZoneService.create).not.toHaveBeenCalled();
        });

        it('should return 400 if gpio_pin is invalid', () => {
            mockReq.body = { name: 'New Zone', gpio_pin: 999 };

            ZoneController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('Invalid GPIO pin');
            expect(mockZoneService.create).not.toHaveBeenCalled();
        });

        it('should accept gpio_pin 0', () => {
            mockPinToLineMap[0] = 0;
            mockReq.body = { name: 'New Zone', gpio_pin: 0 };
            const mockZone = { id: 1, name: 'New Zone', gpio_pin: 0, active: 1 };
            mockZoneService.create.mockReturnValue(mockZone);

            ZoneController.create(mockReq, mockRes);

            expect(mockZoneService.create).toHaveBeenCalledWith('New Zone', 0);
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should handle service errors', () => {
            mockReq.body = { name: 'New Zone', gpio_pin: 17 };
            mockZoneService.create.mockImplementation(() => {
                throw new Error('Zone creation failed');
            });

            ZoneController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('Zone creation failed');
        });

        it('should accept all valid GPIO pins', () => {
            const validPins = [17, 27, 22];

            validPins.forEach((pin, index) => {
                mockReq.body = { name: `Zone ${pin}`, gpio_pin: pin };
                const mockZone = { id: index + 1, name: `Zone ${pin}`, gpio_pin: pin, active: 1 };
                mockZoneService.create.mockReturnValue(mockZone);

                ZoneController.create(mockReq, mockRes);

                expect(mockZoneService.create).toHaveBeenCalledWith(`Zone ${pin}`, pin);
                expect(mockRes.status).toHaveBeenCalledWith(201);
            });
        });
    });

    describe('update', () => {
        it('should update zone active status', () => {
            mockReq.params = { id: '1' };
            mockReq.body = { active: 0 };
            const mockZoneData = { id: 1, name: 'Test Zone', gpio_pin: 17, active: 1 };
            const updatedZone = { ...mockZoneData, active: 0 };

            mockDb.mockGet.mockReturnValue(mockZoneData);
            mockZoneService.save.mockReturnValue(updatedZone);

            ZoneController.update(mockReq, mockRes);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM zones WHERE id = ?');
            expect(mockDb.mockGet).toHaveBeenCalledWith('1');
            expect(mockZoneService.save).toHaveBeenCalledWith(expect.any(Zone), 0);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(updatedZone);
        });

        it('should activate zone when active is 1', () => {
            mockReq.params = { id: '1' };
            mockReq.body = { active: 1 };
            const mockZoneData = { id: 1, name: 'Test Zone', gpio_pin: 17, active: 0 };
            const updatedZone = { ...mockZoneData, active: 1 };

            mockDb.mockGet.mockReturnValue(mockZoneData);
            mockZoneService.save.mockReturnValue(updatedZone);

            ZoneController.update(mockReq, mockRes);

            expect(mockZoneService.save).toHaveBeenCalledWith(expect.any(Zone), 1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should handle zone not found', () => {
            mockReq.params = { id: '999' };
            mockReq.body = { active: 0 };
            mockDb.mockGet.mockReturnValue(null);

            expect(() => {
                ZoneController.update(mockReq, mockRes);
            }).toThrow();
        });

        it('should handle service errors', () => {
            mockReq.params = { id: '1' };
            mockReq.body = { active: 0 };
            const mockZoneData = { id: 1, name: 'Test Zone', gpio_pin: 17, active: 1 };

            mockDb.mockGet.mockReturnValue(mockZoneData);
            mockZoneService.save.mockImplementation(() => {
                throw new Error('Update failed');
            });

            ZoneController.update(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('Update failed');
        });

        it('should convert string active value to number', () => {
            mockReq.params = { id: '1' };
            mockReq.body = { active: '0' };
            const mockZoneData = { id: 1, name: 'Test Zone', gpio_pin: 17, active: 1 };
            const updatedZone = { ...mockZoneData, active: 0 };

            mockDb.mockGet.mockReturnValue(mockZoneData);
            mockZoneService.save.mockReturnValue(updatedZone);

            ZoneController.update(mockReq, mockRes);

            expect(mockZoneService.save).toHaveBeenCalledWith(expect.any(Zone), 0);
        });
    });

    describe('delete', () => {
        it('should delete a zone', () => {
            mockReq.params = { id: '1' };
            const mockZoneData = { id: 1, name: 'Test Zone', gpio_pin: 17, active: 0 };

            mockDb.mockGet.mockReturnValue(mockZoneData);

            ZoneController.delete(mockReq, mockRes);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM zones WHERE id = ?');
            expect(mockDb.mockGet).toHaveBeenCalledWith('1');
            expect(mockZoneService.delete).toHaveBeenCalledWith(expect.any(Zone));
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.json).toHaveBeenCalledWith();
        });

        it('should handle zone not found', () => {
            mockReq.params = { id: '999' };
            mockDb.mockGet.mockReturnValue(null);

            expect(() => {
                ZoneController.delete(mockReq, mockRes);
            }).toThrow();
        });

        it('should handle service errors', () => {
            mockReq.params = { id: '1' };
            const mockZoneData = { id: 1, name: 'Test Zone', gpio_pin: 17, active: 0 };

            mockDb.mockGet.mockReturnValue(mockZoneData);
            mockZoneService.delete.mockImplementation(() => {
                throw new Error('Delete failed');
            });

            ZoneController.delete(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('Delete failed');
        });

        it('should delete zone with string id', () => {
            mockReq.params = { id: '42' };
            const mockZoneData = { id: 42, name: 'Test Zone', gpio_pin: 17, active: 0 };

            mockDb.mockGet.mockReturnValue(mockZoneData);

            ZoneController.delete(mockReq, mockRes);

            expect(mockDb.mockGet).toHaveBeenCalledWith('42');
            expect(mockZoneService.delete).toHaveBeenCalled();
        });

        it('should handle deleting active zone', () => {
            mockReq.params = { id: '1' };
            const mockZoneData = { id: 1, name: 'Test Zone', gpio_pin: 17, active: 0 };

            mockDb.mockGet.mockReturnValue(mockZoneData);

            ZoneController.delete(mockReq, mockRes);

            expect(mockZoneService.delete).toHaveBeenCalledWith(expect.objectContaining({
                active: 0
            }));
        });
    });
});
