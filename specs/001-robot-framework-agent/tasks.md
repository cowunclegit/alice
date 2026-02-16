# Tasks: Robot Framework Coding Agent

**Input**: Design documents from `/specs/001-robot-framework-agent/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Tests are MANDATORY. According to the Alice MK4 Constitution, tests MUST be written before implementation and MUST pass for a task to be considered complete.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths below assume single project structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Node.js project with ESM and install dependencies (Langgraph.js, Jest, SQLite3) in package.json
- [X] T002 [P] Configure Jest for ESM testing in jest.config.js
- [X] T003 Create project directory structure (src/agents, src/services, src/cli, robots/results)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 MANDATORY: Create SQLite schema unit tests in tests/unit/services/database.test.js
- [X] T005 Implement SQLite database service for RobotSession and ExecutionTrace in src/services/database.js
- [X] T006 MANDATORY: Create FileSystem service tests in tests/unit/services/filesystem.test.js
- [X] T007 Implement FileSystem service for script storage and result retention in src/services/filesystem.js
- [X] T008 MANDATORY: Create BaseChatModel extension tests in tests/unit/services/llm.test.js
- [X] T009 Implement Custom REST API LLM service extending BaseChatModel in src/services/llm.js
- [X] T010 MANDATORY: Create Robot Runner tests (mocking CLI) in tests/unit/services/runner.test.js
- [X] T011 Implement Robot Framework Executor service using child_process.spawn in src/services/runner.js

**Checkpoint**: Foundation ready - Agent node implementation can now begin.

---

## Phase 3: User Story 1 - Automate Test Script Creation (Priority: P1) 🎯 MVP

**Goal**: Generate a functional Robot Framework script from natural language input.

**Independent Test**: Provide a prompt like "Verify login on example.com" and confirm a valid `.robot` file is saved and metadata is recorded.

### Tests for User Story 1 (MANDATORY TDD) ⚠️

- [X] T012 [P] [US1] Create unit tests for Planner node in tests/unit/agents/planner.test.js
- [X] T013 [P] [US1] Create unit tests for Coder node in tests/unit/agents/coder.test.js
- [X] T014 [US1] Create integration test for Plan -> Code flow in tests/integration/generation_flow.test.js

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement Planner node logic (Intent parsing + Plan generation) in src/agents/planner.js
- [X] T016 [P] [US1] Implement Coder node logic (RF script generation via Playwright) in src/agents/coder.js
- [X] T017 [US1] Implement CLI interface to trigger generation in src/cli/index.js
- [X] T018 [US1] Integrate Planner and Coder into a basic Langgraph workflow in src/agents/graph.js

**Checkpoint**: User Story 1 complete - System can generate and save scripts with metadata.

---

## Phase 4: User Story 2 - Self-Healing Execution (Priority: P2)

**Goal**: Automatically fix errors in generated scripts during execution.

**Independent Test**: Trigger an execution that fails (e.g., wrong selector), verify Debugger proposes a fix, and script passes on retry.

### Tests for User Story 2 (MANDATORY TDD) ⚠️

- [X] T019 [P] [US2] Create unit tests for Executor node in tests/unit/agents/executor.test.js
- [X] T020 [P] [US2] Create unit tests for Debugger node in tests/unit/agents/debugger.test.js
- [X] T021 [US2] Create integration test for Execute -> Debug loop in tests/integration/healing_loop.test.js

### Implementation for User Story 2

- [X] T022 [P] [US2] Implement Executor node (RF execution + Screenshot capture) in src/agents/executor.js
- [X] T023 [P] [US2] Implement Debugger node (Error analysis + Fix generation) in src/agents/debugger.js
- [X] T024 [US2] Update Langgraph workflow to include Execute and Debug nodes with retry logic in src/agents/graph.js
- [X] T025 [US2] Implement trace persistence for every attempt in src/agents/graph.js

**Checkpoint**: User Story 2 complete - System can execute scripts and self-heal from failures.

---

## Phase 5: User Story 3 - Transparent Planning (Priority: P3)

**Goal**: Evaluate execution results semantically against user intent and provide SUCCESS signal.

**Independent Test**: Verify that the agent outputs a terminal SUCCESS token and reasoning only when intent is fully met.

### Tests for User Story 3 (MANDATORY TDD) ⚠️

- [X] T026 [P] [US3] Create unit tests for SemanticEvaluator node in tests/unit/agents/evaluator.test.js
- [X] T027 [US3] Create integration test for Intent Verification in tests/integration/semantic_verification.test.js

### Implementation for User Story 3

- [X] T028 [P] [US3] Implement SemanticEvaluator node (LLM evaluation of logs/screenshots) in src/agents/evaluator.js
- [X] T029 [US3] Implement terminal SUCCESS token and status reporting in src/cli/index.js
- [X] T030 [US3] Finalize Langgraph state transitions for semantic re-planning in src/agents/graph.js

**Checkpoint**: All user stories complete - Autonomous semantic verification loop is functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and maintenance

- [X] T031 Implement 30-day retention cleanup logic in src/services/filesystem.js
- [X] T032 [P] Add README.md instructions for .env setup and local execution
- [X] T033 Final code refactoring and ESM module cleanup (ensuring efficient exports and import paths)
- [X] T034 Run full integration test suite against example web targets

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational (Phase 2).
  - US1 (P1) is the MVP.
  - US2 (P2) depends on US1 basic generation.
  - US3 (P3) depends on US2 execution/trace infra.

### Within Each User Story

- MANDATORY: Write tests FIRST and ensure they FAIL before implementation.
- Nodes before Graph integration.
- Logic before CLI polish.

### Parallel Opportunities

- All Foundational tests (T004, T006, T008, T010) can run in parallel.
- All Story-specific unit tests (T012, T013, T019, T020, T026) can run in parallel.
- Planner (T015) and Coder (T016) implementation can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: Verify local RF script generation.

### Incremental Delivery

1. Add Phase 4 (US2) for self-healing.
2. Add Phase 5 (US3) for semantic verification.
3. Finish with Phase 6 Polish.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Every node MUST use the Langgraph.js pattern.
- Every DB interaction MUST be traced in the ExecutionTrace table.
