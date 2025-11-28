import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook personnalisé pour récupérer les réunions avec filtres
 * @param {Object} filters - Objet contenant tous les filtres
 * @returns {Object} { data, loading, error, refetch }
 */
export function useReunions(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFilters, setCurrentFilters] = useState(filters);

  // Mettre à jour les filtres courants quand ils changent
  useEffect(() => {
    setCurrentFilters(filters);
  }, [filters]);

  const fetchReunions = useCallback(async () => {
    if (!currentFilters.source) {
      setData([]);
      setLoading(false);
      return;
    }

    // Vérifier que les filtres minimums sont présents pour turf-fr
    if (currentFilters.source === 'turf-fr') {
      if (!currentFilters.years?.length || !currentFilters.months?.length) {
        setData([]);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Construction des query params
      const params = new URLSearchParams();

      if (currentFilters.source) params.append('source', currentFilters.source);
      if (currentFilters.years?.length) params.append('years', currentFilters.years.join(','));
      if (currentFilters.months?.length) params.append('months', currentFilters.months.join(','));
      if (currentFilters.dateFrom) params.append('dateFrom', currentFilters.dateFrom);
      if (currentFilters.dateTo) params.append('dateTo', currentFilters.dateTo);
      if (currentFilters.hippodromes?.length) {
        params.append('hippodromes', currentFilters.hippodromes.join(','));
      }
      if (currentFilters.reunionNumbers?.length) {
        params.append('reunionNumbers', currentFilters.reunionNumbers.join(','));
      }
      if (currentFilters.countries?.length) {
        params.append('countries', currentFilters.countries.join(','));
      }
      if (currentFilters.textQuery) params.append('textQuery', currentFilters.textQuery);

      // Timeout de 90 secondes pour permettre le scraping des rapports d'arrivée
      const response = await axios.get(`/api/archives?${params.toString()}`, {
        timeout: 90000, // 90 secondes
      });
      // S'assurer que data est toujours un tableau
      const responseData = response.data;
      setData(Array.isArray(responseData) ? responseData : []);
    } catch (err) {
      // Gérer les différents types d'erreurs
      let errorMessage = 'Erreur lors du chargement';
      
      if (err.response) {
        // Erreur HTTP (404, 500, 504, etc.)
        const errorData = err.response.data;
        if (errorData?.error) {
          // Si l'erreur est un objet avec code et message
          if (typeof errorData.error === 'object' && errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          }
        } else if (err.response.status === 504) {
          errorMessage = 'Timeout : Le scraping prend trop de temps. Essayez de réduire le nombre de mois ou d\'années sélectionnés.';
        } else if (err.response.status >= 500) {
          errorMessage = `Erreur serveur (${err.response.status}). Veuillez réessayer plus tard.`;
        } else {
          errorMessage = `Erreur ${err.response.status}`;
        }
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Timeout : La requête a pris trop de temps. Essayez de réduire le nombre de mois ou d\'années sélectionnés.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  // Ne pas lancer automatiquement, seulement via refetch
  // useEffect(() => {
  //   // Debounce de 500ms
  //   const timeoutId = setTimeout(() => {
  //     fetchReunions();
  //   }, 500);

  //   return () => clearTimeout(timeoutId);
  // }, [fetchReunions]);

  return {
    data,
    loading,
    error,
    refetch: fetchReunions,
  };
}

