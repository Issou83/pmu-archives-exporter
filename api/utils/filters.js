/**
 * Module commun pour appliquer les filtres sur les réunions
 * Utilisé par api/archives.js et api/export.js
 */

/**
 * Applique les filtres sur les réunions
 * Gère correctement les types (string/number) pour éviter les incohérences
 * 
 * @param {Array} reunions - Liste des réunions à filtrer
 * @param {Object} filters - Objet contenant les filtres à appliquer
 * @returns {Array} Liste des réunions filtrées
 */
export function applyFilters(reunions, filters) {
  if (!Array.isArray(reunions)) {
    return [];
  }

  let filtered = [...reunions];

  // Filtre par dateFrom
  if (filters.dateFrom) {
    filtered = filtered.filter((r) => r.dateISO >= filters.dateFrom);
  }

  // Filtre par dateTo
  if (filters.dateTo) {
    filtered = filtered.filter((r) => r.dateISO <= filters.dateTo);
  }

  // Filtre par hippodromes (recherche partielle insensible à la casse)
  if (filters.hippodromes?.length) {
    filtered = filtered.filter((r) =>
      filters.hippodromes.some((h) =>
        r.hippodrome?.toLowerCase().includes(h.toLowerCase())
      )
    );
  }

  // Filtre par numéros de réunion
  // IMPORTANT : Gérer les types string/number pour éviter les incohérences
  if (filters.reunionNumbers?.length) {
    filtered = filtered.filter((r) => {
      // Convertir reunionNumber en nombre pour la comparaison
      const reunionNum =
        typeof r.reunionNumber === 'string'
          ? parseInt(r.reunionNumber, 10)
          : r.reunionNumber;

      // Vérifier si le numéro correspond à un des filtres
      return filters.reunionNumbers.some((num) => {
        // Convertir le filtre en nombre aussi
        const filterNum = typeof num === 'string' ? parseInt(num, 10) : num;
        return !isNaN(reunionNum) && !isNaN(filterNum) && reunionNum === filterNum;
      });
    });
  }

  // Filtre par pays (code pays exact)
  if (filters.countries?.length) {
    filtered = filtered.filter((r) =>
      filters.countries.includes(r.countryCode)
    );
  }

  // Filtre par texte (recherche dans plusieurs champs)
  if (filters.textQuery) {
    const query = filters.textQuery.toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(
        (r) =>
          r.hippodrome?.toLowerCase().includes(query) ||
          r.dateLabel?.toLowerCase().includes(query) ||
          r.reunionNumber?.toString().includes(query) ||
          r.id?.toLowerCase().includes(query)
      );
    }
  }

  // Filtre par années (si spécifié)
  if (filters.years?.length) {
    filtered = filtered.filter((r) => {
      const reunionYear = typeof r.year === 'string' ? parseInt(r.year, 10) : r.year;
      return filters.years.some((y) => {
        const filterYear = typeof y === 'string' ? parseInt(y, 10) : y;
        return !isNaN(reunionYear) && !isNaN(filterYear) && reunionYear === filterYear;
      });
    });
  }

  // Filtre par mois (si spécifié)
  if (filters.months?.length) {
    filtered = filtered.filter((r) => {
      const reunionMonth = typeof r.month === 'string' ? parseInt(r.month, 10) : r.month;
      // Convertir les mois en indices (1-12)
      const monthIndices = filters.months.map((m) => {
        // Si c'est un nom de mois, trouver l'index
        if (typeof m === 'string' && isNaN(parseInt(m, 10))) {
          const monthNames = [
            'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
          ];
          const index = monthNames.indexOf(m.toLowerCase());
          return index !== -1 ? index + 1 : null;
        }
        // Sinon, c'est déjà un nombre
        return typeof m === 'string' ? parseInt(m, 10) : m;
      }).filter((m) => m !== null);

      return monthIndices.some((m) => {
        return !isNaN(reunionMonth) && !isNaN(m) && reunionMonth === m;
      });
    });
  }

  return filtered;
}

