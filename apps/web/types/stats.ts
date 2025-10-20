export type OverviewStats = {
  forms: number;
  submissions: number;
  visits: number;
  qualified: number;
  verificationRate: number;
  conversionRate: number;
};

export type FormMetrics = {
  form: {
    id: string;
    name: string;
    description?: string | null;
  };
  metrics: {
    submissions: number;
    visits: number;
    qualified: number;
    verificationRate: number;
    conversionRate: number;
    daily: { date: string; count: number }[];
  };
};
