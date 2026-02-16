import { extractJson } from '../../../src/lib/json-parser.js';

describe('json-parser utility', () => {
  test('should extract JSON from markdown code block', () => {
    const text = `Here is the result:
\`\`\`json
{"key": "value"}
\`\`\`
Hope it helps!`;
    const result = extractJson(text);
    expect(result).toEqual({ key: 'value' });
  });

  test('should extract JSON without "json" tag in markdown block', () => {
    const text = `\`\`\`
{"key": "value"}
\`\`\``;
    const result = extractJson(text);
    expect(result).toEqual({ key: 'value' });
  });

  test('should extract JSON using brace matching as fallback', () => {
    const text = 'Conversational prefix... {"key": "value"} ...conversational suffix';
    const result = extractJson(text);
    expect(result).toEqual({ key: 'value' });
  });

  test('should extract JSON array using bracket matching', () => {
    const text = 'List of items: [{"id": 1}, {"id": 2}]';
    const result = extractJson(text);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('should handle nested structures in brace matching', () => {
    const text = 'Complex: {"outer": {"inner": 1}} end';
    const result = extractJson(text);
    expect(result).toEqual({ outer: { inner: 1 } });
  });

  test('should throw error if no JSON found', () => {
    const text = 'No json here';
    expect(() => extractJson(text)).toThrow('No JSON structure found');
  });

  test('should throw error if JSON is invalid', () => {
    const text = 'Invalid: {"key": "value"';
    expect(() => extractJson(text)).toThrow();
  });
});
