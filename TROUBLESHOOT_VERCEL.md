# 🔧 Dépannage : `npx vercel dev` ne fait rien

## ❌ Problème

Quand vous exécutez `npx vercel dev`, la commande se termine immédiatement sans afficher de sortie.

## ✅ Solutions à essayer

### Solution 1 : Vérifier que vous êtes dans le bon dossier

```powershell
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"
pwd
```

Vous devez être dans le dossier `pmu-archives-exporter`.

### Solution 2 : Supprimer le dossier `.vercel` et réinitialiser

Le dossier `.vercel` peut contenir une configuration corrompue :

```powershell
# Supprimer le dossier .vercel
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue

# Relancer vercel dev
npx vercel dev
```

Vercel vous demandera de reconfigurer le projet. Répondez :

- `yes` à "Set up and develop"
- `no` à "Link to existing project" (ou `yes` si vous voulez lier à un projet existant)
- Donnez un nom au projet : `pmu-archives-exporter`

### Solution 3 : Utiliser `npm run dev` en attendant

Si `vercel dev` ne fonctionne pas, vous pouvez tester le frontend seul :

```powershell
npm run dev
```

**Attention** : Les API routes ne fonctionneront pas avec cette commande, mais vous pourrez au moins voir l'interface.

### Solution 4 : Vérifier les permissions

Assurez-vous d'avoir les permissions d'écriture dans le dossier :

```powershell
# Vérifier les permissions
Get-Acl . | Format-List
```

### Solution 5 : Utiliser la version globale de Vercel CLI

Si `npx` pose problème, utilisez la version globale :

```powershell
# Vérifier que vercel est installé globalement
vercel --version

# Si pas installé
npm install -g vercel@latest

# Utiliser directement
vercel dev
```

### Solution 6 : Vérifier les logs détaillés

Essayez avec plus de verbosité :

```powershell
npx vercel dev --debug
```

Ou :

```powershell
$env:DEBUG="*"
npx vercel dev
```

### Solution 7 : Réinstaller les dépendances

Parfois, les dépendances peuvent causer des problèmes :

```powershell
# Supprimer node_modules
Remove-Item -Recurse -Force node_modules

# Supprimer package-lock.json
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Réinstaller
npm install

# Relancer
npx vercel dev
```

## 🔍 Diagnostic

Pour comprendre ce qui se passe, essayez :

1. **Vérifier que Vercel CLI fonctionne** :

   ```powershell
   npx vercel --version
   ```

   Doit afficher une version (ex: `48.11.0`)

2. **Vérifier que vous êtes dans le bon dossier** :

   ```powershell
   Get-Location
   ```

   Doit afficher le chemin vers `pmu-archives-exporter`

3. **Vérifier que les fichiers sont présents** :
   ```powershell
   Test-Path vercel.json
   Test-Path package.json
   Test-Path api/archives.js
   ```
   Tous doivent retourner `True`

## 📝 Alternative : Utiliser deux terminaux

Si `vercel dev` ne fonctionne toujours pas, vous pouvez utiliser deux terminaux :

**Terminal 1 - Frontend** :

```powershell
npm run dev
```

**Terminal 2 - Backend (si vous avez un serveur Node.js séparé)** :

```powershell
# Pour l'instant, les API routes nécessitent Vercel
# Mais vous pouvez tester le frontend seul
```

## 🆘 Si rien ne fonctionne

1. **Vérifiez les logs Windows** pour voir s'il y a des erreurs système
2. **Essayez dans un nouveau terminal PowerShell** (en tant qu'administrateur)
3. **Vérifiez que Node.js est bien dans le PATH** :
   ```powershell
   where.exe node
   ```

## ✅ Solution recommandée

Commencez par la **Solution 2** (supprimer `.vercel` et réinitialiser), c'est souvent la cause du problème.
