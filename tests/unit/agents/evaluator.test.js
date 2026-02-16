import { evaluatorNode } from '../../../src/agents/evaluator.js';
import { jest } from '@jest/globals';

describe('Evaluator Node', () => {
  test('should evaluate execution success semantically', async () => {
    const state = {
      requirement: 'Verify login',
      executionResult: { exitCode: 0, stdout: 'Logged in successfully' }
    };

    const mockLlm = {
      invoke: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          isSuccess: true,
          analysis: 'Intent met'
        })
      })
    };

    const result = await evaluatorNode(state, { llm: mockLlm });
    
    expect(result.isSuccess).toBe(true);
    expect(result.analysis).toBe('Intent met');
  });
});
