# Roadmap du Projet - SaaS Trading Journal & Bot Manager

## Phase 0 : Fondations SaaS (Semaine 1)
- [x] Setup Firebase (Auth, Firestore).
- [x] Architecture React + Tailwind CSS.
- [x] Layout principal et navigation par onglets.
- [x] Gestion des profils utilisateurs et rôles.

## Phase 1 : MVP Journaling & Analytics (Semaine 2)
- [x] Module Journal de Trading (manuel + auto).
- [x] Module Stats & Analytics (KPIs, Equity Curve).
- [x] Module Daily Tasks (Checklists).
- [x] Module News (Calendrier économique).
- [x] Import manuel CSV (Tradovate, MT5).

## Phase 2 : Broker Sync & Replay (Semaine 3)
- [ ] Connexion API Tradovate (Live/Demo).
- [ ] Synchronisation automatique des trades/fills/fees.
- [ ] Session Replay (v1) : Rejouer des données historiques sur graphique.
- [ ] Liaison News <-> Trades automatique.

## Phase 3 : Backtesting & Stratégies (Semaine 4)
- [ ] Module Backtesting complet.
- [ ] Versionning des stratégies de trading.
- [ ] Comparateur de performance entre stratégies.
- [ ] Export de rapports de backtest (PDF/CSV).

## Phase 4 : Bots Demo & Guardrails (Semaine 5)
- [x] Module Bots (Création, Édition de code).
- [x] Moteur de simulation de stratégie JavaScript.
- [ ] Guardrails de risque (Auto-stop sur perte max).
- [ ] Notifications (Telegram/Discord) sur exécution de bot.

## Critères d'Acceptation (MVP)
- L'utilisateur peut se connecter et voir son dashboard.
- L'utilisateur peut importer ses trades et voir ses stats.
- L'utilisateur peut créer un bot et éditer son code de stratégie.
- Les données sont persistées et sécurisées.

## Risques & Dépendances
- **API Broker :** Changements de documentation ou limites de rate limit.
- **Data Quality :** Normalisation des données entre différents brokers.
- **Sécurité :** Protection des clés API des brokers (chiffrement).
