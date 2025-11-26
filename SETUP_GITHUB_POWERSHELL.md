# Guide : Mettre le projet sur GitHub (PowerShell Windows)

## ⚠️ Important : Vous êtes dans le mauvais dossier !

Vous êtes actuellement dans `cours OPC`, mais le projet est dans `CoursesCH/pmu-archives-exporter`.

## 📍 Étape 1 : Aller dans le bon dossier

```powershell
# Aller dans le dossier du projet
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"

# Vérifier que vous êtes au bon endroit
pwd
# Devrait afficher : C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter

# Vérifier que les fichiers du projet sont là
ls
# Devrait afficher : api, src, package.json, README.md, etc.
```

## 🔧 Étape 2 : Annuler le Git mal initialisé (si nécessaire)

Si vous avez initialisé Git dans le mauvais dossier (`cours OPC`), vous pouvez l'ignorer. 
On va initialiser Git dans le BON dossier maintenant.

## 🚀 Étape 3 : Initialiser Git dans le bon dossier

```powershell
# Vous devez être dans pmu-archives-exporter
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"

# Vérifier si Git est déjà initialisé ici
git status

# Si erreur "not a git repository", initialiser :
git init
```

## 📦 Étape 4 : Ajouter les fichiers du projet

```powershell
# Ajouter tous les fichiers
git add .

# Vérifier ce qui va être commité
git status
```

## 💾 Étape 5 : Premier commit

```powershell
git commit -m "Initial commit: PMU Archives Exporter - projet complet"
```

## 🌐 Étape 6 : Créer le repository sur GitHub

**IMPORTANT** : Faites cela AVANT de connecter Git !

1. Allez sur [GitHub.com](https://github.com) et connectez-vous
2. Cliquez sur le bouton **"+"** en haut à droite → **"New repository"**
3. Remplissez :
   - **Repository name** : `pmu-archives-exporter`
   - **Description** : "Webapp pour extraire et exporter les archives des réunions PMU"
   - **Visibilité** : Public ou Private
   - **NE PAS** cocher "Initialize with README" (on en a déjà un)
4. Cliquez sur **"Create repository"**

## 🔗 Étape 7 : Connecter au repository GitHub

**REMPLACEZ `VOTRE_USERNAME` par votre vrai nom d'utilisateur GitHub !**

```powershell
# Exemple si votre username est "john-doe" :
# git remote add origin https://github.com/john-doe/pmu-archives-exporter.git

# Commande générique (REMPLACEZ VOTRE_USERNAME) :
git remote add origin https://github.com/VOTRE_USERNAME/pmu-archives-exporter.git

# Vérifier que c'est bien ajouté
git remote -v
```

## 📤 Étape 8 : Pousser le code sur GitHub

```powershell
# Renommer la branche en main (si nécessaire)
git branch -M main

# Pousser sur GitHub
git push -u origin main
```

Si GitHub vous demande de vous authentifier :
- **N'utilisez PAS votre mot de passe**
- Utilisez un **Personal Access Token** :
  1. Allez sur https://github.com/settings/tokens
  2. Cliquez sur **"Generate new token (classic)"**
  3. Donnez un nom (ex: "pmu-archives-exporter")
  4. Cochez la case **`repo`** (accès complet aux repositories)
  5. Cliquez sur **"Generate token"**
  6. **COPIEZ LE TOKEN** (vous ne le reverrez plus !)
  7. Utilisez ce token comme mot de passe lors du `git push`

## ✅ Vérification

1. Allez sur votre repository GitHub : `https://github.com/VOTRE_USERNAME/pmu-archives-exporter`
2. Vous devriez voir tous les fichiers du projet
3. Le README.md devrait s'afficher automatiquement

## 🐛 Problèmes courants

### Erreur : "remote origin already exists"

```powershell
# Supprimer l'ancien remote
git remote remove origin

# Réessayer l'étape 7
```

### Erreur : "repository not found"

- Vérifiez que vous avez bien créé le repository sur GitHub
- Vérifiez que le nom du repository correspond exactement
- Vérifiez que vous avez utilisé le BON nom d'utilisateur GitHub

### Erreur d'authentification

Utilisez un **Personal Access Token** au lieu d'un mot de passe (voir étape 8).

## 📝 Commandes complètes (copier-coller)

**Remplacez `VOTRE_USERNAME` par votre vrai username GitHub :**

```powershell
# 1. Aller dans le bon dossier
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"

# 2. Initialiser Git
git init

# 3. Ajouter les fichiers
git add .

# 4. Premier commit
git commit -m "Initial commit: PMU Archives Exporter - projet complet"

# 5. Connecter à GitHub (REMPLACEZ VOTRE_USERNAME !)
git remote add origin https://github.com/VOTRE_USERNAME/pmu-archives-exporter.git

# 6. Pousser sur GitHub
git branch -M main
git push -u origin main
```

## 🎉 C'est fait !

Une fois que tout est poussé, votre projet sera visible sur GitHub et prêt à être déployé sur Vercel !

