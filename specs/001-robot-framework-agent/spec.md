# Feature Specification: Robot Framework Coding Agent

**Feature Branch**: `001-robot-framework-agent`  
**Created**: 2026-02-16  
**Status**: Draft  
**Input**: User description: "Langgraph.js를 사용하여 robot framework 코딩 에이전트를 만들거야 코딩 에이전트는 Plan & Execute를 기본적으로 구성하는데 Planner, Coder, Executor, Debugger 등으로 구성하고 Planner가 사용자의 요청을 받아서 코드를 작성하는 계획을 세우고 Coder는 계획대로 코드를 작성하는 역할을 해 Executor에서 에러나 오동작시 Debugger로 수정하면 될거 같아"

## Clarifications

### Session 2026-02-16
- Q: Which Robot Framework libraries should be pre-installed/supported in the execution environment? → A: Option A, Browser (Playwright) library.
- Q: Where should generated scripts be stored and how should they be identified? → A: Store in `robots/` directory using UUIDs; manage metadata (title, description) via an `sqlite3` database.
- Q: How should the Debugger resolve execution failures? → A: Option A, Proactive Fix (analyze logs and autonomously propose specific code changes to self-heal).
- Q: How should the execution results (output) be handled and persisted? → A: Option A, Full Reports + DB Summary (store `output.xml`, `report.html` in the workspace and log status/errors in SQLite).
- Q: How should the agent handle sensitive credentials (passwords, API keys) required for tests? → A: Option A, Environment Variables (load from .env or system environment).
- Q: Should the browser run in headless or headful mode during execution? → A: Option B, Headful (always show the browser window).
- Q: How should the agent's generated "Plan" be persisted for audit and debugging? → A: Option A, Database (SQLite) (store the plan as a field in the script's metadata record).
- Q: Which languages should the agent support for user prompts and metadata (titles/descriptions)? → A: Option A, Multilingual (English + Korean support).
- Q: How should dependencies and the execution environment be managed? → A: Option A, Node.js (npm) (use npm to manage agent and browser automation dependencies).
- Q: How should the agent handle multiple simultaneous requests or executions? → A: Option A, Strictly Sequential (only one prompt/test processed at any given time).
- Q: How detailed should the historical record of execution attempts be? → A: Option A, Full Trace (store every Coder attempt, Executor failure, and Debugger fix in SQLite).
- Q: Which Robot Framework keywords should the Coder prioritize? → A: Option A, Strict Browser Library (only use keywords from the Browser/Playwright library).
- Q: Should the Debugger's internal reasoning/analysis be persisted? → A: Option A, Full Persist (store the Debugger's error analysis and fix strategy in the SQLite trace).
- Q: How should the lifecycle and status of the execution plan be tracked? → A: Option A, State-Based (track plan status: Draft, Approved, Executed, Failed in the database).
- Q: How should the agent manage the lifecycle of generated artifacts (scripts, logs, traces)? → A: Option A, Time-based Cleanup (automatically delete results and trace logs older than 30 days).
- Q: When should the agent execute the generated script? → A: Option A, Immediate (automatically trigger execution immediately after code generation).
- Q: How should the agent persist the history of code modifications/fixes? → A: Option A, Full History (store every unique fix proposal and code iteration in the trace history).
- Q: How should the state and lifecycle of the execution plan be tracked? → A: Option A, State-Based (track status: Draft, Approved, Executed, Failed).
- Q: How should the agent evaluate if an execution was successful? → A: Option A, Autonomous Semantic Evaluation (analyze results against user intent, not just technical exit codes).
- Q: How should the agent handle detected semantic misalignments between execution and intent? → A: Option A, Iterative Re-planning (return to Planner to refine strategy before re-coding).
- Q: Should the agent's semantic analysis and reasoning be persisted? → A: Option A, Detailed Audit Trail (store the full semantic reasoning/justification in the SQLite trace).
- Q: How should the agent handle user requests that are impossible to fulfill? → A: Option A, Explicit Impossibility Reporting (detect and report impossible intent early to stop the loop).
- Q: How should browser contexts be managed across execution attempts and retries? → A: Option A, Self-Contained Sessions (ensure every execution starts with a fresh, cleared browser context).
- Q: What is the functional scope of the agent's automation capabilities? → A: Option A, Web Only (strictly limited to web-based automation tasks).
- Q: How should the execution timeout be determined? → A: Option B, Dynamic Timeout (timeout duration is calculated by the Planner based on prompt complexity).
- Q: Should the agent capture visual evidence during execution? → A: Option A, Final State (capture a screenshot of the browser at the end of every attempt).
- Q: How should the agent signal the final conclusion of a task? → A: Option A, Explicit SUCCESS (output a terminal signal when intent is fully met).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automate Test Script Creation (Priority: P1)

