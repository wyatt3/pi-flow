import { jest, describe, it, expect, beforeAll } from '@jest/globals';

describe('pinToLineMap error handling', () => {
    let consoleErrorSpy;

    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should handle missing or malformed JSON file gracefully', async () => {
        const mockFs = {
            readFileSync: jest.fn(() => {
                throw new Error('ENOENT: no such file or directory');
            }),
        };

        const mockPath = {
            resolve: jest.fn((p) => p),
        };

        jest.unstable_mockModule('fs', () => ({
            default: mockFs,
        }));

        jest.unstable_mockModule('path', () => ({
            default: mockPath,
        }));

        const { default: mapping } = await import('../src/config/pinToLineMap.js?error-test');

        expect(mapping).toEqual({});

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle malformed JSON gracefully', async () => {
        consoleErrorSpy.mockClear();

        const mockFs = {
            readFileSync: jest.fn(() => '{invalid json'),
        };

        const mockPath = {
            resolve: jest.fn((p) => p),
        };

        jest.unstable_mockModule('fs', () => ({
            default: mockFs,
        }));

        jest.unstable_mockModule('path', () => ({
            default: mockPath,
        }));

        const { default: mapping } = await import('../src/config/pinToLineMap.js?malformed-test');

        expect(mapping).toEqual({});

        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
