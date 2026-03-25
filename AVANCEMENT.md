# Suivi de Projet - SaaS Trading Journal & Bot Manager

## Status Global : 🟡 (En développement)

| Milestone | Status | Date |
|-----------|--------|------|
| Setup Firebase & Auth | ✅ | 24/03/2026 |
| Module Journal & Stats | ✅ | 24/03/2026 |
| Module News & Tasks | ✅ | 24/03/2026 |
| Module Bots & Stratégies | ✅ | 24/03/2026 |
| Sync Broker API | 🔴 | À venir |
| Backtesting Replay | 🔴 | À venir |

## Checklist Détaillée

### 🔐 Auth & SaaS
- [x] Login Google Firebase.
- [x] Rôles (Admin, Member).
- [x] Profil utilisateur et features activées.

### 📊 Journal & Analytics
- [x] Import manuel CSV.
- [x] Liste des trades et éditeur de notes.
- [x] KPIs (PnL, Win Rate, Profit Factor).
- [x] Equity Curve (Graphique de capital).

### 🤖 Bots & Stratégies
- [x] Liste des bots (Demo/Simulé).
- [x] Création de bots avec stratégies prédéfinies.
- [x] Éditeur de code JavaScript pour stratégies.
- [x] Moteur de simulation temps réel (simulé).
- [x] Persistance des bots et stratégies dans Firestore.
- [x] **Bot Suivi :** Dashboard de suivi de la performance globale des bots.
- [x] **Limites & Balance :** Gestion du capital de départ et limite de 1 à 5 bots par utilisateur.

### 📰 News & Tasks
- [x] Calendrier économique (News à fort impact).
- [x] Checklists quotidiennes (Tasks).
- [x] Suivi de la discipline journalière.

## Journal Quotidien (25/03/2026)
- **Fait :**
    - Implémentation du système de Tiers (FREE, NORMAL, VIP, VVIP).
    - Création de l'OnboardingModal pour les nouveaux utilisateurs (choix du compte).
    - Ajout du système de "Pending Approval" et de la fonction `hasAccess`.
    - Création de l'Admin Panel pour gérer les utilisateurs et valider les accès.
    - Mise à jour de la navigation (Sidebar & Mobile) pour respecter les permissions et afficher les verrous.
    - Système de "heartbeat" pour le tracking de l'activité utilisateur.
    - **Correction :** Fix de l'erreur "Failed to fetch candles" en ajoutant un mapping complet des symboles (NQ, ES, Gold, etc.) vers l'API Binance.
    - **Correction :** Fix de l'erreur "Cannot read properties of undefined (reading 'close')" en ajoutant des gardes sur les données vides dans `App.tsx`.
- **Blocages :** Aucun.
- **Next :** Finaliser le module Journal (saisie manuelle) et brancher les vraies données sur le Dashboard.

## Journal Quotidien (24/03/2026)
- **Fait :**
    - Création du module `BotsPanel` avec éditeur de stratégies JavaScript.
    - Ajout de 5 stratégies intégrées (Silver Bullet, London Breakout, etc.).
    - Implémentation du système de sauvegarde/édition des stratégies personnalisées.
    - Correction des erreurs de compilation et intégration dans `App.tsx`.
- **Blocages :** Aucun pour le moment.
- **Next :** Implémentation de la synchronisation automatique avec l'API Tradovate.

## Bugs & Dettes Techniques
- [ ] Améliorer l'éditeur de code (Monaco Editor ou similaire).
- [ ] Ajouter des tests unitaires pour le moteur de simulation.
- [ ] Optimiser les requêtes Firestore (pagination des trades).
