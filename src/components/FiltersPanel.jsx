import { useState, useEffect } from 'react';
import { MONTHS, YEARS, COUNTRIES } from '../utils/constants';
import { useHippodromes } from '../hooks/useHippodromes';

/**
 * Composant pour gérer tous les filtres de recherche
 * Réorganisé en 3 sections logiques :
 * 1. Années et Mois
 * 2. Date de début et Date de fin
 * 3. Pays et Hippodromes
 */
export function FiltersPanel({ filters, onFiltersChange, onSearch }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [selectedCountry, setSelectedCountry] = useState(filters.countries?.[0] || 'FR');
  const { hippodromes, loading: hippodromesLoading } = useHippodromes(selectedCountry);

  // Synchroniser avec les props
  useEffect(() => {
    setLocalFilters(filters);
    // Mettre à jour le pays sélectionné si les filtres changent
    if (filters.countries?.[0] && filters.countries[0] !== selectedCountry) {
      setSelectedCountry(filters.countries[0]);
    }
  }, [filters]);

  // Initialiser avec France par défaut
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
    // Réinitialiser les hippodromes quand on change de pays
    updateFilter('hippodromes', []);
  };

  const handleHippodromeChange = (e) => {
    const selectedHippodrome = e.target.value;
    if (selectedHippodrome && !localFilters.hippodromes?.includes(selectedHippodrome)) {
      updateFilter('hippodromes', [...(localFilters.hippodromes || []), selectedHippodrome]);
      // Réinitialiser le select
      e.target.value = '';
    }
  };

  const resetFilters = () => {
    const reset = {
      source: filters.source, // Garder la source
      years: [],
      months: [],
      dateFrom: '',
      dateTo: '',
      hippodromes: [],
      reunionNumbers: [],
      countries: ['FR'], // Réinitialiser avec France par défaut
      textQuery: '',
    };
    setLocalFilters(reset);
    setSelectedCountry('FR');
    onFiltersChange(reset);
  };

  const handleSearch = () => {
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
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Filtres de recherche</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ↻ Réinitialiser
        </button>
      </div>

      {/* SECTION 1 : Années et Mois */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Section 1 : Période (Années et Mois)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Années */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Années
            </label>
            <div className="flex flex-wrap gap-3">
              {YEARS.map((year) => (
                <label
                  key={year}
                  className="flex items-center cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={localFilters.years?.includes(year.toString())}
                    onChange={() => toggleArrayFilter('years', year.toString())}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-600">
                    {year}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Mois */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mois
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="grid grid-cols-2 gap-2">
                {MONTHS.map((month) => (
                  <label
                    key={month.value}
                    className="flex items-center cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.months?.includes(month.value)}
                      onChange={() => toggleArrayFilter('months', month.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-600">
                      {month.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 : Dates */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Section 2 : Plage de dates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={localFilters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={localFilters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3 : Pays et Hippodromes */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Section 3 : Localisation (Pays et Hippodromes)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pays - Menu déroulant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
            {localFilters.countries?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {localFilters.countries.map((code) => {
                  const country = COUNTRIES.find((c) => c.code === code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                    >
                      {country?.label || code}
                      <button
                        onClick={() => removeChip('countries', code)}
                        className="text-green-600 hover:text-green-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hippodromes - Menu déroulant dépendant du pays */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hippodromes
              {hippodromesLoading && (
                <span className="ml-2 text-xs text-gray-500">(Chargement...)</span>
              )}
            </label>
            <select
              onChange={handleHippodromeChange}
              disabled={!selectedCountry || hippodromesLoading}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              <div className="mt-2 flex flex-wrap gap-2">
                {localFilters.hippodromes.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                  >
                    {h}
                    <button
                      onClick={() => removeChip('hippodromes', h)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
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

      {/* Filtres supplémentaires (optionnels) */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Filtres supplémentaires
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Numéros de réunion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéros de réunion
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <label
                    key={num}
                    className="flex items-center cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.reunionNumbers?.includes(num.toString())}
                      onChange={() => toggleArrayFilter('reunionNumbers', num.toString())}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-1 text-xs text-gray-700 group-hover:text-blue-600">
                      R{num}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Recherche texte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche texte (contient)
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bouton Rechercher */}
      <div className="flex justify-end">
        <button
          onClick={handleSearch}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <span>🔍</span>
          <span>Rechercher</span>
        </button>
      </div>
    </div>
  );
}
