import { debuggerNode } from '../../../src/agents/debugger.js';
import { jest } from '@jest/globals';

describe('Debugger Node', () => {
  test('should analyze error and propose fix', async () => {
    const state = {
      scriptContent: 'Invalid Code',
      executionResult: { exitCode: 1, stderr: 'Syntax Error' },
      retryCount: 0
    };

    const mockLlm = {
      invoke: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          analysis: 'Found syntax error',
          fixProposal: 'Correct the syntax'
        })
      })
    };

    const result = await debuggerNode(state, { llm: mockLlm });
    
    expect(result.retryCount).toBe(1);
    expect(result.analysis).toBe('Found syntax error');
    expect(result.fixProposal).toBe('Correct the syntax');
  });
});
