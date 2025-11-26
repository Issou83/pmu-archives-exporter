# 🚀 Configuration Vercel - Guide étape par étape

## 📋 Étapes de configuration

### 1. Connexion à Vercel ✅

Vous êtes déjà connecté ! C'est fait.

### 2. Créer un nouveau projet

Quand Vercel demande :
```
? Link to existing project? yes
```

**Répondez : `No`** (ou appuyez sur `N` puis Entrée)

Puis Vercel vous demandera :
```
? What's your project's name? 
```

**Tapez :** `pmu-archives-exporter` (ou laissez le nom par défaut)

### 3. Configuration automatique

Vercel détectera automatiquement :
- ✅ Framework : Vite
- ✅ Build Command : `npm run build`
- ✅ Output Directory : `dist`
- ✅ Serverless Functions : `/api`

### 4. Démarrer le serveur

Une fois configuré, le serveur démarrera automatiquement sur `http://localhost:3000`

## 🔄 Si vous avez déjà répondu "yes"

Si vous avez déjà sélectionné un projet existant par erreur :

1. **Appuyez sur `Ctrl + C`** pour annuler
2. **Relancez** : `npx vercel dev`
3. **Cette fois, répondez `No`** à "Link to existing project?"

## ✅ Après la configuration

Une fois configuré, vous verrez :
```
> Ready! Available at http://localhost:3000
```

Votre application sera accessible avec :
- Frontend React : `http://localhost:3000`
- API routes : `http://localhost:3000/api/archives`, `http://localhost:3000/api/export`

## 📝 Commandes utiles

```powershell
# Démarrer le serveur de développement
npx vercel dev

# Déployer sur Vercel (production)
npx vercel

# Voir les logs
npx vercel logs
```

