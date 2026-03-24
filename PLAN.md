# Plan de Développement - SaaS Trading Journal & Bot Manager

**Repository :** [https://github.com/anwarhajji/ict-anwar-last-test.git](https://github.com/anwarhajji/ict-anwar-last-test.git)

## 1) Vision & Utilisateurs
- **Persona :** Trader indépendant (Futures/CFD) cherchant à professionnaliser son activité.
- **Objectifs :** Centraliser les données de trading, automatiser le journal, analyser la performance et gérer des stratégies algorithmiques en mode démo/simulé.
- **Résultats attendus :** Meilleure discipline, détection des biais psychologiques, optimisation des setups.

## 2) Modules
### A) Auth & SaaS (MVP)
- Authentification via Firebase Auth (Google Login).
- Gestion des rôles (Admin, Member).
- Quotas de bots et d'historique selon le plan.

### B) Intégration Broker (Phase 1)
- Import manuel via CSV (Tradovate, MetaTrader).
- Connexion API (Tradovate) pour import automatique des trades/fills/fees.

### C) Journal de Trading (MVP)
- Journalisation automatique des trades importés.
- Ajout manuel de notes, screenshots et tags (émotions, erreurs).
- Tracker d'erreurs (Mistake Tracker).

### D) Analytics & Stats (MVP)
- KPIs : PnL, Win Rate, Profit Factor, Expectancy, Drawdown.
- Graphiques de courbe de capital (Equity Curve).
- Analyse par session, instrument et stratégie.

### E) News & Calendrier (MVP)
- Affichage des événements économiques à fort impact.
- Liaison automatique ou manuelle entre news et trades.

### F) Tâches & Checklists (MVP)
- Checklists pré-market et post-market.
- Suivi de la discipline journalière.

### G) Backtesting (Phase 2)
- Replay de session sur graphique.
- Journalisation des trades de backtest.

### H) Bots de Trading (MVP)
- Création de bots sur compte démo.
- Éditeur de stratégie en JavaScript.
- Moteur de simulation temps réel (simulé).

## 3) Pages UI (Routes)
- `/dashboard` : Vue d'ensemble (Stats + News + Tasks).
- `/journal` : Liste des trades et éditeur de notes.
- `/analytics` : Rapports détaillés et graphiques.
- `/news` : Calendrier économique.
- `/tasks` : Checklists quotidiennes.
- `/bots` : Gestion des bots et éditeur de code.
- `/settings` : Profil et connexions broker.

## 4) Modèle de Données (Firestore)
- `users/{uid}` : Profil, préférences, features activées, botSettings (balance, maxBots).
- `users/{uid}/data/trades` : Historique des trades réels/importés.
- `users/{uid}/data/bots` : Configuration des bots et stratégies personnalisées.
- `users/{uid}/data/tasks` : Logs des checklists quotidiennes.
- `users/{uid}/data/strategies` : Bibliothèque de stratégies de backtesting.

## 5) API Interne
- `geminiService` : Analyse IA des trades et détection d'erreurs.
- `brokerService` : Sync avec Tradovate/Brokers.
- `simulationEngine` : Exécution des scripts de bots.

## 6) Definition of Done (DoD)
- Code TypeScript sans erreurs.
- Interface responsive et accessible.
- Données persistées dans Firebase.
- Sécurité des données via Firestore Rules.
