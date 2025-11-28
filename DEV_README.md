# Guide de Développement Local

## 🚀 Démarrage Rapide

### Option 1 : Développement Frontend uniquement (Recommandé)

Pour le développement local avec hot-reload et toutes les fonctionnalités Vite :

```bash
npm run dev
```

Cela lance Vite sur `http://localhost:3000` avec :
- ✅ Hot Module Replacement (HMR)
- ✅ Rechargement automatique
- ✅ Support complet de React
- ⚠️ Les API routes ne fonctionneront pas (elles pointent vers la production)

### Option 2 : Développement avec API routes locales

Si vous devez tester les API routes en local :

```bash
npx vercel dev
```

⚠️ **Note importante** : `vercel dev` peut avoir des problèmes avec le hot-reload de Vite. Si vous voyez des erreurs 404 pour `main.jsx`, `client`, ou `@react-refresh`, utilisez plutôt `npm run dev` et testez les API sur la production.

## 🔧 Résolution des Problèmes

### Erreur 404 pour `main.jsx`, `client`, ou `@react-refresh`

**Cause** : `vercel dev` ne sert pas correctement les fichiers Vite en développement.

**Solution** : Utilisez `npm run dev` au lieu de `vercel dev` pour le développement local.

### Les API routes ne fonctionnent pas avec `npm run dev`

**Cause** : Vite seul ne peut pas servir les serverless functions Vercel.

**Solution** : 
1. Utilisez `npm run dev` pour le frontend
2. Testez les API routes directement sur la production (https://pmu-archives-exporter.vercel.app/api/...)
3. Ou utilisez `npx vercel dev` uniquement quand vous devez absolument tester les API en local

## 📝 Commandes Disponibles

- `npm run dev` - Lance Vite en mode développement (port 3000)
- `npm run build` - Build de production
- `npm run preview` - Prévisualise le build de production
- `npx vercel dev` - Simule l'environnement Vercel (peut avoir des problèmes avec Vite)

## ⚠️ Important pour la Production

- **Ne modifiez jamais** `vercel.json` sans tester en production
- **Ne modifiez jamais** les configurations de build sans vérifier
- Les changements dans `vite.config.js` n'affectent que le développement local
- La production utilise toujours `npm run build` défini dans `vercel.json`

