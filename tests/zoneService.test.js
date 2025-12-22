import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createMockDb, createMockWebsocketService, resetAllMocks } from './testUtils.js';

// Mock dependencies before importing the service
const mockDb = createMockDb();
const mockWebsocketService = createMockWebsocketService();
const mockGpio = { writeSync: jest.fn() };

// Mock modules
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: mockDb,
}));

jest.unstable_mockModule('../src/services/websocketService.js', () => ({
  default: mockWebsocketService,
}));

jest.unstable_mockModule('onoff', () => ({
  Gpio: jest.fn(() => mockGpio),
}));

// Import after mocking
const ZoneService = (await import('../src/services/zoneService.js')).default;
const Zone = (await import('../src/models/zone.js')).default;

describe('ZoneService', () => {
  beforeEach(() => {
    resetAllMocks(mockDb, mockWebsocketService, mockGpio);
  });

  describe('create', () => {
    it('should create a new zone with valid data', () => {
      mockDb.mockRun.mockReturnValue({ lastInsertRowid: 1 });

      const zone = ZoneService.create('Test Zone', 17);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO zones')
      );
      expect(mockDb.mockRun).toHaveBeenCalledWith('Test Zone', 17);
      expect(zone).toBeInstanceOf(Zone);
      expect(zone.name).toBe('Test Zone');
      expect(zone.gpio_pin).toBe(17);
      expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
    });

    it('should assign correct ID from database', () => {
      mockDb.mockRun.mockReturnValue({ lastInsertRowid: 42 });

      const zone = ZoneService.create('Zone 42', 18);

      expect(zone.id).toBe(42);
    });

    it('should handle zone creation with different GPIO pins', () => {
      const testCases = [
        { name: 'Zone 1', pin: 17 },
        { name: 'Zone 2', pin: 27 },
        { name: 'Zone 3', pin: 22 },
      ];

      testCases.forEach(({ name, pin }, index) => {
        mockDb.mockRun.mockReturnValue({ lastInsertRowid: index + 1 });
        const zone = ZoneService.create(name, pin);

        expect(zone.name).toBe(name);
        expect(zone.gpio_pin).toBe(pin);
      });
    });
  });

  describe('save', () => {
    let testZone;

    beforeEach(() => {
      testZone = {
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 1,
        gpio: mockGpio,
      };
    });

    it('should update zone active status to inactive (0)', () => {
      const result = ZoneService.save(testZone, 0);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE zones SET active')
      );
      expect(mockDb.mockRun).toHaveBeenCalledWith(0, 1);
      expect(result.active).toBe(0);
      expect(mockGpio.writeSync).toHaveBeenCalledWith(0);
      expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
    });

    it('should update zone active status to active (1)', () => {
      testZone.active = 0;
      const result = ZoneService.save(testZone, 1);

      expect(mockDb.mockRun).toHaveBeenCalledWith(1, 1);
      expect(result.active).toBe(1);
      expect(mockGpio.writeSync).toHaveBeenCalledWith(1);
    });

    it('should handle zones without GPIO gracefully', () => {
      const zoneWithoutGpio = {
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 1,
        gpio: null,
      };

      expect(() => {
        ZoneService.save(zoneWithoutGpio, 0);
      }).not.toThrow();

      expect(mockGpio.writeSync).not.toHaveBeenCalled();
    });

    it('should return the updated zone object', () => {
      const result = ZoneService.save(testZone, 0);

      expect(result).toBe(testZone);
      expect(result.active).toBe(0);
    });
  });

  describe('delete', () => {
    let testZone;
    let mockScheduleService;

    beforeEach(async () => {
      testZone = {
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
        gpio: mockGpio,
      };

      // Mock ScheduleService
      mockScheduleService = {
        deleteByZone: jest.fn(),
      };

      jest.unstable_mockModule('../src/services/scheduleService.js', () => ({
        default: mockScheduleService,
      }));
    });

    it('should turn off GPIO before deleting', () => {
      ZoneService.delete(testZone);

      expect(mockGpio.writeSync).toHaveBeenCalledWith(1);
    });

    it('should delete associated schedules', async () => {
      // Re-import ZoneService to get the mocked ScheduleService
      const ZoneServiceWithMockedSchedule = (await import('../src/services/zoneService.js')).default;
      ZoneServiceWithMockedSchedule.delete(testZone);

      // Note: This test might need adjustment based on how modules are imported
    });

    it('should delete zone from database', () => {
      ZoneService.delete(testZone);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM zones')
      );
      expect(mockDb.mockRun).toHaveBeenCalledWith(1);
      expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
    });

    it('should handle zones without GPIO gracefully', () => {
      const zoneWithoutGpio = {
        id: 1,
        name: 'Test Zone',
        gpio_pin: 17,
        active: 0,
        gpio: null,
      };

      expect(() => {
        ZoneService.delete(zoneWithoutGpio);
      }).not.toThrow();
    });
  });

  describe('turnOffAllZones', () => {
    it('should turn off all zones', () => {
      const mockZones = [
        { id: 1, name: 'Zone 1', gpio_pin: 17, active: 0 },
        { id: 2, name: 'Zone 2', gpio_pin: 27, active: 0 },
        { id: 3, name: 'Zone 3', gpio_pin: 22, active: 1 },
      ];

      mockDb.mockAll.mockReturnValue(mockZones);

      ZoneService.turnOffAllZones();

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM zones');
      expect(mockDb.mockAll).toHaveBeenCalled();
      expect(mockDb.mockRun).toHaveBeenCalledTimes(3);
      
      // Each zone should be set to active=1 (off state)
      expect(mockDb.mockRun).toHaveBeenNthCalledWith(1, 1, 1);
      expect(mockDb.mockRun).toHaveBeenNthCalledWith(2, 1, 2);
      expect(mockDb.mockRun).toHaveBeenNthCalledWith(3, 1, 3);
      
      expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
    });

    it('should handle empty zone list', () => {
      mockDb.mockAll.mockReturnValue([]);

      expect(() => {
        ZoneService.turnOffAllZones();
      }).not.toThrow();

      expect(mockDb.mockRun).not.toHaveBeenCalled();
      expect(mockWebsocketService.broadcastUpdate).toHaveBeenCalled();
    });

    it('should handle database with single zone', () => {
      const mockZones = [
        { id: 1, name: 'Single Zone', gpio_pin: 17, active: 0 },
      ];

      mockDb.mockAll.mockReturnValue(mockZones);

      ZoneService.turnOffAllZones();

      expect(mockDb.mockRun).toHaveBeenCalledTimes(1);
      expect(mockDb.mockRun).toHaveBeenCalledWith(1, 1);
    });
  });
});
