# 🔧 Correction de l'erreur "File is not defined"

## ❌ Problème identifié

L'erreur `ReferenceError: File is not defined` se produit car Vercel CLI utilise Node.js v19.8.1, alors que l'API `File` nécessite Node.js 20+.

## ✅ Solutions appliquées

1. **Ajout de `.nvmrc`** : Spécifie Node.js 20 comme version requise
2. **Ajout de `engines` dans `package.json`** : Force Node.js >= 20.0.0

## 🚀 Solutions possibles

### Option 1 : Mettre à jour Vercel CLI (recommandé)

```powershell
npm install -g vercel@latest
```

Puis relancez :
```powershell
npx vercel dev
```

### Option 2 : Utiliser nvm pour changer la version de Node.js

Si vous avez `nvm` installé :

```powershell
# Installer Node.js 20 si pas déjà fait
nvm install 20

# Utiliser Node.js 20
nvm use 20

# Vérifier la version
node --version

# Relancer Vercel
npx vercel dev
```

### Option 3 : Utiliser directement Node.js 20+

Si vous avez Node.js 20+ installé mais que Vercel CLI utilise une autre version :

1. **Vérifiez quelle version Node.js est utilisée par Vercel** :
   - Regardez l'erreur : elle indique `Node.js v19.8.1`
   - Votre système a `v22.13.1` mais Vercel CLI utilise `v19.8.1`

2. **Mettez à jour Vercel CLI** :
   ```powershell
   npm install -g vercel@latest
   ```

3. **Ou utilisez la version locale de Node.js** :
   - Assurez-vous que Node.js 20+ est dans votre PATH
   - Vérifiez avec `node --version`
   - Si c'est bien 20+, Vercel CLI devrait l'utiliser après mise à jour

### Option 4 : Utiliser `npm run dev` pour le frontend uniquement

Si vous voulez juste tester le frontend sans les API routes :

```powershell
npm run dev
```

Mais attention : les appels API ne fonctionneront pas.

## 🔍 Vérification

Après avoir appliqué une solution, vérifiez :

1. **La version de Node.js utilisée** :
   ```powershell
   node --version
   ```
   Doit être >= 20.0.0

2. **La version de Vercel CLI** :
   ```powershell
   npx vercel --version
   ```

3. **Relancez le serveur** :
   ```powershell
   npx vercel dev
   ```

4. **Vérifiez qu'il n'y a plus d'erreur** `File is not defined`

## 📝 Notes

- L'API `File` est disponible depuis Node.js 20.0.0
- Vercel CLI devrait automatiquement utiliser la version de Node.js spécifiée dans `engines` ou `.nvmrc`
- Si le problème persiste, essayez de désinstaller et réinstaller Vercel CLI

