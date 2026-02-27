# Axa Shop - Boutique en ligne avec paiement Stripe

Une boutique en ligne moderne construite avec React, Express, tRPC et Stripe pour les paiements.

## 🚀 Déploiement sur Vercel

Ce projet est prêt pour un déploiement sur Vercel avec l'intégration Stripe fonctionnelle.

**📖 [Guide complet de déploiement Vercel](./VERCEL_DEPLOYMENT.md)**

### Déploiement rapide

1. **Forkez ou clonez ce dépôt**
2. **Importez dans Vercel** : [vercel.com/new](https://vercel.com/new)
3. **Configurez les variables d'environnement** (voir `.env.example`)
4. **Déployez** !

Les variables d'environnement critiques :
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=mysql://...
JWT_SECRET=...
OAUTH_SERVER_URL=https://oauth.manus.im
OWNER_OPEN_ID=...
```

## ✨ Fonctionnalités

- 🛒 **Catalogue de produits** avec gestion du stock
- 💳 **Paiements Stripe** sécurisés
- 🔐 **Authentification OAuth** via Manus
- 📦 **Gestion des commandes** en temps réel
- 🎨 **Interface moderne** avec Tailwind CSS et Radix UI
- 📱 **Responsive** sur tous les appareils
- ⚡ **Performance optimale** avec React et Vite
- 🔔 **Webhooks Stripe** pour la synchronisation des paiements

## 🛠️ Stack technique

### Frontend
- **React 19** - Interface utilisateur
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Styling moderne
- **Radix UI** - Composants accessibles
- **tRPC** - API type-safe
- **Wouter** - Routing léger

### Backend
- **Express** - Serveur HTTP
- **tRPC** - API type-safe
- **Drizzle ORM** - ORM TypeScript
- **MySQL** - Base de données
- **Stripe** - Paiements en ligne
- **JWT** - Authentification

## 📦 Installation locale

### Prérequis
- Node.js 18+
- pnpm 10+
- MySQL

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/Anonyme-00152/Axa-shop.git
cd Axa-shop

# Installer les dépendances
pnpm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos clés
nano .env

# Initialiser la base de données
pnpm db:push

# Lancer en développement
pnpm dev
```

L'application sera disponible sur `http://localhost:3000`

## 🔧 Configuration

### Variables d'environnement

Voir `.env.example` pour la liste complète des variables.

**Variables obligatoires** :
- `DATABASE_URL` : Connexion MySQL
- `STRIPE_SECRET_KEY` : Clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` : Secret webhook Stripe
- `JWT_SECRET` : Secret pour les tokens
- `OAUTH_SERVER_URL` : URL du serveur OAuth
- `OWNER_OPEN_ID` : ID du propriétaire

### Configuration Stripe

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Récupérez vos clés API dans **Développeurs** → **Clés API**
3. Configurez un webhook dans **Développeurs** → **Webhooks**
   - URL : `https://votre-domaine.com/api/stripe/webhook`
   - Événements : `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`
4. Copiez le secret du webhook

## 🧪 Tests

### Tester les paiements Stripe

Utilisez les cartes de test Stripe :
- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0027 6000 3184`

Date d'expiration : n'importe quelle date future  
CVC : n'importe quel 3 chiffres

## 📚 Documentation

- [Guide de déploiement Vercel](./VERCEL_DEPLOYMENT.md)
- [Modifications pour Vercel](./VERCEL_CHANGES.md)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation tRPC](https://trpc.io)

## 🏗️ Structure du projet

```
Axa-shop/
├── api/                    # Serverless functions (Vercel)
│   └── index.ts           # Point d'entrée API
├── client/                # Application React
│   ├── src/
│   │   ├── components/   # Composants UI
│   │   └── pages/        # Pages de l'application
│   └── public/           # Assets statiques
├── server/                # Code backend
│   ├── _core/            # Core du serveur
│   ├── routers/          # Routes tRPC
│   │   └── stripe.ts     # Router Stripe
│   └── webhooks/         # Webhooks
│       └── stripe.ts     # Webhook Stripe
├── drizzle/              # Schéma de base de données
│   └── schema.ts
├── shared/               # Code partagé
└── dist/                 # Build output
```

## 🚢 Déploiement

### Vercel (Recommandé)

Suivez le [guide de déploiement Vercel](./VERCEL_DEPLOYMENT.md) pour un déploiement complet.

### Autres plateformes

Le projet peut également être déployé sur :
- **Railway** : Support Node.js natif
- **Render** : Support Express
- **Fly.io** : Avec Docker
- **VPS** : Avec PM2 ou systemd

## 🔐 Sécurité

- ✅ Authentification JWT sécurisée
- ✅ Validation des webhooks Stripe
- ✅ Variables d'environnement pour les secrets
- ✅ HTTPS obligatoire en production
- ✅ Validation des entrées avec Zod
- ✅ Protection CSRF

## 📝 Scripts disponibles

```bash
pnpm dev          # Lancer en développement
pnpm build        # Construire pour la production
pnpm start        # Lancer en production
pnpm check        # Vérifier les types TypeScript
pnpm format       # Formater le code
pnpm test         # Lancer les tests
pnpm db:push      # Synchroniser le schéma de base de données
```

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 💬 Support

Pour toute question ou problème :
- 📧 Créez une [issue GitHub](https://github.com/Anonyme-00152/Axa-shop/issues)
- 📖 Consultez la [documentation Vercel](./VERCEL_DEPLOYMENT.md)
- 💳 Consultez la [documentation Stripe](https://stripe.com/docs)

---

**Fait avec ❤️ pour Vercel et Stripe**
