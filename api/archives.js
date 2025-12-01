import {
  scrapeTurfFrArchives,
  setArrivalReportsCache,
} from './scrapers/turfScraper.js';
import { scrapePmuJsonArchives } from './scrapers/pmuJsonScraper.js';
import { applyFilters } from './utils/filters.js';
import { DEBUG } from './utils/constants.js';

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
 * Génère une clé de cache résiliente
 * Inclut les filtres et l'activation des rapports pour éviter les problèmes de cache
 */
function getCacheKey(source, years, months, filters = {}, includeArrivalReports = false) {
  const yearsStr = Array.isArray(years) ? years.sort().join(',') : '';
  const monthsStr = Array.isArray(months) ? months.sort().join(',') : '';
  
  // Inclure les filtres dans la clé pour éviter les conflits
  const filtersStr = JSON.stringify({
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
    hippodromes: filters.hippodromes?.sort() || [],
    reunionNumbers: filters.reunionNumbers?.sort() || [],
    countries: filters.countries?.sort() || [],
    textQuery: filters.textQuery || null,
  });
  
  // Inclure l'activation des rapports dans la clé
  const reportsFlag = includeArrivalReports ? 'with_reports' : 'no_reports';
  
  // Hash simple pour éviter des clés trop longues
  const filtersHash = Buffer.from(filtersStr).toString('base64').substring(0, 16);
  
  return `${source}_${yearsStr}_${monthsStr}_${reportsFlag}_${filtersHash}`;
}

