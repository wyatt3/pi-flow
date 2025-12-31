import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createMockDb, resetAllMocks } from './testUtils.js';

const mockDb = createMockDb();
const mockGpio = jest.fn(() => ({
  writeSync: jest.fn(),
  readSync: jest.fn(),
  unexport: jest.fn(),
}));

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: mockDb,
}));

jest.unstable_mockModule('onoff', () => ({
  Gpio: mockGpio,
}));

jest.unstable_mockModule('../src/config/pinToLineMap.js', () => ({
  default: { 17: 0, 27: 2, 22: 3 },
}));

process.env.GPIO_ENABLED = 'false';

const Zone = (await import('../src/models/zone.js')).default;
const Schedule = (await import('../src/models/schedule.js')).default;

describe('Zone Model', () => {
  beforeEach(() => {
    resetAllMocks(mockDb);
    mockGpio.mockClear();
    process.env.GPIO_ENABLED = 'false';
  });

  describe('constructor', () => {
    it('should create a zone with all properties', () => {
      mockDb.mockAll.mockReturnValue([]);

      const zone = new Zone({
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
      });

      expect(zone.id).toBe(1);
      expect(zone.name).toBe('Test Zone');
      expect(zone.gpio_pin).toBe(17);
      expect(zone.active).toBe(0);
      expect(zone.schedules).toEqual([]);
    });

    it('should default active to 1 if not provided', () => {
      mockDb.mockAll.mockReturnValue([]);

      const zone = new Zone({
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
      });

      expect(zone.active).toBe(1);
    });

    it('should default id to null if not provided', () => {
      mockDb.mockAll.mockReturnValue([]);

      const zone = new Zone({
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
      });

      expect(zone.id).toBeNull();
    });

    it('should not initialize GPIO when GPIO_ENABLED is false', () => {
      mockDb.mockAll.mockReturnValue([]);
      process.env.GPIO_ENABLED = 'false';

      const zone = new Zone({
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
      });

      expect(zone.gpio).toBeNull();
      expect(mockGpio).not.toHaveBeenCalled();
    });

    it('should initialize GPIO when GPIO_ENABLED is true and active is 0', () => {
      mockDb.mockAll.mockReturnValue([]);
      process.env.GPIO_ENABLED = 'true';

      const zone = new Zone({
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
      });

      expect(mockGpio).toHaveBeenCalledWith(0, 'out');
    });

    it('should initialize GPIO as high when active is 1', () => {
      mockDb.mockAll.mockReturnValue([]);
      process.env.GPIO_ENABLED = 'true';

      const zone = new Zone({
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 1,
      });

      expect(mockGpio).toHaveBeenCalledWith(0, 'high');
    });

    it('should load schedules for the zone', () => {
      const mockSchedules = [
        {
          id: 1,
          zone_id: 1,
          start_time: '08:00',
          duration_min: 30,
          one_time: false,
          status: 'scheduled',
          skip_next: false,
        },
        {
          id: 2,
          zone_id: 1,
          start_time: '12:00',
          duration_min: 45,
          one_time: false,
          status: 'scheduled',
          skip_next: false,
        },
      ];

      mockDb.mockAll.mockReturnValueOnce(mockSchedules).mockReturnValue([]);

      const zone = new Zone({
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
      });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT * FROM schedules WHERE zone_id = ? ORDER BY start_time'
      );
      expect(mockDb.mockAll).toHaveBeenCalledWith(1);
      expect(zone.schedules).toHaveLength(2);
      expect(zone.schedules[0]).toBeInstanceOf(Schedule);
    });

    it('should handle zone with no schedules', () => {
      mockDb.mockAll.mockReturnValue([]);

      const zone = new Zone({
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
      });

      expect(zone.schedules).toEqual([]);
    });

    it('should handle zone with null id', () => {
      mockDb.mockAll.mockReturnValue([]);

      const zone = new Zone({
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
      });

      expect(zone.id).toBeNull();
      expect(mockDb.mockAll).toHaveBeenCalledWith(null);
    });

    it('should map different GPIO pins correctly', () => {
      mockDb.mockAll.mockReturnValue([]);
      process.env.GPIO_ENABLED = 'true';

      const testCases = [
        { pin: 17, expected: 0 },
        { pin: 27, expected: 2 },
        { pin: 22, expected: 3 },
      ];

      testCases.forEach(({ pin, expected }) => {
        mockGpio.mockClear();
        new Zone({
          id: 1,
          name: `Zone ${pin}`,
          gpio_pin: pin,
          active: 0,
        });

        expect(mockGpio).toHaveBeenCalledWith(expected, 'out');
      });
    });
  });
});

