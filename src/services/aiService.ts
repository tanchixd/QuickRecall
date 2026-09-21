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
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });

      // If this endpoint returned 404, try the next endpoint in the list
      if (response.status === 404 && i < endpoints.length - 1) {
        continue;
      }

      if (!response.ok) {
        let errorMsg = '';
        try {
          const errData = await response.json();
          errorMsg = errData.error || errData.message || '';
        } catch {
          // JSON parsing failed (e.g. HTML error page)
        }
        if (!errorMsg) {
          errorMsg = `Server error (HTTP ${response.status}). Please try again in a few moments.`;
        }
        throw new Error(errorMsg);
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
