export async function coderNode(state, config) {
  const { llm } = config;
  const { plan, title, description, analysis_results, element_inventory, current_url, retryCount, page_history } = state;

  console.log(`\n[Coder] 🚀 Node Start`);
  console.log(`[Coder] 📂 State: URL=${current_url || 'N/A'}, Retry=${retryCount}, History=${page_history?.length || 0} steps`);
  console.log('[Coder] Generating Robot Framework script...');

  let contextInfo = '';
  if (element_inventory) {
    contextInfo = `
### CURRENT PAGE ELEMENT INVENTORY:
${element_inventory}
`;
  }

  const strictGuidelines = `
## 1. Robot Framework Syntax (Pipe Separated)
- Every token MUST be separated by a pipe (|). Indented lines start with "| |".
- **ID Escaping**: CSS selectors starting with '#' MUST be escaped with a single backslash: \\#id-name.

## 2. Mandatory Sections
- Always include: *** Settings ***, *** Variables ***, *** Test Cases ***, *** Keywords ***.
- *** Settings *** must include: | Test Teardown | Capture HTML |

## 3. Automation Standards
- **Argument Style**: Use positional arguments only.
- **Waiting**: Use 'Wait For Elements State' for element visibility and 'Wait For Load State | networkidle' for transitions.
- **HTML Capture & URL Logging**: Use the 'Capture HTML' keyword to log CURRENT_URL and save \${OUTPUT DIR}\${/}debug.html.
`;

  const referenceExample = `
| *** Settings *** |
| Library | Browser |
| Library | JSONLibrary |
| Library | OperatingSystem |
| Test Teardown | Capture HTML |

| *** Test Cases *** |
| Automation Task |
| | [Setup] | Start Session |
| | Perform Steps |
| | [Teardown] | Close Session |

| *** Keywords *** |
| Start Session |
| | New Browser | chromium | headless=True |
| | New Page | https://example.com |
| | Capture HTML |

| Perform Steps |
| | Wait For Elements State | \\#target-id | visible | 10s |
| | Click | \\#target-id |
| | Capture HTML |

| Capture HTML |
| | \${url} | Get Url |
| | Log To Console | CURRENT_URL: \${url} |
| | \${html} | Get Property | html | outerHTML |
| | Create File | \${OUTPUT DIR}\${/}debug.html | \${html} |

| Close Session |
| | Capture HTML |
| | Browser.Close Browser |
`;

  const systemPrompt = `You are a Robot Framework Expert.
Generate a valid .robot file based on the provided plan.

${strictGuidelines}

${contextInfo}

### REFERENCE EXAMPLE:
${referenceExample}

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
