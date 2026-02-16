# Contract: Gemini REST API (subset)

## Endpoint: `generateContent`

**URL**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
**Method**: `POST`

### Request Body
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "string" }]
    }
  ],
  "system_instruction": {
    "role": "system",
    "parts": [{ "text": "string" }]
  },
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 2048,
    "responseMimeType": "application/json"
  }
}
```

### Success Response (200 OK)
```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [{ "text": "string" }]
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 20,
    "totalTokenCount": 30
  }
}
```
