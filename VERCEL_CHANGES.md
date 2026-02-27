# Modifications pour le déploiement Vercel

Ce document liste toutes les modifications apportées au projet Axa Shop pour le rendre compatible avec Vercel.

## Fichiers ajoutés

### 1. `.env.example`
Fichier d'exemple contenant toutes les variables d'environnement nécessaires au fonctionnement de l'application.

**Variables critiques pour Stripe** :
- `STRIPE_SECRET_KEY` : Clé secrète Stripe pour créer des sessions de paiement
- `STRIPE_WEBHOOK_SECRET` : Secret pour vérifier les webhooks Stripe

### 2. `api/index.ts`
Point d'entrée serverless pour Vercel qui gère :
- Les routes tRPC (`/api/trpc`)
- Le webhook Stripe (`/api/stripe/webhook`)
- L'authentification OAuth (`/api/oauth/callback`)
- Le health check (`/api/health`)

**Important** : Le webhook Stripe est enregistré AVANT `express.json()` pour permettre la vérification de signature avec le body brut.

### 3. `VERCEL_DEPLOYMENT.md`
Guide complet de déploiement sur Vercel avec :
- Configuration de Stripe étape par étape
- Configuration des variables d'environnement
- Tests et vérification
- Dépannage des problèmes courants

### 4. `VERCEL_CHANGES.md`
Ce fichier, qui documente les modifications apportées.

## Fichiers modifiés

### 1. `vercel.json`
**Modifications** :
- Ajout de `buildCommand` explicite : `pnpm install && pnpm build`
- Configuration de `outputDirectory` : `dist/public`
- Configuration des rewrites pour router les requêtes API
- Configuration des fonctions serverless avec timeout de 30s
- Ajout de la variable d'environnement `NODE_ENV=production`

