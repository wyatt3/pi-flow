import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createMockDb, resetAllMocks } from './testUtils.js';

const mockDb = createMockDb();
const mockScheduleService = {
    createSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({
    default: mockDb,
}));

jest.unstable_mockModule('../src/services/scheduleService.js', () => ({
    default: mockScheduleService,
}));

jest.unstable_mockModule('onoff', () => ({
    Gpio: jest.fn(() => ({
        writeSync: jest.fn(),
        readSync: jest.fn(),
        unexport: jest.fn(),
    })),
}));

const ScheduleController = (await import('../src/controllers/scheduleController.js')).default;
const Schedule = (await import('../src/models/schedule.js')).default;

describe('ScheduleController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        resetAllMocks(mockDb, mockScheduleService);

        mockReq = {
            params: {},
            body: {},
        };

        mockRes = {
            json: jest.fn(() => mockRes),
            status: jest.fn(() => mockRes),
        };
    });

    describe('create', () => {
        it('should create a new schedule with valid data', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                days: [1, 3, 5],
            };

            const mockZone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            const mockSchedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockZone);
            mockScheduleService.createSchedule.mockReturnValue(mockSchedule);

            ScheduleController.create(mockReq, mockRes);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM zones WHERE id = ?');
            expect(mockDb.mockGet).toHaveBeenCalledWith(1);
            expect(mockScheduleService.createSchedule).toHaveBeenCalledWith(
                expect.any(Object),
                '08:00',
                30,
                false,
                [1, 3, 5]
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(mockSchedule);
        });

        it('should return 400 if zone_id is missing', () => {
            mockReq.body = {
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                days: [1, 3, 5],
            };

            ScheduleController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'zone_id, start_time, duration_min, one_time, days required',
            });
            expect(mockScheduleService.createSchedule).not.toHaveBeenCalled();
        });

        it('should return 400 if start_time is missing', () => {
            mockReq.body = {
                zone_id: 1,
                duration_min: 30,
                one_time: false,
                days: [1, 3, 5],
            };

            ScheduleController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'zone_id, start_time, duration_min, one_time, days required',
            });
        });

        it('should return 400 if duration_min is missing', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                one_time: false,
                days: [1, 3, 5],
            };

            ScheduleController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'zone_id, start_time, duration_min, one_time, days required',
            });
        });

        it('should return 400 if one_time is null', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: null,
                days: [1, 3, 5],
            };

            ScheduleController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'zone_id, start_time, duration_min, one_time, days required',
            });
        });

        it('should return 400 if days is missing', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
            };

            ScheduleController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'zone_id, start_time, duration_min, one_time, days required',
            });
        });

        it('should accept one_time as false', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                days: [1, 3, 5],
            };

            const mockZone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            const mockSchedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
            };

            mockDb.mockGet.mockReturnValue(mockZone);
            mockScheduleService.createSchedule.mockReturnValue(mockSchedule);

            ScheduleController.create(mockReq, mockRes);

            expect(mockScheduleService.createSchedule).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if zone does not exist', () => {
            mockReq.body = {
                zone_id: 999,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                days: [1, 3, 5],
            };

            mockDb.mockGet.mockReturnValue(null);

            ScheduleController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'invalid zone_id' });
            expect(mockScheduleService.createSchedule).not.toHaveBeenCalled();
        });

        it('should handle service errors', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                days: [1, 3, 5],
            };

            const mockZone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            mockDb.mockGet.mockReturnValue(mockZone);
            mockScheduleService.createSchedule.mockImplementation(() => {
                throw new Error('Schedule overlaps with an existing schedule');
            });

            ScheduleController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('Schedule overlaps with an existing schedule');
        });

        it('should create schedule with all days selected', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                days: [0, 1, 2, 3, 4, 5, 6],
            };

            const mockZone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            const mockSchedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
            };

            mockDb.mockGet.mockReturnValue(mockZone);
            mockScheduleService.createSchedule.mockReturnValue(mockSchedule);

            ScheduleController.create(mockReq, mockRes);

            expect(mockScheduleService.createSchedule).toHaveBeenCalledWith(
                expect.any(Object),
                '08:00',
                30,
                false,
                [0, 1, 2, 3, 4, 5, 6]
            );
        });

        it('should create one-time schedule', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: true,
                days: [1],
            };

            const mockZone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            const mockSchedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: true,
            };

            mockDb.mockGet.mockReturnValue(mockZone);
            mockScheduleService.createSchedule.mockReturnValue(mockSchedule);

            ScheduleController.create(mockReq, mockRes);

            expect(mockScheduleService.createSchedule).toHaveBeenCalledWith(
                expect.any(Object),
                '08:00',
                30,
                true,
                [1]
            );
        });

        it('should handle schedule with short duration', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 1,
                one_time: false,
                days: [1],
            };

            const mockZone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            const mockSchedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 1,
                one_time: false,
            };

            mockDb.mockGet.mockReturnValue(mockZone);
            mockScheduleService.createSchedule.mockReturnValue(mockSchedule);

            ScheduleController.create(mockReq, mockRes);

            expect(mockScheduleService.createSchedule).toHaveBeenCalledWith(
                expect.any(Object),
                '08:00',
                1,
                false,
                [1]
            );
        });

        it('should handle schedule with long duration', () => {
            mockReq.body = {
                zone_id: 1,
                start_time: '08:00',
                duration_min: 180,
                one_time: false,
                days: [1],
            };

            const mockZone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            const mockSchedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 180,
                one_time: false,
            };

            mockDb.mockGet.mockReturnValue(mockZone);
            mockScheduleService.createSchedule.mockReturnValue(mockSchedule);

            ScheduleController.create(mockReq, mockRes);

            expect(mockScheduleService.createSchedule).toHaveBeenCalledWith(
                expect.any(Object),
                '08:00',
                180,
                false,
                [1]
            );
        });
    });

    describe('update', () => {
        it('should update an existing schedule', () => {
            mockReq.params = { id: '1' };
            mockReq.body = {
                start_time: '09:00',
                duration_min: 45,
                one_time: false,
                skip_next: false,
                days: [2, 4, 6],
            };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);

            ScheduleController.update(mockReq, mockRes);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM schedules WHERE id = ?');
            expect(mockDb.mockGet).toHaveBeenCalledWith('1');
            expect(mockScheduleService.updateSchedule).toHaveBeenCalledWith(
                expect.any(Schedule),
                '09:00',
                45,
                false,
                false,
                [2, 4, 6]
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.any(Schedule));
        });

        it('should update skip_next flag', () => {
            mockReq.params = { id: '1' };
            mockReq.body = {
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: true,
                days: [1, 3, 5],
            };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);

            ScheduleController.update(mockReq, mockRes);

            expect(mockScheduleService.updateSchedule).toHaveBeenCalledWith(
                expect.any(Schedule),
                '08:00',
                30,
                false,
                true,
                [1, 3, 5]
            );
        });

        it('should handle schedule not found', () => {
            mockReq.params = { id: '999' };
            mockReq.body = {
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                days: [1],
            };

            mockDb.mockGet.mockReturnValue(null);

            expect(() => {
                ScheduleController.update(mockReq, mockRes);
            }).toThrow();
        });

        it('should handle service errors', () => {
            mockReq.params = { id: '1' };
            mockReq.body = {
                start_time: '09:00',
                duration_min: 45,
                one_time: false,
                skip_next: false,
                days: [1],
            };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);
            mockScheduleService.updateSchedule.mockImplementation(() => {
                throw new Error('Update failed');
            });

            ScheduleController.update(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('Update failed');
        });

        it('should update to one-time schedule', () => {
            mockReq.params = { id: '1' };
            mockReq.body = {
                start_time: '08:00',
                duration_min: 30,
                one_time: true,
                skip_next: false,
                days: [1],
            };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);

            ScheduleController.update(mockReq, mockRes);

            expect(mockScheduleService.updateSchedule).toHaveBeenCalledWith(
                expect.any(Schedule),
                '08:00',
                30,
                true,
                false,
                [1]
            );
        });

        it('should update schedule days', () => {
            mockReq.params = { id: '1' };
            mockReq.body = {
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                days: [0, 6],
            };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);

            ScheduleController.update(mockReq, mockRes);

            expect(mockScheduleService.updateSchedule).toHaveBeenCalledWith(
                expect.any(Schedule),
                '08:00',
                30,
                false,
                false,
                [0, 6]
            );
        });
    });

    describe('delete', () => {
        it('should delete a schedule', () => {
            mockReq.params = { id: '1' };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);

            ScheduleController.delete(mockReq, mockRes);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM schedules WHERE id = ?');
            expect(mockDb.mockGet).toHaveBeenCalledWith('1');
            expect(mockScheduleService.deleteSchedule).toHaveBeenCalledWith(expect.any(Schedule));
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.json).toHaveBeenCalledWith();
        });

        it('should handle schedule not found', () => {
            mockReq.params = { id: '999' };
            mockDb.mockGet.mockReturnValue(null);

            expect(() => {
                ScheduleController.delete(mockReq, mockRes);
            }).toThrow();
        });

        it('should handle service errors', () => {
            mockReq.params = { id: '1' };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);
            mockScheduleService.deleteSchedule.mockImplementation(() => {
                throw new Error('Delete failed');
            });

            ScheduleController.delete(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith('Delete failed');
        });

        it('should delete schedule with string id', () => {
            mockReq.params = { id: '42' };

            const mockScheduleData = {
                id: 42,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);

            ScheduleController.delete(mockReq, mockRes);

            expect(mockDb.mockGet).toHaveBeenCalledWith('42');
            expect(mockScheduleService.deleteSchedule).toHaveBeenCalled();
        });

        it('should delete running schedule', () => {
            mockReq.params = { id: '1' };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                status: 'running',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);

            ScheduleController.delete(mockReq, mockRes);

            expect(mockScheduleService.deleteSchedule).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'running' })
            );
        });

        it('should delete one-time schedule', () => {
            mockReq.params = { id: '1' };

            const mockScheduleData = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: true,
                skip_next: false,
                status: 'scheduled',
            };

            mockDb.mockGet.mockReturnValue(mockScheduleData);

            ScheduleController.delete(mockReq, mockRes);

            expect(mockScheduleService.deleteSchedule).toHaveBeenCalledWith(
                expect.objectContaining({ one_time: true })
            );
        });
    });
});
