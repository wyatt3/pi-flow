import { jest } from '@jest/globals';

process.env.PORT = '3000';
process.env.GPIO_ENABLED = 'false';
process.env.TIMEZONE = 'America/New_York';

jest.unstable_mockModule('onoff', () => ({
    Gpio: jest.fn().mockImplementation(() => ({
        writeSync: jest.fn(),
        readSync: jest.fn(),
        unexport: jest.fn(),
    })),
}));

jest.setTimeout(10000);