describe('Schedule Model', () => {
  beforeEach(() => {
    resetAllMocks(mockDb);
  });

  describe('constructor', () => {
    it('should create a schedule with all properties', () => {
      mockDb.mockAll.mockReturnValue([{ day: 1 }, { day: 3 }, { day: 5 }]);

      const schedule = new Schedule({
        id: 1,
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: false,
        status: 'scheduled',
        skip_next: false,
      });

      expect(schedule.id).toBe(1);
      expect(schedule.zone_id).toBe(1);
      expect(schedule.start_time).toBe('08:00');
      expect(schedule.duration_min).toBe(30);
      expect(schedule.one_time).toBe(false);
      expect(schedule.status).toBe('scheduled');
      expect(schedule.skip_next).toBe(false);
      expect(schedule.days).toEqual([1, 3, 5]);
    });

    it('should default id to null if not provided', () => {
      mockDb.mockAll.mockReturnValue([]);

      const schedule = new Schedule({
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: false,
        status: 'scheduled',
        skip_next: false,
      });

      expect(schedule.id).toBeNull();
    });

    it('should load schedule days from database', () => {
      mockDb.mockAll.mockReturnValue([{ day: 0 }, { day: 6 }]);

      const schedule = new Schedule({
        id: 1,
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: false,
        status: 'scheduled',
        skip_next: false,
      });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT day FROM schedule_days WHERE schedule_id = ?'
      );
      expect(mockDb.mockAll).toHaveBeenCalledWith(1);
      expect(schedule.days).toEqual([0, 6]);
    });

    it('should handle schedule with no days', () => {
      mockDb.mockAll.mockReturnValue([]);

      const schedule = new Schedule({
        id: 1,
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: false,
        status: 'scheduled',
        skip_next: false,
      });

      expect(schedule.days).toEqual([]);
    });

    it('should handle schedule with all days', () => {
      const allDays = [
        { day: 0 },
        { day: 1 },
        { day: 2 },
        { day: 3 },
        { day: 4 },
        { day: 5 },
        { day: 6 },
      ];
      mockDb.mockAll.mockReturnValue(allDays);

      const schedule = new Schedule({
        id: 1,
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: false,
        status: 'scheduled',
        skip_next: false,
      });

      expect(schedule.days).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('should handle one-time schedule', () => {
      mockDb.mockAll.mockReturnValue([{ day: 1 }]);

      const schedule = new Schedule({
        id: 1,
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: true,
        status: 'scheduled',
        skip_next: false,
      });

      expect(schedule.one_time).toBe(true);
    });

    it('should handle running schedule', () => {
      mockDb.mockAll.mockReturnValue([{ day: 1 }]);

      const schedule = new Schedule({
        id: 1,
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: false,
        status: 'running',
        skip_next: false,
      });

      expect(schedule.status).toBe('running');
    });

    it('should handle schedule with skip_next set', () => {
      mockDb.mockAll.mockReturnValue([{ day: 1 }]);

      const schedule = new Schedule({
        id: 1,
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: false,
        status: 'scheduled',
        skip_next: true,
      });

      expect(schedule.skip_next).toBe(true);
    });

    it('should handle schedule with null id', () => {
      mockDb.mockAll.mockReturnValue([]);

      const schedule = new Schedule({
        zone_id: 1,
        start_time: '08:00',
        duration_min: 30,
        one_time: false,
        status: 'scheduled',
        skip_next: false,
      });

      expect(schedule.id).toBeNull();
      expect(mockDb.mockAll).toHaveBeenCalledWith(null);
    });

    it('should handle different start times', () => {
      mockDb.mockAll.mockReturnValue([{ day: 1 }]);

      const times = ['00:00', '06:30', '12:00', '18:45', '23:59'];

      times.forEach(time => {
        const schedule = new Schedule({
          id: 1,
          zone_id: 1,
          start_time: time,
          duration_min: 30,
          one_time: false,
          status: 'scheduled',
          skip_next: false,
        });

        expect(schedule.start_time).toBe(time);
      });
    });

    it('should handle different durations', () => {
      mockDb.mockAll.mockReturnValue([{ day: 1 }]);

      const durations = [1, 5, 15, 30, 60, 120];

      durations.forEach(duration => {
        const schedule = new Schedule({
          id: 1,
          zone_id: 1,
          start_time: '08:00',
          duration_min: duration,
          one_time: false,
          status: 'scheduled',
          skip_next: false,
        });

        expect(schedule.duration_min).toBe(duration);
      });
    });
  });
});
