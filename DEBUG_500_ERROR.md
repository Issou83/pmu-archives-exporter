# 🔍 Déboguer l'erreur 500

## ✅ Corrections appliquées

J'ai ajouté :
1. **Vérification de `fetch`** : L'API vérifie maintenant si `fetch` est disponible
2. **Meilleure gestion d'erreurs** : Les erreurs affichent maintenant plus de détails
3. **Endpoint de test** : `/api/test` pour vérifier que les Serverless Functions fonctionnent

## 🧪 Tests à faire

### Test 1 : Vérifier que les Serverless Functions fonctionnent

Ouvrez dans votre navigateur :
```
http://localhost:3003/api/test
```

**Résultat attendu** : Un JSON avec :
```json
{
  "message": "API fonctionne !",
  "method": "GET",
  "nodeVersion": "v22.13.1",
  "hasFetch": true
}
```

**Si ça fonctionne** : Les Serverless Functions sont OK, le problème est dans le scraper.

**Si ça ne fonctionne pas** : Il y a un problème avec la configuration Vercel.

### Test 2 : Tester l'API archives avec des paramètres

Ouvrez dans votre navigateur :
```
http://localhost:3003/api/archives?source=turf-fr&years=2024&months=janvier
```

**Regardez les logs du serveur** dans le terminal où `vercel dev` tourne.

Vous devriez voir :
- `[API] Scraping avec source=turf-fr, years=2024, months=janvier`
- `[API] Début scraping Turf-FR...`
- Soit des messages de succès, soit une erreur avec le message complet

## 📋 Ce que je dois voir dans les logs

**Copiez-collez ici les logs du terminal** quand vous testez l'API. Je cherche :

1. **Messages `[API]`** : Pour voir où ça bloque
2. **Messages `[Scraper]`** : Pour voir le processus de scraping
3. **Erreurs complètes** : Message + stack trace

## 🔧 Solutions possibles selon l'erreur

### Erreur "fetch is not available"
- **Cause** : Node.js < 18 ou problème de configuration Vercel
- **Solution** : Vérifier que Vercel utilise Node.js 20+ (déjà configuré dans `package.json`)

### Erreur réseau (timeout, connection refused)
- **Cause** : Le site turf-fr.com bloque les requêtes ou n'est pas accessible
- **Solution** : Vérifier que le site est accessible depuis votre navigateur

### Erreur de parsing
- **Cause** : La structure HTML a changé
- **Solution** : Adapter le scraper

### Erreur d'import
- **Cause** : Problème avec les imports ES modules
- **Solution** : Vérifier que tous les fichiers existent et que les imports sont corrects

## 🚀 Prochaines étapes

1. **Testez `/api/test`** et dites-moi le résultat
2. **Testez `/api/archives`** avec les paramètres
3. **Copiez-collez les logs du serveur** ici

Avec ces informations, je pourrai identifier et corriger le problème exact !

