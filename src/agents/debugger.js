import { extractJson } from '../lib/json-parser.js';

export async function debuggerNode(state, config) {
  const { llm } = config;
  const { executionResult, scriptContent, retryCount, analysis_results, element_inventory } = state;

  console.log(`\n[Debugger] Analyzing failure (Attempt ${retryCount + 1})...`);
  console.log(`[Debugger] 🔍 Data Check - Inventory present: ${!!element_inventory}, Analysis results: ${analysis_results?.length || 0}`);
  
  let analyzerContext = '';
  if (element_inventory) {
    analyzerContext = `
### CURRENT PAGE ELEMENT INVENTORY:
The following elements are ACTUALLY present on the page where the failure occurred. 
YOU MUST use these elements to fix your selectors. Do not guess.
${element_inventory}
`;
  } else if (analysis_results && analysis_results.length > 0) {
    analyzerContext = `
CRITICAL: The Analyzer has found the following CORRECT selectors from the actual page HTML:
${analysis_results.map(r => `- ${r.description}: ${r.selector}`).join('\n')}
YOU MUST USE THESE SELECTORS to fix the script. Do not guess.
`;
  }

  const systemPrompt = `You are a Robot Framework Debugger.
Analyze the execution failure and propose a fix for the .robot script.
The "fixProposal" MUST be the FULL raw content of the corrected .robot file as a string.

${analyzerContext}

CRITICAL RULES (STRICT ENFORCEMENT):
0. ID ESCAPING: ALWAYS escape ID selectors with a SINGLE backslash (e.g., \\#query). NEVER use # without a backslash. Robot Framework will FAIL if you use '#id-name' because it thinks it's a comment.
1. NO NAMED ARGUMENTS: NEVER use 'selector=', 'key=', 'txt=', etc. Use positional only.
2. FORMAT: You MUST use the PIPE-SEPARATED format (| Keyword | arg |).
3. SELF-CORRECTION: 
   - ALWAYS use scalar syntax $\{elements\} to store Get Elements. NEVER use @{elements} for assignment.
   - BEFORE using Get Elements or Get Text, you MUST explicitly wait for that element.
4. LIBRARIES: Use Browser, OperatingSystem, JSONLibrary, Collections.
5. JSON: Use '| \${json} | Evaluate | json.dumps(\${data}, indent=4) |'. NEVER use 'Convert To Json'.
6. HTML CAPTURE: ALWAYS use 'debug.html' as the filename and 'Get Property | html | outerHTML' to get content. ALWAYS write to \${OUTPUT DIR}\${/}debug.html. Ensure a 'Test Teardown' with 'Capture HTML' is present.
7. KEYWORDS: Use 'Get Elements' or 'Get Element'. NEVER use 'Query Selector'.
8. WAITING: ALWAYS use 'Wait For Elements State'. NEVER use 'Wait For Selector' or 'Wait For Element'.
9. SEPARATORS: Ensure at least 4 spaces or | are used. If the error says "No keyword with name 'X Y'", it usually means a missing separator between 'X' and 'Y'.

Return the response strictly in JSON format with the following keys:
- analysis: A detailed analysis of why the script failed.
- fixProposal: The FULL corrected .robot script content (STRING ONLY).

IMPORTANT JSON RULE: If you include a backslash in the 'analysis' or 'fixProposal' fields, remember that in JSON a literal backslash must be written as \\\\ (e.g., \\\\#id). However, our system will try to auto-fix it if you forget.`;

  const userMessage = `Script Content:
${scriptContent}

Execution Result:
Exit Code: ${executionResult ? executionResult.exitCode : 'Unknown'}
STDOUT: ${executionResult ? executionResult.stdout : 'N/A'}
STDERR: ${executionResult ? executionResult.stderr : 'N/A'}`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ], { response_format: { type: 'json_object' } });

  let result = extractJson(response.content);
  if (Array.isArray(result)) {
    result = result[0];
  }

  // Robust handling if fixProposal is somehow still an object
  if (typeof result.fixProposal === 'object' && result.fixProposal !== null) {
    console.warn('[Debugger] fixProposal is an object, attempting to extract content or stringify');
    // If it has a 'code' or 'content' field, use that, otherwise stringify
    result.fixProposal = result.fixProposal.code || result.fixProposal.content || JSON.stringify(result.fixProposal, null, 2);
  }

  console.log(`[Debugger] Analysis: ${result.analysis}`);
  console.log(`[Debugger] Proposed Fix Content:\n--------------------------\n${result.fixProposal}\n--------------------------`);

  return {
    analysis: result.analysis,
    fixProposal: result.fixProposal,
    scriptContent: result.fixProposal, // Apply fix for next execution
    retryCount: retryCount + 1,
    history: [{
      attempt: retryCount + 1,
      analysis: result.analysis,
      fix_proposal: result.fixProposal,
      result: executionResult && executionResult.exitCode === 0 ? 'PASS' : 'FAIL'
    }]
  };
}
