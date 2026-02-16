# Research: Gemini BaseChatModel Implementation

## LangChain.js BaseChatModel Extension

To implement a custom chat model in LangChain.js, we need to extend the `BaseChatModel` class from `@langchain/core/language_models/chat_models`.

### Key Methods to Implement
- `_generate(messages, options, runManager)`: The core method that takes messages and returns `ChatResult`.
- `_llmType()`: Returns a string identifier for the model (e.g., `"gemini"`).
- `_combineLLMOutput?(...outputs)`: Optional, for combining multiple outputs if supported.

### Dependencies
- `@langchain/core`: Mandatory for base classes.
- `node-fetch` or native `fetch` (Node 18+): To make REST calls to Gemini API.

## Gemini API (REST) Details

### Endpoint
`POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}`

### Message Mapping
| LangChain Message | Gemini Role | Notes |
|-------------------|-------------|-------|
| `HumanMessage`    | `user`      | Maps directly to `parts: [{ text: ... }]` |
| `AIMessage`       | `model`     | Maps directly. |
| `SystemMessage`   | `system`    | In `v1beta`, can be passed as `system_instruction` in the top-level request. |

### Request Format
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Hello!"}]
    }
  ],
  "system_instruction": {
    "parts": [{"text": "You are a helpful assistant."}]
  }
}
```

## Robot Framework Syntax & Best Practices

### Modern Control Structures (v5+)
- **IF/ELSE**: Uses the `END` keyword. Prefer this over old `Run Keyword If`.
- **FOR**: Uses `FOR ... IN ... END` syntax.
- **TRY/EXCEPT**: Native error handling in v5+ is significantly more robust than `Run Keyword And Ignore Error`.

### Library: Browser (Playwright)
- **Decision**: Exclusively use `Browser` library instead of `SeleniumLibrary`.
- **Rationale**: Better speed, automatic waiting, and native support for modern web apps. Matches the user's preference for Playwright.

### Formatting
- **Standard**: 4 spaces are the community standard for readability and to avoid ambiguity with single spaces.

## LLM JSON Generation & Extraction

### Gemini Native JSON Mode (v1beta)
- **Feature**: `response_mime_type: "application/json"` in `generationConfig`.
- **Pros**: Guaranteed valid JSON (if output isn't truncated), eliminates markdown wrapping.
- **Cons**: Requires explicit instruction in the prompt about the expected schema.
- **REST Implementation**:
  ```json
  {
    "generationConfig": {
      "responseMimeType": "application/json"
    }
  }
  ```

### Structured Output with `response_schema`
- **Feature**: Provide a JSON schema in `generationConfig.responseSchema`.
- **Pros**: Enforces specific fields and types, minimizing validation errors.

### LangChain.js Integration
- **Output Parser**: Use `JsonOutputParser` or `StructuredOutputParser`.
- **Extraction Logic**:
  1. If `response_mime_type` is used, direct `JSON.parse(response.text)`.
  2. If markdown is returned, use regex ` /```json\n([\s\S]*?)\n```/` to extract.

### Improved JSON Extraction Algorithm (2-Tier)

To ensure high reliability when native JSON mode is unavailable, the extraction logic follows these priorities:

1. **Priority 1: Markdown Block Extraction**
   - Look for ` ```json ... ``` ` or ` ``` ... ``` `.
   - Extract the content between the backticks.
   - This handles cases where the LLM wraps the JSON in a code block.

2. **Priority 2: Brace/Bracket Pair Matching (Fallback)**
   - Find the index of the **first** `{` (or `[`) and the **last** `}` (or `]`).
   - Extract the substring between these boundaries.
   - This effectively strips conversational noise (e.g., "Sure, here is the JSON:") from the beginning or end of the string.

3. **Validation & Sanitization**
   - Attempt `JSON.parse`.
   - If it fails, apply basic sanitization (e.g., stripping trailing commas) and retry once.
   - Log errors for the agent's self-healing loop.

### Prompt Engineering for JSON
- **Rule**: When structured output is required, the `SystemMessage` (or `system_instruction`) MUST explicitly include a directive like `"Return the response strictly in JSON format according to the provided schema."`.
- **Rationale**: Even with native JSON mode, explicit prompting reduces model "confusion" and improves adherence to complex schemas, especially in fallback scenarios.

### Space Sensitivity & Separator Pitfalls
- **Issue**: Robot Framework's "Space-Separated" format is often misinterpreted by LLMs as single-space separation (standard CLI/code style).
- **Impact**: Using a single space between a keyword and its argument (e.g., `Input Text username myuser`) will fail because Robot looks for `Input Text username myuser` as a single keyword name.
- **Mitigation**: The Coder agent's system prompt must strictly enforce the "4-space rule" for all separators.

## Decisions & Rationale

- **Decision**: Use native `fetch` for REST calls.
- **Rationale**: Minimal dependencies, available in Node.js 18+.
- **Decision**: Extend `BaseChatModel` directly instead of using `ChatGoogleGenerativeAI` from `@langchain/google-genai`.
- **Rationale**: User explicitly asked to "extend basechatmodel" and "create a chat model", possibly to have full control over the REST implementation (Custom REST API LLM mandate).

## Remaining Clarifications
- None. REST API structure is well-documented.
