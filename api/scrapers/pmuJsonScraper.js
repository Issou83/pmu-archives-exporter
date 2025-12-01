/**
 * Scraper pour l'API PMU JSON (non-officielle)
 * Endpoint: https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/{ddMMyyyy}
 */

import { MONTH_NAMES_ARRAY, DEBUG } from '../utils/constants.js';

// Limite maximale de jours à scraper en une requête (évite les timeouts)
const MAX_DAYS_TO_SCRAPE = 31;

/**
 * Formate une date au format ddMMyyyy
 */
function formatDateForPmu(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Génère toutes les dates entre dateFrom et dateTo
 */
function generateDateRange(dateFrom, dateTo) {
  const dates = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

/**
 * Normalise les données d'une réunion PMU JSON
 */
function normalizePmuReunion(pmuData, date) {
  // Structure attendue: pmuData contient des réunions avec hippodrome, numéro, etc.
  // Cette fonction doit être adaptée selon la structure réelle de l'API PMU

  // Si pmuData contient libelleCourt/libelleLong, c'est probablement une erreur
  // ou une structure différente qu'on ne supporte pas encore
  if (pmuData.libelleCourt || pmuData.libelleLong) {
    console.warn('Structure PMU non supportée dans normalizePmuReunion:', pmuData);
    return null;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const dateISO = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Extraire les informations depuis différentes structures possibles
  const hippodrome = pmuData.hippodrome || pmuData.nomHippodrome || pmuData.lieu || 'Inconnu';
  const reunionNumber = pmuData.reunionNumber || pmuData.numeroReunion || pmuData.numero || '1';
  const countryCode = pmuData.countryCode || pmuData.pays || 'FR';

  // Exemple de normalisation (à adapter selon la structure réelle)
  return {
    id: `${dateISO}_${hippodrome}_${reunionNumber}`.replace(/[^a-zA-Z0-9_]/g, '_'),
    dateISO,
    dateLabel: `${day}/${month}/${year}`,
    year,
    month,
    monthLabel: new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long' }),
    hippodrome,
    reunionNumber: reunionNumber.toString(),
    countryCode,
    url: pmuData.url || pmuData.lien || null,
    source: 'pmu-json',
  };
}

/**
 * Scrape les archives PMU JSON pour une date donnée
 */
async function scrapePmuDate(date) {
  const dateStr = formatDateForPmu(date);
  const url = `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${dateStr}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      // Si 404, pas de données pour cette date
      if (response.status === 404) return [];
      throw new Error(`HTTP ${response.status} pour ${url}`);
    }

    const data = await response.json();

    // Parser les réunions depuis la structure JSON
    // Structure attendue: data.programme.reunions ou similaire
    const reunions = [];

    // Adapter selon la structure réelle de l'API
    // L'API PMU peut retourner différentes structures
    if (data.programme?.reunions) {
      for (const reunion of data.programme.reunions) {
        const normalized = normalizePmuReunion(reunion, date);
        if (normalized) reunions.push(normalized);
      }
    } else if (data.reunions && Array.isArray(data.reunions)) {
      for (const reunion of data.reunions) {
        const normalized = normalizePmuReunion(reunion, date);
        if (normalized) reunions.push(normalized);
      }
    } else if (Array.isArray(data)) {
      for (const item of data) {
        if (item.reunions && Array.isArray(item.reunions)) {
          for (const reunion of item.reunions) {
            const normalized = normalizePmuReunion(reunion, date);
            if (normalized) reunions.push(normalized);
          }
        } else if (item.libelleCourt || item.libelleLong) {
          // Si l'item est directement une réunion avec libelleCourt/libelleLong
          // C'est probablement une structure différente, on l'ignore pour l'instant
          console.warn('Structure PMU non supportée:', item);
        }
      }
    } else if (data.libelleCourt || data.libelleLong) {
      // Si la réponse entière est un objet avec libelleCourt/libelleLong
      // C'est probablement une erreur ou une structure différente
      console.warn('Structure PMU non supportée (objet avec libelleCourt/libelleLong)');
    }

    return reunions;
  } catch (error) {
    console.error(`Erreur lors du scraping PMU JSON pour ${dateStr}:`, error.message);
    return [];
  }
}

/**
 * Scrape les archives PMU JSON pour les années et mois spécifiés
 */
export async function scrapePmuJsonArchives(years, months, dateFrom, dateTo) {
  const allReunions = [];
  const datesToScrape = [];

  // Si dateFrom et dateTo sont fournis, utiliser cette plage
  if (dateFrom && dateTo) {
    const dateRange = generateDateRange(dateFrom, dateTo);
    
    // Limiter le nombre de jours pour éviter les timeouts
    if (dateRange.length > MAX_DAYS_TO_SCRAPE) {
      if (DEBUG) {
        console.warn(
          `[PMU JSON] Plage trop large (${dateRange.length} jours), limitation à ${MAX_DAYS_TO_SCRAPE} jours`
        );
      }
      datesToScrape.push(...dateRange.slice(0, MAX_DAYS_TO_SCRAPE));
    } else {
      datesToScrape.push(...dateRange);
    }
  } else {
    // Sinon, générer les dates depuis years et months
    const monthNames = MONTH_NAMES_ARRAY;

    for (const year of years) {
      for (const month of months) {
        const monthIndex = monthNames.indexOf(month);
        if (monthIndex === -1) continue;

        // Générer toutes les dates du mois
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          datesToScrape.push(new Date(year, monthIndex, day));
        }
      }
    }
    
    // Limiter le nombre total de dates pour éviter les timeouts
    if (datesToScrape.length > MAX_DAYS_TO_SCRAPE) {
      if (DEBUG) {
        console.warn(
          `[PMU JSON] Trop de dates à scraper (${datesToScrape.length}), limitation à ${MAX_DAYS_TO_SCRAPE} jours`
        );
      }
      datesToScrape.splice(MAX_DAYS_TO_SCRAPE);
    }
  }

  // Scraper chaque date
  for (const date of datesToScrape) {
    const reunions = await scrapePmuDate(date);
    allReunions.push(...reunions);

    // Sleep 400ms entre les requêtes
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  // Dédupliquer
  const uniqueReunions = [];
  const seenIds = new Set();

  for (const reunion of allReunions) {
    if (!seenIds.has(reunion.id)) {
      seenIds.add(reunion.id);
      uniqueReunions.push(reunion);
    }
  }

  return uniqueReunions;
}

