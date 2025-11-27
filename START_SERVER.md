# 🚀 Démarrer le serveur

## ✅ Vérifications préalables

Avant de démarrer le serveur, vérifiez que :

1. **Node.js >= 20.0.0** :

   ```powershell
   node --version
   ```

   Doit afficher `v20.x.x` ou supérieur

2. **Vercel CLI est à jour** :
   ```powershell
   npx vercel --version
   ```
   Doit afficher une version récente (48.x.x ou supérieur)

## 🚀 Démarrer le serveur

```powershell
npx vercel dev
```

## ✅ Ce que vous devriez voir

Si tout fonctionne correctement, vous devriez voir :

```
Vercel CLI 48.11.0

> Running Dev Command "vite --port $PORT"

  VITE v5.4.21  ready in [X] ms

  ➜  Local:   http://localhost:3000/

  ➜  Network: use --host to expose

  ➜  press h + enter to show help

> Ready! Available at http://localhost:3000
```

**IMPORTANT** : Vous ne devriez PAS voir l'erreur `File is not defined`.

## 🧪 Tester l'application

1. **Ouvrez** `http://localhost:3000` dans votre navigateur
2. **Vérifiez** que l'interface se charge correctement
3. **Testez une recherche** :
   - Source : Turf-FR
   - Années : 2024
   - Mois : janvier
   - Cliquez sur "Rechercher"
4. **Vérifiez les logs** dans le terminal pour voir le processus de scraping

## ❌ Si vous voyez encore l'erreur "File is not defined"

1. **Vérifiez la version de Node.js utilisée par Vercel** :
   - L'erreur indique `Node.js v19.8.1` dans la stack trace
   - Cela signifie que Vercel CLI utilise une version ancienne de Node.js

2. **Solutions possibles** :
   - **Option A** : Utiliser `nvm` pour changer la version de Node.js :
     ```powershell
     nvm install 20
     nvm use 20
     npx vercel dev
     ```
   - **Option B** : Vérifier que Node.js 20+ est dans votre PATH :
     ```powershell
     where node
     ```
     Vérifiez que le chemin pointe vers Node.js 20+
   - **Option C** : Utiliser directement la version locale de Node.js :

     ```powershell
     # Vérifier que node pointe vers la bonne version
     node --version

     # Si c'est bien 20+, Vercel devrait l'utiliser
     npx vercel dev
     ```

## 📝 Notes

- Le serveur doit rester actif pour que l'application fonctionne
- Ne fermez pas le terminal pendant que le serveur tourne
- Pour arrêter le serveur, appuyez sur `Ctrl + C`
