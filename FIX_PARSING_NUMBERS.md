# 🐛 Fix : Correction du Parsing des Rapports d'Arrivée

## ❌ Problème Identifié

**Symptôme** : Les rapports d'arrivée étaient mal parsés
- **Résultat affiché** : `1-1-6-4-5-1`
- **Résultat réel** : `11-6-4-5-1`

**Cause** : Le nettoyage du texte remplaçait **tous les espaces** par des tirets, y compris ceux à l'intérieur des nombres à plusieurs chiffres.

## 🔍 Analyse

### Code Problématique (Avant)
```javascript
candidate = candidate
  .replace(/\s+/g, ' ')           // Normaliser les espaces
  .replace(/\s*[-–]?\s*/g, '-')  // ❌ PROBLÈME : Remplace TOUS les espaces
  .replace(/-+/g, '-');           // Normaliser les tirets

// Résultat pour "11 - 6 - 4" :
// 1. "11 - 6 - 4"
// 2. "11-6-4" (OK)
// MAIS si le texte contient "11  6" (espaces multiples) :
// 1. "11  6" → "11 6"
// 2. "11 6" → "1-1-6" ❌ (l'espace entre les deux "1" est remplacé)
```

### Solution (Après)
```javascript
candidate = candidate
  .replace(/\s+/g, ' ')           // Normaliser les espaces multiples
  .replace(/\s*[-–]\s*/g, '|')   // Remplacer les tirets par séparateur temporaire
  .replace(/\s+/g, '|')           // Remplacer les espaces restants par séparateur
  .replace(/\|+/g, '|');          // Normaliser les séparateurs

const numbers = candidate
  .split('|')                      // Split par séparateur temporaire
  .map(n => n.trim())              // Nettoyer chaque numéro
  .filter((n) => n.match(/^\d+$/)); // Valider que c'est un nombre

// Résultat pour "11 - 6 - 4" :
// 1. "11 - 6 - 4"
// 2. "11|6|4" (séparateur temporaire)
// 3. Split → ["11", "6", "4"] ✅
// 4. Join → "11-6-4" ✅
```

## ✅ Corrections Appliquées

Toutes les méthodes de parsing ont été corrigées :

1. ✅ **PRIORITÉ 1** : `#decompte_depart_course` (ligne ~800)
2. ✅ **PRIORITÉ 1b** : `.title2` (ligne ~834)
3. ✅ **PRIORITÉ 2** : `body text` (ligne ~872)
4. ✅ **PRIORITÉ 3** : `aside elements` (ligne ~907)
5. ✅ **PRIORITÉ 4** : `selectors spécifiques` (ligne ~972)
6. ✅ **PRIORITÉ 5** : `éléments avec 'Arrivée'` (ligne ~1008)
7. ✅ **PRIORITÉ 6** : `body context match` (ligne ~1039)

## 🧪 Tests

### Test 1 : Nombre à deux chiffres
- **Input** : `"11 - 6 - 4 - 5 - 1"`
- **Attendu** : `"11-6-4-5-1"`
- **Résultat** : ✅ `"11-6-4-5-1"`

### Test 2 : Espaces multiples
- **Input** : `"11   6    4"`
- **Attendu** : `"11-6-4"`
- **Résultat** : ✅ `"11-6-4"`

### Test 3 : Mélange tirets et espaces
- **Input** : `"11 - 6  4"`
- **Attendu** : `"11-6-4"`
- **Résultat** : ✅ `"11-6-4"`

## 📝 Notes Techniques

- Le séparateur temporaire `|` est choisi car il n'apparaît jamais dans les rapports d'arrivée
- La méthode préserve les nombres à plusieurs chiffres (11, 12, 13, etc.)
- La validation reste identique (nombres entre 1 et 30)

## 🚀 Déploiement

- ✅ Code corrigé
- ✅ Build réussi
- ✅ Commit et push effectués
- ⏳ En attente du redéploiement Vercel

