import { jest } from '@jest/globals';
import { createGraph } from '../../src/agents/graph.js';

describe('Healing Loop Integration', () => {
  test('should retry on failure', async () => {
    const mockLlm = {
      invoke: jest.fn()
        .mockResolvedValueOnce({ // Planner
          content: JSON.stringify({ title: 'T', description: 'D', plan: [], dynamicTimeout: '1m' })
        })
        .mockResolvedValueOnce({ // Coder
          content: 'FAILING SCRIPT'
        })
        .mockResolvedValueOnce({ // Debugger
          content: JSON.stringify({ analysis: 'A', fixProposal: 'FIXED SCRIPT' })
        })
        .mockResolvedValueOnce({ // Evaluator
          content: JSON.stringify({ isSuccess: true, analysis: 'All good' })
        })
    };

    const mockRunner = {
      execute: jest.fn()
        .mockResolvedValueOnce({ exitCode: 1, stderr: 'ERR' }) // First attempt fails
        .mockResolvedValueOnce({ exitCode: 0, stdout: 'OK' })  // Second attempt succeeds
    };

    const mockFs = {
      saveScript: jest.fn(),
      saveResult: jest.fn()
    };
    const mockDb = {
      addTrace: jest.fn().mockResolvedValue(1),
      getSession: jest.fn().mockResolvedValue(null),
      createSession: jest.fn().mockResolvedValue(1),
      updateSessionStatus: jest.fn().mockResolvedValue(true)
    };

    const graph = createGraph({ llm: mockLlm, runner: mockRunner, fs: mockFs, db: mockDb });
    const result = await graph.invoke({
      requirement: 'Test me',
      uuid: 'test-uuid',
      retryCount: 0,
      history: []
    });

    expect(result.retryCount).toBe(1);
    expect(mockRunner.execute).toHaveBeenCalledTimes(2);
    expect(result.isSuccess).toBe(true);
  });
});
