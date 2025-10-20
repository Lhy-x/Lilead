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

  if (env.aiApiKey && env.aiApiUrl) {
    try {
      const { data } = await axios.post<LeadEvaluation>(
        env.aiApiUrl,
        { features, email, formId },
        { headers: { Authorization: `Bearer ${env.aiApiKey}` } }
      );
      return data;
    } catch (error) {
      console.warn('AI API request failed, falling back to local rules.', error);
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
