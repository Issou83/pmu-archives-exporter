# Optimisations du Scraping - Analyse et Améliorations

## 📊 Analyse Actuelle

### Configuration Actuelle

- **Timeout par requête** : 5 secondes
- **Batch size** : 10 réunions en parallèle
- **Max duration Vercel** : 60 secondes
- **Stratégie** : 2 requêtes par réunion (partants-programmes puis arrivees-rapports)
- **Cache** : 6 heures pour les réunions, pas de cache pour les rapports d'arrivée

### Goulots d'Étranglement Identifiés

1. **Double requête par réunion** : Chaque réunion nécessite 2 requêtes HTTP (partants-programmes puis arrivees-rapports)
2. **Timeout trop long** : 5 secondes par requête peut bloquer le batch entier
3. **Batch size conservateur** : 10 réunions en parallèle pourrait être augmenté
4. **Pas d'early exit** : Continue à chercher même après avoir trouvé le rapport
5. **Pas de cache des rapports** : Re-scrape les mêmes rapports à chaque fois
6. **Promise.all bloque** : Si une requête échoue, bloque tout le batch

## 🚀 Optimisations Proposées

### 1. Réduire le Timeout

- **Avant** : 5 secondes
- **Après** : 3 secondes
- **Impact** : Réduction de 40% du temps d'attente pour les pages lentes

### 2. Augmenter le Batch Size

- **Avant** : 10 réunions
- **Après** : 15-20 réunions (selon le crawl-delay)
- **Impact** : Réduction du temps total de 33-50%

### 3. Utiliser Promise.allSettled

- **Avant** : Promise.all (bloque sur erreur)
- **Après** : Promise.allSettled (continue même en cas d'erreur)
- **Impact** : Meilleure résilience, pas de blocage

### 4. Early Exit dans la Recherche HTML

- **Avant** : Continue à chercher même après avoir trouvé
- **Après** : Arrête dès qu'on trouve le rapport dans #decompte_depart_course
- **Impact** : Réduction de 50-70% du temps de parsing HTML

### 5. Optimiser la Stratégie de Double Requête

- **Avant** : Toujours essayer partants-programmes puis arrivees-rapports
- **Après** : Essayer arrivees-rapports en premier (plus probable d'avoir le rapport)
- **Impact** : Réduction de 50% des requêtes si le rapport est dans arrivees-rapports

### 6. Cache des Rapports d'Arrivée

- **Avant** : Pas de cache
- **Après** : Cache en mémoire avec TTL de 24h
- **Impact** : Réduction de 100% du temps pour les rapports déjà scrapés

### 7. Optimiser l'Ordre de Recherche HTML

- **Avant** : Cherche dans plusieurs sélecteurs sans ordre optimal
- **Après** : Cherche d'abord #decompte_depart_course (le plus fiable), puis arrête
- **Impact** : Réduction de 60-80% du temps de parsing

## 📈 Estimation des Gains

### Scénario : 50 réunions avec rapports d'arrivée

**Avant** :

- 50 réunions × 2 requêtes = 100 requêtes
- Batch de 10 : 10 batches
- Temps par batch : ~10 secondes (5s timeout × 2 requêtes)
- **Total : ~100 secondes** (dépasse le timeout de 60s)

**Après** :

- 50 réunions × 1.5 requêtes moyenne = 75 requêtes (optimisation stratégie)
- Batch de 20 : 4 batches
- Temps par batch : ~6 secondes (3s timeout × 2 requêtes, mais early exit)
- **Total : ~24 secondes** (bien en dessous de 60s)

**Gain estimé : 76% de réduction du temps**

## ✅ Tests à Effectuer

1. Test avec 1 mois, 1 année (petite requête)
2. Test avec 2 mois, 1 année (requête moyenne)
3. Test avec 4 mois, 1 année (requête grande)
4. Test avec cache (requête répétée)
5. Test avec timeout (simuler page lente)
6. Test avec erreurs (simuler pages 404)
