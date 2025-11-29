import { scrapeTurfFrArchives, setArrivalReportsCache } from './scrapers/turfScraper.js';
import { scrapePmuJsonArchives } from './scrapers/pmuJsonScraper.js';

// Cache mémoire simple avec TTL
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 heures

// Cache spécifique pour les rapports d'arrivée (évite de re-scraper les mêmes URLs)
const arrivalReportsCache = new Map();
const ARRIVAL_REPORTS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

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
    const cacheAge = cached ? Date.now() - cached.timestamp : null;

    if (cached && cacheAge < CACHE_TTL) {
      // Cache hit - appliquer les filtres et retourner
      console.log(`[API] Cache hit (âge: ${Math.round(cacheAge / 1000)}s)`);
      const filtered = applyFilters(cached.data, filters);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(filtered);
    } else if (cached) {
      console.log(`[API] Cache expiré (âge: ${Math.round(cacheAge / 1000)}s, TTL: ${CACHE_TTL / 1000}s)`);
    } else {
      console.log(`[API] Cache miss pour la clé: ${cacheKey}`);
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
        // OPTIMISATION : Injecter le cache des rapports d'arrivée dans le scraper
        setArrivalReportsCache(arrivalReportsCache, ARRIVAL_REPORTS_CACHE_TTL);
        
        // CORRECTION : Réactiver les rapports d'arrivée avec une logique équilibrée
        // Le timeout global de 50s protège, mais on limite pour éviter les timeouts
        const totalMonths = years.length * months.length;
        
        // Activer les rapports d'arrivée si :
        // 1. Exactement 1 mois (le plus sûr)
        // 2. OU 2 mois avec des filtres spécifiques (hippodromes, réunions, dates) qui réduisent le nombre de réunions
        const hasSpecificFilters = (filters.hippodromes?.length > 0 || 
                                   filters.reunionNumbers?.length > 0 || 
                                   filters.dateFrom || 
                                   filters.dateTo);
        
        // Activer seulement pour 1 mois, ou 2 mois avec filtres très spécifiques
        const includeArrivalReports = totalMonths === 1 || (totalMonths === 2 && hasSpecificFilters);
        
        if (!includeArrivalReports) {
          console.log(`[API] Rapports d'arrivée désactivés (${totalMonths} mois, filtres spécifiques: ${hasSpecificFilters}) pour éviter timeout`);
        } else {
          console.log(`[API] Rapports d'arrivée activés (${totalMonths} mois, filtres spécifiques: ${hasSpecificFilters})`);
        }
        
        // CORRECTION TIMEOUT : Ajouter un timeout global de 55 secondes pour laisser une marge
        // Vercel a une limite de 60 secondes, on s'arrête à 55 pour éviter le timeout
        // Augmenté de 50s à 55s pour permettre le scraping des rapports d'arrivée
        const SCRAPING_TIMEOUT = 55000; // 55 secondes
        
        const scrapingPromise = scrapeTurfFrArchives(years, months, includeArrivalReports);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Scraping timeout: Le scraping prend trop de temps (>55s). Réduisez le nombre de mois ou d\'années.'));
          }, SCRAPING_TIMEOUT);
        });
        
        try {
          reunions = await Promise.race([scrapingPromise, timeoutPromise]);
          console.log(
            `[API] Scraping terminé: ${reunions.length} réunions trouvées`
          );
        } catch (timeoutError) {
          if (timeoutError.message.includes('timeout')) {
            console.error(`[API] Timeout après ${SCRAPING_TIMEOUT}ms`);
            return res.status(504).json({
              error: {
                code: '504',
                message: 'Le scraping prend trop de temps (>55s). Essayez de réduire le nombre de mois ou d\'années sélectionnés, ou utilisez des filtres plus spécifiques (hippodromes, dates).',
              },
            });
          }
          throw timeoutError;
        }
      } catch (scrapeError) {
        console.error(`[API] Erreur lors du scraping:`, scrapeError);
        // Si c'est un timeout, retourner une erreur plus claire
        if (scrapeError.message?.includes('timeout') || scrapeError.code === 'ECONNABORTED') {
          return res.status(504).json({
            error: {
              code: '504',
              message: 'Le scraping prend trop de temps. Essayez de réduire le nombre de mois ou d\'années sélectionnés.',
            },
          });
        }
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
    
    // Gérer les timeouts spécifiquement
    if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: {
          code: '504',
          message: 'Le scraping prend trop de temps. Essayez de réduire le nombre de mois ou d\'années sélectionnés.',
        },
      });
    }
    
    // Retourner une erreur plus détaillée
    const errorResponse = {
      error: {
        code: '500',
        message: error.message || 'Internal server error',
      },
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
