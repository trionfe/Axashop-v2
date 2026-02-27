# Axa-shop - Digital Marketplace TODO

## Base de Données & Infrastructure
- [x] Créer les tables Drizzle (colonnes, produits, commandes, utilisateurs)
- [x] Configurer les relations et migrations
- [ ] Ajouter les seeds de données initiales

## Authentification & Sécurité
- [x] Configurer l'authentification OAuth Manus
- [x] Implémenter les rôles (user/admin)
- [x] Créer la procédure protégée admin
- [x] Ajouter la protection des routes /admin

## Interface Publique - Header & Navigation
- [x] Créer le Header avec logo DX
- [x] Ajouter la navigation (Home, Vouchers, Terms, Contact)
- [x] Implémenter le sélecteur de langue (FR/EN/ES)
- [x] Ajouter le bouton Login/Avatar utilisateur
- [x] Ajouter le lien Dashboard pour les admins

## Interface Publique - Hero Section
- [x] Créer la Hero Section avec titre et sous-titre
- [x] Ajouter les boutons "Start Shopping" et "View Vouchers"
- [x] Implémenter les cartes statistiques animées (Active Members, Total Vouchers, Security Rate)
- [x] Ajouter les animations au scroll

## Interface Publique - Trust Section
- [x] Créer les 3 cards Trust (Support, Quality, Availability)
- [x] Ajouter les icônes et textes
- [x] Implémenter les animations

## Interface Publique - Catalogue Produits
- [x] Créer la grille dynamique de produits
- [x] Implémenter les filtres par tags (All, Discord, Spotify, Roblox, Streaming)
- [x] Ajouter la barre de recherche
- [x] Créer les cartes produits avec hover effects
- [x] Ajouter le bouton "Buy Now"
- [ ] Implémenter la pagination

## Pages Secondaires
- [x] Créer la page Vouchers avec feed d'activité
- [x] Créer la page Terms (Refund policy, Guarantees, Usage rules)
- [x] Créer la page Contact
- [x] Ajouter le système de langue à toutes les pages

## Dashboard Administrateur
- [x] Créer la route /admin sécurisée
- [ ] Implémenter le layout avec sidebar
- [ ] Ajouter les cartes statistiques (ventes, produits actifs, commandes du jour)
- [ ] Ajouter les graphiques de performance (ventes/jours, produits populaires)

## Gestion des Colonnes (Admin)
- [ ] Créer la page de gestion des colonnes
- [ ] Implémenter la création de colonnes (nom, icône, ordre)
- [ ] Ajouter le drag & drop pour réorganiser
- [ ] Implémenter l'activation/désactivation
- [ ] Ajouter la modification et suppression

## Gestion des Produits (Admin)
- [ ] Créer la page de gestion des produits
- [ ] Implémenter la création/édition de produits
- [ ] Ajouter l'upload d'images vers S3
- [ ] Implémenter la gestion du stock
- [ ] Ajouter le toggle visible/caché
- [ ] Implémenter la suppression

## Gestion des Utilisateurs (Admin)
- [ ] Créer la page de gestion des utilisateurs
- [ ] Afficher la liste des utilisateurs avec rôles
- [ ] Ajouter l'historique d'achats par utilisateur
- [ ] Implémenter la modification des rôles

## Intégration Stripe
- [x] Configurer la clé Stripe
- [x] Créer les produits Stripe
- [x] Implémenter le checkout Stripe
- [x] Gérer les webhooks Stripe
- [x] Créer la table des commandes
- [x] Implémenter la confirmation de paiement

## Stockage S3
- [x] Configurer les helpers S3 (pré-configuré)
- [ ] Implémenter l'upload d'images produits
- [ ] Implémenter l'upload de logos de catégories
- [ ] Ajouter la gestion des URLs publiques

## Notifications Email
- [x] Configurer le service d'email
- [x] Ajouter les notifications pour nouvelles commandes
- [x] Ajouter les notifications pour nouveaux utilisateurs
- [x] Ajouter les notifications pour événements importants

## Design & Styling
- [x] Configurer le thème Dark Luxury Gaming
- [x] Ajouter les couleurs (noir obsidienne, brun chocolat, orange ambré)
- [x] Implémenter le glassmorphism et glow effects
- [x] Ajouter les polices Inter/Montserrat
- [x] Ajouter les animations fluides

## Tests & Déploiement
- [ ] Écrire les tests vitest pour les procédures critiques
- [ ] Tester l'authentification et les rôles
- [ ] Tester le flux de paiement Stripe
- [ ] Préparer le déploiement Vercel
- [ ] Configurer les variables d'environnement
- [ ] Tester en production

## Documentation & Finalisation
- [ ] Créer la documentation du projet
- [ ] Ajouter les commentaires dans le code
- [ ] Préparer le push sur GitHub
- [ ] Vérifier la compatibilité Vercel
