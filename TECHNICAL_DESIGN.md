# Conception Technique - Modifications Axa-shop

Ce document détaille les modifications à apporter au projet Axa-shop pour répondre aux nouvelles exigences.

## 1. Modèle de Données (Schema)

Les produits doivent maintenant supporter trois prix distincts. Nous allons mettre à jour `products.json` (et le schéma Drizzle pour la cohérence) :

- `pricePayPal`: decimal (EUR)
- `priceLTC`: decimal (LTC)
- `pricePSC`: decimal (EUR - montant fixe arrondi)
- `pscFeePercent`: global (dans un nouveau fichier `settings.json`)

## 2. Système de Panier (Frontend)

Un nouveau contexte `CartContext.tsx` sera créé pour gérer :
- Liste des articles (`CartItem[]`)
- Fonctions `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- Persistance dans le `localStorage`
- Widget dans le `Header.tsx` avec compteur en temps réel

## 3. Page Produit (Home.tsx)

Modification de la grille de produits :
- Affichage des 3 prix simultanément.
- Sélecteur de mode de paiement (Radio Group).
- Logique conditionnelle :
    - Si **Paysafecard** : Afficher la majoration de 10% (ou selon le réglage admin) et un champ pour le code PIN.
    - Si **PayPal/LTC** : Champ e-mail requis.
- Boutons : "Acheter maintenant" (checkout direct) et "Ajouter au panier".

## 4. Interface Administrateur

Mise à jour de `AdminProducts.tsx` :
- Formulaire étendu pour saisir les 3 prix.
- Nouveau réglage global pour le pourcentage de frais Paysafecard.

## 5. Intégration Stripe (Backend)

Mise à jour de `server/routers/stripe.ts` :
- Support du panier global (plusieurs articles).
- Calcul du montant total basé sur le mode de paiement sélectionné.
- Pour Paysafecard, Stripe servira de passerelle si possible, sinon simulation/enregistrement de la transaction.
- *Note : Stripe ne supporte pas nativement le LTC, donc pour LTC/PayPal, nous utiliserons Stripe Checkout avec les méthodes appropriées si disponibles, ou nous adapterons la logique.*

## 6. Flux de Travail

1.  **Phase 3** : Modifier `Home.tsx` et créer les composants UI nécessaires.
2.  **Phase 4** : Créer `CartContext.tsx` et mettre à jour `Header.tsx`.
3.  **Phase 5** : Modifier `AdminProducts.tsx` et les fonctions DB dans `server/db.ts`.
4.  **Phase 6** : Adapter le router Stripe pour gérer le panier et les nouveaux modes.
