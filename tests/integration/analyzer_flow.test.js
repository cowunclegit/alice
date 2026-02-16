import { jest } from '@jest/globals';
import { createGraph } from '../../src/agents/graph.js';

describe('Analyzer Flow Integration', () => {
  test('should use analyzer results in coder when html_content is provided', async () => {
    const mockLlm = {
      invoke: jest.fn()
        .mockResolvedValueOnce({ // Planner
          content: JSON.stringify({ title: 'T', description: 'D', plan: [], dynamicTimeout: '1m' })
        })
        .mockResolvedValueOnce({ // Analyzer
          content: JSON.stringify({
            selectors: [{ description: 'Search Box', selector: 'input[name="q"]' }],
            strategy: 'S'
          })
        })
        .mockResolvedValueOnce({ // Coder
          content: '*** Settings ***\nLibrary    Browser'
        })
        .mockResolvedValueOnce({ // Evaluator
          content: JSON.stringify({ isSuccess: true, analysis: 'OK' })
        })
        .mockResolvedValueOnce({ // Finalizer
          content: '*** Settings ***\nLibrary    Browser'
        })
    };

    const mockRunner = { execute: jest.fn().mockResolvedValue({ exitCode: 0, stdout: 'OK' }) };
    const mockFs = { saveScript: jest.fn(), saveResult: jest.fn() };
    const mockDb = { 
        addTrace: jest.fn(),
        getSession: jest.fn().mockResolvedValue(null),
        createSession: jest.fn().mockResolvedValue(1),
        updateSessionStatus: jest.fn().mockResolvedValue(true)
    };

    const graph = createGraph({ llm: mockLlm, runner: mockRunner, fs: mockFs, db: mockDb });
    const result = await graph.invoke({
      requirement: 'Search on Google',
      html_content: '<html>...</html>',
      analysis_goal: 'Find search input',
      uuid: 'test-uuid',
      retryCount: 0,
      history: []
    });

    expect(mockLlm.invoke).toHaveBeenCalledTimes(5); // Planner, Analyzer, Coder, Evaluator, Finalizer
    expect(result.analysis_results).toBeDefined();
    expect(result.analysis_results[0].selector).toBe('input[name="q"]');
    
    // Verify Coder was called with analysis_results
    const coderCall = mockLlm.invoke.mock.calls[2]; // 3rd call is Coder
    expect(coderCall[0][0].content).toContain('input[name="q"]');
  });
});
