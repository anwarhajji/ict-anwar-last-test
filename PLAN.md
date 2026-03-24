# FILE: PLAN.md

# SPÉCIFICATION FONCTIONNELLE DÉTAILLÉE

## 1) Vision & utilisateurs
- **Persona** : Trader solo (Futures/CFD), Coach de trading, Prop firm trader.
- **Objectifs** : Centraliser l'analyse technique, le journaling, et le suivi de performance pour améliorer la discipline et la rentabilité.
- **Résultats attendus** : Détection des erreurs récurrentes, mesure précise de l'expectancy, amélioration du Risk/Reward.

## 2) Modules (MVP vs Futur)
- **A) Auth & SaaS** : MVP (Google Auth, Workspace unique). Futur (Rôles, Stripe, Multi-workspaces).
- **B) Broker Sync** : MVP (Import CSV manuel, UI de connexion API). Futur (Webhooks Tradovate/NinjaTrader en temps réel).
- **C) Journal** : MVP (Notes, Tags, Émotions, Erreurs). Futur (Upload de screenshots, auto-tagging).
- **D) Analytics** : MVP (PnL journalier/hebdo/mensuel, Win Rate, Drawdown). Futur (Heatmaps, analyse par heure/jour).
- **E) News & Calendrier** : MVP (Flux statique/mocké des news High Impact). Futur (API ForexFactory live).
- **F) Tâches journalières** : MVP (Checklist Pre/Post market). Futur (Gamification, Streaks).
- **G) Backtesting** : MVP (Replay manuel sur chart). Futur (Moteur de règles automatisé).
- **H) Bots demo** : MVP (Paper trading manuel). Futur (Exécution algorithmique simulée).

## 3) Pages UI (routes)
- `/dashboard` : Vue d'ensemble (KPIs, mini-chart, tâches du jour).
- `/chart` : Graphique principal TradingView Lightweight Charts.
- `/trading` : Interface de Paper Trading (Draft trades, exécution).
- `/journal` : Liste des trades et éditeur de notes/émotions.
- `/tasks` : Checklist de discipline quotidienne.
- `/news` : Calendrier économique.
- `/stats` : Historique complet et métriques avancées.
- `/broker` : Synchronisation API et import CSV.
- `/setups` : Catalogue des modèles ICT.
- `/bots` : Gestion des bots de trading en mode simulé.
- `/risk` : Configuration des limites de risque (Daily Loss Limit, Max Drawdown).
- `/profile` : Gestion du compte utilisateur et de l'abonnement.
- `/admin` : Dashboard SaaS pour la gestion des utilisateurs.

## 4) Permissions (RBAC)
- **Owner** : Accès total, gestion de la facturation.
- **Member** : Peut trader et journaliser.
- **Viewer** : Lecture seule (pour les coachs).

## 5) Modèle de données PostgreSQL (Schéma Logique)
- `users` (id, email, role, created_at)
- `workspaces` (id, name, owner_id)
- `broker_connections` (id, user_id, broker_name, api_key_encrypted, status)
- `trades` (id, user_id, type, entry_price, sl, tp, pnl, status, created_at)
- `journal_entries` (id, trade_id, notes, emotions, mistakes, tags)
- `daily_tasks` (id, user_id, title, category, completed, date)

## 6) API interne (Endpoints REST)
- `POST /api/auth/login`
- `GET /api/trades` & `POST /api/trades`
- `POST /api/broker/sync`
- `GET /api/news`

## 7) Non-fonctionnel (qualité)
- **Sécurité** : Chiffrement des clés API broker (AES-256).
- **Performances** : Pagination des trades (limit 50).
- **RGPD** : Bouton "Supprimer mon compte et mes données".

## 8) Definition of Done (DoD)
- Code review passé.
- Tests unitaires sur le calcul du PnL.
- UI responsive (Mobile/Desktop).
- Déploiement CI/CD réussi.
