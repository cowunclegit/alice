import { load } from 'cheerio';
import { extractJson } from '../lib/json-parser.js';

export async function analyzerNode(state, config) {
  const { llm } = config;
  const { html_content, analysis_goal, requirement, current_url } = state;

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
    const selectors = 'a, button, input, select, [role="button"], [role="tab"], [data-clk], [data-testid], h1, h2, h3';
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
      const text = $el.text().trim().substring(0, 60).replace(/\s+/g, ' ');
      const dataClk = $el.attr('data-clk');
      const dataTestid = $el.attr('data-testid');
      const placeholder = $el.attr('placeholder');

      // Skip elements that have absolutely no identifying features or text
      if (!id && !cls && !text && !name && !role && !dataClk && !dataTestid) return;

      let entry = `<${tag}`;
      if (id) entry += ` id="#${id}"`;
      if (cls) entry += ` class=".${cls.trim().split(/\s+/).join('.')}"`;
      if (role) entry += ` role="${role}"`;
      if (name) entry += ` name="${name}"`;
      if (type) entry += ` type="${type}"`;
      if (placeholder) entry += ` placeholder="${placeholder}"`;
      if (dataClk) entry += ` data-clk="${dataClk}"`;
      if (dataTestid) entry += ` data-testid="${dataTestid}"`;
      
      // Add text content if present
      if (text) entry += `> Text: "${text}"</${tag}>`;
      else entry += ' />';

      elementInventory += entry + '\n';
      count++;
    });
  }
  
  console.log(`[Analyzer] 📊 Inventory size: ${elementInventory.length} chars (${elementInventory.split('\n').length} elements)`);

  const systemPrompt = `You are an expert Web Element Analyzer with "State Awareness".
Analyze the provided ELEMENT INVENTORY to find the best CSS selectors.

STATE CHECK & ANALYSIS RULES:
1. **Compare** [Current URL] and [Element Inventory] with the [Goal].
2. **Identify the CURRENT STATE** (e.g., "On Home Page", "On Search Results").
3. **NO GUESSING**: Only provide selectors for elements you can ACTUALLY see in the inventory. 
4. **PHASED ANALYSIS**: If the goal requires elements from a NEXT page but you are on a PREVIOUS page, DO NOT guess. State that "Further analysis is required after navigation".
5. **SELECTOR RULES**:
   - Target ID (#) if available and unique.
   - Use [role="..."], [name="..."], or text if ID is missing.
   - For ambiguous elements, use parent-child relationship or nth-child.

Return a SINGLE JSON object:
- state_diagnosis: Detailed diagnosis (e.g., "Correct Page", "Partial Page", "Wrong Page").
- selectors: Array of objects {description, selector}.
- strategy: Explanation of what was found and what is missing for the next phase.`;

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
  
  // Return everything to ensure state is fully updated for the Debugger
  return {
    analysis_results: result.selectors || [],
    analysis_strategy: result.strategy || '',
    element_inventory: elementInventory // This is the crucial information for Debugger
  };
}
