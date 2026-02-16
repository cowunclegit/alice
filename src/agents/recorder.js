export async function recorderNode(state, config) {
  const { db } = config;
  const { uuid, retryCount, scriptContent, analysis, fixProposal, executionResult } = state;

  console.log(`[Recorder] Logging attempt ${retryCount}. scriptContent type: ${typeof scriptContent}`);
  if (typeof scriptContent !== 'string') {
    console.log('[Recorder] WARNING: scriptContent is not a string!', scriptContent);
  }

  if (db && executionResult) {
    await db.addTrace({
      session_uuid: uuid,
      attempt: retryCount,
      code: scriptContent,
      analysis: analysis || 'Initial execution',
      fix_proposal: fixProposal || null,
      result: executionResult.exitCode === 0 ? 'PASS' : 'FAIL',
      screenshots: '[]' // TODO: Capture screenshots in executor
    });
  }

  return {};
}
