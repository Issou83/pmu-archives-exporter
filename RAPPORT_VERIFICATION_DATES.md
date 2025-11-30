# Rapport de Vérification à la Source - DATES UNIQUEMENT

## Problème Identifié

L'utilisateur a demandé de vérifier la véracité des dates extraites par le scraper, comme nous l'avons fait pour les rapports d'arrivée.

### Vérification à la Source

#### Méthodologie

1. **Récupération des données** de l'API pour mai 2025, France
2. **Sélection** de 5 URLs avec dates scrapées
3. **Test direct** de chaque URL avec `cheerio` et `fetch` pour vérifier la date réelle sur la page

#### Résultats

**TOUTES les dates scrapées sont incorrectes !**

| URL                      | Date scrapée | Date réelle à la source | Statut       |
| ------------------------ | ------------ | ----------------------- | ------------ |
| r1-saint-cloud-39681     | 2025-05-01   | 2025-12-03              | ❌ Différent |
| r1-vincennes-39686       | 2025-05-01   | 2025-12-03              | ❌ Différent |
| r1-paris-longchamp-39710 | 2025-05-01   | 2025-12-03              | ❌ Différent |
| r1-vichy-39714           | 2025-05-01   | 2025-12-03              | ❌ Différent |
| r1-chantilly-39729       | 2025-05-01   | 2025-12-03              | ❌ Différent |

### Constatations Importantes

1. **Toutes les dates scrapées sont "2025-05-01"** (1er mai 2025) - c'est le fallback utilisé quand la date n'est pas trouvée
2. **Les dates réelles sur les pages sont "2025-12-03"** (3 décembre 2025) - c'est la date réelle de chaque réunion
3. **Le scraper cherche la date sur la page d'archives** (`/archives/courses-pmu/2025/mai`), mais la date réelle de chaque réunion est sur la page individuelle de la réunion (`/partants-programmes/r1-...`)

### Cause Probable

Le scraper extrait les dates depuis la page d'archives (`/archives/courses-pmu/2025/mai`), mais :

- La page d'archives ne contient pas toujours la date exacte de chaque réunion
- La date réelle de chaque réunion est sur la page individuelle (`/partants-programmes/r1-...`)
- Quand la date n'est pas trouvée, le scraper utilise le fallback : 1er jour du mois (d'où "2025-05-01")

### Solution

**Extraire la date depuis la page individuelle de chaque réunion** au lieu de la page d'archives.

1. Pour chaque réunion trouvée, scraper sa page individuelle pour extraire la date réelle
2. Utiliser la date trouvée sur la page individuelle, ou le fallback seulement si vraiment pas trouvée

### Statistiques

- **Dates correctes** : 0/5 (0%)
- **Dates différentes** : 5/5 (100%)
- **Problème** : Toutes les dates utilisent le fallback (1er jour du mois)

## Corrections à Appliquer

1. ✅ **Extraire la date depuis la page individuelle de chaque réunion**
2. ✅ **Améliorer les patterns de recherche de date** pour être plus robustes
3. ✅ **Ne pas utiliser le fallback si on peut scraper la page individuelle**
