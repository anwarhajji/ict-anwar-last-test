# Guide de Test Local / Serveur Dédié

Pour faire tourner l'application en dehors de l'environnement AI Studio, suivez ces étapes :

## 1. Prérequis
- **Node.js** (v18 ou supérieur)
- **npm** ou **yarn**

## 2. Installation
Clonez ou téléchargez le code, puis installez les dépendances :
```bash
npm install
```

## 3. Configuration de l'environnement
Créez un fichier `.env` à la racine du projet en vous basant sur `.env.example`.

### Option A : Utiliser le fichier JSON (Plus simple)
Gardez le fichier `firebase-applet-config.json` à la racine. Le code le détectera automatiquement s'il n'y a pas de variables `VITE_FIREBASE_*` dans votre `.env`.

### Option B : Utiliser les variables d'environnement (Recommandé pour serveur dédié)
Copiez les valeurs de `firebase-applet-config.json` dans votre fichier `.env` :
```env
VITE_FIREBASE_API_KEY=votre_cle_api
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_id_projet
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_id_sender
VITE_FIREBASE_APP_ID=votre_id_app
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_FIRESTORE_DATABASE_ID=votre_id_database_firestore
```

## 4. Lancement
### Mode Développement (avec Hot Reload)
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

### Mode Production (Build & Start)
```bash
npm run build
npm run start
```

## 5. Configuration Firebase (Console)
N'oubliez pas d'ajouter `http://localhost:3000` (ou l'IP de votre serveur dédié) dans la liste des **domaines autorisés** pour l'authentification Google dans la console Firebase (Authentication > Settings > Authorized domains).
