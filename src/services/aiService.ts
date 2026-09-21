import { GenerateQuestionsPayload, GenerateQuestionsResponse } from '../types';

/**
 * Isolated AI service layer for QuickRecall.
 * Decouples the UI from the specific API endpoint or backend provider.
 */
export async function generateQuestions(
  payload: GenerateQuestionsPayload
): Promise<GenerateQuestionsResponse> {
  const endpoints = ['/api/generate-questions', '/api/generate'];
  let lastError: any = null;

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // If this endpoint returned 404, try the next endpoint in the list
      if (response.status === 404 && i < endpoints.length - 1) {
        continue;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data: GenerateQuestionsResponse = await response.json();
      return data;
    } catch (error: any) {
      lastError = error;
      if (i === endpoints.length - 1) {
        console.error('aiService: generateQuestions failed:', error);
        throw new Error(
          error.message || 'Unable to connect to the question generator. Please check your connection and try again.'
        );
      }
    }
  }

  throw lastError || new Error('Failed to generate questions. Please try again.');
}
