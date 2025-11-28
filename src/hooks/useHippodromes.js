import { useState, useEffect } from 'react';
import { getHippodromesByCountry } from '../data/hippodromes';

/**
 * Hook pour charger les hippodromes selon le pays sélectionné
 */
export function useHippodromes(selectedCountry = 'FR') {
  const [hippodromes, setHippodromes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedCountry) {
      setHippodromes([]);
      return;
    }

    setLoading(true);
    setError(null);

    // D'abord utiliser la liste locale
    const localHippodromes = getHippodromesByCountry(selectedCountry);
    setHippodromes(localHippodromes);
    setLoading(false);

    // Ensuite, essayer de charger depuis l'API pour une mise à jour
    fetch(`/api/hippodromes?country=${selectedCountry}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hippodromes && data.hippodromes.length > 0) {
          // Fusionner avec la liste locale, en gardant les valeurs uniques
          const merged = [...new Set([...localHippodromes, ...data.hippodromes])];
          setHippodromes(merged.sort());
        }
      })
      .catch((err) => {
        // En cas d'erreur, on garde la liste locale
        console.warn('Erreur lors du chargement des hippodromes:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCountry]);

  return { hippodromes, loading, error };
}

