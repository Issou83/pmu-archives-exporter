import { useState, useEffect } from 'react';
import { MONTHS, YEARS, COUNTRIES } from '../utils/constants';

/**
 * Composant pour gérer tous les filtres de recherche
 */
export function FiltersPanel({ filters, onFiltersChange, suggestions = {} }) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Synchroniser avec les props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (key, value) => {
    const current = localFilters[key] || [];
    const newArray = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, newArray);
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
      countries: [],
      textQuery: '',
    };
    setLocalFilters(reset);
    onFiltersChange(reset);
  };

  const removeChip = (key, value) => {
    const current = localFilters[key] || [];
    updateFilter(key, current.filter((v) => v !== value));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filtres</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Années */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Années
          </label>
          <div className="flex flex-wrap gap-2">
            {YEARS.map((year) => (
              <label key={year} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.years?.includes(year.toString())}
                  onChange={() => toggleArrayFilter('years', year.toString())}
                  className="mr-1"
                />
                <span className="text-sm">{year}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Mois */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mois
          </label>
          <div className="max-h-32 overflow-y-auto border rounded p-2">
            {MONTHS.map((month) => (
              <label key={month.value} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={localFilters.months?.includes(month.value)}
                  onChange={() => toggleArrayFilter('months', month.value)}
                  className="mr-2"
                />
                <span className="text-sm">{month.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de début
          </label>
          <input
            type="date"
            value={localFilters.dateFrom || ''}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            value={localFilters.dateTo || ''}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        {/* Hippodromes - Autocomplete */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hippodromes
          </label>
          <input
            type="text"
            placeholder="Rechercher un hippodrome..."
            value={localFilters.hippodromeInput || ''}
            onChange={(e) => {
              setLocalFilters({ ...localFilters, hippodromeInput: e.target.value });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && localFilters.hippodromeInput) {
                e.preventDefault();
                const value = localFilters.hippodromeInput.trim();
                if (value && !localFilters.hippodromes?.includes(value)) {
                  updateFilter('hippodromes', [...(localFilters.hippodromes || []), value]);
                  setLocalFilters({ ...localFilters, hippodromeInput: '' });
                }
              }
            }}
            className="w-full border rounded px-2 py-1 text-sm"
            list="hippodrome-suggestions"
          />
          <datalist id="hippodrome-suggestions">
            {suggestions.hippodromes?.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
          <div className="flex flex-wrap gap-1 mt-2">
            {localFilters.hippodromes?.map((h) => (
              <span
                key={h}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1"
              >
                {h}
                <button
                  onClick={() => removeChip('hippodromes', h)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Numéros de réunion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéros de réunion
          </label>
          <div className="max-h-32 overflow-y-auto border rounded p-2">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
              <label key={num} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={localFilters.reunionNumbers?.includes(num.toString())}
                  onChange={() => toggleArrayFilter('reunionNumbers', num.toString())}
                  className="mr-2"
                />
                <span className="text-sm">Réunion {num}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Pays */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pays
          </label>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((country) => (
              <label key={country.code} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.countries?.includes(country.code)}
                  onChange={() => toggleArrayFilter('countries', country.code)}
                  className="mr-1"
                />
                <span className="text-sm">{country.label}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {localFilters.countries?.map((code) => {
              const country = COUNTRIES.find((c) => c.code === code);
              return (
                <span
                  key={code}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1"
                >
                  {country?.label || code}
                  <button
                    onClick={() => removeChip('countries', code)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* Recherche texte */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recherche texte (contient)
          </label>
          <input
            type="text"
            placeholder="Rechercher dans les réunions..."
            value={localFilters.textQuery || ''}
            onChange={(e) => updateFilter('textQuery', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

