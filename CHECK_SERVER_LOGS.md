# 🔍 Vérifier les logs du serveur pour l'erreur 500

## ❌ Problème actuel

L'API `/api/archives` retourne une erreur 500. Pour comprendre le problème, il faut regarder les **logs du serveur** dans le terminal où `vercel dev` tourne.

## 📋 Étapes pour diagnostiquer

### 1. Regardez le terminal où `vercel dev` tourne

Dans le terminal PowerShell où vous avez lancé `npx vercel dev`, vous devriez voir des messages comme :

```
[API] Scraping avec source=turf-fr, years=2024, months=janvier
[API] Début scraping Turf-FR...
[Scraper] Début scraping Turf-FR: années=2024, mois=janvier
```

### 2. Cherchez les erreurs

Quand vous faites une recherche dans l'application, regardez les logs. Vous devriez voir soit :
- ✅ Les messages de scraping qui se déroulent normalement
- ❌ Une erreur avec le message et la stack trace

### 3. Erreurs possibles

#### Erreur "fetch is not defined"
- **Cause** : `fetch` n'est pas disponible dans l'environnement Node.js
- **Solution** : Node.js 18+ a `fetch` intégré. Vérifiez la version : `node --version`

#### Erreur "Cannot find module"
- **Cause** : Un import ne fonctionne pas
- **Solution** : Vérifiez que tous les fichiers existent et que les imports sont corrects

#### Erreur réseau (timeout, connection refused)
- **Cause** : Le site turf-fr.com n'est pas accessible ou bloque les requêtes
- **Solution** : Vérifiez que le site est accessible depuis votre navigateur

#### Erreur de parsing HTML
- **Cause** : La structure HTML du site a changé
- **Solution** : Le scraper doit être adapté

## 🔧 Action immédiate

**Regardez le terminal où `vercel dev` tourne** et copiez-collez ici :
1. Les messages qui apparaissent quand vous cliquez sur "Rechercher"
2. Les erreurs complètes (message + stack trace)

Cela m'aidera à identifier le problème exact et à le corriger.

## 📝 Exemple de ce que vous devriez voir

Si tout fonctionne :
```
[API] Scraping avec source=turf-fr, years=2024, months=janvier
[API] Début scraping Turf-FR...
[Scraper] Début scraping Turf-FR: années=2024, mois=janvier
[Scraper] Scraping 2024/janvier...
[Scraper] Scraping: https://www.turf-fr.com/archives/courses-pmu/2024/janvier
[Scraper] HTML reçu, longueur: [X] caractères
[Scraper] Trouvé [X] liens, [Y] réunions extraites
[Scraper] [Y] réunions trouvées pour 2024/janvier
[API] Scraping terminé: [Y] réunions trouvées
```

Si il y a une erreur :
```
[API] Scraping avec source=turf-fr, years=2024, months=janvier
[API] Début scraping Turf-FR...
Erreur dans /api/archives: [message d'erreur]
Stack trace: [détails de l'erreur]
```

**Copiez-collez les logs ici pour que je puisse vous aider !**

