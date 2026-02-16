export async function coderNode(state, config) {
  const { llm } = config;
  const { plan, title, description, analysis_results } = state;

  console.log('\n[Coder] Generating Robot Framework script...');

  let contextInfo = '';
  if (analysis_results && analysis_results.length > 0) {
    contextInfo = `
CRITICAL: Use these analyzed selectors for higher accuracy:
${analysis_results.map(r => `- ${r.description}: ${r.selector}`).join('\n')}
`;
  }

  const strictGuidelines = `
## 1. Sections (MANDATORY)
- Always include: *** Settings ***, *** Variables ***, *** Test Cases ***, *** Keywords ***.
- *** Settings *** MUST include:
  | Test Teardown | Capture HTML |

## 2. Formatting (PIPE FORMAT)
- Every token MUST be separated by a pipe (|).
- Indented lines MUST start with "| |".

## 3. ARGUMENT STYLE (NO LABELS)
- NEVER use 'selector=', 'key=', 'txt=', 'url=', etc. Use positional only.

## 4. HTML CAPTURE (CRITICAL FOR ANALYZER)
- ALWAYS use the name 'debug.html'. NEVER use other names.
- ALWAYS use 'Get Property | html | outerHTML' to get HTML.
- AFTER every page transition AND in the Teardown, capture the HTML:
  | | \${html} | Get Property | html | outerHTML |
  | | Create File | debug.html | \${html} |

## 5. VALID KEYWORDS (DO NOT GUESS)
- Multiple elements: 'Get Elements'. (DO NOT use Query Selector All)
- Single element: 'Get Element'. (DO NOT use Query Selector)
- JSON String: Use '| \${json} | Evaluate | json.dumps(\${data}, indent=4) |'. (DO NOT use Convert To Json)

## 6. REFERENCE EXAMPLE:
| *** Settings *** |
| Library | Browser |
| Library | JSONLibrary |
| Library | OperatingSystem |
| Test Teardown | Capture HTML |

| *** Test Cases *** |
| Search Test |
| | [Setup] | Start Session |
| | Search AI |
| | [Teardown] | Close Browser |

| *** Keywords *** |
| Start Session |
| | New Browser | chromium | headless=True |
| | New Page | https://www.naver.com |

| Search AI |
| | Fill Text | \\#query | AI |
| | Press Keys | \\#query | Enter |
| | Wait For Load State | networkidle |
| | Capture HTML |

| Capture HTML |
| | \${html} | Get Property | html | outerHTML |
| | Create File | debug.html | \${html} |
`;

  const systemPrompt = `You are a Robot Framework Expert.
Generate a valid .robot file based on the provided test plan.
Strictly follow these MANDATORY guidelines:
${strictGuidelines}

${contextInfo}

CRITICAL: Use PIPE-SEPARATED format only.
LIBRARIES: Only use Browser, OperatingSystem, JSONLibrary, and Collections.
SYNTAX: Use modern "RETURN" instead of deprecated "[Return]".

Return ONLY the raw content of the .robot file. No markdown code blocks.`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate script for: ${title} - ${description}` }
  ]);

  console.log('[Coder] Generated Script:\n--------------------------\n' + response.content + '\n--------------------------');

  return {
    scriptContent: response.content
  };
}
