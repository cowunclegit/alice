export function extractJson(text) {
  // console.log('[JSON Parser] Input length:', text.length);

  // Preliminary cleanup: Fix invalid escape sequences (like \#) that LLMs often generate.
  // We match valid JSON escapes first to skip them, and only escape "naked" backslashes.
  const sanitizedText = text.replace(/\\(["\\\/bfnrtu])|\\/g, (match, p1) => {
    return p1 ? match : '\\\\\\\\'; // If p1 exists, it's a valid escape. Otherwise, escape the backslash.
  });
  
  // Priority 1: Markdown Block Extraction
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const markdownMatch = sanitizedText.match(markdownRegex);
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
  const firstBrace = sanitizedText.indexOf('{');
  const firstBracket = sanitizedText.indexOf('[');
  
  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = sanitizedText.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = sanitizedText.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = sanitizedText.substring(start, end + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      // console.log('[JSON Parser] Success using Priority 2');
      return parsed;
    } catch (e) {
      console.error('[JSON Parser] Priority 2 failure:', e.message);
      throw new Error(`Failed to parse extracted JSON: ${e.message}\nExtracted string: ${jsonStr}`);
    }
  }

  console.error('[JSON Parser] No JSON found in text:', sanitizedText);
  throw new Error('No JSON structure found in response');
}
