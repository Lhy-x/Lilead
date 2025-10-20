import axios from 'axios';

import { env } from '../config/env';
import { prisma } from '../config/prisma';

export type LeadFeature = {
  questionId: string;
  label: string;
  value: string;
};

export type LeadEvaluation = {
  score: number;
  status: 'QUALIFIED' | 'DISQUALIFIED';
  summary: string;
};

const normalizeValue = (value: string) => value.toLowerCase();

export const evaluateLead = async (
  formId: string,
  features: LeadFeature[],
  email?: string
): Promise<LeadEvaluation> => {
  const rules = await prisma.leadRule.findMany({
    where: {
      OR: [{ formId }, { formId: null }]
    }
  });

  let score = 0;
  for (const rule of rules) {
    const feature = features.find((f) => f.label === rule.fieldKey);
    if (!feature) continue;

    const normalized = normalizeValue(feature.value);
    const ruleValue = normalizeValue(rule.value);
    const matches =
      (rule.operator === 'contains' && normalized.includes(ruleValue)) ||
      (rule.operator === 'equals' && normalized === ruleValue) ||
      (rule.operator === 'starts_with' && normalized.startsWith(ruleValue)) ||
      (rule.operator === 'ends_with' && normalized.endsWith(ruleValue));

    if (matches) {
      score += rule.weight;
    }
  }

  if (env.geminiApiKey) {
    try {
      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Tu es un assistant qui qualifie des leads pour un SaaS B2B. ` +
                    `Analyse les informations suivantes et réponds strictement en JSON au format {"score": number entre 0 et 1, "status": "QUALIFIED" ou "DISQUALIFIED", "summary": string en français}. ` +
                    `Utilise les règles implicites de qualification et rappelle-toi que la décision finale doit être cohérente avec le score.\n` +
                    `Identifiant du formulaire: ${formId}.\n` +
                    `Email: ${email ?? 'non fourni'}.\n` +
                    `Caractéristiques:\n${features
                      .map((feature) => `- ${feature.label}: ${feature.value}`)
                      .join('\n')}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const candidate = data.candidates?.[0];
      const textOutput =
        candidate?.content?.parts?.map((part: { text?: string }) => part.text).filter(Boolean).join('\n') ?? '';

      if (textOutput) {
        try {
          const parsed = JSON.parse(textOutput) as LeadEvaluation;
          if (
            typeof parsed.score === 'number' &&
            (parsed.status === 'QUALIFIED' || parsed.status === 'DISQUALIFIED') &&
            typeof parsed.summary === 'string'
          ) {
            return parsed;
          }
        } catch (parseError) {
          console.warn('Gemini response parsing failed, using local rules.', parseError);
        }
      }
    } catch (error) {
      console.warn('Gemini request failed, falling back to local rules.', error);
    }
  }

  const status = score >= rules.reduce((acc, rule) => acc + rule.weight, 0) * 0.6 ? 'QUALIFIED' : 'DISQUALIFIED';
  return {
    score,
    status,
    summary:
      status === 'QUALIFIED'
        ? "Le lead satisfait aux critères définis."
        : "Le lead ne respecte pas suffisamment les critères."
  };
};
