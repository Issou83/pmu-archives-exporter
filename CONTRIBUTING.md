# Guide de contribution

Merci de votre intérêt pour contribuer à PMU Archives Exporter !

## Structure du projet

```
pmu-archives-exporter/
├── api/                    # Serverless Functions Vercel
│   ├── archives.js
│   ├── export.js
│   └── scrapers/
│       ├── turfScraper.js
│       ├── turfScraper.test.js  # Tests à côté des fichiers
│       └── pmuJsonScraper.js
├── src/                     # Frontend React
│   ├── components/
│   ├── hooks/
│   └── utils/
└── tests/                   # Tests d'intégration (optionnel)
```

## Organisation des tests

Les tests sont organisés de deux manières :

1. **Tests unitaires** : À côté des fichiers source (ex: `turfScraper.test.js` à côté de `turfScraper.js`)
2. **Tests d'intégration** : Dans le dossier `tests/` (si nécessaire)

## Workflow de développement

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Faire vos modifications
4. Ajouter des tests si nécessaire
5. Vérifier que tout fonctionne :
   ```bash
   npm run lint
   npm test
   npm run build
   ```
6. Commit vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
7. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
8. Ouvrir une Pull Request

## Standards de code

- Utiliser ESLint et Prettier (configurés dans le projet)
- Écrire des tests pour les nouvelles fonctionnalités
- Documenter le code avec des commentaires JSDoc
- Suivre les conventions de nommage (camelCase pour variables, PascalCase pour composants)

## Tests

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Lancer les tests avec coverage
npm run test:coverage
```

## Questions ?

N'hésitez pas à ouvrir une issue pour poser des questions ou suggérer des améliorations.

