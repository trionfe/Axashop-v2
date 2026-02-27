# Guide de Déploiement sur Vercel - Axa Shop

Ce guide vous accompagne dans le déploiement de votre boutique en ligne Axa Shop sur Vercel avec l'intégration Stripe fonctionnelle.

## Prérequis

Avant de commencer, assurez-vous d'avoir :

1. **Un compte Vercel** - [Créer un compte](https://vercel.com/signup)
2. **Un compte Stripe** - [Créer un compte](https://dashboard.stripe.com/register)
3. **Une base de données MySQL** - Options recommandées :
   - [PlanetScale](https://planetscale.com/) (gratuit)
   - [Railway](https://railway.app/)
   - [TiDB Cloud](https://tidbcloud.com/)
4. **Un compte GitHub** - Le dépôt doit être sur GitHub

## Étape 1 : Configuration de Stripe

### 1.1 Récupérer les clés API Stripe

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com/)
2. Allez dans **Développeurs** → **Clés API**
3. Copiez votre **Clé secrète** (commence par `sk_test_` en mode test ou `sk_live_` en production)

### 1.2 Configurer le Webhook Stripe

1. Dans le Dashboard Stripe, allez dans **Développeurs** → **Webhooks**
2. Cliquez sur **Ajouter un point de terminaison**
3. URL du webhook : `https://votre-domaine.vercel.app/api/stripe/webhook`
   - **Important** : Remplacez `votre-domaine` par votre URL Vercel réelle
4. Sélectionnez les événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Cliquez sur **Ajouter un point de terminaison**
6. Copiez le **Secret de signature** (commence par `whsec_`)

## Étape 2 : Déploiement sur Vercel

### 2.1 Importer le projet

1. Connectez-vous à [Vercel](https://vercel.com/)
2. Cliquez sur **Add New** → **Project**
3. Importez votre dépôt GitHub `Anonyme-00152/Axa-shop`
4. Vercel détectera automatiquement la configuration

### 2.2 Configurer les variables d'environnement

Dans les paramètres du projet Vercel, ajoutez les variables d'environnement suivantes :

#### Variables obligatoires

```bash
# Application
VITE_APP_ID=axa-shop-app
NODE_ENV=production

# Sécurité
JWT_SECRET=votre-secret-jwt-genere-aleatoirement

# Base de données
DATABASE_URL=mysql://user:password@host:port/database

# OAuth Manus
OAUTH_SERVER_URL=https://oauth.manus.im
OWNER_OPEN_ID=votre-owner-open-id

# Stripe (CRITIQUE pour les paiements)
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook

# Administration
OWNER_NAME=Votre Nom
ADMIN_PASSWORD=votre-mot-de-passe-admin-securise
```

#### Comment ajouter les variables dans Vercel

1. Dans votre projet Vercel, allez dans **Settings** → **Environment Variables**
2. Pour chaque variable :
   - Entrez le **nom** de la variable (ex: `STRIPE_SECRET_KEY`)
   - Entrez la **valeur** correspondante
   - Sélectionnez les environnements : **Production**, **Preview**, **Development**
   - Cliquez sur **Add**

### 2.3 Déployer

1. Une fois toutes les variables configurées, cliquez sur **Deploy**
2. Vercel va :
   - Installer les dépendances avec `pnpm`
   - Construire le frontend avec Vite
   - Compiler le backend serverless
   - Déployer l'application

## Étape 3 : Vérification post-déploiement

### 3.1 Tester l'application

1. Accédez à votre URL Vercel : `https://votre-domaine.vercel.app`
2. Vérifiez que la page d'accueil se charge correctement
3. Testez l'authentification OAuth
4. Vérifiez que les produits s'affichent

### 3.2 Tester le webhook Stripe

1. Retournez dans le Dashboard Stripe → **Développeurs** → **Webhooks**
2. Cliquez sur votre webhook
3. Cliquez sur **Envoyer un événement test**
4. Sélectionnez `checkout.session.completed`
5. Vérifiez dans les logs Vercel que l'événement a été reçu

### 3.3 Tester un paiement

1. Connectez-vous à votre boutique
2. Ajoutez un produit au panier
3. Procédez au paiement
4. Utilisez une carte de test Stripe :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
5. Vérifiez que la commande apparaît dans votre base de données

## Étape 4 : Mise à jour du webhook Stripe avec l'URL finale

**Important** : Si vous n'aviez pas encore votre URL Vercel lors de la configuration initiale du webhook :

1. Retournez dans **Dashboard Stripe** → **Développeurs** → **Webhooks**
2. Cliquez sur votre webhook
3. Cliquez sur **...** → **Modifier le point de terminaison**
4. Mettez à jour l'URL avec votre URL Vercel finale : `https://votre-domaine-reel.vercel.app/api/stripe/webhook`
5. Sauvegardez

## Étape 5 : Configuration du domaine personnalisé (Optionnel)

1. Dans Vercel, allez dans **Settings** → **Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS
4. **N'oubliez pas** de mettre à jour l'URL du webhook Stripe avec votre nouveau domaine

## Dépannage

### Le webhook Stripe ne fonctionne pas

**Symptômes** : Les paiements sont acceptés mais les commandes n'apparaissent pas dans la base de données.

**Solutions** :
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est correctement configuré dans Vercel
2. Vérifiez que l'URL du webhook dans Stripe correspond exactement à votre URL Vercel
3. Consultez les logs Vercel : **Deployments** → **Functions** → `/api/stripe/webhook`
4. Testez le webhook avec un événement test dans le Dashboard Stripe

### Erreur "Stripe is not configured"

**Cause** : La variable `STRIPE_SECRET_KEY` n'est pas définie ou est incorrecte.

**Solution** :
1. Vérifiez dans **Settings** → **Environment Variables** que `STRIPE_SECRET_KEY` est bien définie
2. Vérifiez que la clé commence par `sk_test_` ou `sk_live_`
3. Redéployez l'application après avoir ajouté/modifié la variable

### Erreur de connexion à la base de données

**Cause** : La variable `DATABASE_URL` est incorrecte ou la base de données n'est pas accessible.

**Solution** :
1. Vérifiez le format de `DATABASE_URL` : `mysql://user:password@host:port/database`
2. Vérifiez que votre base de données accepte les connexions depuis les IP Vercel
3. Pour PlanetScale, utilisez le format de connexion fourni dans leur dashboard

### Les paiements fonctionnent en test mais pas en production

**Cause** : Vous utilisez des clés de test en production.

**Solution** :
1. Dans Stripe, basculez en mode **Live** (en haut à droite)
2. Récupérez vos clés **Live** (commencent par `sk_live_`)
3. Créez un nouveau webhook pour le mode Live
4. Mettez à jour les variables `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` dans Vercel avec les valeurs Live
5. Redéployez

## Architecture Vercel

Le projet utilise :

- **Frontend** : Application React construite avec Vite → déployée comme site statique
- **Backend** : API Express + tRPC → déployée comme Serverless Functions
- **Webhook Stripe** : Fonction serverless dédiée à `/api/stripe/webhook`

### Limitations Vercel à connaître

- **Timeout** : Les fonctions serverless ont un timeout de 10s (Hobby) ou 60s (Pro)
- **Taille** : La taille maximale d'une fonction est de 50 MB
- **Connexions DB** : Utilisez un pool de connexions ou une base serverless-friendly (PlanetScale, TiDB)

## Passage en production

Avant de passer en production :

1. **Activez le mode Live dans Stripe** et mettez à jour les clés
2. **Configurez un domaine personnalisé** pour plus de professionnalisme
3. **Activez HTTPS** (automatique avec Vercel)
4. **Testez tous les flux de paiement** avec de vraies cartes
5. **Configurez les emails de notification** pour les commandes
6. **Mettez en place une surveillance** (Vercel Analytics, Sentry)
7. **Sauvegardez régulièrement votre base de données**

## Support

Pour toute question :
- **Vercel** : [Documentation](https://vercel.com/docs)
- **Stripe** : [Documentation](https://stripe.com/docs)
- **GitHub Issues** : [Créer une issue](https://github.com/Anonyme-00152/Axa-shop/issues)

---

**Dernière mise à jour** : Janvier 2026
