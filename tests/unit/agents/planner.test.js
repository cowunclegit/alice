import { plannerNode } from '../../../src/agents/planner.js';
import { jest } from '@jest/globals';

describe('Planner Node', () => {
  test('should generate a plan from requirement', async () => {
    const state = {
      requirement: 'Verify login on example.com',
      plan: [],
      history: []
    };

    const mockLlm = {
      invoke: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          title: 'Login Test',
          description: 'Tests login on example.com',
          plan: [
            { step: 1, action: 'Open browser to example.com' },
            { step: 2, action: 'Input username' },
            { step: 3, action: 'Input password' },
            { step: 4, action: 'Click login' },
            { step: 5, action: 'Verify success' }
          ],
          dynamicTimeout: '2m'
        })
      })
    };

    const result = await plannerNode(state, { llm: mockLlm });
    
    expect(result.plan).toHaveLength(5);
    expect(result.dynamicTimeout).toBe('2m');
    expect(result.title).toBe('Login Test');
  });
});
