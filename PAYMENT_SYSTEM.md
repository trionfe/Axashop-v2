# 💳 Système de Paiement Manuel - Axa Shop

## 📋 Vue d'ensemble

Le système de paiement manuel d'Axa Shop permet de gérer les commandes sans utiliser d'API payantes comme Stripe. Les paiements sont vérifiés manuellement via Discord.

## 🎯 Fonctionnalités

### ✅ Méthodes de paiement supportées

1. **PayPal** 💳
   - Adresse email : `contact@axashop.com`
   - Le client doit fournir son pseudo PayPal après l'envoi

2. **Litecoin (LTC)** ₿
   - Adresse wallet : `LTC1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`
   - Le client doit fournir l'ID de transaction (TXID)

3. **Paysafecard** 🎫
   - Le client doit saisir son code PIN (16 chiffres)
   - Validation manuelle par l'administrateur

### 🔄 Flux de commande

1. **Client** : Sélectionne les produits et va au checkout
2. **Système** : Génère un ID de commande unique (format: `AXA-XXXXXXXXX`)
3. **Client** : Remplit ses informations (nom, email)
4. **Client** : Choisit une méthode de paiement
5. **Client** : Effectue le paiement et fournit la preuve
6. **Système** : Envoie la commande au webhook Discord
7. **Admin** : Clique sur "Accepter" ou "Refuser" dans Discord
8. **Système** : Notifie le client par email (à implémenter)

## 🤖 Intégration Discord

### Webhook URL
```
https://discord.com/api/webhooks/1467182501633196204/vp3w_zM8iPWGXL_J_0ffikqK0aoS_53FXKKfEXPQnbcgeyWnFaprXUycFpUaXv5G9vio
```

### Format du message Discord

Chaque commande envoie un embed avec :
- 🛒 ID de commande
- 👤 Nom et email du client
- 💳 Méthode de paiement
- 💰 Montant total
- 📝 Preuve de paiement (pseudo PayPal, TXID, ou code PIN)
- 📦 Liste des produits

### Actions disponibles

Le message Discord contient deux liens cliquables :

1. **✅ ACCEPTER LA COMMANDE**
   - URL : `/api/order/validate?action=accept&orderId=...&email=...&name=...`
   - Envoie une confirmation sur Discord
   - Affiche une page de succès

2. **❌ REFUSER LA COMMANDE**
   - URL : `/api/order/validate?action=reject&orderId=...&email=...`
   - Envoie une notification de rejet sur Discord
   - Affiche une page de refus

## 🔧 Configuration technique

### Fichiers modifiés

1. **`client/src/pages/Checkout.tsx`**
   - Interface de paiement avec 3 options
   - Génération d'ID de commande unique
   - Formulaire de preuve de paiement

2. **`server/routers.ts`**
   - Endpoint `submitManualPayment` pour envoyer les commandes
   - Intégration webhook Discord

3. **`api/index.ts`** et **`server/_core/index.ts`**
   - Endpoint `/api/order/validate` pour accepter/refuser
   - Pages HTML de confirmation

4. **Suppression de Stripe**
   - ❌ `server/routers/stripe.ts` (supprimé)
   - ❌ `server/webhooks/stripe.ts` (supprimé)
   - ❌ `server/stripe-products.ts` (supprimé)
   - ❌ Dépendance `stripe` retirée de `package.json`
   - ❌ Variables `stripeSecretKey` et `stripeWebhookSecret` retirées

## 📧 Envoi d'email (À implémenter)

Pour envoyer les produits au client après validation :

1. Intégrer un service d'email gratuit (SendGrid, Mailgun, Resend)
2. Modifier l'endpoint `/api/order/validate` pour envoyer un email
3. Inclure les liens de téléchargement ou codes des produits

### Exemple d'intégration

```typescript
// Dans /api/order/validate, après acceptation
if (action === "accept") {
  // Envoyer email au client
  await sendEmail({
    to: email,
    subject: `Votre commande ${orderId} est validée !`,
    html: `
      <h1>Commande validée</h1>
      <p>Bonjour ${name},</p>
      <p>Votre commande a été validée. Voici vos produits :</p>
      <!-- Liste des produits avec liens -->
    `
  });
}
```

## 🚀 Déploiement

Le système fonctionne automatiquement en production sur Vercel ou tout autre hébergeur Node.js.

### Variables d'environnement requises

Aucune variable spécifique n'est requise pour le système de paiement manuel. Le webhook Discord est codé en dur dans le code.

## ⚠️ Sécurité

- ⚠️ Le webhook Discord est public dans le code
- ✅ Les commandes nécessitent une validation manuelle
- ✅ Aucune donnée sensible n'est stockée automatiquement
- 🔒 Recommandation : Déplacer le webhook URL vers les variables d'environnement

## 📝 Notes importantes

1. **Pas de stockage en base de données** : Les commandes ne sont pas sauvegardées automatiquement. Tout passe par Discord.
2. **Validation manuelle obligatoire** : Un administrateur doit cliquer sur les liens Discord.
3. **Pas d'envoi d'email automatique** : À implémenter selon vos besoins.

## 🎨 Personnalisation

Pour modifier les informations de paiement :

1. **PayPal** : Modifier dans `client/src/pages/Checkout.tsx` ligne 250
2. **Litecoin** : Modifier dans `client/src/pages/Checkout.tsx` ligne 271
3. **Webhook Discord** : Modifier dans `server/routers.ts` ligne 101

---

**Créé le** : 31 janvier 2026  
**Version** : 1.0.0  
**Auteur** : Axa Shop Team
