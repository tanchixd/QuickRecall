import { GenerateQuestionsPayload, GenerateQuestionsResponse } from '../types';

/**
 * Isolated AI service layer for QuickRecall.
 * Decouples the UI from the specific API endpoint or backend provider.
 */
export async function generateQuestions(
  payload: GenerateQuestionsPayload
): Promise<GenerateQuestionsResponse> {
  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const data: GenerateQuestionsResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('aiService: generateQuestions failed:', error);
    throw new Error(
      error.message || 'Unable to connect to the question generator. Please check your connection and try again.'
    );
  }
}
