import { useState } from 'react';
import axios from 'axios';

/**
 * Barre d'export avec bouton et compteur de résultats
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
        }
      );

      // Créer un lien de téléchargement
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
    <div className="bg-white p-4 rounded-lg shadow mb-4 flex flex-wrap justify-between items-center gap-4">
      <div className="text-sm text-gray-700">
        <span className="font-semibold">{total}</span> réunion{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
      </div>
      <button
        onClick={handleExport}
        disabled={exporting || total === 0}
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {exporting ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Export en cours...</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span>Exporter Excel</span>
          </>
        )}
      </button>
    </div>
  );
}

