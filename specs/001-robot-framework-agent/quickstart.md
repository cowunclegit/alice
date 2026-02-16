# Quickstart: Gemini BaseChatModel

## Setup

1. **Environment Variable**:
   Ensure `GEMINI_API_KEY` is set in your `.env` file.

2. **Installation** (Planned):
   ```bash
   npm install @langchain/core
   ```

## Usage

```javascript
import { GeminiChatModel } from './src/services/gemini.js';
import { HumanMessage } from '@langchain/core/messages';

const model = new GeminiChatModel({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-2.5-flash'
});

const response = await model.invoke([
  new HumanMessage("Hello, who are you?")
]);

console.log(response.content);
```
