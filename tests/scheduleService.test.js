import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createMockDb, createMockWebsocketService, resetAllMocks } from './testUtils.js';

const mockDb = createMockDb();
const mockWebsocketService = createMockWebsocketService();
const mockZoneService = {
    save: jest.fn(),
};

const mockMoment = jest.fn(() => ({
    tz: jest.fn(() => ({
        format: jest.fn(() => '12:00'),
        day: jest.fn(() => 1),
    })),
}));
mockMoment.tz = jest.fn(() => ({
    format: jest.fn(() => '2024-01-01 12:00'),
}));

jest.unstable_mockModule('../src/config/db.js', () => ({
    default: mockDb,
}));

jest.unstable_mockModule('../src/services/websocketService.js', () => ({
    default: mockWebsocketService,
}));

jest.unstable_mockModule('../src/services/zoneService.js', () => ({
    default: mockZoneService,
}));

jest.unstable_mockModule('moment-timezone', () => ({
    default: mockMoment,
}));

process.env.TIMEZONE = 'America/New_York';

const ScheduleService = (await import('../src/services/scheduleService.js')).default;
const Schedule = (await import('../src/models/schedule.js')).default;
const Zone = (await import('../src/models/zone.js')).default;

describe('ScheduleService', () => {
    beforeEach(() => {
        resetAllMocks(mockDb, mockWebsocketService, mockZoneService);
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('createSchedule', () => {
        it('should create a new schedule with valid data', () => {
            const zone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            mockDb.mockRun.mockReturnValue({ lastInsertRowid: 1 });
            mockDb.mockAll.mockReturnValue([]);

            const schedule = ScheduleService.createSchedule(zone, '08:00', 30, false, [1, 3, 5]);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO schedules')
            );
            expect(mockDb.mockRun).toHaveBeenCalledWith(1, '08:00', 30, 0);
            expect(schedule).toBeInstanceOf(Schedule);
            expect(schedule.start_time).toBe('08:00');
            expect(schedule.duration_min).toBe(30);
            expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
        });

        it('should set schedule days correctly', () => {
            const zone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            mockDb.mockRun.mockReturnValue({ lastInsertRowid: 1 });
            mockDb.mockAll.mockReturnValue([]);
            const days = [0, 2, 4, 6];

            ScheduleService.createSchedule(zone, '08:00', 30, false, days);

            expect(mockDb.mockRun).toHaveBeenCalledWith(1);
            days.forEach(day => {
                expect(mockDb.mockRun).toHaveBeenCalledWith(1, day);
            });
        });

        it('should handle one-time schedules', () => {
            const zone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            mockDb.mockRun.mockReturnValue({ lastInsertRowid: 1 });
            mockDb.mockAll.mockReturnValue([]);

            const schedule = ScheduleService.createSchedule(zone, '08:00', 30, true, [1]);

            expect(mockDb.mockRun).toHaveBeenCalledWith(1, '08:00', 30, 1);
            expect(schedule.one_time).toBe(true);
        });

        it('should throw error on overlapping schedules', () => {
            const zone = { id: 1, name: 'Test Zone', gpio_pin: 17 };
            mockDb.mockAll.mockReturnValue([
                { id: 2, start_time: '08:00', duration_min: 60, day: 1 }
            ]);

            expect(() => {
                ScheduleService.createSchedule(zone, '08:30', 30, false, [1]);
            }).toThrow('Schedule overlaps with an existing schedule on this zone.');
        });
    });

    describe('updateSchedule', () => {
        it('should update an existing schedule', () => {
            const schedule = { id: 1, zone_id: 1, start_time: '08:00', duration_min: 30 };
            mockDb.mockAll.mockReturnValue([]);

            ScheduleService.updateSchedule(schedule, '09:00', 45, false, false, [1, 3, 5]);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE schedules')
            );
            expect(mockDb.mockRun).toHaveBeenCalledWith('09:00', 45, 0, 0, 1);
            expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
        });

        it('should update skip_next flag', () => {
            const schedule = { id: 1, zone_id: 1, start_time: '08:00', duration_min: 30 };
            mockDb.mockAll.mockReturnValue([]);

            ScheduleService.updateSchedule(schedule, '08:00', 30, false, true, [1]);

            expect(mockDb.mockRun).toHaveBeenCalledWith('08:00', 30, 0, 1, 1);
        });

        it('should allow overlap with itself when updating', () => {
            const schedule = { id: 1, zone_id: 1, start_time: '08:00', duration_min: 30 };
            mockDb.mockAll.mockReturnValue([]);

            expect(() => {
                ScheduleService.updateSchedule(schedule, '08:00', 30, false, false, [1]);
            }).not.toThrow();
        });

        it('should throw error when updating causes overlap', () => {
            const schedule = { id: 1, zone_id: 1, start_time: '08:00', duration_min: 30 };
            mockDb.mockAll.mockReturnValue([
                { id: 2, start_time: '09:00', duration_min: 60, day: 1 }
            ]);

            expect(() => {
                ScheduleService.updateSchedule(schedule, '09:30', 60, false, false, [1]);
            }).toThrow('Schedule overlaps with an existing schedule on this zone.');
        });
    });

    describe('deleteSchedule', () => {
        it('should delete schedule and its days', () => {
            const schedule = { id: 1, zone_id: 1 };

            ScheduleService.deleteSchedule(schedule);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedules')
            );
            expect(mockDb.mockRun).toHaveBeenCalledWith(1);
            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedule_days')
            );
            expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
        });

        it('should handle deleting multiple schedules', () => {
            const schedules = [{ id: 1 }, { id: 2 }, { id: 3 }];

            schedules.forEach(schedule => {
                ScheduleService.deleteSchedule(schedule);
            });

            expect(mockDb.mockRun).toHaveBeenCalledTimes(6);
        });
    });

    describe('deleteByZone', () => {
        it('should delete all schedules for a zone', () => {
            const zone = { id: 1 };

            ScheduleService.deleteByZone(zone);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedule_days')
            );
            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedules WHERE zone_id')
            );
            expect(mockDb.mockRun).toHaveBeenCalledWith(1);
            expect(mockDb.mockRun).toHaveBeenCalledWith(1);
        });
    });

    describe('skipNextOccurrence', () => {
        it('should set skip_next flag', () => {
            const schedule = { id: 1 };

            ScheduleService.skipNextOccurrence(schedule);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE schedules SET skip_next')
            );
            expect(mockDb.mockRun).toHaveBeenCalledWith(1);
            expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
        });
    });

    describe('runSchedules', () => {
        it('should run schedules matching current time and day', () => {
            const mockSchedules = [
                { id: 1, zone_id: 1, start_time: '12:00', duration_min: 30, one_time: 0, skip_next: 0 },
                { id: 2, zone_id: 2, start_time: '12:00', duration_min: 45, one_time: 0, skip_next: 0 }
            ];

            mockDb.mockAll.mockReturnValue(mockSchedules);
            mockDb.mockGet.mockReturnValue({ id: 1, name: 'Zone', gpio_pin: 17 });

            ScheduleService.runSchedules();

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM schedules WHERE start_time')
            );
            expect(mockDb.mockAll).toHaveBeenCalledWith('12:00');
        });

        it('should not run schedules on wrong day', () => {
            const mockSchedules = [
                { id: 1, zone_id: 1, start_time: '12:00', duration_min: 30, one_time: 0, skip_next: 0 }
            ];

            mockDb.mockAll.mockReturnValue(mockSchedules);

            ScheduleService.runSchedules();

            expect(mockDb.mockAll).toHaveBeenCalled();
        });

        it('should handle empty schedule list', () => {
            mockDb.mockAll.mockReturnValue([]);

            expect(() => {
                ScheduleService.runSchedules();
            }).not.toThrow();

            expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
        });

        it('should call runSchedule for schedules matching the current day', () => {
            const mockSchedules = [
                { id: 1, zone_id: 1, start_time: '12:00', duration_min: 30, one_time: 0, skip_next: 0, status: 'scheduled' }
            ];

            mockDb.mockAll.mockReturnValueOnce(mockSchedules).mockReturnValueOnce([{ day: 1 }]).mockReturnValue([]);
            mockDb.mockGet.mockReturnValue({ id: 1, name: 'Zone', gpio_pin: 17 });

            const runScheduleSpy = jest.spyOn(ScheduleService, 'runSchedule');

            ScheduleService.runSchedules();

            expect(runScheduleSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 1, days: [1] }));
            runScheduleSpy.mockRestore();
        });
    });

    describe('runSchedule', () => {
        it('should skip schedule if skip_next is set', () => {
            const schedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: true,
                days: [1]
            };

            mockDb.mockAll.mockReturnValue([]);

            ScheduleService.runSchedule(schedule);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE schedules')
            );
            expect(mockZoneService.save).not.toHaveBeenCalled();
        });

        it('should activate zone and set status to running', () => {
            const schedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                days: [1]
            };

            const zone = { id: 1, name: 'Zone', gpio_pin: 17 };
            mockDb.mockGet.mockReturnValue(zone);

            ScheduleService.runSchedule(schedule);

            expect(mockDb.mockGet).toHaveBeenCalled();
            expect(mockZoneService.save).toHaveBeenCalledWith(expect.any(Zone), 0);
            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE schedules SET status')
            );
            expect(mockDb.mockRun).toHaveBeenCalledWith('running', 1);
        });

        it('should delete schedule if zone is invalid', () => {
            const schedule = {
                id: 1,
                zone_id: 999,
                start_time: '08:00',
                duration_min: 30,
                one_time: false,
                skip_next: false,
                days: [1]
            };

            mockDb.mockGet.mockReturnValue(null);

            ScheduleService.runSchedule(schedule);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedules')
            );
        });

        it('should deactivate zone after duration', () => {
            const schedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 1,
                one_time: false,
                skip_next: false,
                days: [1]
            };

            const zone = { id: 1, name: 'Zone', gpio_pin: 17 };
            mockDb.mockGet.mockReturnValue(zone);

            ScheduleService.runSchedule(schedule);

            jest.advanceTimersByTime(60 * 1000);

            expect(mockZoneService.save).toHaveBeenCalledWith(expect.any(Zone), 1);
            expect(mockDb.mockRun).toHaveBeenCalledWith('idle', 1);
        });

        it('should delete one-time schedule after completion', () => {
            const schedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 1,
                one_time: true,
                skip_next: false,
                days: [1]
            };

            const zone = { id: 1, name: 'Zone', gpio_pin: 17 };
            mockDb.mockGet.mockReturnValue(zone);

            ScheduleService.runSchedule(schedule);

            jest.advanceTimersByTime(60 * 1000);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedules')
            );
        });

        it('should delete schedule if zone is deleted during execution', () => {
            const schedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 1,
                one_time: false,
                skip_next: false,
                days: [1]
            };

            const zone = { id: 1, name: 'Zone', gpio_pin: 17 };
            mockDb.mockGet.mockReturnValueOnce(zone).mockReturnValueOnce({ id: 1 }).mockReturnValueOnce(null);

            ScheduleService.runSchedule(schedule);

            jest.advanceTimersByTime(60 * 1000);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedules')
            );
        });

        it('should delete schedule if schedule is deleted during execution', () => {
            const schedule = {
                id: 1,
                zone_id: 1,
                start_time: '08:00',
                duration_min: 1,
                one_time: false,
                skip_next: false,
                days: [1]
            };

            const zone = { id: 1, name: 'Zone', gpio_pin: 17 };
            mockDb.mockGet.mockReturnValueOnce(zone).mockReturnValueOnce(null).mockReturnValueOnce({ id: 1 });

            ScheduleService.runSchedule(schedule);

            jest.advanceTimersByTime(60 * 1000);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedules')
            );
        });
    });

    describe('checkForScheduleOverlap', () => {
        it('should not throw for non-overlapping schedules', () => {
            mockDb.mockAll.mockReturnValue([
                { id: 1, start_time: '08:00', duration_min: 30, day: 1 }
            ]);

            expect(() => {
                ScheduleService.checkForScheduleOverlap(1, '09:00', 30, [1]);
            }).not.toThrow();
        });

        it('should throw for overlapping schedules', () => {
            mockDb.mockAll.mockReturnValue([
                { id: 1, start_time: '08:00', duration_min: 60, day: 1 }
            ]);

            expect(() => {
                ScheduleService.checkForScheduleOverlap(1, '08:30', 30, [1]);
            }).toThrow('Schedule overlaps with an existing schedule on this zone.');
        });

        it('should allow schedules on different days', () => {
            mockDb.mockAll.mockReturnValue([
                { id: 1, start_time: '08:00', duration_min: 60, day: 1 }
            ]);

            expect(() => {
                ScheduleService.checkForScheduleOverlap(1, '08:00', 60, [2, 3]);
            }).not.toThrow();
        });

        it('should exclude specified schedule from overlap check', () => {
            mockDb.mockAll.mockReturnValue([]);

            expect(() => {
                ScheduleService.checkForScheduleOverlap(1, '08:00', 30, [1], 1);
            }).not.toThrow();
        });

        it('should handle edge cases at midnight', () => {
            mockDb.mockAll.mockReturnValue([
                { id: 1, start_time: '23:30', duration_min: 60, day: 1 }
            ]);

            expect(() => {
                ScheduleService.checkForScheduleOverlap(1, '23:45', 30, [1]);
            }).toThrow();
        });

        it('should detect overlap when new schedule starts before existing', () => {
            mockDb.mockAll.mockReturnValue([
                { id: 1, start_time: '10:00', duration_min: 30, day: 1 }
            ]);

            expect(() => {
                ScheduleService.checkForScheduleOverlap(1, '09:45', 30, [1]);
            }).toThrow();
        });

        it('should detect overlap when new schedule ends after existing starts', () => {
            mockDb.mockAll.mockReturnValue([
                { id: 1, start_time: '08:00', duration_min: 30, day: 1 }
            ]);

            expect(() => {
                ScheduleService.checkForScheduleOverlap(1, '07:45', 30, [1]);
            }).toThrow();
        });
    });

    describe('setDays', () => {
        it('should delete old days and insert new ones', () => {
            const schedule = { id: 1 };
            const days = [0, 2, 4];

            ScheduleService.setDays(schedule, days);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM schedule_days')
            );
            expect(mockDb.mockRun).toHaveBeenCalledWith(1);

            days.forEach(day => {
                expect(mockDb.mockRun).toHaveBeenCalledWith(1, day);
            });
        });

        it('should handle empty days array', () => {
            const schedule = { id: 1 };

            expect(() => {
                ScheduleService.setDays(schedule, []);
            }).not.toThrow();

            expect(mockDb.mockRun).toHaveBeenCalledWith(1);
        });

        it('should handle all 7 days', () => {
            const schedule = { id: 1 };
            const days = [0, 1, 2, 3, 4, 5, 6];

            ScheduleService.setDays(schedule, days);

            expect(mockDb.mockRun).toHaveBeenCalledTimes(8);
        });
    });
});
