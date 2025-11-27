# 🔧 Corriger les erreurs API

## ❌ Problèmes identifiés

1. **L'API retourne du code source au lieu de JSON**
   - Vercel sert le fichier `archives.js` comme un fichier statique
   - Les Serverless Functions ne sont pas correctement exécutées

2. **Erreur React #31 avec PMU JSON**
   - L'API PMU retourne des objets avec `{code, libelleCourt, libelleLong}`
   - Ces objets sont rendus directement dans React (interdit)

## ✅ Solutions

### Solution 1 : Vérifier la configuration Vercel

Le problème vient du fait que Vercel ne reconnaît pas les fichiers dans `/api` comme des Serverless Functions.

**Vérifiez que :**
1. Les fichiers dans `/api` exportent bien `export default async function handler(req, res)`
2. Le fichier `vercel.json` ne redirige pas incorrectement les routes API

### Solution 2 : Redéployer sur Vercel

Après les corrections, redéployez :

```powershell
# Pousser les changements sur GitHub
git add .
git commit -m "Fix API errors: better PMU JSON handling and headers"
git push

# Vercel redéploiera automatiquement si connecté à GitHub
# Ou déployez manuellement :
npx vercel --prod
```

### Solution 3 : Tester localement avec vercel dev

Pour tester les API routes localement, vous DEVEZ utiliser `vercel dev` :

```powershell
npx vercel dev
```

**Ne pas utiliser `npm run dev`** car Vite ne peut pas servir les Serverless Functions.

## 🔍 Vérification

Une fois redéployé, testez :

1. **L'API devrait retourner du JSON**, pas du code source
2. **Les erreurs React #31 devraient disparaître** car on filtre maintenant les objets non supportés

## 📝 Modifications apportées

1. **Meilleure gestion des structures PMU JSON** :
   - Détection et filtrage des objets avec `libelleCourt/libelleLong`
   - Meilleure extraction des données depuis différentes structures

2. **Headers Content-Type explicites** :
   - Ajout de `Content-Type: application/json` pour s'assurer que la réponse est bien du JSON

3. **Gestion d'erreurs améliorée** :
   - Les structures non supportées sont ignorées au lieu de causer des erreurs

## ⚠️ Note importante

**L'API PMU JSON nécessite une adaptation** selon la structure réelle de l'API. Si vous voyez encore des erreurs avec `libelleCourt/libelleLong`, cela signifie que la structure de l'API PMU est différente de ce qui était prévu.

Pour adapter le scraper PMU JSON :
1. Inspectez la réponse réelle de l'API PMU
2. Modifiez `normalizePmuReunion` dans `api/scrapers/pmuJsonScraper.js`
3. Adaptez la logique de parsing dans `scrapePmuDate`

