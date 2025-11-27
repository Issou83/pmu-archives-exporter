# 🚀 Guide complet : Démarrer `vercel dev`

## 📋 Situation actuelle

- ✅ Projet créé et fonctionnel
- ✅ Code sur GitHub : `Issou83/pmu-archives-exporter`
- ✅ Projet déployé sur Vercel : `pmu-archives-exporter`
- ⚠️ Configuration locale Vercel à refaire (dossier `.vercel` supprimé)

## 🎯 Objectif

Démarrer le serveur de développement local avec `npx vercel dev` pour tester l'application avec les API routes.

## 📝 Étapes à suivre

### Étape 1 : Vérifier que vous êtes dans le bon dossier

```powershell
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"
```

### Étape 2 : Vérifier que le dossier `.vercel` n'existe pas

```powershell
# Si le dossier existe, supprimez-le
if (Test-Path .vercel) {
    Remove-Item -Recurse -Force .vercel
    Write-Host "Dossier .vercel supprimé" -ForegroundColor Green
} else {
    Write-Host "Dossier .vercel n'existe pas, c'est bon" -ForegroundColor Green
}
```

### Étape 3 : Lancer `npx vercel dev`

```powershell
npx vercel dev
```

### Étape 4 : Répondre aux questions de Vercel

Vercel va vous poser plusieurs questions. Voici les réponses à donner :

#### Question 1 :
```
? Set up and develop "~\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"?
```
**Réponse :** `yes` (ou `y` puis Entrée)

#### Question 2 :
```
? Which scope should contain your project?
```
**Réponse :** Sélectionnez `issou83's projects` (utilisez les flèches ↑↓ puis Entrée)

#### Question 3 :
```
? Found project "issou83s-projects/pmu-archives-exporter". Link to it?
```
**Réponse :** `yes` (ou `y` puis Entrée)

**IMPORTANT** : Cette fois, répondez `yes` pour lier au projet existant. Cela permettra :
- D'utiliser les mêmes variables d'environnement si nécessaire
- De garder la cohérence entre local et production
- D'éviter les conflits

#### Question 4 (si elle apparaît) :
```
? Would you like to pull environment variables now?
```
**Réponse :** `yes` (ou `y` puis Entrée)

Cela récupérera les variables d'environnement du projet Vercel (s'il y en a).

### Étape 5 : Attendre que le serveur démarre

Une fois toutes les questions répondues, vous devriez voir :

```
🔗 Linked to issou83s-projects/pmu-archives-exporter (created .vercel)

✅ Created .env.local file and added it to .gitignore

> Running Dev Command "vite --port $PORT"

  VITE v5.4.21  ready in [X] ms

  ➜  Local:   http://localhost:3000/

  ➜  Network: use --host to expose

  ➜  press h + enter to show help

> Ready! Available at http://localhost:3000
```

## ✅ Vérification

Une fois le serveur démarré :

1. **Ouvrez votre navigateur** : `http://localhost:3000`
2. **Vérifiez** que l'interface se charge correctement
3. **Testez une recherche** :
   - Source : Turf-FR
   - Années : 2024
   - Mois : janvier
   - Cliquez sur "Rechercher"
4. **Vérifiez les logs** dans le terminal pour voir :
   - `[API] Scraping avec source=turf-fr...`
   - `[Scraper] Début scraping Turf-FR...`
   - Les résultats du scraping

## 🐛 Si vous avez des erreurs

### Erreur "File is not defined"
- ✅ Déjà corrigé (Node.js 20+ requis dans `package.json` et `.nvmrc`)
- Vérifiez que `node --version` affiche >= 20.0.0

### Erreur 500 sur l'API
- Vérifiez les logs dans le terminal
- Regardez les messages `[API]` et `[Scraper]`
- L'erreur exacte sera affichée dans les logs

### Le serveur ne démarre pas
- Vérifiez que vous êtes dans le bon dossier
- Vérifiez que `package.json` existe
- Essayez de supprimer `node_modules` et réinstaller : `npm install`

## 📝 Résumé des réponses

Pour référence rapide :

1. `Set up and develop?` → **`yes`**
2. `Which scope?` → **`issou83's projects`**
3. `Link to it?` → **`yes`** ⭐ (IMPORTANT : cette fois, répondez yes)
4. `Pull environment variables?` → **`yes`**

## 🎉 C'est parti !

Suivez ces étapes et votre serveur devrait démarrer correctement. Une fois que vous voyez `> Ready! Available at http://localhost:3000`, vous pouvez tester l'application dans votre navigateur.

