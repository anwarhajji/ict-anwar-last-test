# FILE: CHANGEMENT.md

# CHANGELOG

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [Unreleased] - Maintenance & Ops
### Added
- Guide complet pour le test en local et sur serveur dédié (`GUIDE_LOCAL.md`).
- Variables d'environnement Firebase dans `.env.example`.
- Support de `VITE_FIREBASE_FIRESTORE_DATABASE_ID` dans `firebase.ts`.
### Fixed
- Correction des erreurs de rendu dans `AdminPanel` dues à des profils utilisateurs incomplets.
- Mise à jour des règles `firestore.rules` pour permettre aux rôles `SUPER_ADMIN` et `OWNER` de lister les utilisateurs.
- Correction de la fonction `isAdmin()` dans les règles pour éviter les erreurs `get()` sur des documents inexistants.

## [v0.4.0] - Phase 4
### Added
- Filtres (Jour, Impact) et explications dynamiques sur le calendrier économique (`NewsPanel`).
- `BotsPanel` pour la gestion des bots de trading automatisés en mode simulé.
- `RiskPanel` pour la configuration des limites de risque (Daily Loss Limit, Max Drawdown).
- Nouveaux types TypeScript (`Bot`, `RiskSettings`).
### Changed
- Mise à jour des permissions pour le rôle `OWNER` (accès complet à l'AdminPanel, bypass des restrictions de fonctionnalités).
- Amélioration de l'UI de l'AdminPanel (couleurs des badges de rôles, gestion des droits de modification).

## [v0.3.0] - Phase 3
### Added
- `BacktestPanel` pour la gestion des stratégies et des sessions de replay.
- `ProfilePanel` pour la gestion du compte utilisateur (abonnement, sécurité).
- `AdminPanel` pour la gestion des utilisateurs (SaaS admin view).
- Nouveaux types TypeScript (`Strategy`, `StrategyVersion`, `BacktestSession`, `UserProfile`).

## [v0.2.0] - Phase 2
### Added
- Fichiers de documentation projet (`PLAN.md`, `ROADMAP.md`, `OPTIONAJOUTER.md`, `AVANCEMENT.md`, `CHANGEMENT.md`).
- `BrokerPanel` pour la synchronisation des comptes de trading.
- Fonctionnalité d'import CSV pour les trades historiques.

## [v0.1.0] - Phase 1 MVP
### Added
- Authentification Google via Firebase.
- Intégration Lightweight Charts avec outils de dessin (Draft Trades).
- `JournalPanel` pour la prise de notes, tags et émotions.
- `TasksPanel` pour les routines Pre/Post market.
- `NewsPanel` pour le calendrier économique.
- `StatsPanel` et `DashboardPanel` pour l'analyse des performances.

### Fixed
- Correction du bug de connexion Google (gestion de l'erreur `auth/cancelled-popup-request`).
- Résolution des erreurs `toFixed` sur les anciens trades sans `lotSize`.
