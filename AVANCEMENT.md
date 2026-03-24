# FILE: AVANCEMENT.md

# SUIVI PROJET

**Status Global** : ✅ MVP Terminé (Phase 4)

## Table des Milestones
| Milestone | Status | Date cible |
|---|---|---|
| M1: Fondations & Auth | ✅ Fait | J0 |
| M2: Paper Trading & Chart | ✅ Fait | J+1 |
| M3: Journal & Tasks | ✅ Fait | J+2 |
| M4: Broker Sync (CSV) | ✅ Fait | J+3 |
| M5: Backtesting & Admin | ✅ Fait | J+4 |
| M6: Bots & Guardrails | ✅ Fait | J+5 |

## Checklist Détaillée (Maintenance & Ops)
- [x] Correction des bugs d'affichage `AdminPanel` (propriétés indéfinies).
- [x] Mise à jour des règles Firestore pour les rôles `SUPER_ADMIN` et `OWNER`.
- [x] Création du guide de déploiement local/dédié (`GUIDE_LOCAL.md`).
- [x] Exposition des variables Firebase dans `.env.example`.
- [x] Support de l'ID de base de données dynamique dans `firebase.ts`.

## Journal Quotidien
- **Aujourd'hui** : Finalisation de la Phase 4 (Bots & Guardrails). Le MVP est désormais complet. Ajout des filtres et explications d'impact sur le calendrier économique (News). Ajustement des permissions pour le rôle OWNER (accès Admin et bypass des feature locks). Correction critique de l'AdminPanel pour la visibilité des utilisateurs et ajout de la documentation pour le déploiement hors AI Studio.
- **Blocages** : Aucun.
- **Next** : Tests de charge sur l'import CSV et amélioration de l'UX du journal (édition en ligne).

## Bugs & Dette Technique
- *Bug* : Le graphique ne se redimensionne pas toujours parfaitement lors du toggle du menu mobile.
- *Tech Debt* : Le state `tradeHistory` est géré dans `App.tsx`, il faudra passer sur un Context React ou Redux/Zustand pour une meilleure scalabilité.
- ✅ *Bug Fix* : Correction de l'affichage des utilisateurs dans l'AdminPanel (gestion des propriétés indéfinies et mise à jour des règles Firestore pour les rôles `SUPER_ADMIN` et `OWNER`).
- ✅ *New* : Ajout d'un guide de test local et serveur dédié (`GUIDE_LOCAL.md`) et mise à jour de `.env.example` avec les variables Firebase.
