import { useState, useMemo } from 'react';
import { SourceToggle } from './components/SourceToggle';
import { FiltersPanel } from './components/FiltersPanel';
import { ReunionsTable } from './components/ReunionsTable';
import { ExportBar } from './components/ExportBar';
import { Toast } from './components/Toast';
import { useReunions } from './hooks/useReunions';
import { SOURCES } from './utils/constants';

function App() {
  const [source, setSource] = useState(SOURCES.TURF_FR);
  const [filters, setFilters] = useState({
    source: SOURCES.TURF_FR,
    years: [],
    months: [],
    dateFrom: '',
    dateTo: '',
    hippodromes: [],
    reunionNumbers: [],
    countries: ['FR'], // France par défaut
    textQuery: '',
  });
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Mettre à jour la source dans les filtres
  const handleSourceChange = (newSource) => {
    setSource(newSource);
    setFilters((prev) => ({ ...prev, source: newSource }));
  };

  // Mettre à jour les filtres
  const handleFiltersChange = (newFilters) => {
    // S'assurer que la source est toujours incluse
    const updatedFilters = { ...newFilters, source: newFilters.source || source };
    setFilters(updatedFilters);
  };

  // Utiliser le hook pour récupérer les réunions
  const { data, loading, error, refetch } = useReunions(filters);

  // Fonction pour lancer la recherche
  const handleSearch = () => {
    // Utiliser les filtres actuels pour la recherche
    refetch();
  };

  // Les suggestions d'hippodromes sont maintenant gérées par le hook useHippodromes

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast({ message: '', type: 'success' });
  };

  return (
    <div className="min-h-screen">
      {/* Header moderne avec gradient */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="text-5xl sm:text-6xl">🏇</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight">
              PMU Archives Exporter
            </h1>
            <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto">
              Extrayez et exportez les archives des réunions PMU avec précision chirurgicale
            </p>
          </div>
        </div>
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249, 250, 251)"/>
          </svg>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl -mt-8 relative z-20">
        <div className="space-y-6 sm:space-y-8">
          {/* Source Toggle avec design moderne */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <SourceToggle source={source} onChange={handleSourceChange} />
          </div>

          {/* Filters Panel avec design moderne */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <FiltersPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearch}
            />
          </div>

          {/* Export Bar avec design moderne */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <ExportBar
              total={Array.isArray(data) ? data.length : 0}
              filters={filters}
              onExportSuccess={(msg) => showToast(msg, 'success')}
              onExportError={(msg) => showToast(msg, 'error')}
            />
          </div>

          {/* Table avec design moderne */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <ReunionsTable data={data} loading={loading} error={error} />
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Footer moderne */}
      <footer className="mt-16 py-8 text-center text-gray-400 text-sm">
        <p>© 2025 PMU Archives Exporter - Outil professionnel d'extraction de données</p>
      </footer>
    </div>
  );
}

export default App;

