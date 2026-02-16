import { executorNode } from '../../../src/agents/executor.js';
import { jest } from '@jest/globals';

describe('Executor Node', () => {
  test('should execute robot script and return result', async () => {
    const state = {
      uuid: 'test-uuid',
      scriptContent: '*** Test Cases ***',
      dynamicTimeout: '1m'
    };

    const mockRunner = {
      execute: jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'All tests passed',
        stderr: ''
      })
    };
    const mockFs = {
      saveScript: jest.fn(),
      saveResult: jest.fn()
    };

    const result = await executorNode(state, { runner: mockRunner, fs: mockFs });
    
    expect(result.executionResult.exitCode).toBe(0);
    expect(mockRunner.execute).toHaveBeenCalled();
  });
});
