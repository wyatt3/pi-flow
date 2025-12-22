import { jest } from '@jest/globals';

// Create a mock database with common methods
export const createMockDb = () => {
  const mockGet = jest.fn();
  const mockAll = jest.fn();
  const mockRun = jest.fn(() => ({ lastInsertRowid: 1 }));

  const mockPrepare = jest.fn(() => ({
    get: mockGet,
    all: mockAll,
    run: mockRun,
  }));

  return {
    prepare: mockPrepare,
    mockGet,
    mockAll,
    mockRun,
  };
};

// Create a mock websocket service
export const createMockWebsocketService = () => ({
  broadcastUpdate: jest.fn(),
});

// Create a mock GPIO object
export const createMockGpio = () => ({
  writeSync: jest.fn(),
  readSync: jest.fn(),
  unexport: jest.fn(),
});

// Helper to reset all mocks
export const resetAllMocks = (...mocks) => {
  mocks.forEach(mock => {
    if (mock && typeof mock === 'object') {
      Object.values(mock).forEach(fn => {
        if (typeof fn?.mockClear === 'function') {
          fn.mockClear();
        }
      });
    }
  });
};
