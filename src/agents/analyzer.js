import { extractJson } from '../lib/json-parser.js';

export async function analyzerNode(state, config) {
  const { llm } = config;
  const { html_content, analysis_goal, requirement, current_url } = state;

  const goal = analysis_goal || `Analyze elements for: ${requirement}`;
  console.log('\n[Analyzer] Analyzing HTML structure for goal:', goal);
  if (current_url) console.log(`[Analyzer] Current URL context: ${current_url}`);

  const systemPrompt = `You are an expert Web Element Analyzer with "State Awareness".
Your GOLDEN RULE: ONLY identify elements that are VISIBLE in the provided HTML.

STATE CHECK & ANALYSIS RULES:
1. Compare [Current URL] and [HTML Content] with the [Goal].
2. Identify the CURRENT STATE (e.g., "On Home Page", "On Search Results").
3. **NO GUESSING**: If the goal requires elements from a NEXT page (e.g., search results) but you are currently on a PREVIOUS page (e.g., home page), DO NOT guess selectors for the next page. 
4. **PHASED ANALYSIS**: Only provide selectors for elements you can actually see. If more elements are needed after a page transition, state that "Further analysis is required after navigation".
5. **STATE DIAGNOSIS**: 
   - "Correct Page": All goal elements should be here.
   - "Partial Page": Some elements found, but navigation is needed for others.
   - "Wrong Page": None of the goal elements can be found here.

Return a SINGLE JSON object:
- state_diagnosis: Detailed diagnosis of the current page state.
- selectors: Array of objects for VISIBLE elements only.
- strategy: Explanation of what was found and what is still missing for the next phase.`;

  const userMessage = `Goal: ${analysis_goal}
Current URL: ${current_url || 'Unknown'}
HTML Content (truncated):
${html_content ? html_content.substring(0, 10000) : 'No HTML content provided'}`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ], { response_format: { type: 'json_object' } });

  let result = extractJson(response.content);
  if (Array.isArray(result)) {
    result = result[0];
  }

  console.log('[Analyzer] Found selectors:');
  result.selectors.forEach(s => console.log(`  - ${s.description}: ${s.selector}`));

  return {
    analysis_results: result.selectors,
    analysis_strategy: result.strategy
  };
}
