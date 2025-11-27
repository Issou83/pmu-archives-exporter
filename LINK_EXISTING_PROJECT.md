# 🔗 Lier au projet Vercel existant

## Situation

Le projet `pmu-archives-exporter` existe déjà sur Vercel. Vous devez le lier au projet existant.

## Solution

Quand Vercel vous demande :

```
? What's your project's name?
pmu-archives-exporter
> Project already exists
```

**Vercel va probablement vous demander** :
```
? Link to existing project? (Y/n)
```

**Répondez `yes`** (ou `y` puis Entrée)

Puis Vercel vous demandera de sélectionner le projet :
```
? Which existing project do you want to link?
```

**Sélectionnez** `pmu-archives-exporter` (ou `issou83s-projects/pmu-archives-exporter`)

## Alternative : Utiliser un nom différent

Si vous préférez créer un nouveau projet local (sans lier au projet Vercel existant), vous pouvez utiliser un nom différent :

```
? What's your project's name?
pmu-archives-exporter-local
```

Mais il est recommandé de lier au projet existant pour garder la cohérence.

## Après la liaison

Une fois lié, vous devriez voir :

```
🔗 Linked to issou83s-projects/pmu-archives-exporter (created .vercel)
✅ Created .env.local file and added it to .gitignore
> Ready! Available at http://localhost:3000
```

Ensuite, votre application sera accessible sur `http://localhost:3000` avec les API routes fonctionnelles !

