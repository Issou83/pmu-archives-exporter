# 🔄 Réinitialiser la configuration Vercel

## Problème

`npx vercel dev` se termine immédiatement sans afficher de sortie.

## Solution : Réinitialiser Vercel

Exécutez ces commandes dans PowerShell :

```powershell
# 1. Aller dans le dossier du projet
cd "C:\Users\iss\Desktop\Openclassrooms\CoursesCH\pmu-archives-exporter"

# 2. Supprimer le dossier .vercel (configuration corrompue)
Remove-Item -Recurse -Force .vercel

# 3. Relancer vercel dev (il va vous demander de reconfigurer)
npx vercel dev
```

## Ce qui va se passer

Quand vous exécutez `npx vercel dev` après avoir supprimé `.vercel`, Vercel va vous poser des questions :

1. **"Set up and develop?"** → Répondez `yes` (ou `y`)
2. **"Which scope?"** → Sélectionnez votre scope (probablement `issou83's projects`)
3. **"Link to existing project?"** → Répondez `no` (ou `n`) pour créer un nouveau projet local
4. **"What's your project's name?"** → Tapez `pmu-archives-exporter` (ou appuyez sur Entrée pour le nom par défaut)
5. **"In which directory is your code located?"** → Appuyez sur Entrée (c'est `./`)

Ensuite, Vercel devrait démarrer correctement et vous verrez :

```
> Ready! Available at http://localhost:3000
```

## Alternative : Utiliser npm run dev

Si `vercel dev` ne fonctionne toujours pas, vous pouvez au moins tester le frontend :

```powershell
npm run dev
```

**Note** : Avec `npm run dev`, les API routes ne fonctionneront pas, mais vous pourrez voir l'interface.

## Si ça ne fonctionne toujours pas

Essayez avec la version globale de Vercel CLI :

```powershell
# Utiliser vercel directement (sans npx)
vercel dev
```

Ou vérifiez les logs détaillés :

```powershell
$env:DEBUG="*"
npx vercel dev
```

