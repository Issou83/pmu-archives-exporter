import { scrapeTurfFrArchives } from './scrapers/turfScraper.js';
import { scrapePmuJsonArchives } from './scrapers/pmuJsonScraper.js';

// Cache mémoire simple avec TTL
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 heures

// Rate limiting simple par IP
const rateLimitMap = new Map();
const RATE_LIMIT = 30; // 30 requêtes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Vérifie le rate limiting
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];

  // Nettoyer les requêtes anciennes
  const recentRequests = userRequests.filter(
    (time) => now - time < RATE_LIMIT_WINDOW
  );

  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

/**
 * Génère une clé de cache
 */
function getCacheKey(source, years, months) {
  const yearsStr = Array.isArray(years) ? years.sort().join(',') : '';
  const monthsStr = Array.isArray(months) ? months.sort().join(',') : '';
  return `${source}_${yearsStr}_${monthsStr}`;
}

/**
 * Applique les filtres sur les réunions
 */
function applyFilters(reunions, filters) {
  let filtered = [...reunions];

  // Filtre par date
  if (filters.dateFrom) {
    filtered = filtered.filter((r) => r.dateISO >= filters.dateFrom);
  }
  if (filters.dateTo) {
    filtered = filtered.filter((r) => r.dateISO <= filters.dateTo);
  }

  // Filtre par hippodromes
  if (filters.hippodromes?.length) {
    filtered = filtered.filter((r) =>
      filters.hippodromes.some((h) =>
        r.hippodrome?.toLowerCase().includes(h.toLowerCase())
      )
    );
  }

  // Filtre par numéros de réunion
  if (filters.reunionNumbers?.length) {
    filtered = filtered.filter((r) => {
      const reunionNum =
        typeof r.reunionNumber === 'string'
          ? parseInt(r.reunionNumber)
          : r.reunionNumber;
      return filters.reunionNumbers.some((num) => {
        const filterNum = typeof num === 'string' ? parseInt(num) : num;
        return reunionNum === filterNum;
      });
    });
  }

  // Filtre par pays
  if (filters.countries?.length) {
    filtered = filtered.filter((r) =>
      filters.countries.includes(r.countryCode)
    );
  }

  // Filtre par texte
  if (filters.textQuery) {
    const query = filters.textQuery.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.hippodrome?.toLowerCase().includes(query) ||
        r.dateLabel?.toLowerCase().includes(query) ||
        r.reunionNumber?.toString().includes(query)
    );
  }

  return filtered;
}

/**
 * Handler API /api/archives
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer l'IP pour le rate limiting
    const ip =
      req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

    // Vérifier le rate limiting
    if (!checkRateLimit(ip)) {
      return res
        .status(429)
        .json({ error: 'Too many requests. Please try again later.' });
    }

    // Parser les query params
    const {
      source = 'turf-fr',
      years: yearsParam,
      months: monthsParam,
      dateFrom,
      dateTo,
      hippodromes: hippodromesParam,
      reunionNumbers: reunionNumbersParam,
      countries: countriesParam,
      textQuery,
    } = req.query;

    const years = yearsParam ? yearsParam.split(',').filter(Boolean) : [];
    const months = monthsParam ? monthsParam.split(',').filter(Boolean) : [];
    const hippodromes = hippodromesParam
      ? hippodromesParam.split(',').filter(Boolean)
      : [];
    const reunionNumbers = reunionNumbersParam
      ? reunionNumbersParam.split(',').filter(Boolean).map(Number)
      : [];
    const countries = countriesParam
      ? countriesParam.split(',').filter(Boolean)
      : [];

    const filters = {
      dateFrom,
      dateTo,
      hippodromes,
      reunionNumbers,
      countries,
      textQuery,
    };

    // Vérifier le cache
    const cacheKey = getCacheKey(source, years, months);
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Cache hit - appliquer les filtres et retourner
      const filtered = applyFilters(cached.data, filters);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(filtered);
    }

    // Cache miss - scraper les données
    console.log(
      `[API] Scraping avec source=${source}, years=${years.join(',')}, months=${months.join(',')}`
    );
    
    // Vérifier que fetch est disponible
    if (typeof fetch === 'undefined') {
      const errorMsg = `fetch is not available. Node.js version: ${process.version}. Required: >= 18.0.0`;
      console.error(`[API] ${errorMsg}`);
      return res.status(500).json({
        error: errorMsg,
        nodeVersion: process.version,
      });
    }
    
    let reunions = [];

    if (source === 'turf-fr') {
      if (years.length === 0 || months.length === 0) {
        console.log(`[API] Erreur: years ou months manquants`);
        return res.status(400).json({
          error: 'Years and months are required for turf-fr source',
        });
      }
      console.log(`[API] Début scraping Turf-FR...`);
      try {
        // Scraper avec les rapports d'arrivée (peut prendre du temps)
        // Pour les grandes requêtes, on pourrait désactiver les rapports d'arrivée
        const includeArrivalReports = true; // Toujours inclure les rapports d'arrivée
        reunions = await scrapeTurfFrArchives(years, months, includeArrivalReports);
        console.log(
          `[API] Scraping terminé: ${reunions.length} réunions trouvées`
        );
      } catch (scrapeError) {
        console.error(`[API] Erreur lors du scraping:`, scrapeError);
        throw scrapeError;
      }
    } else if (source === 'pmu-json') {
      console.log(`[API] Début scraping PMU JSON...`);
      if (dateFrom && dateTo) {
        reunions = await scrapePmuJsonArchives([], [], dateFrom, dateTo);
      } else if (years.length > 0 && months.length > 0) {
        reunions = await scrapePmuJsonArchives(years, months);
      } else {
        console.log(
          `[API] Erreur: dateFrom/dateTo ou years/months manquants pour PMU JSON`
        );
        return res.status(400).json({
          error:
            'Either dateFrom/dateTo or years/months are required for pmu-json source',
        });
      }
      console.log(
        `[API] Scraping PMU JSON terminé: ${reunions.length} réunions trouvées`
      );
    } else {
      console.log(`[API] Source invalide: ${source}`);
      return res.status(400).json({ error: 'Invalid source' });
    }

    // Mettre en cache
    cache.set(cacheKey, {
      data: reunions,
      timestamp: Date.now(),
    });

    // Appliquer les filtres
    const filtered = applyFilters(reunions, filters);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(filtered);
  } catch (error) {
    console.error('❌ Erreur dans /api/archives:', error);
    console.error('📋 Type d\'erreur:', error.constructor.name);
    console.error('📋 Message:', error.message);
    console.error('📋 Stack trace:', error.stack);
    
    // Retourner une erreur plus détaillée en développement
    const errorResponse = {
      error: error.message || 'Internal server error',
      type: error.constructor.name,
    };
    
    // En développement, ajouter plus de détails
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV !== 'production') {
      errorResponse.stack = error.stack;
      errorResponse.nodeVersion = process.version;
      errorResponse.hasFetch = typeof fetch !== 'undefined';
    }
    
    return res.status(500).json(errorResponse);
  }
}
