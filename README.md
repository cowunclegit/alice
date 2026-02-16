# Alice MK4: Robot Framework Coding Agent

Autonomous agent loop using Langgraph.js that plans, codes, executes, and self-heals Robot Framework scripts.

## Setup

1. **Node.js**: Ensure you have Node.js v20+ installed.
2. **Python**: Ensure Python 3.10+ and Robot Framework are installed.
   ```bash
   pip install robotframework robotframework-browser
   rfbrowser init
   ```
3. **Dependencies**:
   ```bash
   npm install
   npx playwright install chromium
   ```
4. **Environment**: Create a `.env` file with:
   ```env
   LLM_API_URL=your_custom_llm_api_url
   LLM_API_KEY=your_api_key
   ```

## Usage

Run the agent with a natural language requirement:
```bash
node src/cli/index.js "Verify that example.com has a login button"
```

## Features

- **Autonomous Loop**: Planner -> Coder -> Executor -> Semantic Evaluator.
- **Self-Healing**: Automatically debugs and retries on technical or semantic failure (up to 5 times).
- **Traceability**: Full audit trail of every agent transition in SQLite.
- **Retention**: Automatic 30-day cleanup of old scripts and reports.
