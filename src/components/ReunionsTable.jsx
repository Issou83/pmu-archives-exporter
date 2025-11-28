import { useState, useMemo } from 'react';
import { PAGINATION_OPTIONS } from '../utils/constants';

/**
 * Composant tableau pour afficher les réunions avec tri et pagination
 */
export function ReunionsTable({ data, loading, error }) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Tri des données
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Conversion pour tri numérique si nécessaire
      if (sortColumn === 'reunionNumber') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  // Pagination
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
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-gray-700 font-medium">Chargement en cours...</div>
          <div className="text-sm text-gray-500 max-w-md">
            Le scraping des réunions et des rapports d'arrivée peut prendre 20-30 secondes.
            <br />
            <span className="text-xs text-gray-400">Veuillez patienter, ne fermez pas cette page.</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">⚠️ Erreur</div>
          <div className="text-gray-700 mb-4">{typeof error === 'string' ? error : 'Une erreur est survenue'}</div>
          {typeof error === 'string' && error.includes('Timeout') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <div className="text-yellow-800 font-medium mb-2">💡 Suggestions :</div>
              <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
                <li>Réduisez le nombre de mois sélectionnés (1-2 mois maximum)</li>
                <li>Limitez le nombre d'années (1 année à la fois)</li>
                <li>Ajoutez des filtres supplémentaires (hippodrome, pays) pour réduire les résultats</li>
                <li>Le scraping des rapports d'arrivée peut prendre du temps pour de grandes quantités de données</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <div className="text-gray-500">Aucune réunion trouvée</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Contrôles de pagination */}
      <div className="p-4 border-b flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Par page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            {PAGINATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-700">
          Page {currentPage} sur {totalPages} ({sortedData.length} résultats)
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dateISO')}
              >
                Date {getSortIcon('dateISO')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('hippodrome')}
              >
                Hippodrome {getSortIcon('hippodrome')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('reunionNumber')}
              >
                Réunion {getSortIcon('reunionNumber')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('countryCode')}
              >
                Pays {getSortIcon('countryCode')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('source')}
              >
                Source {getSortIcon('source')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rapport d'arrivée
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
Lien
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((reunion) => (
              <tr key={reunion.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <div>{reunion.dateLabel}</div>
                  <div className="text-xs text-gray-500">{reunion.dateISO}</div>
                </td>
                <td className="px-4 py-3 text-sm">{reunion.hippodrome}</td>
                <td className="px-4 py-3 text-sm">{reunion.reunionNumber}</td>
                <td className="px-4 py-3 text-sm">{reunion.countryCode}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {reunion.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {reunion.arrivalReport ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono">
                      {reunion.arrivalReport}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Non disponible</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {reunion.url ? (
                    <a
                      href={reunion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
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

      {/* Navigation pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Précédent
          </button>
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
                className={`px-3 py-1 border rounded ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

