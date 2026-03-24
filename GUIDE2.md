# GUIDE DE DÉPLOIEMENT EN PRODUCTION (GUIDE2.md)

Ce guide détaille les étapes nécessaires pour préparer, compiler et déployer l'application de Trading Algorithmique (SaaS) dans un environnement de production.

---

## 1. PRÉREQUIS

Avant de lancer le déploiement, assurez-vous d'avoir :
- **Node.js** (version 18 ou supérieure) installé sur votre machine ou serveur.
- **npm** ou **yarn** comme gestionnaire de paquets.
- Un compte sur une plateforme d'hébergement (Vercel, Netlify, Firebase Hosting) ou un serveur VPS (Ubuntu/Debian) avec Nginx.
- Vos clés d'API de production (Firebase, Tradovate, etc.).

---

## 2. CONFIGURATION DES VARIABLES D'ENVIRONNEMENT

Ne commitez **jamais** vos clés d'API de production dans le dépôt Git.
Créez un fichier `.env.production` à la racine du projet (ou configurez ces variables directement dans le dashboard de votre hébergeur) :

```env
# Exemple de variables requises
VITE_FIREBASE_API_KEY=votre_cle_api_production
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id

# Autres APIs (Brokers & Exchanges)
VITE_TRADOVATE_API_URL=https://live.tradovateapi.com/v1
VITE_BINANCE_API_KEY=votre_cle_api_binance_production
VITE_BINANCE_API_SECRET=votre_secret_api_binance_production
```

---

## 3. COMPILATION DE L'APPLICATION (BUILD)

L'application utilise **Vite**. Pour générer les fichiers statiques optimisés pour la production :

1. Installez les dépendances (si ce n'est pas déjà fait) :
   ```bash
   npm install
   ```

2. Lancez le build de production :
   ```bash
   npm run build
   ```

3. *(Optionnel)* Testez le build localement avant de le déployer :
   ```bash
   npm run preview
   ```
   *Cela lancera un serveur web local (généralement sur le port 4173) servant le dossier `dist/`.*

---

## 4. OPTIONS DE DÉPLOIEMENT

L'application étant une **Single Page Application (SPA)** React, le dossier généré `dist/` contient uniquement des fichiers statiques (HTML, CSS, JS). Voici les méthodes de déploiement les plus courantes :

### Option A : Déploiement sur Vercel ou Netlify (Recommandé, Rapide)
C'est la méthode la plus simple pour une application Vite/React.
1. Connectez votre dépôt GitHub/GitLab à Vercel ou Netlify.
2. Configurez les paramètres de build :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
3. Ajoutez vos variables d'environnement dans les paramètres du projet sur la plateforme.
4. Cliquez sur **Deploy**.

### Option B : Déploiement sur Firebase Hosting
Idéal si vous utilisez déjà Firebase pour l'authentification et la base de données.
1. Installez les outils Firebase :
   ```bash
   npm install -g firebase-tools
   ```
2. Connectez-vous et initialisez le projet :
   ```bash
   firebase login
   firebase init hosting
   ```
   *(Choisissez le dossier `dist` comme dossier public, et configurez comme une Single Page App : réécrire toutes les URLs vers `index.html`)*
3. Déployez :
   ```bash
   firebase deploy --only hosting
   ```

### Option C : Hébergement sur un Serveur VPS (Nginx)
Si vous gérez votre propre serveur (ex: AWS EC2, DigitalOcean Droplet).
1. Transférez le contenu du dossier `dist/` vers votre serveur (ex: `/var/www/trading-app`).
2. Configurez Nginx pour servir l'application et gérer le routage SPA (fallback sur `index.html`) :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/trading-app;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache control pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```
3. Redémarrez Nginx : `sudo systemctl restart nginx`.
4. Sécurisez avec HTTPS via Certbot (Let's Encrypt) : `sudo certbot --nginx -d votre-domaine.com`.

---

## 5. CHECKLIST POST-DÉPLOIEMENT

- [ ] **Certificat SSL (HTTPS)** : Vérifiez que le site est bien servi en HTTPS.
- [ ] **Routage** : Testez le rechargement d'une page (ex: `/journal`) pour vérifier que le serveur redirige bien vers `index.html` (pas d'erreur 404).
- [ ] **Variables d'environnement** : Vérifiez que les appels API fonctionnent et que les clés de production sont bien utilisées.
- [ ] **Règles de sécurité (Firebase/DB)** : Assurez-vous que les règles de sécurité de votre base de données de production sont strictes (pas de `allow read, write: if true;`).
- [ ] **Performances** : Vérifiez le score Lighthouse (temps de chargement, accessibilité).
- [ ] **CORS** : Si vous avez un backend séparé, assurez-vous que votre domaine de production est autorisé dans les règles CORS de votre API.
