import { load } from 'cheerio';
import { extractJson } from '../lib/json-parser.js';

export async function analyzerNode(state, config) {
  const { llm } = config;
  const { html_content, analysis_goal, requirement, current_url, retryCount, page_history } = state;

  console.log(`\n[Analyzer] 🚀 Node Start`);
  console.log(`[Analyzer] 📂 State: URL=${current_url || 'N/A'}, Retry=${retryCount}, History=${page_history?.length || 0} steps`);

  const goal = analysis_goal || `Analyze elements for: ${requirement}`;
  console.log('\n[Analyzer] 🔍 Analyzing HTML structure...');
  console.log(`[Analyzer] Target Goal: ${goal}`);
  if (current_url) console.log(`[Analyzer] Current URL: ${current_url}`);
  console.log(`[Analyzer] Original HTML Length: ${html_content ? html_content.length : 0} chars`);

  // --- Cheerio-based Element Inventory Generation ---
  let elementInventory = '';
  if (html_content) {
    console.log('[Analyzer] 🛠 Generating Element Inventory with Cheerio...');
    const $ = load(html_content);
    
    // Target interactive and semantic elements
    const selectors = 'a, button, input, select, [role="button"], [role="tab"], [data-clk], [data-testid], h1, h2, h3, li, .news_tit, .news_contents';
    const elements = $(selectors);
    
    let count = 0;
    elements.each((i, el) => {
      if (count > 500) return false; // Limit to 500 elements to keep context small

      const $el = $(el);
      const tag = el.name;
      const id = $el.attr('id');
      const cls = $el.attr('class');
      const role = $el.attr('role');
      const name = $el.attr('name');
      const type = $el.attr('type');
      const title = $el.attr('title');
      const alt = $el.attr('alt');
      const text = $el.text().trim().substring(0, 60).replace(/\s+/g, ' ');
      const dataClk = $el.attr('data-clk');
      const dataTestid = $el.attr('data-testid');
      const placeholder = $el.attr('placeholder');

      // Skip elements that have absolutely no identifying features or text
      if (!id && !cls && !text && !name && !role && !dataClk && !dataTestid && !title) return;

      let entry = `<${tag}`;
      if (id) entry += ` id="#${id}"`;
      if (cls) entry += ` class=".${cls.trim().split(/\s+/).join('.')}"`;
      if (role) entry += ` role="${role}"`;
      if (name) entry += ` name="${name}"`;
      if (type) entry += ` type="${type}"`;
      if (title) entry += ` title="${title}"`;
      if (alt) entry += ` alt="${alt}"`;
      if (placeholder) entry += ` placeholder="${placeholder}"`;
      if (dataClk) entry += ` data-clk="${dataClk}"`;
      if (dataTestid) entry += ` data-testid="${dataTestid}"`;
      
      // Add text content if present
      if (text) entry += `> Text: "${text}"</${tag}>`;
      else entry += ' />';

      elementInventory += `[${count}] ${entry}\n`;
      count++;
    });
  }
  
  console.log(`[Analyzer] 📊 Inventory size: ${elementInventory.length} chars (${elementInventory.split('\n').length} elements)`);

  const systemPrompt = `You are a Web Structure Analyzer with "State Awareness".
Your goal is to identify the current page and find correct selectors for the goal.

### CONTEXT:
- Target Goal: ${goal}
- Current URL: ${current_url || 'Unknown'}
- Page History: ${JSON.stringify(page_history || [])}

### STATE ANALYSIS RULES:
1. **Identify Page Phase**: Look at the URL and History to determine where we are in the flow.
2. **Selector Accuracy**: Only return selectors for elements visible in the provided inventory.
3. **SELECTOR ESCAPING**: ALL CSS selectors starting with '#' MUST be returned with a backslash: \#id-name. This is a Robot Framework syntax requirement.

Return a SINGLE JSON object:
- state_diagnosis: Explanation of the current page state.
- selectors: Array of { description, selector } found in the inventory.
- strategy: Next immediate action based on the findings.`;

  const userMessage = `Goal: ${analysis_goal}
Current URL: ${current_url || 'Unknown'}
Element Inventory:
${elementInventory}`;

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ], { response_format: { type: 'json_object' } });

  let result = extractJson(response.content);
  if (Array.isArray(result)) {
    result = result[0];
  }

  const diagnosis = result.state_diagnosis || 'Unknown';
  console.log(`[Analyzer] ✅ Analysis Complete. Diagnosis: ${diagnosis}`);
  if (result.strategy) console.log(`[Analyzer] 🎯 Strategy: ${result.strategy}`);
  
  return {
    analysis_results: result.selectors || [],
    analysis_strategy: result.strategy || '',
    element_inventory: elementInventory,
    // Add inventory to history for this specific URL
    page_history: [{
      url: current_url,
      inventory: elementInventory,
      diagnosis: diagnosis
    }],
    html_content: null 
  };
}
