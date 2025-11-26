# 🔧 Corriger l'erreur Git dans VS Code

## ❌ Problème

VS Code affiche l'erreur : **"Git : remote: Repository not found."**

Cela arrive généralement quand :
1. VS Code est ouvert sur le **mauvais dossier** (`cours OPC` au lieu de `pmu-archives-exporter`)
2. Le remote Git pointe vers un repository qui n'existe pas
3. VS Code essaie de publier une branche depuis le mauvais projet

## ✅ Solution

### Option 1 : Ouvrir le bon dossier dans VS Code (Recommandé)

1. **Fermez VS Code** (ou fermez la fenêtre actuelle)

2. **Ouvrez VS Code dans le bon dossier** :
   ```powershell
   # Dans PowerShell ou Terminal
   cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"
   code .
   ```

   Ou depuis VS Code :
   - `File` → `Open Folder...`
   - Naviguez vers : `C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter`
   - Cliquez sur "Select Folder"

3. **Vérifiez que vous êtes dans le bon dossier** :
   - Regardez en bas à gauche de VS Code
   - Vous devriez voir : `pmu-archives-exporter` (pas `cours OPC`)

### Option 2 : Corriger le remote dans VS Code

Si vous devez rester dans VS Code avec le dossier `cours OPC` :

1. **Ouvrez le terminal intégré** dans VS Code (`Ctrl + ù` ou `Terminal` → `New Terminal`)

2. **Vérifiez le remote actuel** :
   ```powershell
   git remote -v
   ```

3. **Si le remote est incorrect**, corrigez-le :
   ```powershell
   # Supprimer l'ancien remote
   git remote remove origin
   
   # Ajouter le bon remote (si vous travaillez sur pmu-archives-exporter)
   git remote add origin https://github.com/Issou83/pmu-archives-exporter.git
   
   # Vérifier
   git remote -v
   ```

### Option 3 : Utiliser le terminal PowerShell directement

**Au lieu d'utiliser VS Code pour Git**, utilisez PowerShell directement :

```powershell
# Aller dans le bon dossier
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"

# Vérifier le status
git status

# Ajouter les changements
git add .

# Commiter
git commit -m "Vos changements"

# Pousser
git push
```

## 🎯 Recommandation

**La meilleure solution** est d'ouvrir VS Code dans le **bon dossier** (`pmu-archives-exporter`) :

1. Fermez VS Code
2. Ouvrez PowerShell
3. Exécutez :
   ```powershell
   cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"
   code .
   ```

Cela ouvrira VS Code directement dans le bon dossier, et Git fonctionnera correctement.

## ✅ Vérification

Une fois dans le bon dossier, vérifiez :

1. **Dans VS Code**, en bas à gauche, vous devriez voir : `pmu-archives-exporter`
2. **Dans le terminal VS Code**, exécutez :
   ```powershell
   git remote -v
   ```
   Vous devriez voir :
   ```
   origin  https://github.com/Issou83/pmu-archives-exporter.git (fetch)
   origin  https://github.com/Issou83/pmu-archives-exporter.git (push)
   ```

3. **Testez un push** :
   ```powershell
   git status
   git push
   ```

Si tout est correct, le push devrait fonctionner sans erreur !

