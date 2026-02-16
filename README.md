# Robot Framework Coding Agent

Autonomous agent that plans, codes, executes, and self-heals Robot Framework tests using Langgraph.js and Gemini API.

## Setup

1.  **Clone the repository**.
2.  **Install Python dependencies**:
    ```bash
    pip install robotframework robotframework-browser
    rfbrowser init
    ```
3.  **Install Node.js dependencies**:
    ```bash
    npm install
    ```
4.  **Configure Environment**:
    Create a `.env` file with:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

## Usage

Run the agent with a natural language requirement:

```bash
node src/cli/index.js "Verify that the search functionality on example.com works correctly"
```

## Architecture

- **Planner**: Parses requirement into a step-by-step plan.
- **Coder**: Generates `.robot` script using the Browser library.
- **Executor**: Runs the script and captures results.
- **Recorder**: Persists execution trace to SQLite.
- **Debugger**: Proposes fixes for technical failures.
- **Evaluator**: Semantically verifies results against user intent.
