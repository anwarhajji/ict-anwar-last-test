# Changelog - SaaS Trading Journal & Bot Manager

## [Unreleased]

### Added
- **Repository GitHub :** Ajout de l'URL du repository officiel ([https://github.com/anwarhajji/ict-anwar-last-test.git](https://github.com/anwarhajji/ict-anwar-last-test.git)) dans `package.json`, `PLAN.md` et création du fichier `README.md`.
- **Page Profil :** Ajout de la gestion des informations personnelles et des paramètres de bot.
- **Bot Settings :** Possibilité de définir un capital de départ (Starting Balance) et une limite de bots (1 à 5) par utilisateur.
- **Bot Suivi :** Dashboard de suivi consolidé affichant l'Equity totale, le PnL global et le taux de réussite moyen de tous les bots actifs.
- **Limites de Bots :** Enforcement de la limite de bots configurée dans le profil lors de la création d'un nouveau bot.
- **Module Bots :** Création et gestion de bots de trading algorithmique (mode démo).
- **Éditeur de Stratégies :** Interface pour écrire et sauvegarder des stratégies JavaScript personnalisées.
- **Stratégies Intégrées :** Ajout de 5 modèles (ICT Silver Bullet, London Breakout v2.0, NQ FVG Scalper, 2022 Mentorship Model, ICT Unicorn).
- **Moteur de Simulation :** Exécution en temps réel des scripts de stratégie sur données simulées.
- **Persistance Firebase :** Sauvegarde automatique des bots et stratégies personnalisées dans Firestore.
- **Intégration App.tsx :** Ajout de l'onglet "Bots" dans la navigation principale.

### Changed
- **Layout :** Amélioration de la navigation par onglets pour inclure les nouveaux modules.
- **Stats :** Mise à jour des calculs de performance pour inclure les données de backtest/bots.

### Fixed
- **Compilation :** Correction d'une erreur de syntaxe (accolade fermante en trop) dans `BotsPanel.tsx`.
- **Firebase :** Correction de la récupération des stratégies personnalisées après le premier chargement.
- **Chart Data :** Correction de l'erreur "Failed to fetch candles" en ajoutant un mapping complet des symboles (NQ, ES, Gold, etc.) vers l'API Binance.
- **Chart Stability :** Correction de l'erreur "Cannot read properties of undefined (reading 'close')" en ajoutant des gardes sur les données vides dans `App.tsx`.

### Security
- **Firestore Rules :** Mise à jour des règles pour protéger les données de bots et stratégies par utilisateur.

---

## [v0.1.0] - 24/03/2026

### Added
- **Initial Release :** Setup de base avec Auth, Dashboard, Journal, Stats, News et Tasks.
- **Firebase Setup :** Configuration Firestore et Auth (Google Login).
- **UI :** Thème sombre (TradingView style) avec Tailwind CSS.
- **Import CSV :** Support pour l'import manuel des trades Tradovate.
- **Analytics :** KPIs de base et Equity Curve.
- **Calendrier Économique :** Affichage des news à fort impact.
- **Checklists :** Tâches quotidiennes pré/post market.

---

## Processus de Release
- **Added :** Nouvelles fonctionnalités.
- **Changed :** Modifications de fonctionnalités existantes.
- **Fixed :** Corrections de bugs.
- **Removed :** Fonctionnalités supprimées.
- **Security :** Améliorations de la sécurité.
