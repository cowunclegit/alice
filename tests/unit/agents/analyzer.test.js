import { jest } from '@jest/globals';
import { analyzerNode } from '../../../src/agents/analyzer.js';

describe('Analyzer Node', () => {
  test('should analyze HTML and return selectors', async () => {
    const mockLlm = {
      invoke: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          selectors: [
            { description: 'Search Input', selector: '#query', type: 'input' }
          ],
          strategy: 'Used unique ID'
        })
      })
    };

    const state = {
      html_content: '<html><body><input id="query"></body></html>',
      analysis_goal: 'Find search input'
    };

    const result = await analyzerNode(state, { llm: mockLlm });

    expect(result.analysis_results).toHaveLength(1);
    expect(result.analysis_results[0].selector).toBe('#query');
    expect(result.analysis_strategy).toBe('Used unique ID');
  });
});
