# 🔧 Fix : Timeout 504 Gateway Timeout

## ❌ Problème Identifié

**Symptôme** : Erreur `504 Gateway Timeout` sur les requêtes API

- **URL testée** : `https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=mai&reunionNumbers=1&countries=FR`
- **Cause** : Le scraping dépasse la limite de 60 secondes de Vercel
- **Impact** : Même sans rapports d'arrivée, le scraping de base prend trop de temps

## 🔍 Analyse

### Limites Vercel

- **Timeout maximum** : 60 secondes pour les fonctions serverless
- **Configuration** : `vercel.json` définit `maxDuration: 60`

### Causes du Timeout

1. **Pas de timeout sur les requêtes fetch** : Les requêtes peuvent bloquer indéfiniment
2. **Chargement de robots.txt** : Peut prendre plusieurs secondes
3. **Scraping de la page d'archives** : Peut être lent selon la taille de la page
4. **Pas de timeout global** : Le scraping peut dépasser 60 secondes sans contrôle

## ✅ Corrections Appliquées

### 1. Timeout Global sur le Scraping

**Fichier** : `api/archives.js` (lignes 231-250)

```javascript
// Timeout global de 50 secondes (marge de 10s avant la limite Vercel)
const SCRAPING_TIMEOUT = 50000; // 50 secondes

const scrapingPromise = scrapeTurfFrArchives(
  years,
  months,
  includeArrivalReports
);
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(
      new Error('Scraping timeout: Le scraping prend trop de temps (>50s)...')
    );
  }, SCRAPING_TIMEOUT);
});

reunions = await Promise.race([scrapingPromise, timeoutPromise]);
```

**Impact** : Arrête le scraping après 50 secondes pour éviter le timeout Vercel

### 2. Timeout sur les Requêtes Fetch

**Fichier** : `api/scrapers/turfScraper.js` (lignes 122-145)

```javascript
// Timeout de 10 secondes pour la page d'archives
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes max

response = await fetch(url, {
  signal: controller.signal,
  // ...
});
```

**Impact** : Chaque requête fetch s'arrête après 10 secondes maximum

### 3. Timeout sur robots.txt

**Fichier** : `api/scrapers/turfScraper.js` (lignes 1199-1210)

```javascript
// Timeout de 5 secondes pour robots.txt
try {
  const robotsPromise = fetchRobotsTxt('https://www.turf-fr.com');
  const robotsTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('robots.txt timeout')), 5000);
  });
  robotsRules = await Promise.race([robotsPromise, robotsTimeout]);
} catch (error) {
  // Utiliser un délai par défaut si robots.txt échoue
  crawlDelay = 400; // Délai par défaut
}
```

**Impact** : Si robots.txt prend trop de temps, on utilise un délai par défaut

## 📊 Résultats Attendus

### Avant les Corrections

- ❌ Timeout 504 : Fréquent pour les requêtes avec plusieurs mois
- ❌ Pas de contrôle : Le scraping peut bloquer indéfiniment
- ❌ Erreurs silencieuses : Pas de message clair pour l'utilisateur

### Après les Corrections

- ✅ Timeout contrôlé : Arrêt après 50 secondes avec message clair
- ✅ Timeouts individuels : Chaque requête a un timeout de 10s
- ✅ Gestion gracieuse : Message d'erreur explicite pour l'utilisateur

## 🧪 Tests

### Test 1 : Requête Simple

```bash
curl "https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=mai&reunionNumbers=1&countries=FR"
```

**Résultat attendu** :

- ✅ Réponse en moins de 50 secondes
- ✅ OU erreur 504 avec message clair si timeout

### Test 2 : Requête Complexe

```bash
curl "https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=mai,fevrier"
```

**Résultat attendu** :

- ✅ Réponse en moins de 50 secondes
- ✅ OU erreur 504 avec message suggérant de réduire le nombre de mois

## 🚀 Déploiement

1. ✅ Code corrigé
2. ✅ Build réussi
3. ⏳ Commit et push en attente
4. ⏳ Redéploiement Vercel en attente

## 📝 Notes Techniques

- Les timeouts sont configurables et peuvent être ajustés si nécessaire
- Le timeout global de 50s laisse une marge de 10s avant la limite Vercel (60s)
- Les timeouts individuels (10s pour fetch, 5s pour robots.txt) empêchent les blocages
- Les erreurs sont maintenant explicites et aident l'utilisateur à comprendre le problème
