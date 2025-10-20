import { QuestionType } from './question';

export type FormSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  accentColor?: string | null;
  theme?: string | null;
  isPublished: boolean;
  successTitle?: string | null;
  enableTestMode: boolean;
  _count: {
    submissions: number;
    visits: number;
  };
};

export type FormDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  accentColor?: string | null;
  theme?: string | null;
  isPublished: boolean;
  successTitle?: string | null;
  successMessage?: string | null;
  successVideoUrl?: string | null;
  enableTestMode: boolean;
  questions: Question[];
  submissions: Submission[];
  leadRules: LeadRule[];
};

export type Question = {
  id: string;
  formId: string;
  label: string;
  helperText?: string | null;
  type: QuestionType;
  isRequired: boolean;
  order: number;
};

export type Submission = {
  id: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  status: 'PENDING' | 'QUALIFIED' | 'DISQUALIFIED';
  aiScore?: number | null;
  aiSummary?: string | null;
  createdAt: string;
};

export type LeadRule = {
  id: string;
  fieldKey: string;
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with';
  value: string;
  weight: number;
};

export type QuestionPayload = {
  label: string;
  helperText?: string;
  type: QuestionType;
  isRequired: boolean;
  order: number;
};