**Avant** :
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist/public" }
    }
  ],
  "rewrites": [...]
}
```

**Après** :
```json
{
  "version": 2,
  "buildCommand": "pnpm install && pnpm build",
  "outputDirectory": "dist/public",
  "framework": null,
  "rewrites": [...],
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. `package.json`
**Modifications** :
- Mise à jour du script `build` pour compiler à la fois le frontend et le backend
- Ajout du script `vercel-build` pour Vercel

**Avant** :
```json
"scripts": {
  "build": "vite build",
}
```

**Après** :
```json
"scripts": {
  "build": "vite build && tsc api/index.ts --outDir dist/api --esModuleInterop --resolveJsonModule --skipLibCheck",
  "vercel-build": "pnpm build",
}
```

## Architecture de déploiement

### Structure des dossiers
```
Axa-shop/
├── api/                    # Serverless functions Vercel
│   └── index.ts           # Point d'entrée API
├── client/                # Application React
│   ├── src/
│   └── public/
├── server/                # Code backend
│   ├── _core/
│   ├── routers/
│   └── webhooks/
│       └── stripe.ts      # Webhook Stripe
├── dist/                  # Build output
│   ├── public/           # Frontend statique
│   └── api/              # Backend compilé
├── .env.example          # Variables d'environnement
├── vercel.json           # Configuration Vercel
└── VERCEL_DEPLOYMENT.md  # Guide de déploiement
```

### Flux de déploiement Vercel

1. **Build** :
   - `pnpm install` : Installation des dépendances
   - `vite build` : Compilation du frontend React → `dist/public/`
   - `tsc api/index.ts` : Compilation du backend → `dist/api/`

2. **Déploiement** :
   - Frontend : Servi comme site statique depuis `dist/public/`
   - Backend : Déployé comme serverless function à `/api/*`

3. **Runtime** :
   - Requêtes frontend (`/`, `/about`, etc.) → `index.html` (SPA routing)
   - Requêtes API (`/api/trpc/*`) → Serverless function
   - Webhook Stripe (`/api/stripe/webhook`) → Serverless function

## Intégration Stripe

### Configuration existante (conservée)

Le projet utilise déjà Stripe avec :
- **SDK Stripe** : `stripe` package (v20.1.2)
- **Router tRPC** : `server/routers/stripe.ts`
  - `createCheckoutSession` : Crée une session de paiement
  - `getSession` : Récupère le statut d'une session
- **Webhook handler** : `server/webhooks/stripe.ts`
  - Gère `checkout.session.completed`
  - Gère `payment_intent.payment_failed`
  - Gère `charge.refunded`

### Adaptations pour Vercel

**Aucune modification du code Stripe n'a été nécessaire** car :
1. Les variables d'environnement sont déjà utilisées via `process.env`
2. Le webhook est déjà configuré avec `express.raw()` pour le body brut
3. L'initialisation lazy de Stripe est compatible avec les serverless functions

**Ce qui doit être configuré dans Vercel** :
1. `STRIPE_SECRET_KEY` : Clé API Stripe
2. `STRIPE_WEBHOOK_SECRET` : Secret du webhook Stripe
3. URL du webhook dans le Dashboard Stripe : `https://votre-domaine.vercel.app/api/stripe/webhook`

## Variables d'environnement requises

### Obligatoires pour Stripe
```bash
STRIPE_SECRET_KEY=sk_test_...           # Clé secrète Stripe
STRIPE_WEBHOOK_SECRET=whsec_...         # Secret webhook Stripe
```

### Obligatoires pour l'application
```bash
DATABASE_URL=mysql://...                # Base de données MySQL
JWT_SECRET=...                          # Secret pour les tokens JWT
OAUTH_SERVER_URL=https://oauth.manus.im # Serveur OAuth
OWNER_OPEN_ID=...                       # ID du propriétaire
```

### Optionnelles
```bash
BUILT_IN_FORGE_API_URL=...             # API Forge (optionnel)
BUILT_IN_FORGE_API_KEY=...             # Clé API Forge (optionnel)
OWNER_NAME=...                          # Nom du propriétaire
ADMIN_PASSWORD=...                      # Mot de passe admin
```

## Compatibilité

### ✅ Compatible avec Vercel
- Express.js (via serverless adapter)
- tRPC
- Stripe SDK
- MySQL (avec connexion serverless)
- OAuth Manus
- React + Vite

### ⚠️ Limitations Vercel
- **Timeout** : 10s (Hobby) / 30s (configuré) / 60s (Pro)
- **Taille** : 50 MB max par fonction
- **Connexions DB** : Utiliser un pool ou une DB serverless-friendly

## Tests recommandés après déploiement

1. ✅ **Frontend** : Vérifier que la page d'accueil se charge
2. ✅ **API** : Tester `/api/health` → doit retourner `{"status": "ok"}`
3. ✅ **OAuth** : Tester la connexion utilisateur
4. ✅ **Stripe Checkout** : Créer une session de paiement
5. ✅ **Webhook Stripe** : Envoyer un événement test depuis le Dashboard Stripe
6. ✅ **Paiement complet** : Effectuer un paiement test avec `4242 4242 4242 4242`

## Rollback

Si vous souhaitez revenir à la version précédente :

```bash
git revert HEAD~4  # Annule les 4 derniers commits
git push origin main
```

Ou restaurez manuellement les fichiers :
- `vercel.json` → version précédente
- `package.json` → version précédente
- Supprimez `api/`, `.env.example`, `VERCEL_DEPLOYMENT.md`, `VERCEL_CHANGES.md`

## Prochaines étapes

1. **Déployer sur Vercel** en suivant `VERCEL_DEPLOYMENT.md`
2. **Configurer les variables d'environnement** dans Vercel
3. **Configurer le webhook Stripe** avec l'URL Vercel
4. **Tester les paiements** en mode test
5. **Passer en production** avec les clés Stripe Live

---

**Date des modifications** : Janvier 2026  
**Compatibilité** : Vercel, Node.js 18+, pnpm 10+
