import path from 'path';

export async function executorNode(state, config) {
  const { runner, fs } = config;
  const { uuid, scriptContent } = state;

  console.log(`\n[Executor] Running script for session: ${uuid}`);
  
  if (!scriptContent) {
    console.error('[Executor] ERROR: scriptContent is undefined or null!');
    return {
      executionResult: { exitCode: -1, stdout: '', stderr: 'Script content is missing' }
    };
  }
  
  // Clean up the script content (remove markdown if present)
  let rawContent = scriptContent.replace(/```robot/g, '').replace(/```/g, '').trim();
  
  console.log('[Executor] Raw Script Content (from Coder):\n--------------------------\n' + rawContent + '\n--------------------------');

  let finalContent = rawContent;
  
  // 1. Convert pipe format to standard format (TABS)
  if (finalContent.includes('|')) {
    console.log('[Executor] Converting pipe-separated format to standard format...');
    finalContent = finalContent.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed === '' || !trimmed.includes('|')) return line;

      // Section headers
      if (trimmed.includes('***')) {
        return trimmed.replace(/\|/g, '').trim();
      }

      // Count leading pipes for indentation level
      // Example: "| | | Keyword" -> 3 pipes -> level 2 (2 * tab)
      const pipeMatch = trimmed.match(/^(\| *)+/);
      let indentLevel = 0;
      if (pipeMatch) {
        const pipeCount = (pipeMatch[0].match(/\|/g) || []).length;
        indentLevel = Math.max(0, pipeCount - 1);
      } else if (line.startsWith('\t') || line.startsWith('  ')) {
        indentLevel = 1;
      }

      // Extract tokens by splitting by pipe and filtering empty/whitespace-only parts
      const parts = trimmed.split('|')
        .map(p => p.trim())
        .filter(p => p !== '');

      if (parts.length === 0) return '';

      // Join parts with 4 SPACES for absolute reliability
      const joined = parts.join('    ');
      return '    '.repeat(indentLevel) + joined;
    }).join('\n');
  }

  // 2. Cleanup: Remove trailing whitespace
  finalContent = finalContent.split('\n').map(line => line.trimEnd()).join('\n');

  const scriptFilename = `${uuid}.robot`;
  await fs.saveScript(uuid, finalContent);
  console.log('[Executor] Normalized script content:\n--------------------------\n' + finalContent + '\n--------------------------');
  console.log('[Executor] Normalized script (escaped):\n' + JSON.stringify(finalContent));

  const resultsDir = path.join('robots', 'results', uuid);
  const result = await runner.execute(path.join('robots', scriptFilename), resultsDir);

  console.log(`[Executor] Execution finished with code: ${result.exitCode}`);
  
  let html_content = null;
  try {
    const debugHtmlPath = path.join(resultsDir, 'debug.html');
    html_content = await fs.readFile(debugHtmlPath);
    console.log('[Executor] Captured debug.html for analysis.');
  } catch (e) {
    // No debug.html found, which is fine
  }

  if (result.exitCode !== 0) {
    console.log('[Executor] STDOUT:', result.stdout);
    console.error('[Executor] STDERR:', result.stderr);
  }

  // Extract current URL and failed locator from STDOUT/STDERR
  let current_url = null;
  let analysis_goal = null;

  const urlMatch = result.stdout.match(/opened url: (https?:\/\/[^\s]+)/i);
  if (urlMatch) current_url = urlMatch[1];

  const locatorMatch = result.stdout.match(/waiting for locator\('(.+?)'\)/i) || 
                       result.stderr.match(/waiting for locator\('(.+?)'\)/i);
  
  if (locatorMatch) {
    const failedLocator = locatorMatch[1];
    analysis_goal = `The locator '${failedLocator}' failed. Find the correct, most reliable CSS selector for this element in the current HTML.`;
    console.log(`[Executor] Detected failed locator: ${failedLocator}`);
  }

  return {
    executionResult: result,
    html_content,
    current_url,
    analysis_goal
  };
}
