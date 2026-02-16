# Data Model: Gemini BaseChatModel

## Class Structure: `GeminiChatModel`

Extends `BaseChatModel` from `@langchain/core`.

### Configuration (Fields)
- `apiKey`: string (Mandatory)
- `modelName`: string (Default: `gemini-2.5-flash`)
- `temperature`: number (Default: 0.7)
- `maxOutputTokens`: number (Optional)

### Internal State Transitions
1. **Input**: `BaseMessage[]`
2. **Transform**: 
    - Convert `BaseMessage[]` to Gemini `Content[]` format. 
    - **Prompt Augmentation**: If structured output is requested, append JSON formatting instructions to the `SystemMessage`.
    - Set `responseMimeType: "application/json"` in `generationConfig`.
3. **Request**: HTTP POST to Gemini REST endpoint.
4. **Response**: Parse Gemini JSON response.
5. **Extract**: If `application/json` was requested, parse the `text` field directly. Otherwise, attempt markdown block extraction.
6. **Output**: Wrap in `ChatResult` (containing `AIChatMessage`).

## JSON Extraction Utility

A robust utility function used by the `GeminiChatModel` (and future custom models) to extract structured data from raw string responses.

### Extraction Pipeline (Prioritized)

1. **Markdown Block**: Match ` /```(?:json)?\s*([\s\S]*?)\s*```/`. If found, use the first block's content.
2. **Brace/Bracket Matching**: 
   - Find the index of the first `{` and the last `}`.
   - If not found, find the index of the first `[` and the last `]`.
   - Extract the substring.
3. **Direct Parse**: Attempt `JSON.parse(extractedContent)`.
4. **Sanitization (Fallback)**: Strip trailing commas or markdown artifacts if parsing fails, then try one last time.

### Error Handling
- If all steps fail, throw a `JSONExtractionError` containing the raw text for debugging and potential retry by the agent.

```javascript
// LangChain to Gemini
{
  "HumanMessage": { "role": "user", "parts": [{ "text": message.content }] },
  "AIMessage": { "role": "model", "parts": [{ "text": message.content }] },
  "SystemMessage": { "role": "system", "parts": [{ "text": message.content }] } // Used in system_instruction
}
```
