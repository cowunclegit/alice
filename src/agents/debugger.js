import { extractJson } from '../lib/json-parser.js';

export async function debuggerNode(state, config) {
  const { llm } = config;
  const { executionResult, scriptContent, retryCount, analysis_results, element_inventory, current_url, page_history } = state;

  console.log(`\n[Debugger] 🚀 Node Start`);
  console.log(`[Debugger] 📂 State: URL=${current_url || 'N/A'}, Retry=${retryCount}, History=${page_history?.length || 0} steps`);
  console.log(`[Debugger] Analyzing failure (Attempt ${retryCount + 1})...`);
  console.log(`[Debugger] 🔍 Data Check - Inventory present: ${!!element_inventory}, Analysis results: ${analysis_results?.length || 0}`);
  
  let analyzerContext = '';
  if (page_history && page_history.length > 0) {
    analyzerContext = `
### SESSION MEMORY (PAST VISITS):
${page_history.map((h, i) => `[Page ${i + 1}] URL: ${h.url}\nDiagnosis: ${h.diagnosis || 'N/A'}`).join('\n---\n')}

### CURRENT PAGE ELEMENT INVENTORY:
${element_inventory || 'No inventory available.'}
`;
  }

  const systemPrompt = `You are a Robot Framework Debugger.
Analyze the failure and fix the .robot script using the provided Element Inventory and Session Memory.

### CORE RULES:
1. **ID ESCAPING**: ALWAYS escape '#' in CSS selectors with a single backslash: \\#id-name.
2. **SYNTAX**: Use PIPE-SEPARATED format only. No named arguments.
3. **WAITING**: Use 'Wait For Load State | networkidle' for transitions. 
4. **AMBIGUITY**: If multiple elements match, use more specific attributes (role, class, index) from the inventory.
5. **CAPTURE**: Ensure 'Capture HTML' is used to maintain visibility for future analysis.

Return JSON:
{
  "analysis": "Explanation of the fix based on the inventory",
  "fixProposal": "The FULL corrected .robot script content"
}`;

  const userMessage = `Current Script:
${scriptContent}

Execution Error:
${executionResult ? executionResult.stdout + '\n' + executionResult.stderr : 'Unknown error'}

Current URL: ${current_url}`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ], { response_format: { type: 'json_object' } });

  let result = extractJson(response.content);
  if (Array.isArray(result)) {
    result = result[0];
  }

  console.log(`[Debugger] Analysis: ${result.analysis}`);
  console.log(`[Debugger] Proposed Fix Content:\n--------------------------\n${result.fixProposal}\n--------------------------`);

  return {
    analysis: result.analysis,
    fixProposal: result.fixProposal,
    scriptContent: result.fixProposal,
    retryCount: retryCount + 1,
    history: [{
      attempt: retryCount + 1,
      analysis: result.analysis,
      fix_proposal: result.fixProposal,
      result: executionResult && executionResult.exitCode === 0 ? 'PASS' : 'FAIL'
    }]
  };
}
