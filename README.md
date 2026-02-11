# Transcendence - Documentation du Projet

## Formation et composition de l'équipe

Au départ, notre équipe devait être composée de trois personnes, conformément aux consignes initiales. Cependant, au fil du processus, nous nous sommes finalement retrouvés à deux.

Ce choix n'a pas été immédiat. Dès la fin du cercle précédent, conscients du peu de marge de manœuvre dont nous disposions, nous avons décidé de lancer le projet rapidement, tout en cherchant activement d'autres membres.

Afin de ne pas perdre de temps, nous avons établi un squelette global des sept modules, tout en laissant une place pour de futurs coéquipiers.

Nous avons bien tenté d'intégrer une nouvelle personne, qui nous a rejoints sur Discord et Git, mais après une période d'inactivité, elle a finalement choisi de rejoindre un autre groupe. Malgré plusieurs tentatives de fusion avec d'autres équipes (notamment via des rendez-vous avec Kunfundi), aucune n'a abouti. Nous avons donc conduit l'intégralité du projet en binôme.

---

## Organisation et dynamique de collaboration

Cette configuration a eu un impact majeur sur notre manière de travailler.

Travailler à deux implique forcément une charge de travail individuelle plus importante, mais offre en contrepartie une autonomie accrue.

La communication s'en trouve simplifiée : 
- Moins d'interlocuteurs
- Moins de temps perdu à se coordonner
- Ne demande qu'une compréhension superficielle de git

Dans un groupe plus large, les différentes parties du code sont souvent très imbriquées, rendant les ajustements permanents. À deux, les tâches étaient moins interdépendantes, limitant ainsi les conflits de version ou les bugs liés à la fusion du code.

Nos réunions hebdomadaires et nos échanges réguliers suffisaient à maintenir une progression efficace, là où un groupe plus nombreux aurait nécessité des processus de validation plus lourds (pull requests, revue de code, etc.).

---

## Répartition des rôles et responsabilités

Afin d'assurer une progression claire et efficace, nous avons divisé le travail en deux pôles :

### Backend
Principalement pris en charge par moi-même.

### Frontend
Géré par mon binôme.

### Rôles de gestion

**Project Manager (PM)** - Assumé par moi-même  
Ce cumul s'est fait naturellement, notamment parce que la charge du backend me laissait le temps de coordonner, planifier et résoudre les bugs complexes. Même si le rôle de PM est moins visible dans une équipe réduite, il a permis de maintenir un cap cohérent tout au long du développement.

**Architecte** - Assumé par mon binôme  
Sa rigueur et son sens de la structure lui ont permis de définir l'ossature du projet, tout en veillant à ce que mon code reste clair et lisible. Ses conseils et relectures ont permis de maintenir un niveau de qualité constant dans l'ensemble du dépôt.

---

## Bilan du travail en binôme

### Avantages

Travailler à deux présente de nombreux avantages :

- Une meilleure fluidité dans la communication  
- Des décisions rapides et des compromis simplifiés  
- Une organisation allégée

### Limites

Cependant, cette configuration implique aussi certaines limites. En particulier, elle réduit l'aspect pédagogique du travail en groupe.

Dans une équipe plus large, chaque membre doit justifier ses choix techniques et rendre son code compréhensible pour tous — un processus qui favorise l'apprentissage collectif. En binôme, cet effet est atténué, chacun se concentrant davantage sur ses modules spécifiques.

---

## Architecture du Projet

### Technologies utilisées

- **Frontend**: TypeScript, Canvas API
- **Backend**: Node.js, Fastify, TypeScript
- **Database**: SQLite
- **Communication**: WebSocket (WSS), HTTPS
- **Sécurité**: JWT, SSL/TLS
- **Deployment**: Docker, Docker Compose

### Structure des modules

Le projet est divisé en plusieurs modules principaux :

1. **Authentification** - Gestion des utilisateurs et sessions
2. **Jeux** - Pong et Pacman avec modes solo/duo
3. **Tournois** - Système de bracket et matchmaking
4. **Chat** - Messagerie temps réel avec WebSocket
5. **Profil** - Gestion des profils utilisateurs
6. **Amis** - Système d'amitié et blocage
7. **Dashboard** - Statistiques et historique de jeux

---

## Installation et Utilisation

### Prérequis

- Docker
- Docker Compose
- Make

### Commandes disponibles

Le projet utilise un Makefile pour simplifier les opérations. Voici les commandes disponibles :

#### Démarrer le projet
```bash
make up
```
Lance les conteneurs Docker en mode détaché. Si les certificats SSL n'existent pas, ils seront générés automatiquement.

#### Arrêter le projet
```bash
make down
```
Arrête tous les conteneurs Docker.

#### Construire les images
```bash
make build
```
Construit (ou reconstruit) les images Docker. Génère également les certificats SSL si nécessaire.

#### Nettoyer complètement
```bash
make clean
```
Arrête et supprime tout : conteneurs, volumes, et images Docker.

#### Nettoyer uniquement les volumes
```bash
make clean-volumes
```
Arrête les conteneurs et supprime uniquement les volumes (conserve les images).

#### Afficher l'aide
```bash
make help
```
Affiche la liste des commandes disponibles.

### Accès à l'application

Une fois le projet démarré avec `make up`, l'application est accessible à :

- **URL**: `https://localhost:8443`
- **Note**: Comme le projet utilise des certificats SSL auto-signés, votre navigateur affichera un avertissement de sécurité. Il faut accepter le certificat pour accéder à l'application.

### Workflow typique

```bash
# Première utilisation
make build    # Construire les images
make up       # Démarrer le projet

# Développement quotidien
make down     # Arrêter
make up       # Redémarrer

# Nettoyage complet (en cas de problème)
make clean    # Tout supprimer
make build    # Reconstruire
make up       # Relancer
```
