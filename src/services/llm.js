import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';

export class GeminiChatModel extends BaseChatModel {
  constructor(fields) {
    super(fields);
    this.apiKey = fields.apiKey;
    this.modelName = fields.modelName || 'gemini-2.5-flash';
    this.temperature = fields.temperature ?? 0.7;
    this.maxOutputTokens = fields.maxOutputTokens;
  }

  _llmType() {
    return 'gemini';
  }

  async _generate(messages, options, runManager) {
    const isJsonRequested = options?.response_format?.type === 'json_object';
    
    const systemMessage = messages.find(m => m._getType() === 'system');
    const chatMessages = messages.filter(m => m._getType() !== 'system');

    let systemInstruction = systemMessage ? systemMessage.content : '';
    if (isJsonRequested) {
      systemInstruction += '\nReturn the response strictly in JSON format according to the provided schema.';
    }

    const contents = chatMessages.map(m => {
      let role = 'user';
      if (m._getType() === 'ai') role = 'model';
      return {
        role,
        parts: [{ text: m.content }]
      };
    });

    const body = {
      contents,
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxOutputTokens,
        responseMimeType: isJsonRequested ? 'application/json' : 'text/plain'
      }
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    // console.log('[LLM] Raw API Response:', JSON.stringify(data, null, 2));
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('[LLM] No candidates in response:', JSON.stringify(data));
      throw new Error('Gemini API returned no candidates');
    }

    let text = data.candidates[0].content.parts[0].text;

    const message = new AIMessage(text);
    
    return {
      generations: [{
        text,
        message
      }]
    };
  }
}
