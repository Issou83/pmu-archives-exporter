# 🔧 Corriger l'erreur "Function Runtimes must have a valid version"

## ❌ Erreur

```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

## ✅ Solution

J'ai supprimé la configuration incorrecte de `vercel.json`. Vercel détecte automatiquement la version de Node.js via :

1. **`.nvmrc`** : Déjà configuré avec `20`
2. **`package.json`** : Déjà configuré avec `"engines": { "node": ">=20.0.0" }`

## 🚀 Redémarrer le serveur

1. **Relancez** :
```powershell
npx vercel dev
```

2. **Vérifiez la version Node.js** :
   - Ouvrez `http://localhost:3003/api/test`
   - Regardez `nodeVersion` dans la réponse

## 📝 Note importante

Pour `vercel dev` en local, Vercel CLI utilise la version de Node.js installée sur votre système. 

Si vous voyez toujours `v19.8.1` dans `/api/test`, c'est que Vercel CLI utilise une version ancienne de Node.js. 

**Solutions possibles** :

### Option 1 : Utiliser nvm pour changer la version

Si vous avez `nvm` installé :

```powershell
nvm use 20
npx vercel dev
```

### Option 2 : Vérifier quelle version Node.js est utilisée

```powershell
node --version
```

Si c'est `v19.8.1`, vous devez mettre à jour Node.js sur votre système.

### Option 3 : En production sur Vercel

En production, Vercel respectera automatiquement `.nvmrc` et `package.json`, donc Node.js 20+ sera utilisé.

## ✅ Test

Après redémarrage, testez :

```
http://localhost:3003/api/test
```

Si `nodeVersion` est toujours `v19.8.1`, vous devez mettre à jour Node.js sur votre système local.

