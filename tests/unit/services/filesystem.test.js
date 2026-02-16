import { jest } from '@jest/globals';
import { FilesystemService } from '../../../src/services/filesystem.js';
import fs from 'fs';
import path from 'path';

describe('FilesystemService', () => {
  const baseDir = './test_robots';
  let fsService;

  beforeEach(() => {
    if (fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
    fs.mkdirSync(baseDir, { recursive: true });
    fsService = new FilesystemService(baseDir);
  });

  afterEach(() => {
    if (fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
  });

  test('should save and get a robot script', () => {
    const uuid = 'test-uuid';
    const content = '*** Test Cases ***';
    fsService.saveScript(uuid, content);
    const retrieved = fsService.getScript(uuid);
    expect(retrieved).toBe(content);
    expect(fs.existsSync(path.join(baseDir, `${uuid}.robot`))).toBe(true);
  });

  test('should save execution result artifacts', () => {
    const uuid = 'test-uuid';
    const artifactName = 'log.html';
    const content = '<html></html>';
    fsService.saveResult(uuid, artifactName, content);
    const resultPath = path.join(baseDir, 'results', uuid, artifactName);
    expect(fs.existsSync(resultPath)).toBe(true);
    expect(fs.readFileSync(resultPath, 'utf8')).toBe(content);
  });

  test('should cleanup old files', async () => {
    const uuid = 'old-uuid';
    const content = 'old content';
    const filePath = path.join(baseDir, `${uuid}.robot`);
    fsService.saveScript(uuid, content);
    
    // Backdate the file
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);
    fs.utimesSync(filePath, oldDate, oldDate);

    fsService.cleanupOldFiles(30);
    expect(fs.existsSync(filePath)).toBe(false);
  });
});
