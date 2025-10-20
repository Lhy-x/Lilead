export type QuestionType = 'EMAIL' | 'PHONE' | 'SHORT_TEXT' | 'LONG_TEXT' | 'CHATBOX';

export const questionTypeLabels: Record<QuestionType, string> = {
  EMAIL: 'Email',
  PHONE: 'Téléphone',
  SHORT_TEXT: 'Réponse courte',
  LONG_TEXT: 'Réponse longue',
  CHATBOX: 'Chatbox'
};
