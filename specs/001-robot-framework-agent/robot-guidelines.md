# Robot Framework Syntax Guidelines (v6.x+)

These guidelines MUST be followed by the Coder agent when generating `.robot` scripts.

## 1. Section Headers
- Use the plural form for standard sections:
  - `*** Settings ***`
  - `*** Variables ***`
  - `*** Test Cases ***`
  - `*** Keywords ***`
- Wrap headers with exactly three asterisks and a single space: `*** Section Name ***`.

## 2. Formatting & Spacing (CRITICAL)
- **The Golden Rule**: Robot Framework uses **two or more spaces** as a separator between keywords and arguments. 
- **Separator**: Use exactly **4 spaces** as the cell separator. DO NOT use TABS.
- **Indentation**: Keywords within a Test Case or a User Keyword MUST be indented with exactly 4 spaces.
- **Trailing Spaces**: Avoid trailing spaces at the end of lines.
- **Empty Cells**: If an argument is empty, use `${EMPTY}` or leave the space clear with the 4-space separator.

## 3. Continuations
- Use `...` at the beginning of the next line to continue a long command. 
- The `...` must also be preceded by the 4-space indentation and followed by the 4-space separator.

## 3. Variables
- **Scalar**: `${VARIABLE_NAME}`
- **List**: `@{LIST_VARIABLE}`
- **Dictionary**: `&{DICTIONARY_VARIABLE}`
- **Environment**: `%{ENV_VAR}`
- Prefer descriptive, uppercase names for global variables and lowercase for local ones (optional but recommended).

## 4. Documentation & Comments
- **Comments**: Use `#` for single-line comments.
- **Documentation**: Use the `[Documentation]` setting for all Test Cases and Keywords.
- **Suite Documentation**: Use `Documentation` in the `*** Settings ***` section.

## 5. Keyword Usage (Browser Library focus)
- All web automation MUST use the `Browser` library.
- Keywords should be written in **Title Case** (e.g., `New Page`, `Fill Text`).
- Arguments follow the keyword, separated by 4 spaces.

### 🚨 NO NAMED ARGUMENTS (MANDATORY) 🚨
DO NOT use `selector=`, `key=`, `keys=`, `txt=`, `url=`, `state=`, `property=`, or `path=`. 
Using these labels often causes "expected X arguments, got 1" errors. ALWAYS use **Positional Arguments** (values only).

### 🚨 MANDATORY LIBRARY RULES 🚨
1. **JSONLibrary**: 
   - ALWAYS use `Convert String to JSON`.
   - NEVER use `Convert To Json` (it does not exist in standard JSONLibrary).
2. **Positional Only**: Continue to follow the **NO NAMED ARGUMENTS** rule for all library keywords.

- **Correct (Positional)**:
  - `New Page    ${URL}`
  - `Type Text    ${selector}    Search Term`
  - `Fill Text    ${selector}    Search Term`
  - `Press Keys    ${selector}    Enter`
  - `Wait For Elements State    ${selector}    visible    10s`
  - `Get Property    ${selector}    outerHTML`
  - `Create File    ${file_path}    ${content}    UTF-8`
  - `Convert String to JSON    ${json_string}`

- **Forbidden**:
  - ❌ `Convert To Json    ${json_string}`
  - ❌ `New Page    url=${URL}`

- **Correct HTML Capture**:
  - BAD: `Get Page Content` (Does not exist)
  - GOOD: `Get Property    html    outerHTML` (Captures full page HTML)
  - GOOD: `Get Property    ${selector}    outerHTML` (Captures specific element HTML)

## 9. Examples
### Clean Positional Style (Reference)
```robotframework
*** Keywords ***
Perform Search
    Wait For Elements State    ${SEARCH_INPUT_SELECTOR}    visible    10s
    Type Text    ${SEARCH_INPUT_SELECTOR}    AI
    Press Keys    ${SEARCH_INPUT_SELECTOR}    Enter
    Wait For Elements State    ${MAIN_CONTENT_SELECTOR}    visible    15s
```

## 6. Control Structures (Modern Syntax)
- Always use `END` to close `IF`, `FOR`, `WHILE`, and `TRY` blocks.

### IF/ELSE
```robotframework
IF    ${condition}
    Keyword    arg
ELSE IF    ${other_condition}
    Keyword    arg
ELSE
    Keyword    arg
END
```

### FOR Loops
```robotframework
FOR    ${element}    IN    @{elements}
    Log    ${element}
END
```

### TRY/EXCEPT
```robotframework
TRY
    Dangerous Keyword
EXCEPT    Error message
    Recovery Keyword
END
```

## 7. Library & Resource Imports
- Place all imports in `*** Settings ***`.
- Use `Library    Browser` for Playwright automation.
- Resources should use absolute or relative paths: `Resource    common.robot`.

## 8. Naming Conventions
- **Test Cases**: Descriptive sentences (e.g., `User Should Be Able To Login`).
- **Keywords**: Action-oriented phrases (e.g., `Open Login Page`).
- **Files**: Use snake_case or kebab-case for filenames, but the UUID requirement in `spec.md` takes precedence for generated files.
