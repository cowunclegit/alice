import { jest } from '@jest/globals';
import { createGraph } from '../../src/agents/graph.js';

describe('Generation Flow Integration', () => {
  test('should go from requirement to robot script', async () => {
    const mockLlm = {
      invoke: jest.fn()
        .mockResolvedValueOnce({ // Planner
          content: JSON.stringify({ title: 'T', description: 'D', plan: [], dynamicTimeout: '1m' })
        })
        .mockResolvedValueOnce({ // Coder
          content: `*** Settings ***\nLibrary    Browser`
        })
        .mockResolvedValueOnce({ // Evaluator (Technical SUCCESS goes to evaluator)
          content: JSON.stringify({ isSuccess: true, analysis: 'OK' })
        })
    };

    const mockRunner = {
      execute: jest.fn().mockResolvedValue({ exitCode: 0, stdout: 'OK' })
    };
    const mockFs = { saveScript: jest.fn(), saveResult: jest.fn() };
    const mockDb = { 
      addTrace: jest.fn(),
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

    expect(result.scriptContent).toContain('Library    Browser');
    expect(result.isSuccess).toBe(true);
  });
});
