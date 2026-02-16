import { coderNode } from '../../../src/agents/coder.js';
import { jest } from '@jest/globals';

describe('Coder Node', () => {
  test('should generate robot script from plan', async () => {
    const state = {
      plan: [{ step: 1, action: 'Open browser' }],
      title: 'Test Title',
      description: 'Test Description'
    };

    const mockLlm = {
      invoke: jest.fn().mockResolvedValue({
        content: `*** Settings ***
Library    Browser

*** Test Cases ***
Test Title
    [Documentation]    Test Description
    New Page    https://example.com`
      })
    };

    const result = await coderNode(state, { llm: mockLlm });
    
    expect(result.scriptContent).toContain('*** Settings ***');
    expect(result.scriptContent).toContain('Library    Browser');
    expect(result.scriptContent).toContain('New Page');
  });
});