// applyFilters est maintenant importé depuis ./utils/filters.js

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

    // Cache miss - scraper les données
    // NOTE: La vérification du cache pour turf-fr est faite plus tard car elle dépend de includeArrivalReports
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

        // CORRECTION : Réactiver les rapports d'arrivée - C'EST LE BUT DES RECHERCHES !
        // Le timeout global de 55s protège, mais on optimise pour éviter les timeouts
        const totalMonths = years.length * months.length;

        // Activer les rapports d'arrivée si :
        // 1. Exactement 1 mois (toujours activé - c'est le but des recherches !)
        // 2. OU 2 mois avec des filtres spécifiques (hippodromes, réunions, dates) qui réduisent le nombre de réunions
        const hasSpecificFilters =
          filters.hippodromes?.length > 0 ||
          filters.reunionNumbers?.length > 0 ||
          filters.dateFrom ||
          filters.dateTo;

        // TOUJOURS activer pour 1 mois (c'est le but des recherches !)
        // Pour 2 mois, activer seulement avec filtres spécifiques
        const includeArrivalReports =
          totalMonths === 1 || (totalMonths === 2 && hasSpecificFilters);

        if (!includeArrivalReports) {
          console.log(
            `[API] Rapports d'arrivée désactivés (${totalMonths} mois, filtres spécifiques: ${hasSpecificFilters}) pour éviter timeout`
          );
        } else {
          console.log(
            `[API] Rapports d'arrivée activés (${totalMonths} mois, filtres spécifiques: ${hasSpecificFilters})`
          );
        }

        // OPTIMISATION CRITIQUE : Clé de cache résiliente incluant filtres et rapports
        const cacheKey = getCacheKey(source, years, months, filters, includeArrivalReports);
        const cached = cache.get(cacheKey);
        const cacheAge = cached ? Date.now() - cached.timestamp : null;

        if (cached && cacheAge < CACHE_TTL) {
          // Cache hit - les données sont déjà filtrées et avec/ sans rapports selon la requête
          console.log(`[API] Cache hit (âge: ${Math.round(cacheAge / 1000)}s, clé: ${cacheKey})`);
          const filtered = applyFilters(cached.data, filters);
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).json(filtered);
        } else if (cached) {
          console.log(
            `[API] Cache expiré (âge: ${Math.round(cacheAge / 1000)}s, TTL: ${CACHE_TTL / 1000}s)`
          );
        } else {
          console.log(`[API] Cache miss pour la clé: ${cacheKey}`);
        }

        // OPTIMISATION : Timeout global de 56 secondes pour laisser une marge de 4s
        // Vercel a une limite de 60 secondes, on s'arrête à 56 pour éviter le timeout
        // Le scraper a un early exit à 50s, donc on a 6s de marge totale
        const SCRAPING_TIMEOUT = 56000; // 56 secondes

        // OPTIMISATION CRITIQUE : Appliquer les filtres AVANT le scraping des rapports
        // pour éviter de scraper des réunions qui seront filtrées après
        // On passe les filtres au scraper pour qu'il puisse les appliquer pendant le scraping
        const scrapingPromise = scrapeTurfFrArchives(
          years,
          months,
          includeArrivalReports,
          filters // Passer les filtres pour optimisation
        );
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                "Scraping timeout: Le scraping prend trop de temps (>56s). Réduisez le nombre de mois ou d'années."
              )
            );
          }, SCRAPING_TIMEOUT);
        });

        try {
          reunions = await Promise.race([scrapingPromise, timeoutPromise]);

          // OPTIMISATION : Compter les rapports trouvés pour le logging
          const withReports = reunions.filter((r) => r.arrivalReport).length;
          const reportPct =
            reunions.length > 0
              ? Math.round((withReports / reunions.length) * 100)
              : 0;

          console.log(
            `[API] Scraping terminé: ${reunions.length} réunions trouvées (${withReports} avec rapports, ${reportPct}%)`
          );
        } catch (timeoutError) {
          if (timeoutError.message.includes('timeout')) {
            console.error(`[API] Timeout après ${SCRAPING_TIMEOUT}ms`);
            return res.status(504).json({
              error: {
                code: '504',
                message:
                  "Le scraping prend trop de temps (>56s). Essayez de réduire le nombre de mois ou d'années sélectionnés, ou utilisez des filtres plus spécifiques (hippodromes, dates).",
              },
            });
          }
          throw timeoutError;
        }
      } catch (scrapeError) {
        console.error(`[API] Erreur lors du scraping:`, scrapeError);
        // Si c'est un timeout, retourner une erreur plus claire
        if (
          scrapeError.message?.includes('timeout') ||
          scrapeError.code === 'ECONNABORTED'
        ) {
          return res.status(504).json({
            error: {
              code: '504',
              message:
                "Le scraping prend trop de temps. Essayez de réduire le nombre de mois ou d'années sélectionnés.",
            },
          });
        }
        throw scrapeError;
      }
    } else if (source === 'pmu-json') {
      console.log(`[API] Début scraping PMU JSON...`);
      
      // Pour PMU JSON, pas de rapports d'arrivée pour l'instant
      const includeArrivalReports = false;
      
      // Clé de cache pour PMU JSON
      const cacheKey = getCacheKey(source, years, months, filters, includeArrivalReports);
      const cached = cache.get(cacheKey);
      const cacheAge = cached ? Date.now() - cached.timestamp : null;

      if (cached && cacheAge < CACHE_TTL) {
        console.log(`[API] Cache hit (âge: ${Math.round(cacheAge / 1000)}s, clé: ${cacheKey})`);
        const filtered = applyFilters(cached.data, filters);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(filtered);
      }
      
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
      
      // Mettre en cache pour PMU JSON
      cache.set(cacheKey, {
        data: reunions,
        timestamp: Date.now(),
      });
    } else {
      console.log(`[API] Source invalide: ${source}`);
      return res.status(400).json({ error: 'Invalid source' });
    }

    // Mettre en cache pour turf-fr (cacheKey déjà défini dans le bloc turf-fr)
    if (source === 'turf-fr') {
      cache.set(cacheKey, {
        data: reunions,
        timestamp: Date.now(),
      });
    }

    // Appliquer les filtres
    const filtered = applyFilters(reunions, filters);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(filtered);
  } catch (error) {
    console.error('❌ Erreur dans /api/archives:', error);
    console.error("📋 Type d'erreur:", error.constructor.name);
    console.error('📋 Message:', error.message);
    console.error('📋 Stack trace:', error.stack);

    // Gérer les timeouts spécifiquement
    if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: {
          code: '504',
          message:
            "Le scraping prend trop de temps. Essayez de réduire le nombre de mois ou d'années sélectionnés.",
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
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.VERCEL_ENV !== 'production'
    ) {
      errorResponse.stack = error.stack;
      errorResponse.nodeVersion = process.version;
      errorResponse.hasFetch = typeof fetch !== 'undefined';
    }

    return res.status(500).json(errorResponse);
  }
}