As a QA Engineer, I want to describe a web-based test scenario in natural language (English or Korean) so that the agent can automatically generate a functional Robot Framework script.

**Why this priority**: This is the core value proposition. Without the ability to generate a script from natural language, the system has no primary function.

**Independent Test**: Can be fully tested by providing a simple natural language prompt (e.g., "Verify login success on example.com" or "example.com에서 로그인 성공을 확인해줘") and verifying that a valid `.robot` file is produced.

**Acceptance Scenarios**:

1. **Given** a clear natural language test requirement in English or Korean, **When** the agent is triggered, **Then** it must produce a syntactically correct Robot Framework script using the Browser (Playwright) library that matches the requirement.
2. **Given** a complex requirement involving multiple steps, **When** the agent is triggered, **Then** the generated script must include all necessary keywords and structure.
3. **Given** a generated script, **When** saved, **Then** it must be stored in the `robots/` directory with a UUID filename, and its title/description (in the prompt language) must be recorded in the SQLite database.

---

### User Story 2 - Self-Healing Execution (Priority: P2)

As a Developer, I want the agent to automatically fix errors in the generated script during execution so that I don't have to manually debug common syntax or selector issues.

**Why this priority**: High value for productivity. It differentiates the agent from a simple template generator by adding autonomous reliability.

**Independent Test**: Can be tested by providing a prompt that results in a slightly incorrect script (e.g., wrong selector), and verifying that the agent identifies the failure, modifies the code, and successfully re-executes.

**Acceptance Scenarios**:

1. **Given** a script that fails during execution (technically or semantically), **When** the failure is detected, **Then** the agent must analyze the error and attempt a correction.
2. **Given** a corrected script, **When** re-executed, **Then** it must pass or report why it failed again if the issue is unresolvable.
3. **Given** an execution session, **When** complete, **Then** Robot Framework reports (`report.html`, `log.html`) and a final state screenshot must be saved in a directory associated with the script's UUID.

---

### User Story 3 - Transparent Planning (Priority: P3)

As a Technical Lead, I want to see the execution plan before the code is written so that I can verify the agent's logic and approach.

**Why this priority**: Important for trust and interpretability, though the core function can work without visible plans.

**Independent Test**: Can be tested by checking the agent's logs or output for a structured "Plan" before any `.robot` files are created.

**Acceptance Scenarios**:

1. **Given** a user request, **When** the Planner phase starts, **Then** a step-by-step logic plan must be generated.
2. **Given** an execution failure, **When** the Debugger is triggered, **Then** the plan must be updated to reflect the debugging strategy.

---

### Edge Cases

