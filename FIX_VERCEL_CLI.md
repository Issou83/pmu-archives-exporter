# 🔧 Corriger le problème Vercel CLI sur Windows

## ❌ Problème

Après avoir installé Vercel CLI avec `npm install -g vercel`, PowerShell ne reconnaît pas la commande `vercel`.

## ✅ Solutions

### Solution 1 : Utiliser `npx` (Recommandé - Plus simple)

Au lieu d'utiliser `vercel`, utilisez `npx vercel` :

```powershell
# Démarrer le serveur de développement
npx vercel dev

# Déployer
npx vercel

# Autres commandes
npx vercel --version
npx vercel login
```

**Avantage** : Fonctionne immédiatement, pas besoin de modifier le PATH.

### Solution 2 : Ajouter npm au PATH (Permanent)

1. **Trouvez le chemin npm global** :
   ```powershell
   npm config get prefix
   ```
   Cela devrait afficher quelque chose comme : `C:\Users\iss\AppData\Roaming\nvm\22.13.1`

2. **Ajoutez le chemin au PATH Windows** :
   - Appuyez sur `Win + R`
   - Tapez `sysdm.cpl` et appuyez sur Entrée
   - Allez dans l'onglet "Avancé"
   - Cliquez sur "Variables d'environnement"
   - Dans "Variables système", trouvez "Path" et cliquez sur "Modifier"
   - Cliquez sur "Nouveau" et ajoutez le chemin (ex: `C:\Users\iss\AppData\Roaming\nvm\22.13.1`)
   - Cliquez sur "OK" partout
   - **Redémarrez PowerShell** (fermez et rouvrez)

3. **Vérifiez** :
   ```powershell
   vercel --version
   ```

### Solution 3 : Redémarrer PowerShell (Parfois ça suffit)

Parfois, il suffit de fermer et rouvrir PowerShell pour que le PATH soit mis à jour :

1. Fermez PowerShell complètement
2. Rouvrez PowerShell
3. Essayez `vercel --version`

## 🎯 Recommandation

**Utilisez `npx vercel`** - C'est la solution la plus simple et la plus fiable :

```powershell
# Au lieu de
vercel dev

# Utilisez
npx vercel dev
```

Cela fonctionne immédiatement sans configuration supplémentaire.

## 📝 Commandes avec npx

```powershell
# Démarrer le serveur de développement
npx vercel dev

# Déployer sur Vercel
npx vercel

# Se connecter à Vercel
npx vercel login

# Voir la version
npx vercel --version

# Voir l'aide
npx vercel --help
```

## ✅ Test

Testez que ça fonctionne :

```powershell
npx vercel --version
```

Vous devriez voir : `Vercel CLI 48.11.0` (ou une version similaire)

