# 🔧 Résumé des Corrections - Rapports d'Arrivée

## ❌ Problème Initial

**Symptôme** : Aucun rapport d'arrivée dans les résultats de recherche

- **Cause** : Les rapports étaient désactivés pour les années récentes (>= 2024)
- **Code problématique** : `includeArrivalReports = totalMonths <= 2 && !isRecentYear`

## ✅ Corrections Appliquées

### 1. Réactivation des Rapports d'Arrivée

**Fichier** : `api/archives.js` (lignes 214-233)

**Logique corrigée** :

```javascript
// Activer seulement pour 1 mois, ou 2 mois avec filtres très spécifiques
const includeArrivalReports =
  totalMonths === 1 || (totalMonths === 2 && hasSpecificFilters);
```

**Avant** : Désactivé pour toutes les années >= 2024
**Après** : Activé pour 1 mois, ou 2 mois avec filtres spécifiques

### 2. Optimisation du Batch Size

**Fichier** : `api/scrapers/turfScraper.js` (lignes 1252-1254)

**Réduction du batch size** :

- Avant : 20, 15, 10 (selon crawl-delay)
- Après : 15, 10, 8 (selon crawl-delay)

**Impact** : Réduction du temps de traitement par batch

### 3. Timeout Augmenté

**Fichier** : `api/archives.js` (ligne 237)

**Timeout global** :

- Avant : 50 secondes
- Après : 55 secondes

**Impact** : Plus de temps pour scraper les rapports sans dépasser la limite Vercel (60s)

## 📊 Conditions d'Activation

Les rapports d'arrivée sont activés si :

1. **1 mois exactement** : Toujours activé
2. **2 mois avec filtres spécifiques** :
   - Filtres par hippodromes
   - Filtres par numéros de réunion
   - Filtres par dates (dateFrom/dateTo)

## ⚠️ Limitations

- **Pas de rapports pour 2+ mois sans filtres** : Pour éviter les timeouts
- **Timeout de 55s** : Si le scraping dépasse 55s, erreur 504 avec message clair
- **Batch size réduit** : Plus de batches mais plus rapides

## 🧪 Tests à Effectuer

### Test 1 : 1 mois (devrait fonctionner)

```
GET /api/archives?source=turf-fr&years=2025&months=mai&reunionNumbers=1&countries=FR
```

### Test 2 : 1 mois sans filtres (devrait fonctionner)

```
GET /api/archives?source=turf-fr&years=2024&months=janvier
```

### Test 3 : 2 mois avec filtres (devrait fonctionner)

```
GET /api/archives?source=turf-fr&years=2024&months=janvier,fevrier&reunionNumbers=1
```

## 🚀 Statut

- ✅ Code corrigé
- ✅ Build réussi
- ✅ Commit et push effectués
- ⏳ En attente de test final

## 📝 Notes

- Les rapports peuvent être "Non disponible" si les courses n'ont pas encore eu lieu
- Le cache des rapports d'arrivée (24h) accélère les requêtes suivantes
- Les optimisations (early exit, cache, batch adaptatif) réduisent le temps de scraping
