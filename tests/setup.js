import { jest } from '@jest/globals';

// Mock environment variables
process.env.PORT = '3000';
process.env.GPIO_ENABLED = 'false';
process.env.TIMEZONE = 'America/New_York';

// Mock the onoff module globally
jest.unstable_mockModule('onoff', () => ({
  Gpio: jest.fn().mockImplementation(() => ({
    writeSync: jest.fn(),
    readSync: jest.fn(),
    unexport: jest.fn(),
  })),
}));

// Increase timeout for database operations
jest.setTimeout(10000);
