export function extractJson(text) {
  // console.log('[JSON Parser] Input length:', text.length);
  
  // Priority 1: Markdown Block Extraction
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const markdownMatch = text.match(markdownRegex);
  if (markdownMatch) {
    try {
      const parsed = JSON.parse(markdownMatch[1].trim());
      // console.log('[JSON Parser] Success using Priority 1');
      return parsed;
    } catch (e) {
      // If markdown block parsing fails, try fallback
    }
  }

  // Priority 2: Brace/Bracket Matching (Fallback)
  // Find first { or [ and last } or ]
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  
  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = text.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = text.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = text.substring(start, end + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      // console.log('[JSON Parser] Success using Priority 2');
      return parsed;
    } catch (e) {
      console.error('[JSON Parser] Priority 2 failure:', e.message);
      throw new Error(`Failed to parse extracted JSON: ${e.message}\nExtracted string: ${jsonStr}`);
    }
  }

  console.error('[JSON Parser] No JSON found in text:', text);
  throw new Error('No JSON structure found in response');
}
