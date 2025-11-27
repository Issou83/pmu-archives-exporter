# 🧪 Tester l'application

## ❌ Problème identifié

Lors du test dans le navigateur, j'ai détecté plusieurs problèmes :

1. **Les fichiers Vite ne se chargeaient pas** (404 pour `@vite/client`, `src/main.jsx`)
2. **L'API retournait une erreur 500**
3. **Le rewrite dans `vercel.json` interceptait les routes `/api`**

## ✅ Correction appliquée

J'ai modifié `vercel.json` pour exclure les routes `/api` du rewrite SPA :

```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

Cette regex signifie : "rediriger tout vers `/index.html` SAUF les routes qui commencent par `/api/`"

## 🚀 Redémarrer le serveur

**IMPORTANT** : Vous devez redémarrer le serveur pour que les changements prennent effet :

1. **Arrêtez le serveur actuel** : Appuyez sur `Ctrl + C` dans le terminal

2. **Relancez le serveur** :

```powershell
npx vercel dev
```

3. **Attendez que le serveur soit prêt** :

```
> Ready! Available at http://localhost:3000
```

## 🧪 Tester à nouveau

Une fois le serveur redémarré :

1. **Ouvrez** `http://localhost:3000` dans votre navigateur
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

## 🔍 Si ça ne fonctionne toujours pas

### Vérifier que les API routes sont servies

Testez directement dans le navigateur :

```
http://localhost:3000/api/archives?source=turf-fr&years=2024&months=janvier
```

Vous devriez voir :

- ✅ Un JSON avec les réunions (peut être vide si aucune réunion n'est trouvée)
- ❌ Une erreur 500 (regardez les logs du terminal pour l'erreur exacte)

### Vérifier les logs du terminal

Quand vous faites une recherche, regardez attentivement les logs dans le terminal où `vercel dev` tourne. Vous devriez voir :

- Les messages `[API]` et `[Scraper]`
- Les erreurs éventuelles avec leur stack trace complète

### Alternative : Tester avec `npm run dev`

Si `vercel dev` ne fonctionne toujours pas, vous pouvez tester le frontend seul :

```powershell
npm run dev
```

Mais attention : les appels API ne fonctionneront pas car les Serverless Functions ne seront pas servies.

## 📝 Notes

- Les changements ont été commités dans Git
- Le fichier `vercel.json` est maintenant correctement configuré
- Il faut redémarrer le serveur pour que les changements prennent effet
