# 🚀 Prochaines étapes - Guide final

## ✅ Ce qui est déjà fait

- ✅ Projet complet créé
- ✅ Code sur GitHub : https://github.com/Issou83/pmu-archives-exporter
- ✅ Dépendances installées
- ✅ Build fonctionnel
- ✅ VS Code configuré

## 🧪 Tester le projet localement

### Option 1 : Avec Vercel CLI (recommandé - pour tester les API)

```powershell
# Installer Vercel CLI globalement (une seule fois)
npm install -g vercel

# Dans le dossier du projet
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"

# Démarrer le serveur avec les API routes
vercel dev
```

L'application sera accessible sur `http://localhost:3000` avec les API routes fonctionnelles.

### Option 2 : Frontend uniquement (sans API)

```powershell
# Démarrer uniquement le frontend
npm run dev
```

L'application sera accessible sur `http://localhost:3000`, mais les appels API ne fonctionneront pas sans Vercel CLI.

## 🌐 Déployer sur Vercel

Une fois que vous avez testé localement, déployez sur Vercel pour rendre l'application accessible en ligne.

### Méthode 1 : Via l'interface Vercel (Recommandé)

1. **Allez sur** https://vercel.com
2. **Connectez-vous** avec votre compte GitHub
3. **Cliquez sur** "Add New Project" ou "Import Project"
4. **Sélectionnez** le repository `Issou83/pmu-archives-exporter`
5. **Vercel détectera automatiquement** :
   - Framework : Vite
   - Build Command : `npm run build`
   - Output Directory : `dist`
   - Serverless Functions : `/api`
6. **Cliquez sur** "Deploy"

Vercel déploiera automatiquement :
- ✅ Le frontend React
- ✅ Les Serverless Functions dans `/api`
- ✅ Tout sera accessible via une URL publique (ex: `pmu-archives-exporter.vercel.app`)

### Méthode 2 : Via Vercel CLI

```powershell
# Installer Vercel CLI (si pas déjà fait)
npm install -g vercel

# Dans le dossier du projet
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"

# Déployer
vercel

# Suivre les instructions :
# - Set up and deploy? Y
# - Which scope? (sélectionnez votre compte)
# - Link to existing project? N
# - Project name? pmu-archives-exporter
# - Directory? ./
# - Override settings? N
```

## 📝 Commandes utiles

### Développement

```powershell
# Démarrer le serveur de développement (frontend uniquement)
npm run dev

# Démarrer avec Vercel (frontend + API)
vercel dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

### Tests et qualité

```powershell
# Lancer les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Vérifier le linting
npm run lint

# Corriger automatiquement les erreurs de linting
npm run lint:fix

# Formater le code
npm run format
```

### Git

```powershell
# Voir le status
git status

# Ajouter les changements
git add .

# Commiter
git commit -m "Description de vos changements"

# Pousser sur GitHub
git push

# Voir l'historique
git log --oneline
```

## 🎯 Checklist de déploiement

Avant de déployer sur Vercel, vérifiez :

- [ ] Le projet build correctement (`npm run build`)
- [ ] Les tests passent (`npm test`)
- [ ] Le code est sur GitHub
- [ ] Le README est à jour
- [ ] Les variables d'environnement sont documentées (si nécessaire)

## 🔍 Vérifier le déploiement

Une fois déployé sur Vercel :

1. **Allez sur votre dashboard Vercel** : https://vercel.com/dashboard
2. **Cliquez sur votre projet** `pmu-archives-exporter`
3. **Vérifiez** :
   - ✅ Le déploiement est réussi (statut "Ready")
   - ✅ L'URL de production fonctionne
   - ✅ Les API routes répondent correctement

## 🐛 Dépannage

### Le build échoue sur Vercel

- Vérifiez que `package.json` contient bien le script `build`
- Vérifiez que `vercel.json` est correctement configuré
- Regardez les logs de déploiement dans Vercel

### Les API routes ne fonctionnent pas

- Vérifiez que les fichiers dans `/api` sont bien présents
- Vérifiez que `vercel.json` route correctement vers `/api`
- Testez localement avec `vercel dev` d'abord

### Erreurs de dépendances

```powershell
# Supprimer node_modules et réinstaller
rm -r node_modules
npm install
```

## 📚 Ressources

- **Documentation Vercel** : https://vercel.com/docs
- **Documentation Vite** : https://vitejs.dev
- **Documentation React** : https://react.dev
- **Repository GitHub** : https://github.com/Issou83/pmu-archives-exporter

## 🎉 Félicitations !

Votre projet est maintenant :
- ✅ Complet et fonctionnel
- ✅ Sur GitHub avec CI/CD
- ✅ Prêt à être déployé
- ✅ Prêt à être utilisé

Bon développement ! 🚀

