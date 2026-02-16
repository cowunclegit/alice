<!--
Sync Impact Report:
- Version change: 0.0.0 → 1.0.0
- List of modified principles:
  - I. [PRINCIPLE_1_NAME] → I. Node.js & JavaScript Only
  - II. [PRINCIPLE_2_NAME] → II. Langgraph.js Framework
  - III. [PRINCIPLE_3_NAME] → III. LLM Architecture & Custom REST API
  - IV. [PRINCIPLE_4_NAME] → IV. TDD Mandatory (NON-NEGOTIABLE)
  - V. [PRINCIPLE_5_NAME] → V. Simplicity & YAGNI
- Added sections:
  - Technical Stack Constraints
  - Development Workflow
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->

# Alice MK4 Constitution

## Core Principles

### I. Node.js & JavaScript Only
The backend MUST be implemented using Node.js and JavaScript exclusively. No TypeScript or other languages are permitted for backend logic to maintain consistency and simplicity in the execution environment.

### II. Langgraph.js Framework
Langgraph.js is the mandatory framework for orchestration and agentic workflows. All state management and agent transitions MUST follow Langgraph patterns to ensure a robust and observable system.

### III. LLM Architecture & Custom REST API
The system uses a Custom REST API LLM that extends `BaseChatModel` from LangChain. This ensures portability and control over the model interface. For debugging and development assistance, the Gemini API is the designated secondary model.

### IV. TDD Mandatory (NON-NEGOTIABLE)
Test-Driven Development is strictly required. Tests MUST be written before any feature implementation. A feature is considered successful ONLY when all associated tests pass. Red-Green-Refactor is the law.

### V. Simplicity & YAGNI
Maintain a lean codebase. Do not add features or complexity that are not immediately required by the current specification. Every line of code must justify its existence against the core requirements.

## Technical Stack Constraints
- **Runtime**: Node.js
- **Language**: JavaScript (ESM)
- **Workflow**: Langgraph.js
- **AI**: Custom REST API LLM (extending BaseChatModel), Gemini API (debugging)

## Development Workflow
1. **Define Requirements**: Capture user stories and functional requirements in the spec.
2. **Write Tests First**: Create unit and integration tests that capture the expected behavior.
3. **Red Phase**: Verify that tests fail as expected.
4. **Green Phase**: Implement the minimum necessary code to make tests pass.
5. **Refactor**: Clean up the code while ensuring tests remain green.

## Governance
This constitution supersedes all other informal practices within the Alice MK4 project. Amendments require a version bump and an update to the Sync Impact Report. All Pull Requests and code reviews must verify compliance with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-16
