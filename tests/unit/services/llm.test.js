import { jest } from '@jest/globals';
import { GeminiChatModel } from '../../../src/services/llm.js';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

describe('GeminiChatModel', () => {
  const apiKey = 'test-api-key';
  let model;

  beforeEach(() => {
    model = new GeminiChatModel({ apiKey });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should format messages correctly for Gemini API', async () => {
    const messages = [
      new SystemMessage('You are a bot'),
      new HumanMessage('Hello'),
      new AIMessage('Hi there'),
      new HumanMessage('How are you?')
    ];

    const mockResponse = {
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: 'I am fine' }] },
          finishReason: 'STOP'
        }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 }
      })
    };
    global.fetch.mockResolvedValue(mockResponse);

    await model.invoke(messages);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('gemini-2.5-flash'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"system_instruction"')
      })
    );

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.system_instruction.parts[0].text).toBe('You are a bot');
    expect(body.contents).toHaveLength(3); // Human, AI, Human
    expect(body.contents[0].role).toBe('user');
    expect(body.contents[1].role).toBe('model');
  });

  test('should handle JSON prompt augmentation', async () => {
    const messages = [new HumanMessage('Give me JSON')];
    
    const mockResponse = {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"ok": true}' }] } }]
      })
    };
    global.fetch.mockResolvedValue(mockResponse);

    await model.invoke(messages, { response_format: { type: 'json_object' } });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.system_instruction.parts[0].text).toContain('JSON');
  });
});
