# 🔧 Correction de l'erreur 500

## ❌ Problème identifié

L'erreur 500 (Internal Server Error) se produit lors de l'appel à `/api/archives`.

## 🔍 Causes possibles

1. **`npx vercel dev` ne lance que Vite** : Les Serverless Functions ne sont pas servies
2. **Erreur dans le code** : Problème de syntaxe ou de logique dans `api/archives.js`
3. **Problème de conversion de types** : Les `reunionNumbers` doivent être des nombres, pas des strings

## ✅ Solutions appliquées

### 1. Correction de la conversion des reunionNumbers

Les `reunionNumbers` sont maintenant correctement convertis en nombres lors du parsing des query params.

### 2. Amélioration du filtrage des reunionNumbers

Le filtrage compare maintenant correctement les nombres, même si l'un est une string et l'autre un nombre.

## 🚀 Comment tester

### Option 1 : Utiliser `vercel dev` (recommandé)

**ARRÊTEZ** le serveur actuel (Ctrl+C) et relancez avec :

```powershell
vercel dev
```

**Note :** Si `vercel` n'est pas dans le PATH, utilisez :
```powershell
npx vercel dev
```

Mais cette fois, Vercel devrait détecter les Serverless Functions dans `/api`.

### Option 2 : Vérifier les logs

Quand vous faites une recherche, regardez les logs dans le terminal où `vercel dev` tourne. Vous devriez voir :

```
[API] Scraping avec source=turf-fr, years=2024, months=janvier
[API] Début scraping Turf-FR...
[Scraper] Début scraping Turf-FR: années=2024, mois=janvier
...
```

Si vous voyez une erreur, elle sera affichée dans les logs.

### Option 3 : Tester directement l'API

Ouvrez dans votre navigateur :
```
http://localhost:3000/api/archives?source=turf-fr&years=2024&months=janvier
```

Vous devriez voir soit :
- Un JSON avec les réunions
- Un message d'erreur explicite

## ⚠️ Si l'erreur persiste

1. **Vérifier que les Serverless Functions sont bien détectées** :
   - Dans les logs de `vercel dev`, vous devriez voir quelque chose comme :
     ```
     > Ready! Available at http://localhost:3000
     > API Routes detected
     ```

2. **Vérifier les logs d'erreur** :
   - Regardez attentivement les logs dans le terminal
   - Cherchez les messages `[API]` et `[Scraper]`
   - Si vous voyez une erreur, copiez-la entièrement

3. **Vérifier la structure du projet** :
   - Les fichiers dans `/api` doivent exporter `export default async function handler(req, res)`
   - Vercel détecte automatiquement les fichiers dans `/api` comme Serverless Functions

4. **Tester avec un endpoint simple** :
   Créez un fichier `api/test.js` :
   ```javascript
   export default async function handler(req, res) {
     return res.status(200).json({ message: 'API works!' });
   }
   ```
   
   Testez avec : `http://localhost:3000/api/test`
   
   Si ça fonctionne, le problème est dans `archives.js`.
   Si ça ne fonctionne pas, le problème est dans la configuration Vercel.

## 📝 Notes importantes

- **`npx vercel dev` vs `vercel dev`** : Les deux devraient fonctionner, mais `vercel dev` est plus fiable
- **Les logs sont essentiels** : Regardez toujours les logs du serveur pour comprendre les erreurs
- **Les Serverless Functions prennent du temps** : Le scraping peut prendre plusieurs secondes, c'est normal