- **Ambiguous Prompts**: What happens when the user's natural language request is too vague to form a plan? (System should ask for clarification or use sensible defaults).
- **Environment Failures**: How does the system handle failures not related to code (e.g., network timeout, missing browser drivers)?
- **Infinite Loops**: How does the Debugger prevent an infinite loop of failing and "fixing"? (Limit to 5 attempts per session).
- **Semantic Misalignment**: What happens when a script passes technically but fails to fulfill the user's intent? (Debugger must detect, trigger a re-planning loop via the Planner, and iterate).
- **Impossible Intent**: What happens when the user's request is impossible to fulfill? (Agent must detect and report the reason early to stop the loop).
- **State Contamination**: How to ensure a previous failed execution doesn't affect the next retry? (Agent starts every attempt with a fresh browser context).
- **Out-of-Scope Requests**: What happens if a user asks for mobile or desktop automation? (Agent must politely decline and state the Web-only limitation).
- **Execution Stalls**: What happens if an execution takes too long? (Agent enforces a dynamic timeout calculated by the Planner).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse natural language input (English/Korean) into a structured execution plan (Planner).
- **FR-002**: System MUST generate Robot Framework code based on the approved plan (Coder).
- **FR-022**: System MUST strictly limit automation scope to web-based tasks utilizing the Browser (Playwright) library.
- **FR-023**: System MUST calculate a dynamic execution timeout during the Planner phase based on the complexity of the requested test scenario.
- **FR-024**: System MUST capture a screenshot of the browser's final state at the end of every execution attempt (Success or Failure).
- **FR-025**: System MUST output an explicit "SUCCESS" token and a final status report when user intent is semantically verified as met.
- **FR-020**: System MUST automatically trigger script execution immediately after the Coder completes the initial generation or the Debugger completes a fix.
- **FR-017**: System MUST process requests strictly sequentially, ensuring only one agent execution loop (Plan-Execute-Debug) runs at any given time.
- **FR-008**: Generated code MUST utilize the `Browser` (Playwright) library for web-based automation tasks exclusively.
- **FR-014**: System MUST configure the `Browser` library to run in **headful mode** (headless=False) by default.
- **FR-021**: System MUST ensure every execution attempt starts with a clean browser context (cleared cache/cookies) to prevent state contamination.
- **FR-015**: System MUST support multilingual metadata, storing titles and descriptions in the same language as the user's prompt (English/Korean).
- **FR-009**: System MUST store generated `.robot` scripts in a `robots/` directory using UUIDv4 filenames.
- **FR-010**: System MUST maintain an SQLite3 database in the `robots/` directory to store script metadata including UUID, Title, Description, **Plan (with Status: Draft/Approved/Executed/Failed)**, and Creation Date.
- **FR-011**: System MUST save standard Robot Framework execution artifacts (`log.html`, `report.html`, `output.xml`, **screenshots**) in a subdirectory named after the script's UUID (e.g., `robots/results/<uuid>/`).
- **FR-012**: System MUST update the SQLite3 database with the final execution status (Pass/Fail) and any critical error summaries.
- **FR-018**: System MUST persist a full history of all internal agent transitions, including original code attempts, **debugger reasoning/analysis**, **semantic evaluations**, and **all unique fix proposals**, in the SQLite database (Traceability).
- **FR-019**: System MUST automatically delete execution artifacts and database trace entries older than 30 days (Retention).
- **FR-013**: System MUST support the use of environment variables (e.g., `%{VAR_NAME}`) for handling sensitive data within Robot Framework scripts.
- **FR-016**: System MUST utilize **Node.js (npm)** for managing all dependencies, including Playwright and the agent runtime.
- **FR-003**: System MUST execute the generated Robot Framework scripts in a local environment (Executor).
- **FR-004**: System MUST capture stdout/stderr and exit codes from script execution to identify failures.
- **FR-005**: System MUST analyze execution results (logs, screenshots, output) against the original user intent. If a misalignment is detected, it MUST trigger a re-planning loop via the **Planner** (Semantic Evaluation).
- **FR-006**: System MUST limit autonomous debugging cycles to a maximum of 5 attempts to prevent infinite loops.
- **FR-007**: System MUST support Robot Framework syntax (v6.x or higher).

### Key Entities

- **Requirement**: The original user input describing the test.
- **Plan**: A sequence of steps with a specific state (Draft, Approved, Executed, Failed), persisted in the metadata database.
- **Script**: The actual `.robot` file content generated by the Coder, saved as `robots/<uuid>.robot`.
- **Metadata**: Information stored in SQLite (id, uuid, title, description, plan, plan_status, execution_status, trace_history, created_at).
- **Execution Result**: The output, logs, screenshots, and status (Pass/Fail) from the Robot Framework execution.
- **Fix Proposal**: A suggested modification to the Script generated by the Debugger based on its internal reasoning and semantic analysis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 80% of simple natural language prompts result in a passing test execution on the first attempt.
- **SC-002**: 50% of scripts that fail initially due to selector or syntax errors are successfully self-healed by the Debugger.
- **SC-003**: The time from prompt to first execution attempt is under 30 seconds for standard scenarios (defined as scripts with < 10 keywords and no external resource files).
- **SC-004**: Generated scripts follow standard Robot Framework naming conventions and structure.

**Version**: 0.3.7 | **Last Updated**: 2026-02-16
