# 🚀 Optimisation Critique : Filtres Avant Scraping

## Date : 30 Novembre 2025

## 🎯 Problème Identifié

L'utilisateur a testé l'API avec des filtres :
- `years=2025&months=aout%2Cmai&reunionNumbers=1&countries=FR`
- **Résultat** : Timeout 504 après 56s

### Cause du Problème

Les filtres étaient appliqués **APRÈS** le scraping complet, pas avant. Donc :
1. Le scraper scrapait **TOUTES** les réunions de 2025 (août et mai)
2. Puis les filtres étaient appliqués sur le résultat
3. **Résultat** : Beaucoup trop de réunions scrapées, timeout inévitable

## ✅ Solution Appliquée

### Modification 1 : Passer les filtres au scraper

**Fichier** : `api/archives.js` (ligne 252)
```javascript
const scrapingPromise = scrapeTurfFrArchives(
  years,
  months,
  includeArrivalReports,
  filters // Passer les filtres pour optimisation
);
```

### Modification 2 : Appliquer les filtres AVANT le scraping des rapports

**Fichier** : `api/scrapers/turfScraper.js` (lignes 2357-2408)

Les filtres sont maintenant appliqués **AVANT** le scraping des rapports d'arrivée :
- `reunionNumbers` : Filtre les réunions par numéro
- `countries` : Filtre les réunions par pays
- `dateFrom` / `dateTo` : Filtre les réunions par date
- `hippodromes` : Filtre les réunions par hippodrome

**Résultat** : Seules les réunions qui correspondent aux filtres sont scrapées pour les rapports d'arrivée.

### Exemple d'Optimisation

**Avant** :
- 2 mois (août + mai 2025) = ~400 réunions scrapées
- Filtre `reunionNumbers=1` = Seulement ~60 réunions finales
- **Temps** : Timeout (>56s)

**Après** :
- 2 mois (août + mai 2025) = ~400 réunions trouvées
- Filtre `reunionNumbers=1` appliqué = ~60 réunions à scraper
- **Temps** : ~10-15s (beaucoup plus rapide !)

## 📊 Impact Attendu

### Réduction du Temps de Scraping

- **Sans filtres** : Scrape toutes les réunions (comme avant)
- **Avec filtres** : Scrape seulement les réunions filtrées
- **Gain** : 80-90% de réduction du temps pour les cas avec filtres spécifiques

### Cas d'Usage Optimisés

1. **Filtre `reunionNumbers=1`** : Scrape seulement les réunions R1
2. **Filtre `countries=FR`** : Scrape seulement les réunions françaises
3. **Filtre `dateFrom` / `dateTo`** : Scrape seulement les réunions dans la plage de dates
4. **Combinaison de filtres** : Optimisation cumulative

## 🔍 Points Techniques

### Filtres Appliqués Avant Scraping

- ✅ `reunionNumbers` : Filtre par numéro de réunion
- ✅ `countries` : Filtre par code pays
- ✅ `dateFrom` / `dateTo` : Filtre par plage de dates
- ✅ `hippodromes` : Filtre par nom d'hippodrome

### Filtres Appliqués Après Scraping

- `textQuery` : Nécessite le scraping complet pour la recherche textuelle

### Retour des Données

- Les réunions retournées sont **non filtrées** (pour le cache)
- Les filtres finaux sont appliqués dans `archives.js` après le scraping
- Mais les **rapports d'arrivée** sont scrapés seulement pour les réunions filtrées

## ✅ Tests à Effectuer

1. **Test avec filtres** : `years=2025&months=aout%2Cmai&reunionNumbers=1&countries=FR`
   - **Attendu** : Pas de timeout, réponse rapide (<20s)
   
2. **Test sans filtres** : `years=2025&months=aout%2Cmai`
   - **Attendu** : Comportement normal (peut timeout si trop de réunions)

3. **Test avec un seul mois** : `years=2025&months=aout&reunionNumbers=1`
   - **Attendu** : Réponse très rapide (<10s)

## 📝 Notes

- Les filtres sont appliqués **uniquement** pour le scraping des rapports d'arrivée
- Le scraping initial des réunions (liste) reste inchangé (nécessaire pour le cache)
- Cette optimisation réduit drastiquement le temps de scraping quand des filtres spécifiques sont utilisés

