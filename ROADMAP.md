# FILE: ROADMAP.md

# ROADMAP DU PROJET

## Phase 0 : Setup & Fondations SaaS (✅ Terminé)
- Initialisation React/Vite + TailwindCSS.
- Configuration Firebase Auth (Google).
- Layout principal (Sidebar, Topbar, Routing basique).

## Phase 1 : MVP Journaling + Analytics + Tasks + News (✅ Terminé)
- Intégration du graphique Lightweight Charts.
- Module de Paper Trading (Draft trades, exécution).
- Journal de trading (Notes, Émotions, Tags).
- Tâches quotidiennes (Checklists).
- Calendrier économique (News).

## Phase 2 : Broker Sync + Replay Session (✅ Terminé)
- UI de connexion Broker (Tradovate, etc.).
- Import manuel de trades via CSV.
- Fusion des trades importés avec l'historique local.
- Amélioration du mode Replay (Backtest).

## Phase 3 : Backtesting v1 + Stratégie Versionning (✅ Terminé)
- Sauvegarde des sessions de backtest.
- Comparateur de stratégies (Win rate par setup).
- Export des résultats de backtest.
- Ajout de la page Profil (gestion utilisateur).
- Ajout de la page Admin (gestion des utilisateurs).

## Phase 4 : Bots demo + Guardrails (✅ Terminé)
- Création de règles d'entrée automatiques simples (ex: croisement EMA).
- Mode "Simulated" tournant en tâche de fond.
- Limites de risque (Daily Loss Limit) bloquant la plateforme.
