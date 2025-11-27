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
    countries: [],
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
    setFilters({ ...newFilters, source });
  };

  // Utiliser le hook pour récupérer les réunions
  const { data, loading, error } = useReunions(filters);

  // Extraire les suggestions d'hippodromes depuis les données
  const suggestions = useMemo(() => {
    if (!Array.isArray(data)) {
      return { hippodromes: [] };
    }
    const hippodromes = [...new Set(data.map((r) => r.hippodrome).filter(Boolean))];
    return { hippodromes };
  }, [data]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast({ message: '', type: 'success' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PMU Archives Exporter
          </h1>
          <p className="text-gray-600">
            Extrayez et exportez les archives des réunions PMU
          </p>
        </header>

        <SourceToggle source={source} onChange={handleSourceChange} />

        <FiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          suggestions={suggestions}
        />

        <ExportBar
          total={Array.isArray(data) ? data.length : 0}
          filters={filters}
          onExportSuccess={(msg) => showToast(msg, 'success')}
          onExportError={(msg) => showToast(msg, 'error')}
        />

        <ReunionsTable data={data} loading={loading} error={error} />

        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      </div>
    </div>
  );
}

export default App;

