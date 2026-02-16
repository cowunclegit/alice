# LLM Robot Framework Coding Guidelines

## 1. Project Structure & Context
*   **Context File:** Maintain a `llm-context.md` or `README.md` at the root, explaining the project's purpose, libraries, and architecture.
*   **Modularization:** Divide tests into logical, small, and reusable files. Use `Settings`, `Variables`, `Keywords`, and `Test Cases` sections properly.
*   **Naming Conventions:** Use PascalCase for keywords (`Open Browser`), snake_case for variables (`${user_name}`), and clean, descriptive names.

## 2. Coding Standards
*   **English-like Syntax:** Write keywords in plain English (`Input Text` instead of `send_keys`).
*   **Keyword Driven:** Avoid putting raw logic in tests; encapsulate logic in user-defined keywords.
*   **Documentation:** Use `[Documentation]` in test cases for clarity.
*   **Cleanup:** Always include `[Teardown]` to close browsers or close connections to ensure stability.
*   **Browser Library Specifics**:
    *   **Selectors**: Use CSS selectors by default.
    *   **Press Keys**: Do NOT use `key=Enter`. Use `Press Keys    ${selector}    Enter`.
    *   **Type Text**: Use `enter=True` to submit if needed: `Type Text    ${selector}    Text    enter=True`.
    *   **Arguments**: Prefer positional arguments over named arguments (avoid `selector=`, `key=`).

## 3. LLM Prompting Guidelines
*   **Virtual Environment:** Instruct the LLM to start by creating and activating a `venv`.
*   **Context First:** Provide the `llm-context.md` to the LLM before asking for code.
*   **Turn-by-turn:** Ask the LLM to guide you step-by-step rather than generating a huge block of code at once.
*   **Error Handling:** Ask the LLM to include proper error handling and logging (`Log`, `Log To Console`) in the Keywords.

## 4. Example Structure
```robot
*** Settings ***
Documentation    Example test suite for login
Library          Browser
Test Teardown    Close Browser

*** Variables ***
${URL}           https://example.com
${USERNAME}      testuser

*** Test Cases ***
Valid Login Scenario
    [Documentation]    Verifies that a user can login successfully.
    Open Login Page
    Input Credentials    ${USERNAME}    password123
    Submit Form
    Take Screenshot

*** Keywords ***
Open Login Page
    New Page    ${URL}

Input Credentials
    [Arguments]    ${user}    ${pass}
    Fill Text     #username    ${user}
    Fill Text     #password    ${pass}

Submit Form
    Click   #submit
```
