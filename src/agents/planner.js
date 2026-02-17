import { extractJson } from '../lib/json-parser.js';

export async function plannerNode(state, config) {
  const { llm } = config;
  const { requirement, plan, analysis, current_url, retryCount, page_history } = state;

  console.log(`\n[Planner] 🚀 Node Start`);
  console.log(`[Planner] 📂 State: URL=${current_url || 'N/A'}, Retry=${retryCount}, History=${page_history?.length || 0} steps`);
  console.log('[Planner] Planning/Updating strategy...');

  const systemPrompt = `You are a Robot Framework Test Planner.
Your goal is to create or UPDATE a detailed test plan.

${plan ? `CURRENT PLAN: ${JSON.stringify(plan)}` : ''}
${analysis ? `REASON FOR RE-PLANNING: ${analysis}` : ''}
CURRENT URL: ${current_url || 'Starting Page'}

CRITICAL: "State-Aware Planning"
1. If this is a RE-PLAN, identify which steps were completed and focus on what's next.
2. Identify actions that cause a PAGE TRANSITION.
3. After every transition, you MUST include a step to "Wait for the new page and Analyze its structure".

Return the response strictly as a SINGLE JSON object.
Required keys:
- title: Short title
- description: Brief description
- plan: Updated array of objects {step, action}
- dynamicTimeout: Timeout string`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: requirement }
  ], { response_format: { type: 'json_object' } });

  let result = extractJson(response.content);
  if (Array.isArray(result)) {
    result = result[0];
  }
  
  console.log('[Planner] Generated Plan:');
  console.log(`- Title: ${result.title}`);
  console.log(`- Timeout: ${result.dynamicTimeout}`);
  result.plan.forEach(s => console.log(`  ${s.step}. ${s.action}`));

  return {
    ...result,
    plan_status: 'Approved'
  };
}
