'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { RequireAuth } from '@/components/require-auth';
import { api } from '@/lib/api';
import { FormDetail, FormSummary, LeadRule, Question } from '@/types/form';
import { FormMetrics } from '@/types/stats';
import { QuestionType, questionTypeLabels } from '@/types/question';

const fetchFormDetail = async (id: string) => {
  const { data } = await api.get<FormDetail>(`/forms/${id}`);
  return data;
};

const fetchFormMetrics = async (id: string) => {
  const { data } = await api.get<FormMetrics>(`/stats/forms/${id}`);
  return data;
};

const questionTypes: QuestionType[] = ['EMAIL', 'PHONE', 'SHORT_TEXT', 'LONG_TEXT', 'CHATBOX'];

export default function FormDetailPage() {
  const params = useParams<{ id: string }>();
  const formId = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();

  const { data: form, isLoading } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => fetchFormDetail(formId!)
  });

  const { data: metrics } = useQuery({
    queryKey: ['form-metrics', formId],
    queryFn: () => fetchFormMetrics(formId!),
    enabled: Boolean(formId)
  });

  const [questionOrder, setQuestionOrder] = useState(0);

  useEffect(() => {
    if (form) {
      setQuestionOrder(form.questions.length);
    }
  }, [form]);

  const updateFormMutation = useMutation({
    mutationFn: (payload: Partial<FormSummary>) => api.put(`/forms/${formId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: () => api.post(`/forms/${formId}/publish`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
    }
  });

  const addQuestionMutation = useMutation({
    mutationFn: (payload: Partial<Question>) => api.post(`/forms/${formId}/questions`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
    }
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, ...payload }: Partial<Question> & { questionId: string }) =>
      api.put(`/forms/${formId}/questions/${questionId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => api.delete(`/forms/${formId}/questions/${questionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form', formId] })
  });

  const leadRuleMutation = useMutation({
    mutationFn: (payload: Partial<LeadRule>) => api.post(`/forms/${formId}/rules`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form', formId] })
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.delete(`/forms/${formId}/rules/${ruleId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form', formId] })
  });

  const notifyMutation = useMutation({
    mutationFn: () => api.post(`/forms/${formId}/notify-qualified`, {}),
    onSuccess: () => alert('Email envoyé aux leads qualifiés')
  });

  const handleUpdateForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name'),
      description: formData.get('description'),
      successTitle: formData.get('successTitle'),
      successMessage: formData.get('successMessage'),
      successVideoUrl: formData.get('successVideoUrl'),
      enableTestMode: formData.get('enableTestMode') === 'on'
    };
    await updateFormMutation.mutateAsync(payload);
    alert('Formulaire mis à jour');
  };

  const handleAddQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      label: String(formData.get('label') || ''),
      helperText: formData.get('helperText') ? String(formData.get('helperText')) : undefined,
      type: String(formData.get('type') || 'SHORT_TEXT'),
      isRequired: formData.get('isRequired') === 'on',
      order: Number(formData.get('order') ?? questionOrder)
    };
    await addQuestionMutation.mutateAsync(payload as Partial<Question>);
    event.currentTarget.reset();
    setQuestionOrder((prev) => prev + 1);
  };

  const handleAddRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      fieldKey: String(formData.get('fieldKey') || ''),
      operator: String(formData.get('operator') || 'contains'),
      value: String(formData.get('value') || ''),
      weight: Number(formData.get('weight'))
    };
    await leadRuleMutation.mutateAsync(payload as Partial<LeadRule>);
    event.currentTarget.reset();
  };

  const dailyData = useMemo(() => metrics?.metrics.daily ?? [], [metrics?.metrics.daily]);

  return (
    <RequireAuth>
      {isLoading || !form ? (
        <p className="text-slate-500">Chargement...</p>
      ) : (
        <div className="space-y-10">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-semibold">{form.name}</h1>
              <p className="text-sm text-slate-500">Slug public : {form.slug}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => togglePublishMutation.mutate()}
                className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary"
              >
                {form.isPublished ? 'Mettre en brouillon' : 'Publier le formulaire'}
              </button>
              <button
                onClick={() => notifyMutation.mutate()}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Email leads qualifiés
              </button>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={handleUpdateForm}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-lg font-semibold">Paramètres</h2>
              <div>
                <label className="text-sm font-medium">Nom</label>
                <input
                  name="name"
                  defaultValue={form.name}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  defaultValue={form.description ?? ''}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Titre de succès</label>
                  <input
                    name="successTitle"
                    defaultValue={form.successTitle ?? ''}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL vidéo (Loom, VidAI...)</label>
                  <input
                    name="successVideoUrl"
                    defaultValue={form.successVideoUrl ?? ''}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Message de succès</label>
                <textarea
                  name="successMessage"
                  defaultValue={form.successMessage ?? ''}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="enableTestMode" defaultChecked={form.enableTestMode} />
                  Activer le mode test
                </label>
              </div>
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Enregistrer
              </button>
            </form>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold">Statistiques</h2>
                {metrics ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Visites</p>
                      <p className="text-xl font-semibold">{metrics.metrics.visits}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Soumissions</p>
                      <p className="text-xl font-semibold">{metrics.metrics.submissions}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Leads qualifiés</p>
                      <p className="text-xl font-semibold">{metrics.metrics.qualified}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Taux de vérification</p>
                      <p className="text-xl font-semibold">{metrics.metrics.verificationRate}%</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Aucune donnée pour l'instant.</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold">Soumissions quotidiennes</h2>
                <div className="h-56">
                  {dailyData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyData}>
                        <defs>
                          <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b20" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#color)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-slate-500">Pas encore de soumissions récentes.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow dark:border-slate-800 dark:bg-slate-900">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Questions</h2>
                <span className="text-sm text-slate-500">{form.questions.length} / 30</span>
              </header>
              <form onSubmit={handleAddQuestion} className="grid gap-3 text-sm">
                <div>
                  <label className="font-medium">Intitulé</label>
                  <input
                    name="label"
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-medium">Texte d'aide</label>
                  <input
                    name="helperText"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium">Type</label>
                    <select
                      name="type"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    >
                      {questionTypes.map((type) => (
                        <option key={type} value={type}>
                          {questionTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-medium">Ordre</label>
                    <input
                      name="order"
                      type="number"
                      min={0}
                      value={questionOrder}
                      onChange={(event) => setQuestionOrder(Number(event.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isRequired" />
                  Réponse obligatoire
                </label>
                <button
                  type="submit"
                  disabled={addQuestionMutation.isPending}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Ajouter la question
                </button>
              </form>
              <ul className="space-y-3">
                {form.questions.map((question) => (
                  <li
                    key={question.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{question.label}</p>
                        <p className="text-xs text-slate-500">
                          {questionTypeLabels[question.type]} • {question.isRequired ? 'Obligatoire' : 'Optionnel'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateQuestionMutation.mutate({
                              questionId: question.id,
                              label: question.label,
                              helperText: question.helperText,
                              type: question.type,
                              isRequired: !question.isRequired,
                              order: question.order
                            })
                          }
                          className="rounded-full border border-primary px-3 py-1 text-xs text-primary"
                        >
                          {question.isRequired ? 'Rendre optionnel' : 'Rendre obligatoire'}
                        </button>
                        <button
                          onClick={() => deleteQuestionMutation.mutate(question.id)}
                          className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-500"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Règles IA</h2>
              <form onSubmit={handleAddRule} className="grid gap-3 text-sm">
                <div>
                  <label className="font-medium">Champ</label>
                  <input
                    name="fieldKey"
                    placeholder="ex: Budget"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium">Opérateur</label>
                    <select
                      name="operator"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="contains">Contient</option>
                      <option value="equals">Égale</option>
                      <option value="starts_with">Commence par</option>
                      <option value="ends_with">Se termine par</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-medium">Poids</label>
                    <input
                      name="weight"
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      defaultValue={1}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-medium">Valeur attendue</label>
                  <input
                    name="value"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={leadRuleMutation.isPending}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Ajouter la règle
                </button>
              </form>
              <ul className="space-y-3">
                {form.leadRules.map((rule) => (
                  <li
                    key={rule.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800"
                  >
                    <div>
                      <p className="font-medium">{rule.fieldKey}</p>
                      <p className="text-xs text-slate-500">
                        {rule.operator} {rule.value} • poids {rule.weight}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                      className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-500"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </RequireAuth>
  );
}
