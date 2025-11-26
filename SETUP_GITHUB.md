# Guide : Mettre le projet sur GitHub

Ce guide vous explique étape par étape comment publier ce projet sur GitHub et le déployer.

## 📋 Prérequis

- Un compte GitHub
- Git installé sur votre machine
- Node.js installé (version 18 ou supérieure)

## 🚀 Étapes pour publier sur GitHub

### 1. Créer un nouveau repository sur GitHub

1. Allez sur [GitHub.com](https://github.com)
2. Cliquez sur le bouton **"+"** en haut à droite → **"New repository"**
3. Remplissez les informations :
   - **Repository name** : `pmu-archives-exporter` (ou le nom de votre choix)
   - **Description** : "Webapp pour extraire et exporter les archives des réunions PMU"
   - **Visibilité** : Public ou Private (selon votre préférence)
   - **NE PAS** cocher "Initialize this repository with a README" (on a déjà un README)
4. Cliquez sur **"Create repository"**

### 2. Initialiser Git dans le projet (si pas déjà fait)

Ouvrez un terminal dans le dossier du projet :

```bash
cd pmu-archives-exporter

# Vérifier si Git est déjà initialisé
git status

# Si erreur "not a git repository", initialiser :
git init
```

### 3. Ajouter tous les fichiers

```bash
# Ajouter tous les fichiers
git add .

# Vérifier ce qui va être commité
git status
```

### 4. Faire le premier commit

```bash
git commit -m "Initial commit: PMU Archives Exporter - projet complet"
```

### 5. Connecter au repository GitHub

Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub :

```bash
# Ajouter le remote (remplacez VOTRE_USERNAME)
git remote add origin https://github.com/VOTRE_USERNAME/pmu-archives-exporter.git

# Vérifier que c'est bien ajouté
git remote -v
```

### 6. Pousser le code sur GitHub

```bash
# Pousser sur la branche main
git branch -M main
git push -u origin main
```

Si GitHub vous demande de vous authentifier :
- Utilisez un **Personal Access Token** (pas votre mot de passe)
- Créez-en un ici : https://github.com/settings/tokens
- Sélectionnez les permissions : `repo` (accès complet aux repositories)

## ✅ Vérification

1. Allez sur votre repository GitHub
2. Vous devriez voir tous les fichiers du projet
3. Le README.md devrait s'afficher automatiquement

## 🔄 Workflow Git de base

### Pour faire des modifications :

```bash
# 1. Voir les fichiers modifiés
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Commiter avec un message descriptif
git commit -m "Description de vos changements"

# 4. Pousser sur GitHub
git push
```

### Pour récupérer les dernières modifications :

```bash
git pull
```

## 🚢 Déploiement sur Vercel

Une fois sur GitHub, déployer sur Vercel est très simple :

### Option 1 : Via l'interface Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub
3. Cliquez sur **"Add New Project"**
4. Sélectionnez votre repository `pmu-archives-exporter`
5. Vercel détectera automatiquement la configuration
6. Cliquez sur **"Deploy"**

Vercel utilisera automatiquement :
- Le `vercel.json` pour la configuration
- Les Serverless Functions dans `/api`
- Le build command depuis `package.json`

### Option 2 : Via Vercel CLI

```bash
# Installer Vercel CLI globalement
npm install -g vercel

# Dans le dossier du projet
cd pmu-archives-exporter

# Déployer
vercel

# Suivre les instructions
```

## 🔧 Configuration GitHub Actions (CI/CD)

Le projet inclut déjà un workflow GitHub Actions (`.github/workflows/ci.yml`) qui :
- Lance les tests automatiquement sur chaque push
- Vérifie le linting
- Build le projet

**C'est automatique** : Dès que vous poussez sur GitHub, les tests se lancent !

## 📝 Fichiers importants pour GitHub

- ✅ `.gitignore` : Déjà configuré pour ignorer `node_modules/`, `dist/`, etc.
- ✅ `LICENSE` : Licence MIT (vous pouvez changer si besoin)
- ✅ `.github/workflows/ci.yml` : CI/CD automatique
- ✅ `README.md` : Documentation principale
- ✅ `CONTRIBUTING.md` : Guide pour les contributeurs

## ❓ Problèmes courants

### Erreur : "remote origin already exists"

```bash
# Supprimer l'ancien remote
git remote remove origin

# Réessayer l'étape 5
```

### Erreur : "failed to push some refs"

```bash
# Récupérer les changements distants d'abord
git pull origin main --allow-unrelated-histories

# Puis pousser
git push -u origin main
```

### Erreur d'authentification GitHub

Utilisez un **Personal Access Token** au lieu d'un mot de passe :
1. https://github.com/settings/tokens
2. Generate new token (classic)
3. Sélectionnez `repo` scope
4. Copiez le token et utilisez-le comme mot de passe

## 🎉 C'est fait !

Votre projet est maintenant sur GitHub et prêt à être partagé et déployé !

