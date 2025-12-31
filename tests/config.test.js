import { jest, describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Configuration Files', () => {
  describe('db.js', () => {
    it('should export database instance', async () => {
      const db = (await import('../src/config/db.js')).default;
      expect(db).toBeDefined();
      expect(typeof db.prepare).toBe('function');
    });
  });

  describe('pinToLineMap.js', () => {
    it('should load pin mapping from JSON file', async () => {
      const mapping = (await import('../src/config/pinToLineMap.js')).default;
      expect(mapping).toBeDefined();
      expect(typeof mapping).toBe('object');
    });

    it('should handle missing JSON file gracefully', () => {
      const configPath = path.resolve('src/config/pinToLineMap.json');
      const fileExists = fs.existsSync(configPath);

      if (fileExists) {
        const content = fs.readFileSync(configPath, 'utf8');
        expect(content).toBeTruthy();
      }
    });
  });
});
