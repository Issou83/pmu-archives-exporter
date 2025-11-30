# 📊 Optimisations par Année - Détail Complet

## Date : 30 Novembre 2025

## ✅ Optimisations GÉNÉRALES (Toutes les Années)

Ces optimisations s'appliquent à **TOUTES les années** (2022, 2023, 2024, 2025) :

### 1. ✅ Pages Individuelles de Courses
- **5 pages individuelles** scrapées en parallèle (au lieu de 3)
- **Ligne 1582** : `individualCourseUrls.slice(0, 5)`
- **Status** : ✅ Appliqué pour TOUTES les années

### 2. ✅ Détection Liens Courses
- **Sélecteurs multiples** : c1-c10, tabs, classes
- **Lignes 1517-1532** : Sélecteurs étendus
- **Status** : ✅ Appliqué pour TOUTES les années

### 3. ✅ Patterns JSON Améliorés
- **Support React/Vue/State** : `window.__INITIAL_STATE__`, structures sérialisées
- **Lignes 1758-1776** : Patterns JSON étendus
- **Status** : ✅ Appliqué pour TOUTES les années

### 4. ✅ Hippodromes Inconnus
- **MAX_HIPPODROMES_FROM_PAGES** : 50 (au lieu de 3)
- **MAX_DATES_FROM_PAGES** : 30 (au lieu de 5)
- **Extraction breadcrumb** : PRIORITÉ 2
- **Status** : ✅ Appliqué pour TOUTES les années

### 5. ✅ Tri par Date Décroissante
- **Priorisation** : Réunions les plus récentes en premier
- **Ligne 2280** : `reunionsToScrape.sort((a, b) => dateB - dateA)`
- **Status** : ✅ Appliqué pour TOUTES les années

### 6. ✅ Crawl-Delay Adaptatif
- **Réduction progressive** : Plus on approche du timeout, plus on réduit le délai
- **Lignes 2370-2395** : Logique adaptative
- **Status** : ✅ Appliqué pour TOUTES les années

---

## ⚠️ Optimisations SPÉCIFIQUES 2022

Ces optimisations sont **UNIQUEMENT pour 2022** car c'est l'année problématique avec beaucoup de réunions :

| Paramètre | 2022 | 2023-2025 | Raison |
|-----------|------|-----------|--------|
| **Batch Size** | 6 | 25-40 | 2022 a trop de réunions → timeout |
| **MAX_SCRAPING_TIME** | 32s | 50s | 2022 nécessite plus de marge |
| **Limite Réunions** | 250 | Illimitée | 2022 timeout si toutes scrapées |
| **Early Exit** | 10s | 5s | 2022 nécessite plus de marge |

### Détail 2022 :
- **Ligne 2260** : `adaptiveBatchSize = Math.max(6, ...)` (si has2022)
- **Ligne 2290** : `MAX_SCRAPING_TIME = has2022 ? 32000 : 50000`
- **Ligne 2299** : `if (has2022 && reunionsToScrape.length > 250)`
- **Ligne 2317** : `earlyExitThreshold = has2022 ? 10000 : 5000`

---

## 📊 Résumé par Année

### 2022 (Année Problématique)
- ✅ Optimisations générales : **OUI**
- ⚠️ Optimisations spécifiques : **OUI** (batch 6, MAX_TIME 32s, limite 250, early exit 10s)
- **Objectif** : Éviter les timeouts (priorité sur les rapports)

### 2023, 2024, 2025 (Années Normales)
- ✅ Optimisations générales : **OUI**
- ⚠️ Optimisations spécifiques : **NON** (utilisent paramètres par défaut)
- **Objectif** : Maximiser les rapports (pas de problème de timeout)

---

## 🎯 Pourquoi cette Différence ?

### 2022 :
- **Problème** : Beaucoup de réunions (1683 réunions pour 12 mois)
- **Résultat** : Timeouts fréquents (7 timeouts sur 12 mois)
- **Solution** : Paramètres stricts pour garantir 0 timeout

### 2023-2025 :
- **Problème** : Pas de timeout (0 timeout sur 36 mois)
- **Résultat** : Performance stable
- **Solution** : Paramètres permissifs pour maximiser les rapports

---

## ✅ Conclusion

**TOUTES les optimisations générales s'appliquent à TOUTES les années** ✅

Les optimisations spécifiques 2022 sont nécessaires uniquement pour cette année problématique. Les autres années (2023, 2024, 2025) bénéficient des optimisations générales et n'ont pas besoin de restrictions supplémentaires car elles n'ont pas de problèmes de timeout.

