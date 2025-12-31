import { jest, describe, it, expect } from '@jest/globals';

const mockZoneController = {
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockScheduleController = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

const mockExpress = {
  Router: jest.fn(() => mockRouter),
};

jest.unstable_mockModule('express', () => ({
  default: mockExpress,
}));

jest.unstable_mockModule('../src/controllers/zoneController.js', () => ({
  default: mockZoneController,
}));

jest.unstable_mockModule('../src/controllers/scheduleController.js', () => ({
  default: mockScheduleController,
}));

const router = (await import('../src/routes/api.js')).default;

describe('API Routes', () => {
  it('should create router instance', () => {
    expect(mockExpress.Router).toHaveBeenCalled();
  });

  describe('Zone routes', () => {
    it('should register GET /zones/ route', () => {
      expect(mockRouter.get).toHaveBeenCalledWith('/zones/', mockZoneController.getAll);
    });

    it('should register POST /zones/ route', () => {
      expect(mockRouter.post).toHaveBeenCalledWith('/zones/', mockZoneController.create);
    });

    it('should register POST /zones/:id/ route', () => {
      expect(mockRouter.post).toHaveBeenCalledWith('/zones/:id/', mockZoneController.update);
    });

    it('should register DELETE /zones/:id/ route', () => {
      expect(mockRouter.delete).toHaveBeenCalledWith('/zones/:id/', mockZoneController.delete);
    });
  });

  describe('Schedule routes', () => {
    it('should register POST /schedules/ route', () => {
      expect(mockRouter.post).toHaveBeenCalledWith('/schedules/', mockScheduleController.create);
    });

    it('should register POST /schedules/:id/ route', () => {
      expect(mockRouter.post).toHaveBeenCalledWith('/schedules/:id/', mockScheduleController.update);
    });

    it('should register DELETE /schedules/:id/ route', () => {
      expect(mockRouter.delete).toHaveBeenCalledWith('/schedules/:id/', mockScheduleController.delete);
    });
  });

  it('should export router', () => {
    expect(router).toBe(mockRouter);
  });
});
