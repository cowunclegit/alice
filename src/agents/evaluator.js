import { extractJson } from '../lib/json-parser.js';

export async function evaluatorNode(state, config) {
  const { llm } = config;
  const { requirement, executionResult, current_url, analysis_results } = state;

  console.log('\n[Evaluator] Performing semantic verification of results...');

  const systemPrompt = `You are a Robot Framework Semantic Evaluator.
Compare the execution result and the CURRENT page state against the original user intent.

Consider:
1. Did the script reach the correct page? (Current URL: ${current_url})
2. Are the required elements present? (Analyzed Selectors: ${JSON.stringify(analysis_results)})
3. Even if exitCode is 0, is the outcome semantically correct?

Return the response strictly as a SINGLE JSON object.
Required keys:
- isSuccess: boolean (true if intent fully met)
- needsReplan: boolean (true if the current plan is invalid for the current page state and needs a major update)
- analysis: Reasoning for success/failure and why a replan is or isn't needed.`;

  const userMessage = `Requirement: ${requirement}
Execution Result: ${JSON.stringify(executionResult)}`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ], { response_format: { type: 'json_object' } });

  let result = extractJson(response.content);
  if (Array.isArray(result)) result = result[0];

  console.log(`[Evaluator] Success: ${result.isSuccess}, Needs Re-plan: ${result.needsReplan}`);
  console.log(`[Evaluator] Analysis: ${result.analysis}`);

  return {
    isSuccess: result.isSuccess,
    needsReplan: result.needsReplan,
    analysis: result.analysis
  };
}
