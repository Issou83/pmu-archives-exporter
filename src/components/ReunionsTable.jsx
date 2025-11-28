import { useState, useMemo } from 'react';
import { PAGINATION_OPTIONS } from '../utils/constants';

/**
 * Composant tableau pour afficher les réunions avec tri et pagination - Design moderne
 */
export function ReunionsTable({ data, loading, error }) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === 'reunionNumber') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl shadow-xl p-12 text-center border border-white/20">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800 mb-2">Chargement en cours...</div>
            <div className="text-sm text-gray-600 max-w-md">
              Le scraping des réunions et des rapports d'arrivée peut prendre 20-30 secondes.
              <br />
              <span className="text-xs text-gray-500 mt-2 block">Veuillez patienter, ne fermez pas cette page.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="text-red-600 text-xl font-bold mb-2">Erreur</div>
          <div className="text-gray-700 mb-6">{typeof error === 'string' ? error : 'Une erreur est survenue'}</div>
          {typeof error === 'string' && error.includes('Timeout') && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 text-left max-w-2xl mx-auto">
              <div className="text-amber-800 font-bold mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Suggestions :</span>
              </div>
              <ul className="text-amber-700 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>Réduisez le nombre de mois sélectionnés (1-2 mois maximum)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>Limitez le nombre d'années (1 année à la fois)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>Ajoutez des filtres supplémentaires (hippodrome, pays) pour réduire les résultats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>Le scraping des rapports d'arrivée peut prendre du temps pour de grandes quantités de données</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="glass rounded-2xl shadow-xl p-12 text-center border border-white/20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">📭</span>
        </div>
        <div className="text-xl font-semibold text-gray-700 mb-2">Aucune réunion trouvée</div>
        <div className="text-sm text-gray-500">Essayez de modifier vos critères de recherche</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header avec stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">📋 Résultats de recherche</h2>
            <p className="text-indigo-100 text-sm">{sortedData.length.toLocaleString()} réunion{sortedData.length > 1 ? 's' : ''} trouvée{sortedData.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-white font-medium">Par page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border-0 rounded-lg px-3 py-2 text-sm font-medium bg-white/20 text-white focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
            >
              {PAGINATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="text-gray-900">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau responsive */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {[
                { key: 'dateISO', label: '📅 Date' },
                { key: 'hippodrome', label: '🏇 Hippodrome' },
                { key: 'reunionNumber', label: '🎯 Réunion' },
                { key: 'countryCode', label: '🌍 Pays' },
                { key: 'source', label: '📊 Source' },
                { key: null, label: '🏁 Rapport' },
                { key: null, label: '🔗 Lien' },
              ].map((col) => (
                <th
                  key={col.key || col.label}
                  className={`px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${
                    col.key ? 'cursor-pointer hover:bg-gray-200 transition-colors' : ''
                  }`}
                  onClick={col.key ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.key && getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((reunion, index) => (
              <tr
                key={reunion.id}
                className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-gray-900">{reunion.dateLabel}</div>
                  <div className="text-xs text-gray-500 mt-1">{reunion.dateISO}</div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{reunion.hippodrome}</div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-md">
                    {reunion.reunionNumber}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {reunion.countryCode}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                    {reunion.source}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  {reunion.arrivalReport ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">
                      {reunion.arrivalReport}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                      Non disponible
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  {reunion.url ? (
                    <a
                      href={reunion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Ouvrir
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination moderne */}
      {totalPages > 1 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 sm:px-8 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 font-medium">
              Page <span className="font-bold text-indigo-600">{currentPage}</span> sur{' '}
              <span className="font-bold text-indigo-600">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                ← Précédent
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
