import { extractJson } from '../lib/json-parser.js';

export async function finalizerNode(state, config) {
  const { db, llm, fs } = config;
  const { uuid, title, description, plan, isSuccess, scriptContent } = state;

  let finalScript = scriptContent;

  if (isSuccess && scriptContent) {
    console.log('[Finalizer] Optimizing final robot script (removing diagnostic code)...');
    
    const optimizationPrompt = `You are a Robot Framework Optimizer.
The provided script was successful but contains diagnostic/analysis code used during its development (e.g., Get Page Content, Create File debug.html, extra Wait keywords).

Your task is to:
0. ID SELECTOR ESCAPING: ALWAYS preserve or ensure that CSS selectors starting with '#' are escaped with a SINGLE backslash (e.g., \\#id-name). Robot Framework treats unescaped # as a comment.
1. FORMAT: You MUST maintain or use the PIPE-SEPARATED format (| Keyword | arg |).
2. REMOVE all lines that capture HTML to debug.html.
3. REMOVE redundant "Wait For Load State" or "Wait For Elements State" if they are excessive.
4. VALID KEYWORDS: NEVER use 'Wait For Selector'. Ensure 'Wait For Elements State' is used for waiting.
5. ENSURE the script remains fully functional and follows the positional argument style (no 'selector=', etc.).
6. KEEP only the essential logic for the task: ${title}.

Return ONLY the raw content of the optimized .robot file. No markdown code blocks.`;

    const response = await llm.invoke([
      { role: 'system', content: optimizationPrompt },
      { role: 'user', content: scriptContent }
    ]);
    
    finalScript = response.content;
    
    const optimizedFilename = `${uuid}_optimized.robot`;
    if (fs) {
      await fs.saveScript(optimizedFilename.replace('.robot', ''), finalScript);
      console.log(`[Finalizer] Optimized script saved as: ${optimizedFilename}`);
    }
  }

  console.log(`[Finalizer] Finalizing session ${uuid}.`);

  if (db) {
    const session = await db.getSession(uuid);
    if (!session) {
      await db.createSession({
        uuid,
        title: title || 'Untitled Robot',
        description: description || 'No description',
        plan: JSON.stringify(plan || []),
        plan_status: isSuccess ? 'Success' : 'Failed'
      });
    } else {
      await db.updateSessionStatus(uuid, isSuccess ? 'Success' : 'Failed');
    }
  }

  return {
    scriptContent: finalScript // Final state contains the clean script
  };
}
