# Fonctionnement de l'IA de tri des leads

## Vue d'ensemble

Lilead propose un moteur de qualification hybride :

1. **Règles pondérées** définies par l'utilisateur (`LeadRule`). Chaque règle cible un champ (question ou donnée dérivée), applique un opérateur (contains, equals, starts_with, ends_with) et contribue à un score global.
2. **Endpoint IA externe** optionnel. Si `AI_API_KEY` et `AI_API_URL` sont définis, Lilead envoie les réponses brutes à ce service. Le service doit répondre au format :

```json
{
  "score": 0.8,
  "status": "QUALIFIED",
  "summary": "Lead présentant un budget élevé."
}
```

Si l'appel échoue ou n'est pas configuré, Lilead retombe automatiquement sur les règles locales.

## Calcul local

```text
score = Σ (poids de la règle) pour chaque règle satisfaite
status = QUALIFIED si score ≥ 60% du score maximal, sinon DISQUALIFIED
summary = message prérempli selon le statut
```

Les champs pris en compte correspondent aux labels de questions. Exemple : pour cibler la question "Budget mensuel", définissez la règle avec `fieldKey = "Budget mensuel"`.

## Extension

- Ajouter des opérateurs dans `apps/server/src/utils/ai.ts`.
- Brancher un LLM interne en remplissant `AI_API_URL`.
- Les règles peuvent être combinées avec des données tierces (ex : enrichissement via Clearbit) en modifiant le service d'évaluation.

## Logs & monitoring

Chaque email envoyé est enregistré dans `EmailLog`. Les évaluations IA sont stockées dans `Submission.aiScore` et `Submission.aiSummary` pour audit.
