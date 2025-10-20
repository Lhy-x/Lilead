'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { Question } from '@/types/form';

interface PublicFormResponse {
  id: string;
  name: string;
  description?: string | null;
  accentColor?: string | null;
  theme?: string | null;
  successTitle?: string | null;
  successMessage?: string | null;
  successVideoUrl?: string | null;
  enableTestMode: boolean;
  questions: Question[];
}

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();

  const [form, setForm] = useState<PublicFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'live' | 'test'>('live');

  useEffect(() => {
    const loadForm = async () => {
      try {
        const { data } = await api.get<PublicFormResponse>(`/public/forms/${slug}`);
        setForm(data);
        const visit = await api.post(`/public/forms/${slug}/visit`, { visitorId });
        setVisitorId(visit.data.visitorId);
      } catch (err) {
        console.error(err);
        setError('Formulaire introuvable ou indisponible.');
      } finally {
        setLoading(false);
      }
    };
    loadForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!form) return;
    const emailQuestion = form.questions.find((question) => question.type === 'EMAIL');
    if (emailQuestion && answers[emailQuestion.id] !== email) {
      setAnswers((prev) => ({ ...prev, [emailQuestion.id]: email }));
    }
  }, [email, form, answers]);

  const handleRequestVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.post(`/public/forms/${slug}/request-verification`, {
        email,
        honeypot: ''
      });
      setVerificationSent(true);
    } catch (err) {
      console.error(err);
      setError("Impossible d'envoyer l'email de vérification.");
    }
  };

  const handleConfirmVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.post(`/public/forms/${slug}/confirm-verification`, {
        email,
        code: verificationCode
      });
      setIsVerified(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Code de vérification invalide.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isVerified) {
      setError('Veuillez vérifier votre email avant de soumettre.');
      return;
    }

    try {
      setSubmitting(true);
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value
      }));

      await api.post(`/public/forms/${slug}/submit`, {
        email,
        phone,
        answers: formattedAnswers,
        metadata: { visitorId },
        honeypot: '',
        mode
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Impossible de soumettre le formulaire.');
    } finally {
      setSubmitting(false);
    }
  };

  const accent = form?.accentColor || '#6366f1';
  const containerStyle = useMemo(
    () => ({
      borderColor: accent,
      boxShadow: `0 25px 50px -12px ${accent}33`
    }),
    [accent]
  );

  if (loading) {
    return <p className="py-12 text-center text-slate-500">Chargement du formulaire...</p>;
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-lg text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!form) return null;

  if (success) {
    return (
      <div className="mx-auto mt-16 max-w-2xl rounded-3xl border bg-white p-10 text-center shadow-xl" style={containerStyle}>
        <h1 className="text-3xl font-semibold" style={{ color: accent }}>
          {form.successTitle || 'Merci !'}
        </h1>
        <p className="mt-4 text-slate-600">{form.successMessage || 'Nous vous recontacterons rapidement.'}</p>
        {form.successVideoUrl && (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl">
            <iframe
              src={form.successVideoUrl}
              className="h-full w-full"
              allow="autoplay; fullscreen"
              title="Vidéo de remerciement"
            />
          </div>
        )}
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white"
        >
          Retour au site
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 max-w-3xl rounded-3xl border bg-white p-8 shadow-xl" style={containerStyle}>
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold" style={{ color: accent }}>
          {form.name}
        </h1>
        <p className="text-slate-500">{form.description}</p>
      </header>

      <section className="mt-8 space-y-8">
        <form onSubmit={handleRequestVerification} className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <h2 className="text-lg font-semibold">1. Vérifiez votre email</h2>
          <input
            type="email"
            required
            placeholder="Votre adresse email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={verificationSent}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {verificationSent ? 'Email envoyé' : 'Recevoir un code' }
          </button>
        </form>

        {verificationSent && !isVerified && (
          <form onSubmit={handleConfirmVerification} className="space-y-3 rounded-2xl bg-slate-50 p-4">
            <h2 className="text-lg font-semibold">2. Entrez le code reçu</h2>
            <input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="Code à 6 chiffres"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
            />
            <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Confirmer
            </button>
          </form>
        )}

        {isVerified && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
            <div className="grid gap-5">
              {form.questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <label className="text-sm font-medium">
                    {question.label}
                    {question.isRequired && <span className="text-red-500"> *</span>}
                  </label>
                  {renderQuestionInput(question, answers[question.id] || '', (value) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: value }))
                  )}
                  {question.helperText && <p className="text-xs text-slate-400">{question.helperText}</p>}
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone (optionnel)</label>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
                />
              </div>
              {form.enableTestMode && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={mode === 'test'}
                    onChange={(event) => setMode(event.target.checked ? 'test' : 'live')}
                  />
                  Simuler un envoi (mode test)
                </label>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function renderQuestionInput(
  question: Question,
  value: string,
  onChange: (value: string) => void
) {
  switch (question.type) {
    case 'EMAIL':
      return (
        <input
          type="email"
          required={question.isRequired}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
        />
      );
    case 'PHONE':
      return (
        <input
          type="tel"
          required={question.isRequired}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
        />
      );
    case 'LONG_TEXT':
    case 'CHATBOX':
      return (
        <textarea
          required={question.isRequired}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={question.type === 'CHATBOX' ? 6 : 4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
        />
      );
    default:
      return (
        <input
          required={question.isRequired}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
        />
      );
  }
}
