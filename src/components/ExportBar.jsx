import { useState } from 'react';
import axios from 'axios';

/**
 * Barre d'export avec bouton et compteur de résultats - Design moderne
 */
export function ExportBar({ total, filters, onExportSuccess, onExportError }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.post(
        '/api/export',
        filters,
        {
          responseType: 'blob',
          timeout: 90000,
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reunions_pmu_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onExportSuccess?.('Export réussi !');
    } catch (error) {
      onExportError?.(
        error.response?.data?.error || error.message || 'Erreur lors de l\'export'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white">📊</span>
          </div>
          <div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">
              Résultats
            </div>
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {total.toLocaleString()} réunion{total > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 min-w-[180px] justify-center"
        >
          {exporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Export...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exporter Excel</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
