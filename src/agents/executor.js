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

  const resultsDir = path.join('robots', 'results', uuid);
  const result = await runner.execute(path.join('robots', scriptFilename), resultsDir);

  console.log(`[Executor] Execution finished with code: ${result.exitCode}`);
  
  let html_content = null;
  try {
    const debugHtmlPath = path.join(resultsDir, 'debug.html');
    html_content = await fs.readFile(debugHtmlPath);
    console.log(`[Executor] ✅ Captured debug.html (${html_content.length} chars) for analysis.`);
  } catch (e) {
    console.log(`[Executor] ⚠️ Could not read debug.html from ${resultsDir}. Analyzer might be skipped.`);
  }

  if (result.exitCode !== 0) {
    console.log('[Executor] STDOUT:', result.stdout || '(empty)');
    console.error('[Executor] STDERR:', result.stderr || '(empty)');
  }

  // Extract current URL and failed locator from STDOUT/STDERR
  let analysis_goal = null;

  // Improved URL extraction: Look for explicit 'CURRENT_URL:' logs or standard Browser logs
  let detected_url = state.current_url || null;
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  
  // Look for: "CURRENT_URL: https://..." or "Opened url: https://..."
  const urlRegex = /(?:CURRENT_URL:|opened url|navigated to|url):?\s*(https?:\/\/[^\s"'\|]+)/gi;
  let match;
  let matches = [];
  while ((match = urlRegex.exec(stdout)) !== null) {
    matches.push(match[1]);
  }
  
  if (matches.length > 0) {
    detected_url = matches[matches.length - 1];
  }

  const new_history_entries = [];
  if (detected_url && (!state.page_history || state.page_history.length === 0 || state.page_history[state.page_history.length - 1].url !== detected_url)) {
    new_history_entries.push({ 
      url: detected_url, 
      timestamp: new Date().toISOString(),
      step: state.retryCount + 1
    });
  }

  const locatorMatch = stdout.match(/waiting for locator\('(.+?)'\)/i) || 
                       stderr.match(/waiting for locator\('(.+?)'\)/i);

  if (locatorMatch) {
    const failedLocator = locatorMatch[1];
    analysis_goal = `The locator '${failedLocator}' failed on page ${detected_url}. Find the correct, most reliable CSS selector for this element in the current HTML.`;
    console.log(`[Executor] Detected failed locator: ${failedLocator} at ${detected_url}`);
  } else if (result.exitCode !== 0) {
    // Capture the last error line from stdout/stderr for logic failures
    const lines = stdout.split('\n').filter(l => l.trim() !== '');
    const lastError = lines.find(l => l.includes('| FAIL |')) || lines[lines.length - 1];
    analysis_goal = `The script failed with error: "${lastError.trim()}". Analyze the page structure to find the correct elements for the current step.`;
    console.log(`[Executor] Detected logic failure: ${analysis_goal}`);
  }

  return {
    executionResult: result,
    html_content,
    element_inventory: null,
    analysis_results: [],
    current_url: detected_url,
    page_history: new_history_entries, // Only return the NEW entries for concat reducer
    analysis_goal
  };
}
