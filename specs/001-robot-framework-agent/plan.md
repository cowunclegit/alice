# Implementation Plan: Robot Framework Coding Agent & Extensible LLM Service

**Branch**: `001-robot-framework-agent` | **Date**: 2026-02-16 | **Spec**: [specs/001-robot-framework-agent/spec.md](spec.md)
**Input**: "application/json이 지원되지 않는 경우는 custom json 추출방법을 생각해야해, 지금은 gemini api를 쓰지만 나중에 custom llm을 사용할거야"

## Summary

Implement a custom `BaseChatModel` for LangChain.js that integrates with Gemini API but is architected for future transition to custom LLMs. This includes a robust, multi-layered JSON extraction utility that functions independently of the provider's native JSON mode, ensuring reliability across different model capabilities.

## Technical Context

**Language/Version**: Node.js (JavaScript Only - ESM)
**Primary Dependencies**: `@langchain/core`, Langgraph.js, Robot Framework (v6.x+), Playwright
**Storage**: SQLite3 (for script metadata and trace history)
**Testing**: Jest (MANDATORY TDD)
**Target Platform**: Node.js Runtime
**Project Type**: Agentic Workflow System
**Performance Goals**: Agent response < 30s, execution feedback loop < 1m
**Constraints**: 
- No TypeScript. 
- Strict adherence to [robot-guidelines.md](robot-guidelines.md). 
- **Extensible Extraction**: Decouple JSON parsing from API-specific features (Native JSON vs. Regex Fallback).
- **JSON Prompting**: System prompts must explicitly request JSON format when structured data is required.
- Use `Browser` library for web automation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Node.js/JS Only**: ESM-based Node.js backend.
- [x] **Langgraph.js**: Core orchestration framework.
- [x] **LLM Arch**: Custom `BaseChatModel` implementation with provider-agnostic extraction logic.
- [x] **TDD Mandatory**: All agent nodes and services will have unit tests.
- [x] **Simplicity**: Sequential execution model; direct REST integration for LLM.
- [x] **Robot Syntax**: [robot-guidelines.md](robot-guidelines.md) defined and enforced.

## Project Structure

### Documentation (this feature)

```text
specs/001-robot-framework-agent/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── robot-guidelines.md  # Robot Framework syntax rules (v6.x+)
├── contracts/           # API Contract for Gemini interaction
└── tasks.md             # Implementation tasks
```

### Source Code

```text
src/
├── agents/              # Langgraph nodes (Planner, Coder, Evaluator, Debugger)
├── services/
│   ├── llm.js           # Abstract LLM base / common extraction logic
│   ├── gemini.js        # Gemini-specific implementation
│   ├── database.js      # SQLite3 service
│   └── runner.js        # Robot Framework executor
├── cli/                 # User interface
└── lib/                 # Shared utilities (e.g., json-parser.js)

tests/
├── integration/         # E2E agentic flows
└── unit/                # Component tests
```

**Structure Decision**: Extraction logic will be isolated in `src/lib/utils.js` or a dedicated service to ensure it can be reused by future LLM integrations.
