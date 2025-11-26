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

  const fetchReunions = useCallback(async () => {
    if (!filters.source) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construction des query params
      const params = new URLSearchParams();

      if (filters.source) params.append('source', filters.source);
      if (filters.years?.length) params.append('years', filters.years.join(','));
      if (filters.months?.length) params.append('months', filters.months.join(','));
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.hippodromes?.length) {
        params.append('hippodromes', filters.hippodromes.join(','));
      }
      if (filters.reunionNumbers?.length) {
        params.append('reunionNumbers', filters.reunionNumbers.join(','));
      }
      if (filters.countries?.length) {
        params.append('countries', filters.countries.join(','));
      }
      if (filters.textQuery) params.append('textQuery', filters.textQuery);

      const response = await axios.get(`/api/archives?${params.toString()}`);
      setData(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      fetchReunions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fetchReunions]);

  return {
    data,
    loading,
    error,
    refetch: fetchReunions,
  };
}

