import { useState, useEffect } from 'react';
import { MONTHS, YEARS, COUNTRIES } from '../utils/constants';
import { useHippodromes } from '../hooks/useHippodromes';

/**
 * Composant pour gérer tous les filtres de recherche - Design moderne
 */
export function FiltersPanel({ filters, onFiltersChange, onSearch }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [selectedCountry, setSelectedCountry] = useState(filters.countries?.[0] || 'FR');
  const { hippodromes, loading: hippodromesLoading } = useHippodromes(selectedCountry);

  useEffect(() => {
    setLocalFilters(filters);
    if (filters.countries?.[0] && filters.countries[0] !== selectedCountry) {
      setSelectedCountry(filters.countries[0]);
    }
  }, [filters]);

  useEffect(() => {
    if (!localFilters.countries || localFilters.countries.length === 0) {
      const newFilters = { ...localFilters, countries: ['FR'] };
      setLocalFilters(newFilters);
      setSelectedCountry('FR');
    }
  }, []);

  const updateFilter = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const toggleArrayFilter = (key, value) => {
    const current = localFilters[key] || [];
    const newArray = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, newArray);
  };

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    updateFilter('countries', [countryCode]);
    updateFilter('hippodromes', []);
  };

  const handleHippodromeChange = (e) => {
    const selectedHippodrome = e.target.value;
    if (selectedHippodrome && !localFilters.hippodromes?.includes(selectedHippodrome)) {
      updateFilter('hippodromes', [...(localFilters.hippodromes || []), selectedHippodrome]);
      e.target.value = '';
    }
  };

  const resetFilters = () => {
    const reset = {
      source: filters.source,
      years: [],
      months: [],
      dateFrom: '',
      dateTo: '',
      hippodromes: [],
      reunionNumbers: [],
      countries: ['FR'],
      textQuery: '',
    };
    setLocalFilters(reset);
    setSelectedCountry('FR');
    onFiltersChange(reset);
  };

  const handleSearch = () => {
    const totalMonths = (localFilters.years?.length || 0) * (localFilters.months?.length || 0);
    if (totalMonths > 4) {
      const confirmMessage = `Vous avez sélectionné ${totalMonths} combinaisons mois/année. Cette requête peut prendre plus de 60 secondes et risque de timeout.\n\nSouhaitez-vous continuer ? (Les rapports d'arrivée seront désactivés pour cette requête)`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    onFiltersChange(localFilters);
    setTimeout(() => {
      if (onSearch) {
        onSearch();
      }
    }, 100);
  };

  const removeChip = (key, value) => {
    const current = localFilters[key] || [];
    updateFilter(key, current.filter((v) => v !== value));
  };

  return (
    <div className="glass rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              🔍 Filtres de recherche
            </h2>
            <p className="text-indigo-100 text-sm">Affinez votre recherche selon vos besoins</p>
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30"
          >
            ↻ Réinitialiser
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* SECTION 1 : Années et Mois */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-800">Période (Années et Mois)</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Années */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                📅 Années
              </label>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((year) => (
                  <label
                    key={year}
                    className="group cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.years?.includes(year.toString())}
                      onChange={() => toggleArrayFilter('years', year.toString())}
                      className="sr-only"
                    />
                    <div
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                        localFilters.years?.includes(year.toString())
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-lg scale-105'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:shadow-md'
                      }`}
                    >
                      {year}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Mois */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                📆 Mois
              </label>
              <div className="max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl p-4 bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MONTHS.map((month) => (
                    <label
                      key={month.value}
                      className="group cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.months?.includes(month.value)}
                        onChange={() => toggleArrayFilter('months', month.value)}
                        className="sr-only"
                      />
                      <div
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                          localFilters.months?.includes(month.value)
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-md'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        {month.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 : Dates */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-800">Plage de dates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={localFilters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3 : Localisation */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-gray-800">Localisation (Pays et Hippodromes)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pays */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌍 Pays
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white font-medium"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Hippodromes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏇 Hippodromes
                {hippodromesLoading && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Chargement...)</span>
                )}
              </label>
              <select
                onChange={handleHippodromeChange}
                disabled={!selectedCountry || hippodromesLoading}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                <option value="">
                  {hippodromesLoading
                    ? 'Chargement...'
                    : hippodromes.length === 0
                    ? 'Aucun hippodrome disponible'
                    : 'Sélectionner un hippodrome'}
                </option>
                {hippodromes.map((hippodrome) => (
                  <option key={hippodrome} value={hippodrome}>
                    {hippodrome}
                  </option>
                ))}
              </select>
              {localFilters.hippodromes?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {localFilters.hippodromes.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-md"
                    >
                      {h}
                      <button
                        onClick={() => removeChip('hippodromes', h)}
                        className="text-white hover:text-gray-200 font-bold text-sm leading-none transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtres supplémentaires */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg">
              +
            </div>
            <h3 className="text-lg font-bold text-gray-800">Filtres supplémentaires</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Numéros de réunion */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                🎯 Numéros de réunion
              </label>
              <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-4 bg-white">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <label
                      key={num}
                      className="group cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.reunionNumbers?.includes(num.toString())}
                        onChange={() => toggleArrayFilter('reunionNumbers', num.toString())}
                        className="sr-only"
                      />
                      <div
                        className={`px-3 py-2 rounded-lg border-2 text-xs font-medium text-center transition-all duration-200 ${
                          localFilters.reunionNumbers?.includes(num.toString())
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500 shadow-md'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        R{num}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Recherche texte */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                🔎 Recherche texte (contient)
              </label>
              <input
                type="text"
                placeholder="Rechercher dans les réunions..."
                value={localFilters.textQuery || ''}
                onChange={(e) => updateFilter('textQuery', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white"
              />
            </div>
          </div>
        </div>

        {/* Bouton Rechercher */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSearch}
            className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rechercher
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
