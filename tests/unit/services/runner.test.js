import { jest } from '@jest/globals';
import EventEmitter from 'events';

jest.unstable_mockModule('child_process', () => ({
  spawn: jest.fn()
}));

const { spawn: mockSpawn } = await import('child_process');
const { RobotRunner } = await import('../../../src/services/runner.js');

describe('RobotRunner', () => {
  let runner;

  beforeEach(() => {
    runner = new RobotRunner();
    jest.clearAllMocks();
  });

  test('should execute robot framework and return results', async () => {
    const mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    mockSpawn.mockReturnValue(mockProcess);

    const executionPromise = runner.execute('test.robot', 'results/test');

    // Simulate process output
    setTimeout(() => {
      mockProcess.stdout.emit('data', Buffer.from('Test passed\n'));
      mockProcess.emit('close', 0);
    }, 10);

    const result = await executionPromise;
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Test passed');
  });

  test('should handle execution errors', async () => {
    const mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    mockSpawn.mockReturnValue(mockProcess);

    const executionPromise = runner.execute('test.robot', 'results/test');

    setTimeout(() => {
      mockProcess.stderr.emit('data', Buffer.from('Syntax Error\n'));
      mockProcess.emit('close', 1);
    }, 10);

    const result = await executionPromise;
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Syntax Error');
  });
});
