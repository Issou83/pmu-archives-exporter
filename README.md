# PMU Archives Exporter

Webapp complète pour extraire et exporter les archives des réunions PMU depuis Turf-FR (HTML scraping) ou l'API PMU JSON (non-officielle).

## 🚀 Installation

```bash
npm install
```

## 💻 Usage local

### Option 1 : Avec Vercel CLI (recommandé pour tester les API)

Installer Vercel CLI globalement :
```bash
npm install -g vercel
```

Démarrer le serveur de développement avec les API routes :
```bash
vercel dev
```

L'application sera accessible sur `http://localhost:3000` avec les API routes fonctionnelles.

### Option 2 : Frontend uniquement (sans API)

Démarrer uniquement le frontend :
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`, mais les appels API ne fonctionneront pas sans Vercel CLI.

## 🏗️ Build

Pour créer une build de production :

```bash
npm run build
```

Le dossier `dist/` contiendra les fichiers statiques prêts à être déployés.

## 📦 Déploiement sur Vercel

Le projet est prêt à être déployé sur Vercel sans configuration manuelle :

1. Connectez votre repository GitHub à Vercel
2. Vercel détectera automatiquement la configuration dans `vercel.json`
3. Les Serverless Functions dans `/api` seront automatiquement déployées
4. Le frontend sera servi depuis le dossier `dist/`

### Configuration Vercel

Le fichier `vercel.json` configure :
- Les routes API (`/api/*`)
- Le build du frontend
- Les rewrites pour le routing SPA

## 📋 Fonctionnalités

### Frontend

- **SourceToggle** : Bascule entre Turf-FR (HTML) et PMU JSON
- **FiltersPanel** : Filtres avancés :
  - Années (multi-select)
  - Mois (multi-select)
  - Plage de dates (dateFrom/dateTo)
  - Hippodromes (autocomplete multi)
  - Numéros de réunion (1-20)
  - Pays (multi-select avec chips)
  - Recherche texte (contient)
- **ReunionsTable** : Tableau triable avec pagination (50/100/200)
- **ExportBar** : Export Excel en un clic avec compteur de résultats

### Backend

- **`/api/archives`** : GET endpoint pour récupérer les réunions filtrées
- **`/api/export`** : POST endpoint pour générer et télécharger un fichier Excel
- **Cache mémoire** : TTL de 6 heures par combinaison source+years+months
- **Rate limiting** : 30 requêtes/minute par IP
- **Scrapers** :
  - Turf-FR : Scraping HTML avec cheerio
  - PMU JSON : Parsing de l'API non-officielle

## 🧪 Tests

### Structure des tests

Les tests sont organisés de manière modulaire :
- **Tests unitaires** : À côté des fichiers source (ex: `api/scrapers/turfScraper.test.js`)
- Les tests utilisent Vitest avec des mocks pour éviter les appels réseau réels

### Commandes de test

```bash
# Lancer tous les tests une fois
npm test

# Lancer les tests en mode watch (développement)
npm run test:watch

# Lancer les tests avec rapport de couverture
npm run test:coverage
```

Les tests couvrent principalement le scraper Turf-FR avec des mocks pour éviter le scraping réel lors des tests.

## ⚖️ Limites légales

**Important** : Ce projet est fourni à des fins éducatives et de démonstration uniquement.

- Le scraping de sites web peut violer les conditions d'utilisation de certains sites
- Respectez toujours les `robots.txt` et les conditions d'utilisation
- L'API PMU JSON utilisée est non-officielle et peut être modifiée ou supprimée à tout moment
- Ne pas utiliser ce projet pour un usage commercial sans autorisation
- Le rate limiting est implémenté pour éviter le surchargement des serveurs

**L'auteur de ce projet n'est pas responsable de l'utilisation qui en est faite.**

## 🔧 Guide : Ajouter un nouveau filtre

Pour ajouter un nouveau filtre, suivez ces étapes :

### 1. Ajouter le filtre dans `FiltersPanel.jsx`

```jsx
// Dans le composant FiltersPanel
<div>
  <label>Nouveau filtre</label>
  <input
    type="text"
    value={localFilters.nouveauFiltre || ''}
    onChange={(e) => updateFilter('nouveauFiltre', e.target.value)}
  />
</div>
```

### 2. Mettre à jour l'état initial dans `App.jsx`

```jsx
const [filters, setFilters] = useState({
  // ... autres filtres
  nouveauFiltre: '',
});
```

### 3. Ajouter la logique de filtrage dans `api/archives.js`

```javascript
// Dans la fonction applyFilters
if (filters.nouveauFiltre) {
  filtered = filtered.filter((r) => 
    r.propriete?.includes(filters.nouveauFiltre)
  );
}
```

### 4. Mettre à jour le hook `useReunions.js`

```javascript
// Dans fetchReunions
if (filters.nouveauFiltre) {
  params.append('nouveauFiltre', filters.nouveauFiltre);
}
```

### 5. Parser le paramètre dans `api/archives.js`

```javascript
// Dans le handler
const { nouveauFiltre } = req.query;
const filters = {
  // ... autres filtres
  nouveauFiltre,
};
```

### 6. Mettre à jour `api/export.js`

Ajouter le même filtre dans la fonction `applyFilters` et dans le handler.

## 🔌 Guide : Activer la source PMU JSON

La source PMU JSON est déjà implémentée mais nécessite quelques ajustements selon la structure réelle de l'API.

### 1. Vérifier la structure de l'API

L'endpoint utilisé est :
```
https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/{ddMMyyyy}
```

### 2. Adapter le parser dans `api/scrapers/pmuJsonScraper.js`

Modifiez la fonction `normalizePmuReunion` selon la structure réelle de la réponse JSON :

```javascript
function normalizePmuReunion(pmuData, date) {
  // Adapter selon la structure réelle
  // Exemple si la structure est différente :
  return {
    id: `${dateISO}_${pmuData.nomHippodrome}_${pmuData.numeroReunion}`,
    // ... autres champs
  };
}
```

### 3. Adapter le parsing dans `scrapePmuDate`

Modifiez la partie qui parse les réunions depuis le JSON :

```javascript
// Adapter selon la structure réelle
if (data.programme?.reunions) {
  // Structure actuelle
} else if (data.reunions) {
  // Autre structure possible
  for (const reunion of data.reunions) {
    reunions.push(normalizePmuReunion(reunion, date));
  }
}
```

### 4. Tester

1. Sélectionnez "PMU JSON" dans le SourceToggle
2. Configurez les filtres (années/mois ou dateFrom/dateTo)
3. Vérifiez que les données sont correctement récupérées et normalisées

## 📁 Structure du projet

```
pmu-archives-exporter/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD GitHub Actions
├── api/                         # Serverless Functions Vercel
│   ├── archives.js              # GET /api/archives
│   ├── export.js                # POST /api/export
│   └── scrapers/
│       ├── turfScraper.js
│       ├── turfScraper.test.js  # Tests unitaires (à côté du fichier)
│       └── pmuJsonScraper.js
├── src/                         # Frontend React
│   ├── components/
│   │   ├── SourceToggle.jsx
│   │   ├── FiltersPanel.jsx
│   │   ├── ReunionsTable.jsx
│   │   ├── ExportBar.jsx
│   │   └── Toast.jsx
│   ├── hooks/
│   │   └── useReunions.js
│   ├── utils/
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .eslintrc.json               # Configuration ESLint
├── .prettierrc                  # Configuration Prettier
├── .gitignore                   # Fichiers ignorés par Git
├── index.html
├── package.json
├── vite.config.js
├── vitest.config.js             # Configuration Vitest
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                  # Configuration Vercel
├── LICENSE                      # Licence MIT
├── CONTRIBUTING.md              # Guide de contribution
└── README.md                    # Documentation principale
```

### Organisation des tests

**Principe** : Les tests unitaires sont placés à côté des fichiers source pour une meilleure cohérence.

- `api/scrapers/turfScraper.test.js` → teste `turfScraper.js`
- Si vous ajoutez `src/utils/helpers.js`, créez `src/utils/helpers.test.js`

Cette approche facilite la maintenance et la découverte des tests.

## 🛠️ Technologies utilisées

- **Frontend** : React 18, Vite, TailwindCSS
- **Backend** : Node.js (Serverless Functions Vercel)
- **Scraping** : cheerio
- **Export** : exceljs
- **Tests** : Vitest
- **Lint** : ESLint + Prettier

## 📝 Scripts disponibles

- `npm run dev` : Démarre le serveur de développement
- `npm run build` : Crée une build de production
- `npm run preview` : Prévisualise la build de production
- `npm test` : Lance les tests
- `npm run lint` : Vérifie le code avec ESLint
- `npm run format` : Formate le code avec Prettier

## 🤝 Contribution

Ce projet est un projet éducatif. Les contributions sont les bienvenues pour améliorer le code, ajouter des fonctionnalités ou corriger des bugs.

## 📄 Licence

Ce projet est fourni "tel quel" sans garantie. Voir les limites légales ci-dessus.

