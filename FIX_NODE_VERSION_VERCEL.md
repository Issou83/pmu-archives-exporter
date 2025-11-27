# 🔧 Forcer Node.js 20+ dans Vercel

## ❌ Problème identifié

Vercel utilise Node.js **v19.8.1** alors que nous avons besoin de **v20+** pour que `fetch` et l'API `File` fonctionnent correctement.

## ✅ Solution appliquée

J'ai ajouté la configuration dans `vercel.json` pour forcer Node.js 20.x :

```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

## 🚀 Redémarrer le serveur

**IMPORTANT** : Vous devez redémarrer le serveur pour que les changements prennent effet :

1. **Arrêtez le serveur** : Appuyez sur `Ctrl + C` dans le terminal où `vercel dev` tourne

2. **Relancez** :
```powershell
npx vercel dev
```

3. **Testez à nouveau** :
   - Ouvrez `http://localhost:3003/api/test`
   - Vous devriez voir `"nodeVersion": "v20.x.x"` (au lieu de v19.8.1)

## ✅ Vérification

Après redémarrage, testez :

1. **Endpoint de test** :
   ```
   http://localhost:3003/api/test
   ```
   Vérifiez que `nodeVersion` est maintenant `v20.x.x` ou supérieur

2. **API archives** :
   ```
   http://localhost:3003/api/archives?source=turf-fr&years=2024&months=janvier
   ```
   Devrait maintenant fonctionner sans erreur 500

## 📝 Note

En production sur Vercel, cette configuration sera automatiquement appliquée. Pour le développement local, vous devez redémarrer le serveur.

