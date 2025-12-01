import * as cheerio from 'cheerio';
import {
  fetchRobotsTxt,
  isUrlAllowed,
  getCrawlDelay,
} from '../utils/robotsParser.js';
import { MONTHS, MONTH_NAMES, DEBUG } from '../utils/constants.js';
import { applyFilters } from '../utils/filters.js';

/**
 * Sleep function pour éviter le scraping agressif
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalise le code pays depuis le préfixe de l'hippodrome
 */
function normalizeCountryCode(hippodrome) {
  if (!hippodrome) return 'FR';
  if (hippodrome.startsWith('Gb-') || hippodrome.startsWith('GB-')) return 'GB';
  if (hippodrome.startsWith('Swe-') || hippodrome.startsWith('SWE-'))
    return 'SWE';
  if (hippodrome.startsWith('Usa-') || hippodrome.startsWith('USA-'))
    return 'USA';
  if (hippodrome.startsWith('Ire-') || hippodrome.startsWith('IRE-'))
    return 'IRE';
  if (hippodrome.startsWith('Ger-') || hippodrome.startsWith('GER-'))
    return 'GER';
  if (hippodrome.startsWith('Ita-') || hippodrome.startsWith('ITA-'))
    return 'ITA';
  return 'FR';
}

/**
 * Génère un ID stable pour une réunion
 */
function generateId(dateISO, hippodrome, reunionNumber) {
  return `${dateISO}_${hippodrome}_${reunionNumber}`.replace(
    /[^a-zA-Z0-9_]/g,
    '_'
  );
}

/**
 * Parse une date depuis le texte de la page
 */
function parseDate(dateText) {
  if (!dateText) return null;

  // Utiliser MONTH_NAMES depuis constants.js
  const monthNames = MONTH_NAMES;

  // Pattern 1: "lundi 15 janvier 2024" ou "15 janvier 2024"
  const fullDateMatch = dateText.match(
    /(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\s*(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i
  );
  if (fullDateMatch) {
    const day = parseInt(fullDateMatch[1]);
    const monthName = fullDateMatch[2].toLowerCase();
    const year = parseInt(fullDateMatch[3]);
    const month = monthNames[monthName];

    if (month) {
      const monthIndex = month - 1;
      const date = new Date(year, monthIndex, day);
      return {
        dateISO: date.toISOString().split('T')[0],
        dateLabel: `${day} ${MONTHS[monthIndex].label} ${year}`,
        year,
        month: monthIndex + 1,
        monthLabel: MONTHS[monthIndex].label,
      };
    }
  }

  // Pattern 2: "15/01/2024" ou "01/15/2024"
  const slashDateMatch = dateText.match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
  );
  if (slashDateMatch) {
    const part1 = parseInt(slashDateMatch[1]);
    const part2 = parseInt(slashDateMatch[2]);
    const year = parseInt(slashDateMatch[3]);

    // Déterminer si c'est DD/MM/YYYY ou MM/DD/YYYY
    let day, month;
    if (part1 > 12) {
      // DD/MM/YYYY
      day = part1;
      month = part2;
    } else if (part2 > 12) {
      // MM/DD/YYYY
      day = part2;
      month = part1;
    } else {
      // Ambigu, supposer DD/MM/YYYY (format français)
      day = part1;
      month = part2;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const monthIndex = month - 1;
      const date = new Date(year, monthIndex, day);
      return {
        dateISO: date.toISOString().split('T')[0],
        dateLabel: `${day} ${MONTHS[monthIndex].label} ${year}`,
        year,
        month: monthIndex + 1,
        monthLabel: MONTHS[monthIndex].label,
      };
    }
  }

  return null;
}

/**
 * Scrape l'hippodrome depuis la page individuelle d'une réunion
 * @param {string} reunionUrl - URL de la réunion
 * @param {Object} robotsRules - Règles robots.txt (optionnel)
 */
async function scrapeHippodromeFromReunionPage(reunionUrl, robotsRules = null) {
  if (!reunionUrl) return null;

  try {
    // Vérifier robots.txt si disponible
    if (robotsRules) {
      const allowed = isUrlAllowed(robotsRules, reunionUrl, '*');
      if (!allowed) {
        return null;
      }
    }

    // OPTIMISATION : Timeout réduit à 2 secondes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    let response;
    try {
      response = await fetch(reunionUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'PMU-Archives-Exporter/1.0 (Educational/Research Project; Contact: voir README)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Referer: 'https://www.turf-fr.com/',
        },
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return null; // Timeout silencieux
      }
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // PRIORITÉ 1 : Chercher dans le H1 (le plus fiable)
    const $h1 = $('h1');
    if ($h1.length > 0) {
      const h1Text = $h1.first().text();
      // Patterns pour extraire l'hippodrome depuis H1
      // Ex: "Partants PMU du lundi 01 janvier 2024 à VINCENNES"
      const h1Match = h1Text.match(
        /à\s+([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s\-]+?)(?:\s|$|,|\.)/i
      );
      if (h1Match) {
        const extracted = h1Match[1].trim();
        // Vérifier si c'est un hippodrome connu
        const knownHippodromes = [
          'VINCENNES',
          'CAGNES',
          'LONGCHAMP',
          'CHANTILLY',
          'DEAUVILLE',
          'AUTEUIL',
          'ENGHIEN',
          'PAU',
          'SAINT-MALO',
          'MONT-DE-MARSAN',
          'HYERES',
          'CABOURG',
          'CAGNES SUR MER',
          'GER-GELSENKIRCHEN',
          'GER-COLOGNE',
          'SPA-SON PARDO',
          'GB-GOODWOOD',
          'USA-MEADOWLANDS',
          'CHE AVENCHES',
        ];
        for (const h of knownHippodromes) {
          if (extracted.toUpperCase().includes(h)) {
            // Normaliser la casse
            if (h === 'CAGNES SUR MER') return 'Cagnes Sur Mer';
            if (h === 'SAINT-MALO') return 'Saint-Malo';
            if (h === 'MONT-DE-MARSAN') return 'Mont-de-Marsan';
            if (h === 'GER-GELSENKIRCHEN') return 'Ger-Gelsenkirchen';
            if (h === 'GER-COLOGNE') return 'Ger-Cologne';
            if (h === 'SPA-SON PARDO') return 'Spa-Son Pardo';
            if (h === 'GB-GOODWOOD') return 'GB-Goodwood';
            if (h === 'USA-MEADOWLANDS') return 'USA-Meadowlands';
            if (h === 'CHE AVENCHES') return 'Che Avenches';
            return h.charAt(0) + h.slice(1).toLowerCase();
          }
        }
        // Si pas dans la liste mais semble valide (plus de 3 caractères, pas de "prix")
        if (extracted.length > 3 && !extracted.toLowerCase().includes('prix')) {
          return extracted;
        }
      }
    }

    // PRIORITÉ 2 : Chercher dans le breadcrumb (très fiable pour les pages avec prix dans l'URL)
    const $breadcrumb = $('[aria-label*="breadcrumb"], nav[aria-label*="breadcrumb"], .breadcrumb, [class*="breadcrumb"]');
    if ($breadcrumb.length > 0) {
      const breadcrumbText = $breadcrumb.text();
      const breadcrumbLinks = $breadcrumb.find('a');
      
      // Hippodromes connus
      const knownHippodromes = [
        'Vincennes', 'Cagnes', 'Longchamp', 'Chantilly', 'Deauville',
        'Auteuil', 'Enghien', 'Pau', 'Saint-Malo', 'Mont-de-Marsan',
        'Hyères', 'Cabourg', 'Ger-Gelsenkirchen', 'Spa-Son Pardo',
        'GB-Goodwood', 'USA-Meadowlands', 'Che Avenches'
      ];
      
      // Chercher dans les liens du breadcrumb (souvent l'hippodrome est un lien)
      let foundHippo = null;
      breadcrumbLinks.each((i, elem) => {
        if (foundHippo) return false; // Sortir de la boucle si déjà trouvé
        const $link = $(elem);
        const linkText = $link.text().trim();
        const href = $link.attr('href') || '';
        
        for (const h of knownHippodromes) {
          if (linkText === h || linkText.includes(h)) {
            foundHippo = h;
            return false; // Sortir de la boucle each
          }
        }
        
        // Si le lien contient un hippodrome dans l'URL (ex: /r1-vincennes-)
        const urlHippoMatch = href.match(/r\d+[\-_]([^\/\-]+)/i);
        if (urlHippoMatch) {
          const urlHippo = urlHippoMatch[1];
          for (const h of knownHippodromes) {
            if (urlHippo.toLowerCase().includes(h.toLowerCase().replace(/\s+/g, '-'))) {
              foundHippo = h;
              return false; // Sortir de la boucle each
            }
          }
        }
      });
      
      if (foundHippo) {
        return foundHippo;
      }
      
      // Chercher dans le texte du breadcrumb
      const hippodromes = [
        { pattern: /cagnes\s+sur\s+mer/i, name: 'Cagnes Sur Mer' },
        { pattern: /vincennes/i, name: 'Vincennes' },
        { pattern: /longchamp/i, name: 'Longchamp' },
        { pattern: /chantilly/i, name: 'Chantilly' },
        { pattern: /deauville/i, name: 'Deauville' },
        { pattern: /auteuil/i, name: 'Auteuil' },
        { pattern: /enghien/i, name: 'Enghien' },
        { pattern: /pau/i, name: 'Pau' },
        { pattern: /ger[-\s]?gelsenkirchen/i, name: 'Ger-Gelsenkirchen' },
        { pattern: /spa[-\s]?son[-\s]?pardo/i, name: 'Spa-Son Pardo' },
        { pattern: /saint[-\s]?malo/i, name: 'Saint-Malo' },
        { pattern: /mont[-\s]?de[-\s]?marsan/i, name: 'Mont-de-Marsan' },
        { pattern: /hyeres/i, name: 'Hyères' },
        { pattern: /cabourg/i, name: 'Cabourg' },
      ];
      
      for (const h of hippodromes) {
        if (h.pattern.test(breadcrumbText)) {
          return h.name;
        }
      }
    }

    // PRIORITÉ 3 : Chercher dans le title
    const $title = $('title');
    if ($title.length > 0) {
      const titleText = $title.text();
      // Ex: "Réunion PMU Vincennes 2024"
      const titleMatch = titleText.match(
        /PMU\s+([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s\-]+?)(?:\s+\d{4}|$)/i
      );
      if (titleMatch) {
        const extracted = titleMatch[1].trim();
        if (extracted.length > 3 && !extracted.toLowerCase().includes('prix')) {
          return extracted;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Scrape la date depuis la page individuelle d'une réunion
 * @param {string} reunionUrl - URL de la réunion
 * @param {Object} robotsRules - Règles robots.txt (optionnel)
 */
async function scrapeDateFromReunionPage(reunionUrl, robotsRules = null) {
  if (!reunionUrl) return null;

  try {
    // Vérifier robots.txt si disponible
    if (robotsRules) {
      const allowed = isUrlAllowed(robotsRules, reunionUrl, '*');
      if (!allowed) {
        return null;
      }
    }

    // OPTIMISATION : Timeout réduit à 2 secondes pour éviter les timeouts globaux
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    let response;
    try {
      response = await fetch(reunionUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'PMU-Archives-Exporter/1.0 (Educational/Research Project; Contact: voir README)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Referer: 'https://www.turf-fr.com/',
        },
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return null; // Timeout silencieux
      }
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Chercher la date dans différents endroits de la page
    // OPTIMISATION : Prioriser les éléments les plus fiables (H1, title) pour éviter les dates incorrectes
    let dateText = '';
    const datePatterns = [
      /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    ];

    // PRIORITÉ 1 : Chercher dans le H1 (le plus fiable, contient généralement la date de la réunion)
    const $h1 = $('h1');
    if ($h1.length > 0) {
      const h1Text = $h1.first().text();
      for (const pattern of datePatterns) {
        const match = h1Text.match(pattern);
        if (match) {
          dateText = match[0];
          break;
        }
      }
    }

    // PRIORITÉ 2 : Chercher dans le titre de la page
    if (!dateText) {
      const $title = $('title');
      if ($title.length > 0) {
        const titleText = $title.text();
        for (const pattern of datePatterns) {
          const match = titleText.match(pattern);
          if (match) {
            dateText = match[0];
            break;
          }
        }
      }
    }

    // PRIORITÉ 3 : Chercher dans les éléments avec classe/ID contenant "date" (mais filtrer les dates récentes)
    // Éviter les dates trop anciennes (avant 2020) qui peuvent être dans des widgets
    if (!dateText) {
      const dateSelectors = [
        '[class*="date"]',
        '[id*="date"]',
        '.date',
        '#date',
        '[class*="jour"]',
        '[id*="jour"]',
      ];

      for (const selector of dateSelectors) {
        const $elements = $(selector);
        $elements.each((i, elem) => {
          if (dateText) return false;
          const $elem = $(elem);
          const text = $elem.text();

          for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
              // Vérifier que la date est récente (après 2020) pour éviter les dates de widgets
              const yearMatch = match[0].match(/(\d{4})/);
              if (yearMatch) {
                const year = parseInt(yearMatch[1]);
                if (year >= 2020 && year <= 2025) {
                  dateText = match[0];
                  return false;
                }
              }
            }
          }
        });
        if (dateText) break;
      }
    }

    // PRIORITÉ 4 : Chercher dans le body (en dernier recours)
    if (!dateText) {
      const bodyText = $('body').text();
      // Chercher toutes les dates et prendre la plus récente
      const allDates = [];
      for (const pattern of datePatterns) {
        const matches = bodyText.match(new RegExp(pattern.source, 'gi'));
        if (matches) {
          matches.forEach((match) => {
            const yearMatch = match.match(/(\d{4})/);
            if (yearMatch) {
              const year = parseInt(yearMatch[1]);
              if (year >= 2020 && year <= 2025) {
                allDates.push({ text: match, year });
              }
            }
          });
        }
      }
      // Prendre la date la plus récente
      if (allDates.length > 0) {
        allDates.sort((a, b) => b.year - a.year);
        dateText = allDates[0].text;
      }
    }

    // Parser la date trouvée
    if (dateText) {
      const parsedDate = parseDate(dateText);
      // VALIDATION : Vérifier que la date est raisonnable (entre 2020 et 2025)
      // pour éviter les dates de widgets ou d'anciennes pages
      if (parsedDate) {
        const year = parsedDate.year;
        if (year >= 2020 && year <= 2025) {
          return parsedDate;
        } else {
          if (DEBUG) {
            console.log(
              `[Scraper] Date rejetée (hors plage 2020-2025): ${dateText} (année: ${year})`
            );
          }
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Scrape une page d'archives pour un mois donné
 * @param {string} year - Année
 * @param {string} monthSlug - Slug du mois
 * @param {Object} robotsRules - Règles robots.txt (optionnel)
 */
async function scrapeMonthPage(year, monthSlug, robotsRules = null) {
  const url = `https://www.turf-fr.com/archives/courses-pmu/${year}/${monthSlug}`;
  if (DEBUG) console.log(`[Scraper] Scraping: ${url}`);

  // Vérifier robots.txt si disponible
  if (robotsRules) {
    const allowed = isUrlAllowed(robotsRules, url, '*');
    if (!allowed) {
      if (DEBUG) console.warn(`[Scraper] URL interdite par robots.txt: ${url}`);
      return [];
    }
  }

  // Vérifier que fetch est disponible
  if (typeof fetch === 'undefined') {
    throw new Error(
      'fetch is not available. Node.js version must be >= 18.0.0'
    );
  }

  // CORRECTION : Déclarer datesScrapedFromPages et MAX_DATES_FROM_PAGES au début de la fonction
  // OPTIMISATION ULTIME : Réduire drastiquement pour éviter timeout (5 * 2s = 10s max)
  const MAX_DATES_FROM_PAGES = 5; // Limite réduite pour éviter timeout
  let datesScrapedFromPages = 0; // Compteur pour limiter le scraping depuis pages individuelles

  // OPTIMISATION ULTIME : Réduire drastiquement pour éviter timeout (5 * 2s = 10s max)
  const MAX_HIPPODROMES_FROM_PAGES = 5; // Limite réduite pour éviter timeout
  let hippodromesScrapedFromPages = 0; // Compteur pour limiter le scraping depuis pages individuelles

  try {
    // OPTIMISATION TIMEOUT : Timeout de 10 secondes pour la page d'archives (au lieu de pas de timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes max

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'PMU-Archives-Exporter/1.0 (Educational/Research Project; Contact: voir README)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Referer: 'https://www.turf-fr.com/',
        },
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`[Scraper] Timeout (10s) pour ${url}`);
        throw new Error(
          `Timeout lors du chargement de la page d'archives: ${url}`
        );
      }
      throw error;
    }

    if (!response.ok) {
      console.error(`[Scraper] HTTP ${response.status} pour ${url}`);
      throw new Error(`HTTP ${response.status} pour ${url}`);
    }

    let html = await response.text();
    
    // DÉTECTION MAINTENANCE : Vérifier si le site est en maintenance
    const maintenancePatterns = [
      /EN MAINTENANCE/i,
      /maintenance/i,
      /site.*maintenance/i,
      /sera.*disponible.*quelques.*minutes/i,
    ];
    
    let isMaintenance = maintenancePatterns.some(pattern => pattern.test(html));
    if (isMaintenance) {
      console.warn(`[Scraper] ⚠️ Site en maintenance détecté pour ${url}, retry dans 30s...`);
      await sleep(30000); // Attendre 30 secondes
      
      // Retry une fois
      try {
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 10000);
        const retryResponse = await fetch(url, {
          signal: retryController.signal,
          headers: {
            'User-Agent':
              'PMU-Archives-Exporter/1.0 (Educational/Research Project; Contact: voir README)',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            Referer: 'https://www.turf-fr.com/',
          },
        });
        clearTimeout(retryTimeoutId);
        
        if (retryResponse.ok) {
          html = await retryResponse.text();
          isMaintenance = maintenancePatterns.some(pattern => pattern.test(html));
          if (isMaintenance) {
            console.error(`[Scraper] ❌ Site toujours en maintenance après retry pour ${url}`);
            throw new Error(`Site en maintenance pour ${url}`);
          }
          console.log(`[Scraper] ✅ Site disponible après retry, longueur HTML: ${html.length} caractères`);
        } else {
          throw new Error(`HTTP ${retryResponse.status} après retry pour ${url}`);
        }
      } catch (retryError) {
        console.error(`[Scraper] ❌ Erreur lors du retry pour ${url}: ${retryError.message}`);
        throw new Error(`Site en maintenance ou erreur réseau pour ${url}`);
      }
    }
    
    const $ = cheerio.load(html);
    const reunions = [];

    if (DEBUG) console.log(`[Scraper] HTML reçu, longueur: ${html.length} caractères`);

    // Méthode 1 : Chercher les liens vers les réunions
    // Patterns détectés : /courses-pmu/arrivees-rapports/r1-... ou /partants-programmes/r1-...
    // CORRECTION : Accepter aussi les URLs complètes (https://www.turf-fr.com/...)
    const reunionUrlPatterns = [
      /\/courses-pmu\/(arrivees-rapports|partants|pronostics)\/r\d+/i,
      /\/partants-programmes\/r\d+/i,
      /\/courses-pmu\/.*\/r\d+/i,
      /(?:https?:\/\/)?(?:www\.)?turf-fr\.com\/partants-programmes\/r\d+/i,
      /(?:https?:\/\/)?(?:www\.)?turf-fr\.com\/courses-pmu\/.*\/r\d+/i,
    ];

    // Chercher aussi dans les éléments avec classes pertinentes
    const $reunionContainers = $(
      '.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, [class*="reunion"], [class*="archive"]'
    );

    // DEBUG : Vérifier si les conteneurs existent
    if (DEBUG) {
      console.log(
        `[Scraper] DEBUG: Conteneurs trouvés: ${$reunionContainers.length}`
      );

      // DEBUG : Vérifier si les liens existent
      const allLinksForDebug = $('a').toArray();
      console.log(
        `[Scraper] DEBUG: Total liens sur la page: ${allLinksForDebug.length}`
      );

      // DEBUG : Vérifier les patterns
      let patternMatches = 0;
      for (const elem of allLinksForDebug) {
        const $link = $(elem);
        const href = $link.attr('href');
        if (href) {
          const isReunionUrl = reunionUrlPatterns.some((pattern) =>
            pattern.test(href)
          );
          if (isReunionUrl) {
            patternMatches++;
            if (patternMatches <= 3) {
              console.log(
                `[Scraper] DEBUG: Lien matché ${patternMatches}: ${href}`
              );
            }
          }
        }
      }
      console.log(
        `[Scraper] DEBUG: Liens matchant les patterns: ${patternMatches}`
      );
    }

    let foundLinks = 0;
    const processedUrls = new Set(); // Pour éviter les doublons

    // Méthode 1a : Chercher dans les conteneurs de réunions
    // CORRECTION : Convertir en boucle for pour supporter await
    const links = $reunionContainers.find('a').toArray();
    for (const elem of links) {
      const $link = $(elem);
      const linkText = $link.text().trim();
      const href = $link.attr('href');

      if (!href || processedUrls.has(href)) continue;

      // Vérifier si l'URL correspond à un pattern de réunion
      const isReunionUrl = reunionUrlPatterns.some((pattern) =>
        pattern.test(href)
      );

      // Vérifier si le texte contient un pattern de réunion (R1, R2, etc.)
      // CORRECTION : Ajouter "VOIR CETTE REUNION" qui est le texte standard des liens
      const hasReunionPattern =
        /R\d+/i.test(linkText) ||
        /réunion\s*\d+/i.test(linkText) ||
        /voir\s+cette\s+réunion/i.test(linkText);

      if (isReunionUrl || hasReunionPattern) {
        processedUrls.add(href);

        // Extraire les infos depuis l'URL ou le texte
        const urlMatch = href.match(/r(\d+)[\-_]([^\/\-]+)/i);
        const textMatch =
          linkText.match(/R(\d+)[\s\-]+(.+)/i) ||
          linkText.match(/(.+)[\s\-]+R(\d+)/i);

        // CORRECTION : Accepter aussi si l'URL correspond au pattern même sans textMatch
        // (pour les liens "VOIR CETTE REUNION" qui n'ont pas de pattern dans le texte)
        if (urlMatch || textMatch || isReunionUrl) {
          foundLinks++;
          const reunionNumber = urlMatch
            ? urlMatch[1]
            : textMatch
              ? textMatch[1] || textMatch[2]
              : isReunionUrl
                ? href.match(/r(\d+)[\-_]/i)?.[1] || '1'
                : '1';
          const hippodromeFromUrl = urlMatch
            ? urlMatch[2].replace(/[-_]/g, ' ')
            : '';
          const hippodromeFromText = textMatch
            ? (textMatch[2] || textMatch[1]).trim()
            : '';

          // AMÉLIORATION : Améliorer l'extraction de l'hippodrome depuis l'URL
          let hippodrome = hippodromeFromText || hippodromeFromUrl;

          const fullUrl = href.startsWith('http')
            ? href
            : `https://www.turf-fr.com${href}`;

          // Si on a un hippodrome depuis l'URL mais qu'il est incomplet, essayer de l'améliorer
          if ((!hippodrome || hippodrome.length < 10) && hippodromeFromUrl) {
            // Chercher dans le contexte de la page pour compléter
            const $container = $link.closest(
              '.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, div, article, section'
            );
            const containerText = $container.text();

            // Hippodromes connus avec variations
            const hippodromes = [
              { pattern: /cagnes\s+sur\s+mer/i, name: 'Cagnes Sur Mer' },
              { pattern: /vincennes/i, name: 'Vincennes' },
              { pattern: /longchamp/i, name: 'Longchamp' },
              { pattern: /chantilly/i, name: 'Chantilly' },
              { pattern: /deauville/i, name: 'Deauville' },
              { pattern: /auteuil/i, name: 'Auteuil' },
              { pattern: /enghien/i, name: 'Enghien' },
              { pattern: /pau/i, name: 'Pau' },
              { pattern: /saint[-\s]?malo/i, name: 'Saint-Malo' },
              { pattern: /mont[-\s]?de[-\s]?marsan/i, name: 'Mont-de-Marsan' },
              { pattern: /ger[-\s]?gelsenkirchen/i, name: 'Ger-Gelsenkirchen' },
              { pattern: /spa[-\s]?son[-\s]?pardo/i, name: 'Spa-Son Pardo' },
            ];

            for (const h of hippodromes) {
              if (h.pattern.test(containerText)) {
                hippodrome = h.name;
                break;
              }
            }
          }

          // AMÉLIORATION : Si toujours pas trouvé et que l'URL contient un prix,
          // essayer de scraper l'hippodrome depuis la page individuelle
          // OPTIMISATION : Limiter le nombre de requêtes pour éviter les timeouts
          if (
            (!hippodrome || hippodrome.length < 2) &&
            fullUrl &&
            hippodromesScrapedFromPages < MAX_HIPPODROMES_FROM_PAGES
          ) {
            // Vérifier si l'URL contient un prix (indique que l'hippodrome n'est pas dans l'URL)
            const hasPriceInUrl = /prix[-\s]/i.test(href);
            if (hasPriceInUrl) {
              hippodromesScrapedFromPages++;
              try {
                const hippoFromPage = await scrapeHippodromeFromReunionPage(
                  fullUrl,
                  robotsRules
                );
                if (hippoFromPage) {
                  hippodrome = hippoFromPage;
                  console.log(
                    `[Scraper] Hippodrome trouvé sur page individuelle pour ${fullUrl}: ${hippodrome}`
                  );
                }
              } catch (error) {
                // Erreur silencieuse
              }
            }
          }

          // Si toujours pas trouvé, utiliser "Inconnu" mais avec un log
          if (!hippodrome || hippodrome.length < 2) {
            console.log(
              `[Scraper] Hippodrome non trouvé pour ${fullUrl}, URL: "${hippodromeFromUrl}", Texte: "${hippodromeFromText}"`
            );
            hippodrome = 'Inconnu';
          }

          // AMÉLIORATION : Chercher la date dans une zone plus large
          // 1. Chercher dans le conteneur parent
          const $container = $link.closest(
            '.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, div, article, section'
          );
          let containerText = $container.text();

          // 2. Chercher aussi dans les éléments parents et frères
          const $parent = $link.parent();
          const $siblings = $parent.siblings();
          const nearbyText =
            $parent.text() + ' ' + $siblings.text() + ' ' + containerText;

          // 3. Chercher dans toute la section de la page (plus large)
          const $section = $container.closest(
            'section, article, .archive-section, .month-section'
          );
          const sectionText = $section.length > 0 ? $section.text() : '';

          let dateText = '';
          const datePatterns = [
            /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
            /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
          ];

          // Chercher dans le texte proche d'abord, puis dans le conteneur, puis dans la section
          for (const text of [nearbyText, containerText, sectionText]) {
            for (const pattern of datePatterns) {
              const match = text.match(pattern);
              if (match) {
                dateText = match[0];
                break;
              }
            }
            if (dateText) break;
          }

          let dateInfo = parseDate(dateText);

          // CORRECTION : Si la date n'est pas trouvée sur la page d'archives,
          // essayer de la scraper depuis la page individuelle de la réunion
          // OPTIMISATION : Limiter le nombre de requêtes pour éviter les timeouts
          if (!dateInfo && datesScrapedFromPages < MAX_DATES_FROM_PAGES) {
            console.log(
              `[Scraper] Date non trouvée sur page archives pour ${fullUrl}, tentative depuis page individuelle...`
            );
            datesScrapedFromPages++;
            try {
              const dateFromPage = await scrapeDateFromReunionPage(
                fullUrl,
                robotsRules
              );
              if (dateFromPage) {
                // VALIDATION : Vérifier que la date correspond à l'année et au mois attendus
                const expectedYear = parseInt(year);
                const monthIndex = MONTHS.findIndex(
                  (m) => m.slug === monthSlug
                );
                const expectedMonth = monthIndex !== -1 ? monthIndex + 1 : null;

                if (
                  dateFromPage.year === expectedYear &&
                  dateFromPage.month === expectedMonth
                ) {
                  dateInfo = dateFromPage;
                  console.log(
                    `[Scraper] Date trouvée sur page individuelle: ${dateInfo.dateISO}`
                  );
                } else {
                  console.log(
                    `[Scraper] Date rejetée (ne correspond pas à ${year}/${monthSlug}): ${dateFromPage.dateISO}`
                  );
                }
              }
            } catch (error) {
              console.log(
                `[Scraper] Erreur lors du scraping de la date depuis ${fullUrl}: ${error.message}`
              );
            }
          } else if (
            !dateInfo &&
            datesScrapedFromPages >= MAX_DATES_FROM_PAGES
          ) {
            console.log(
              `[Scraper] Limite atteinte (${MAX_DATES_FROM_PAGES}) pour scraping dates depuis pages individuelles`
            );
          }

          if (!dateInfo) {
            // Utiliser le premier jour du mois comme fallback UNIQUEMENT si vraiment pas trouvé
            const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);
            if (monthIndex !== -1) {
              dateInfo = {
                dateISO: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
                dateLabel: `1 ${MONTHS[monthIndex].label} ${year}`,
                year: parseInt(year),
                month: monthIndex + 1,
                monthLabel: MONTHS[monthIndex].label,
              };
              console.log(
                `[Scraper] Utilisation du fallback (1er jour du mois) pour ${fullUrl}`
              );
            }
          }

          // CORRECTION : Toujours ajouter la réunion même si dateInfo est null
          // (le fallback devrait toujours créer une dateInfo, mais on s'assure)
          if (!dateInfo) {
            // Fallback absolu si vraiment aucune date n'a pu être déterminée
            const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);
            if (monthIndex !== -1) {
              dateInfo = {
                dateISO: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
                dateLabel: `1 ${MONTHS[monthIndex].label} ${year}`,
                year: parseInt(year),
                month: monthIndex + 1,
                monthLabel: MONTHS[monthIndex].label,
              };
            }
          }

          // Maintenant dateInfo devrait toujours exister
          if (dateInfo) {
            const countryCode = normalizeCountryCode(hippodrome);
            const id = generateId(dateInfo.dateISO, hippodrome, reunionNumber);

            reunions.push({
              id,
              dateISO: dateInfo.dateISO,
              dateLabel: dateInfo.dateLabel,
              year: dateInfo.year,
              month: dateInfo.month,
              monthLabel: dateInfo.monthLabel,
              hippodrome: hippodrome,
              reunionNumber: reunionNumber,
              countryCode,
              url: fullUrl,
              source: 'turf-fr',
            });
          } else {
            // Log d'erreur si vraiment aucune date n'a pu être déterminée
            console.error(
              `[Scraper] ERREUR: Impossible de déterminer la date pour ${fullUrl}, réunion non ajoutée`
            );
          }
        }
      }
    }

    // Méthode 1b : Chercher tous les liens avec patterns d'URL de réunion
    // CORRECTION : Convertir en boucle for pour supporter await
    const allLinks = $('a').toArray();
    for (const elem of allLinks) {
      const $link = $(elem);
      const linkText = $link.text().trim();
      const href = $link.attr('href');

      if (!href || processedUrls.has(href)) continue;

      // Vérifier si l'URL correspond à un pattern de réunion
      const isReunionUrl = reunionUrlPatterns.some((pattern) =>
        pattern.test(href)
      );

      if (isReunionUrl) {
        processedUrls.add(href);
        foundLinks++;

        // Extraire le numéro de réunion depuis l'URL (format: r1-, r2-, etc.)
        const urlReunionMatch = href.match(/r(\d+)[\-_]/i);
        const reunionNumber = urlReunionMatch ? urlReunionMatch[1] : '1';

        // Extraire l'hippodrome depuis l'URL ou le texte
        let hippodrome = '';

        // Pattern 1: Extraire depuis l'URL
        // Exemples:
        // - r1-vincennes-36237 → "Vincennes"
        // - r2-cagnes-sur-mer-36234 → "Cagnes Sur Mer"
        // - r3-ger-gelsenkirchen-36245 → "Ger-Gelsenkirchen"
        // Regex améliorée : capturer jusqu'au numéro final (s'il existe)
        const urlHippoMatch = href.match(
          /r\d+[\-_]([^\/\-]+(?:-[^\/\-]+)*?)(?:-\d+)?$/i
        );
        if (urlHippoMatch) {
          let extracted = urlHippoMatch[1];
          // Nettoyer : enlever les mots de prix à la fin si présents
          const priceWords = ['prix', 'de', 'la', 'le', 'du', 'des'];
          let words = extracted.split('-');
          // Si le dernier mot est un mot de prix, l'enlever
          while (
            words.length > 0 &&
            priceWords.includes(words[words.length - 1].toLowerCase())
          ) {
            words.pop();
          }
          extracted = words.join('-');
          const ignoredWords = [
            'prix',
            'de',
            'la',
            'le',
            'du',
            'des',
            'partants',
            'arrivees',
            'rapports',
            'pronostics',
            'programmes',
          ];
          words = extracted.split(/[-_]/);

          // Vérifier si c'est un hippodrome connu (pas un prix)
          const knownHippodromes = {
            vincennes: 'Vincennes',
            cagnes: 'Cagnes',
            'cagnes-sur-mer': 'Cagnes Sur Mer',
            'cagnes-sur': 'Cagnes Sur Mer',
            longchamp: 'Longchamp',
            chantilly: 'Chantilly',
            deauville: 'Deauville',
            auteuil: 'Auteuil',
            enghien: 'Enghien',
            pau: 'Pau',
            ger: 'Ger',
            'ger-gelsenkirchen': 'Ger-Gelsenkirchen',
            'ger-cologne': 'Ger-Cologne',
            spa: 'Spa',
            'spa-son-pardo': 'Spa-Son Pardo',
            'spa-son': 'Spa-Son Pardo',
            'saint-malo': 'Saint-Malo',
            saint: 'Saint-Malo', // Fallback pour saint-malo
            'mont-de-marsan': 'Mont-de-Marsan',
            mont: 'Mont-de-Marsan', // Fallback pour mont-de-marsan
            'che-avenches': 'Che Avenches',
            che: 'Che Avenches', // Fallback pour che-avenches
            'gb-goodwood': 'GB-Goodwood',
            gb: 'GB-Goodwood', // Fallback pour gb-goodwood
            'usa-meadowlands': 'USA-Meadowlands',
            usa: 'USA-Meadowlands', // Fallback pour usa-meadowlands
            hyeres: 'Hyères',
            cabourg: 'Cabourg',
          };

          const extractedLower = extracted.toLowerCase();

          // Vérifier d'abord les cas spéciaux (plus spécifiques)
          if (extractedLower.startsWith('cagnes-sur')) {
            hippodrome = 'Cagnes Sur Mer';
          } else if (extractedLower.startsWith('spa-son')) {
            hippodrome = 'Spa-Son Pardo';
          } else if (extractedLower.startsWith('ger-gelsenkirchen')) {
            hippodrome = 'Ger-Gelsenkirchen';
          } else if (extractedLower.startsWith('ger-cologne')) {
            hippodrome = 'Ger-Cologne';
          } else if (extractedLower.startsWith('ger-')) {
            // Pour ger-*, prendre "Ger-" + le reste capitalisé
            const gerPart = extractedLower.replace(/^ger-/, '');
            hippodrome =
              'Ger-' +
              gerPart
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join('-');
          } else if (extractedLower.startsWith('gb-goodwood')) {
            hippodrome = 'GB-Goodwood';
          } else if (extractedLower.startsWith('gb-')) {
            // Pour gb-*, prendre "GB-" + le reste capitalisé
            const gbPart = extractedLower.replace(/^gb-/, '');
            hippodrome =
              'GB-' +
              gbPart
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join('-');
          } else if (extractedLower.startsWith('usa-meadowlands')) {
            hippodrome = 'USA-Meadowlands';
          } else if (extractedLower.startsWith('usa-')) {
            // Pour usa-*, prendre "USA-" + le reste capitalisé
            const usaPart = extractedLower.replace(/^usa-/, '');
            hippodrome =
              'USA-' +
              usaPart
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join('-');
          } else if (extractedLower.startsWith('saint-malo')) {
            hippodrome = 'Saint-Malo';
          } else if (extractedLower.startsWith('mont-de-marsan')) {
            hippodrome = 'Mont-de-Marsan';
          } else if (extractedLower.startsWith('che-avenches')) {
            hippodrome = 'Che Avenches';
          } else {
            // Chercher une correspondance exacte ou partielle (ordre important : plus spécifique d'abord)
            const sortedKeys = Object.keys(knownHippodromes).sort(
              (a, b) => b.length - a.length
            );
            for (const key of sortedKeys) {
              if (
                extractedLower === key ||
                extractedLower.startsWith(key + '-') ||
                extractedLower.includes('-' + key + '-') ||
                (key.includes('-') && extractedLower.includes(key))
              ) {
                hippodrome = knownHippodromes[key];
                break;
              }
            }
          }

          // CORRECTION : Si pas trouvé, prendre TOUS les mots (pas seulement le premier)
          // Exemple: "saint-malo" → "Saint Malo", "che-avenches" → "Che Avenches"
          if (
            !hippodrome &&
            words.length > 0 &&
            !ignoredWords.includes(words[0].toLowerCase())
          ) {
            // Filtrer les mots ignorés et les mots qui sont des numéros
            const validWords = words.filter(
              (w) => !ignoredWords.includes(w.toLowerCase()) && !/^\d+$/.test(w) // Exclure les numéros purs
            );

            if (validWords.length > 0) {
              // Prendre tous les mots valides (pas seulement 2)
              // Capitaliser chaque mot
              hippodrome = validWords
                .map((w) => {
                  // Gérer les cas spéciaux comme "de", "du", "sur" (minuscules au milieu)
                  const lower = w.toLowerCase();
                  if (
                    lower === 'de' ||
                    lower === 'du' ||
                    lower === 'sur' ||
                    lower === 'le' ||
                    lower === 'la'
                  ) {
                    return lower;
                  }
                  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
                })
                .join(' ');
            }
          }
        }

        // Pattern 2: Depuis le texte du lien (ex: "R1 - Vincennes" ou "R2 Cagnes Sur Mer")
        if (!hippodrome && linkText) {
          const textMatch =
            linkText.match(/R\d+[\s\-]+(.+?)(?:\s*[-–]|$)/i) ||
            linkText.match(/(.+?)[\s\-]+R\d+/i);
          if (textMatch) {
            const extracted = textMatch[1].trim();
            // Vérifier si c'est un hippodrome (pas un prix)
            const knownHippodromes = [
              'Vincennes',
              'Cagnes',
              'Longchamp',
              'Chantilly',
              'Deauville',
              'Auteuil',
              'Enghien',
              'Pau',
            ];
            for (const h of knownHippodromes) {
              if (extracted.includes(h)) {
                hippodrome = h;
                // Si "Cagnes Sur Mer", prendre tout
                if (
                  extracted.includes('Sur Mer') ||
                  extracted.includes('sur mer')
                ) {
                  hippodrome = 'Cagnes Sur Mer';
                }
                break;
              }
            }
            if (!hippodrome && extracted.length < 30) {
              // Si c'est court et ne contient pas "prix", c'est peut-être l'hippodrome
              if (!extracted.toLowerCase().includes('prix')) {
                hippodrome = extracted.split(/[\s\-]/)[0]; // Prendre le premier mot
              }
            }
          }
        }

        // Pattern 3: Depuis le breadcrumb ou le conteneur parent
        if (!hippodrome) {
          const $container = $link.closest(
            '.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, div, article, section'
          );
          const containerText = $container.text();

          // Chercher dans le breadcrumb
          const breadcrumb = $container
            .find('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]')
            .text();
          const searchText = breadcrumb || containerText;

          // Hippodromes connus avec variations
          const hippodromes = [
            { pattern: /cagnes\s+sur\s+mer/i, name: 'Cagnes Sur Mer' },
            { pattern: /vincennes/i, name: 'Vincennes' },
            { pattern: /longchamp/i, name: 'Longchamp' },
            { pattern: /chantilly/i, name: 'Chantilly' },
            { pattern: /deauville/i, name: 'Deauville' },
            { pattern: /auteuil/i, name: 'Auteuil' },
            { pattern: /enghien/i, name: 'Enghien' },
            { pattern: /pau/i, name: 'Pau' },
            { pattern: /ger[-\s]?gelsenkirchen/i, name: 'Ger-Gelsenkirchen' },
            { pattern: /spa[-\s]?son[-\s]?pardo/i, name: 'Spa-Son Pardo' },
          ];

          for (const h of hippodromes) {
            if (h.pattern.test(searchText)) {
              hippodrome = h.name;
              break;
            }
          }
        }

        const fullUrl = href.startsWith('http')
          ? href
          : `https://www.turf-fr.com${href}`;

        // AMÉLIORATION : Si toujours pas trouvé et que l'URL contient un prix,
        // essayer de scraper l'hippodrome depuis la page individuelle
        // OPTIMISATION : Limiter le nombre de requêtes pour éviter les timeouts
        if (
          (!hippodrome || hippodrome.length < 2) &&
          fullUrl &&
          hippodromesScrapedFromPages < MAX_HIPPODROMES_FROM_PAGES
        ) {
          // Vérifier si l'URL contient un prix (indique que l'hippodrome n'est pas dans l'URL)
          const hasPriceInUrl = /prix[-\s]/i.test(href);
          if (hasPriceInUrl) {
            hippodromesScrapedFromPages++;
            try {
              const hippoFromPage = await scrapeHippodromeFromReunionPage(
                fullUrl,
                robotsRules
              );
              if (hippoFromPage) {
                hippodrome = hippoFromPage;
                console.log(
                  `[Scraper] Hippodrome trouvé sur page individuelle pour ${fullUrl}: ${hippodrome}`
                );
              }
            } catch (error) {
              // Erreur silencieuse
            }
          }
        }

        if (!hippodrome || hippodrome.length < 2) {
          hippodrome = 'Inconnu';
          // Log pour debug des hippodromes inconnus
          if (href && !href.includes('prix')) {
            console.log(
              `[Scraper] ⚠️ Hippodrome 'Inconnu' pour ${fullUrl}, URL: ${href.substring(0, 100)}`
            );
          }
        }

        // Chercher la date dans le conteneur, le breadcrumb, ou le texte proche
        const $container = $link.closest(
          '.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, div, article, section'
        );
        let containerText = $container.text();

        // Chercher aussi dans les éléments parents et frères
        const $parent = $link.parent();
        const $siblings = $parent.siblings();
        const nearbyText =
          $parent.text() + ' ' + $siblings.text() + ' ' + containerText;

        let dateText = '';
        const datePatterns = [
          /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
          /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        ];

        // Chercher dans le texte proche d'abord, puis dans le conteneur
        for (const text of [nearbyText, containerText]) {
          for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
              dateText = match[0];
              break;
            }
          }
          if (dateText) break;
        }

        let dateInfo = parseDate(dateText);

        // CORRECTION : Si la date n'est pas trouvée sur la page d'archives,
        // essayer de la scraper depuis la page individuelle de la réunion
        // OPTIMISATION : Limiter le nombre de requêtes pour éviter les timeouts
        // VALIDATION : Vérifier que la date correspond à l'année et au mois attendus
        if (!dateInfo && datesScrapedFromPages < MAX_DATES_FROM_PAGES) {
          console.log(
            `[Scraper] Date non trouvée sur page archives pour ${fullUrl}, tentative depuis page individuelle...`
          );
          datesScrapedFromPages++;
          try {
            const dateFromPage = await scrapeDateFromReunionPage(
              fullUrl,
              robotsRules
            );
            if (dateFromPage) {
              // VALIDATION : Vérifier que la date correspond à l'année et au mois attendus
              const expectedYear = parseInt(year);
              const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);
              const expectedMonth = monthIndex !== -1 ? monthIndex + 1 : null;

              if (
                dateFromPage.year === expectedYear &&
                dateFromPage.month === expectedMonth
              ) {
                dateInfo = dateFromPage;
                console.log(
                  `[Scraper] Date trouvée sur page individuelle: ${dateInfo.dateISO}`
                );
              } else {
                console.log(
                  `[Scraper] Date rejetée (ne correspond pas à ${year}/${monthSlug}): ${dateFromPage.dateISO}`
                );
              }
            }
          } catch (error) {
            console.log(
              `[Scraper] Erreur lors du scraping de la date depuis ${fullUrl}: ${error.message}`
            );
          }
        } else if (!dateInfo && datesScrapedFromPages >= MAX_DATES_FROM_PAGES) {
          console.log(
            `[Scraper] Limite atteinte (${MAX_DATES_FROM_PAGES}) pour scraping dates depuis pages individuelles`
          );
        }

        if (!dateInfo) {
          // Fallback: utiliser le premier jour du mois UNIQUEMENT si vraiment pas trouvé
          const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);
          if (monthIndex !== -1) {
            dateInfo = {
              dateISO: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
              dateLabel: `1 ${MONTHS[monthIndex].label} ${year}`,
              year: parseInt(year),
              month: monthIndex + 1,
              monthLabel: MONTHS[monthIndex].label,
            };
            console.log(
              `[Scraper] Utilisation du fallback (1er jour du mois) pour ${fullUrl}`
            );
          }
        }

        // CORRECTION : Toujours ajouter la réunion même si dateInfo est null
        // (le fallback devrait toujours créer une dateInfo, mais on s'assure)
        if (!dateInfo) {
          // Fallback absolu si vraiment aucune date n'a pu être déterminée
          const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);
          if (monthIndex !== -1) {
            dateInfo = {
              dateISO: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
              dateLabel: `1 ${MONTHS[monthIndex].label} ${year}`,
              year: parseInt(year),
              month: monthIndex + 1,
              monthLabel: MONTHS[monthIndex].label,
            };
          }
        }

        // Maintenant dateInfo devrait toujours exister
        if (dateInfo) {
          const countryCode = normalizeCountryCode(hippodrome);
          const id = generateId(dateInfo.dateISO, hippodrome, reunionNumber);

          reunions.push({
            id,
            dateISO: dateInfo.dateISO,
            dateLabel: dateInfo.dateLabel,
            year: dateInfo.year,
            month: dateInfo.month,
            monthLabel: dateInfo.monthLabel,
            hippodrome: hippodrome,
            reunionNumber: reunionNumber,
            countryCode,
            url: fullUrl,
            source: 'turf-fr',
          });
        } else {
          // Log d'erreur si vraiment aucune date n'a pu être déterminée
          console.error(
            `[Scraper] ERREUR: Impossible de déterminer la date pour ${fullUrl}, réunion non ajoutée`
          );
        }
      }
    }

    console.log(
      `[Scraper] Trouvé ${foundLinks} liens, ${reunions.length} réunions extraites`
    );

    // Méthode 2 : Si aucune réunion trouvée, essayer une approche différente
    if (reunions.length === 0) {
      console.log(
        `[Scraper] ⚠️ Aucune réunion trouvée avec la méthode 1, essai méthode alternative...`
      );
      console.log(
        `[Scraper] DEBUG: Total liens sur la page: ${$('a').length}, Patterns matchés: ${foundLinks}`
      );

      // Log des premiers liens pour debug
      const firstLinks = $('a').slice(0, 10).toArray();
      console.log(`[Scraper] DEBUG: Premiers liens trouvés:`);
      firstLinks.forEach((link, i) => {
        const $link = $(link);
        const href = $link.attr('href');
        const text = $link.text().trim().substring(0, 50);
        console.log(`[Scraper] DEBUG: Lien ${i + 1}: ${href} | Texte: ${text}`);
      });

      // Chercher tous les liens qui pointent vers des réunions
      $('a[href*="reunion"], a[href*="course"], a[href*="programme"]').each(
        (i, elem) => {
          const $link = $(elem);
          const href = $link.attr('href');
          const linkText = $link.text().trim();

          if (href && (linkText.length > 0 || href.includes('reunion'))) {
            // Essayer d'extraire des infos depuis le texte du lien
            const reunionMatch = linkText.match(
              /([A-Za-zÀ-ÿ\s\-]+)\s*[-–]?\s*R[ée]union\s*(\d+)/i
            );
            if (reunionMatch) {
              const hippodrome = reunionMatch[1].trim();
              const reunionNumber = reunionMatch[2];
              const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);

              if (monthIndex !== -1) {
                const dateInfo = {
                  dateISO: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
                  dateLabel: `1 ${MONTHS[monthIndex].label} ${year}`,
                  year: parseInt(year),
                  month: monthIndex + 1,
                  monthLabel: MONTHS[monthIndex].label,
                };

                const countryCode = normalizeCountryCode(hippodrome);
                const id = generateId(
                  dateInfo.dateISO,
                  hippodrome,
                  reunionNumber
                );
                const fullUrl = href.startsWith('http')
                  ? href
                  : `https://www.turf-fr.com${href}`;

                reunions.push({
                  id,
                  dateISO: dateInfo.dateISO,
                  dateLabel: dateInfo.dateLabel,
                  year: dateInfo.year,
                  month: dateInfo.month,
                  monthLabel: dateInfo.monthLabel,
                  hippodrome,
                  reunionNumber,
                  countryCode,
                  url: fullUrl,
                  source: 'turf-fr',
                });
              }
            }
          }
        }
      );

      console.log(
        `[Scraper] Méthode alternative: ${reunions.length} réunions trouvées`
      );
    }

    return reunions;
  } catch (error) {
    console.error(
      `[Scraper] Erreur lors du scraping de ${url}:`,
      error.message
    );
    console.error(error.stack);
    return [];
  }
}

/**
 * Scrape les liens vers les pages individuelles de courses depuis une page de réunion
 * @param {string} reunionUrl - URL de la réunion
 * @param {Object} robotsRules - Règles robots.txt (optionnel)
 * @returns {Promise<string[]>} - Liste des URLs de courses individuelles
 */
async function scrapeIndividualCourseUrls(reunionUrl, robotsRules = null) {
  if (!reunionUrl) return [];

  try {
    // Vérifier robots.txt si disponible
    if (robotsRules) {
      const allowed = isUrlAllowed(robotsRules, reunionUrl, '*');
      if (!allowed) {
        return [];
      }
    }

    // Timeout de 2.5s pour les pages individuelles de courses (plus de temps pour charger)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    let response;
    try {
      response = await fetch(reunionUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'PMU-Archives-Exporter/1.0 (Educational/Research Project; Contact: voir README)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Referer: 'https://www.turf-fr.com/',
        },
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      return [];
    }

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const courseUrls = [];

    // Chercher les liens vers des courses individuelles
    // Patterns possibles: /course/c1-..., /courses-pmu/course/c1-..., etc.
    // AMÉLIORATION : Chercher aussi dans les onglets/tabs qui contiennent souvent les liens de courses
    const courseSelectors = [
      'a[href*="course"]',
      'a[href*="c1"]',
      'a[href*="c2"]',
      'a[href*="c3"]',
      'a[href*="c4"]',
      'a[href*="c5"]',
      'a[href*="c6"]',
      'a[href*="c7"]',
      'a[href*="c8"]',
      'a[href*="c9"]',
      'a[href*="c10"]',
      '[class*="course"] a',
      '[class*="tab"] a',
      '[id*="course"] a',
    ];
    
    for (const selector of courseSelectors) {
      $(selector).each((i, elem) => {
        const $link = $(elem);
        const href = $link.attr('href');
        if (href) {
          // Vérifier si c'est un lien vers une course individuelle (contient "c" suivi d'un chiffre)
          const courseMatch = href.match(/\/c(\d+)/i);
          if (courseMatch) {
            const fullUrl = href.startsWith('http')
              ? href
              : `https://www.turf-fr.com${href}`;
            if (!courseUrls.includes(fullUrl)) {
              courseUrls.push(fullUrl);
            }
          }
        }
      });
    }

    return courseUrls;
  } catch (error) {
    return [];
  }
}

/**
 * Vérifie si une page correspond à une réunion donnée
 * Compare l'hippodrome, la date et le numéro de réunion si disponibles
 * @param {Object} pageInfo - Informations extraites de la page : {hippodrome, dateISO, reunionNumber}
 * @param {Object} reunionInfo - Informations de la réunion attendue : {hippodrome, dateISO, reunionNumber}
 * @returns {boolean} - true si la page correspond à la réunion
 */
function verifyPageMatchesReunion(pageInfo, reunionInfo) {
  if (!pageInfo || !reunionInfo) return true; // Si pas d'info, on accepte (pas de vérification possible)

  // Vérifier l'hippodrome si disponible
  if (pageInfo.hippodrome && reunionInfo.hippodrome) {
    const pageHippo = pageInfo.hippodrome.toLowerCase().trim();
    const reunionHippo = reunionInfo.hippodrome.toLowerCase().trim();
    // Comparaison souple (partielle) pour gérer les variations
    if (!pageHippo.includes(reunionHippo) && !reunionHippo.includes(pageHippo)) {
      // Vérifier aussi avec des variations connues (ex: "Cagnes Sur Mer" vs "Cagnes")
      const knownVariations = {
        'cagnes sur mer': ['cagnes', 'cagnes-sur-mer'],
        'saint-malo': ['saint malo'],
        'mont-de-marsan': ['mont de marsan'],
      };
      
      let matches = false;
      for (const [key, variations] of Object.entries(knownVariations)) {
        if ((pageHippo.includes(key) || reunionHippo.includes(key)) &&
            (variations.some(v => pageHippo.includes(v)) || variations.some(v => reunionHippo.includes(v)))) {
          matches = true;
          break;
        }
      }
      
      if (!matches) {
        if (DEBUG) {
          console.log(
            `[Scraper] Hippodrome ne correspond pas: page="${pageInfo.hippodrome}" vs reunion="${reunionInfo.hippodrome}"`
          );
        }
        return false;
      }
    }
  }

  // Vérifier la date si disponible
  if (pageInfo.dateISO && reunionInfo.dateISO) {
    if (pageInfo.dateISO !== reunionInfo.dateISO) {
      if (DEBUG) {
        console.log(
          `[Scraper] Date ne correspond pas: page="${pageInfo.dateISO}" vs reunion="${reunionInfo.dateISO}"`
        );
      }
      return false;
    }
  }

  // Vérifier le numéro de réunion si disponible
  if (pageInfo.reunionNumber && reunionInfo.reunionNumber) {
    const pageNum = String(pageInfo.reunionNumber).trim();
    const reunionNum = String(reunionInfo.reunionNumber).trim();
    if (pageNum !== reunionNum) {
      if (DEBUG) {
        console.log(
          `[Scraper] Numéro de réunion ne correspond pas: page="${pageInfo.reunionNumber}" vs reunion="${reunionInfo.reunionNumber}"`
        );
      }
      return false;
    }
  }

  return true; // Toutes les vérifications passées (ou pas de données pour vérifier)
}

/**
 * Convertit une URL de réunion vers l'URL d'arrivées/rapports correspondante
 * Gère tous les patterns d'URL observés sur turf-fr.com
 * @param {string} reunionUrl - URL de la réunion à convertir
 * @returns {string[]} - Liste d'URLs d'arrivées possibles (en ordre de probabilité)
 */
function convertToArrivalUrl(reunionUrl) {
  if (!reunionUrl) return [];

  const arrivalUrls = [];
  
  // Normaliser l'URL (ajouter le domaine si manquant)
  let baseUrl = reunionUrl;
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://www.turf-fr.com${baseUrl.startsWith('/') ? '' : '/'}${baseUrl}`;
  }

  // Pattern 1: URLs avec /partants-programmes/ → /courses-pmu/arrivees-rapports/
  if (baseUrl.includes('/partants-programmes/')) {
    const arrivalUrl = baseUrl.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/');
    arrivalUrls.push(arrivalUrl);
  }

  // Pattern 2: URLs avec /partants/ → /courses-pmu/arrivees-rapports/
  if (baseUrl.includes('/partants/') && !baseUrl.includes('/arrivees-rapports/')) {
    const arrivalUrl = baseUrl.replace('/partants/', '/courses-pmu/arrivees-rapports/');
    arrivalUrls.push(arrivalUrl);
  }

  // Pattern 3: URLs avec /pronostics/ → /courses-pmu/arrivees-rapports/
  if (baseUrl.includes('/pronostics/')) {
    const arrivalUrl = baseUrl.replace('/pronostics/', '/courses-pmu/arrivees-rapports/');
    arrivalUrls.push(arrivalUrl);
  }

  // Pattern 4: URLs avec /courses-pmu/[type]/ → /courses-pmu/arrivees-rapports/
  // Capture les patterns comme /courses-pmu/partants/, /courses-pmu/programmes/, etc.
  if (baseUrl.includes('/courses-pmu/') && !baseUrl.includes('/arrivees-rapports/')) {
    // Extraire la partie après /courses-pmu/ jusqu'au prochain /
    const coursesPmuMatch = baseUrl.match(/\/courses-pmu\/([^\/]+)\/(.+)$/);
    if (coursesPmuMatch && coursesPmuMatch[1] !== 'arrivees-rapports') {
      const restOfPath = coursesPmuMatch[2];
      const arrivalUrl = baseUrl.replace(/\/courses-pmu\/[^\/]+\//, '/courses-pmu/arrivees-rapports/');
      arrivalUrls.push(arrivalUrl);
    }
  }

  // Pattern 5: URLs avec r[numero]-[hippodrome] ou similaires
  // Construire l'URL d'arrivées en conservant la structure
  const rMatch = baseUrl.match(/(\/r\d+[^\/]*)/i);
  if (rMatch && !baseUrl.includes('/arrivees-rapports/')) {
    // Si l'URL contient un pattern de réunion mais pas d'arrivées, construire l'URL
    // Exemple: /partants-programmes/r1-vincennes-123 → /courses-pmu/arrivees-rapports/r1-vincennes-123
    if (baseUrl.includes('turf-fr.com')) {
      const rPart = rMatch[1];
      const arrivalUrl = `https://www.turf-fr.com/courses-pmu/arrivees-rapports${rPart}`;
      if (!arrivalUrls.includes(arrivalUrl)) {
        arrivalUrls.push(arrivalUrl);
      }
    }
  }

  // Pattern 6: Si l'URL contient déjà /arrivees-rapports/, la retourner telle quelle
  if (baseUrl.includes('/arrivees-rapports/')) {
    if (!arrivalUrls.includes(baseUrl)) {
      arrivalUrls.unshift(baseUrl); // Priorité à l'URL exacte
    }
  }

  // Dédupliquer tout en préservant l'ordre
  const uniqueUrls = [];
  const seen = new Set();
  for (const url of arrivalUrls) {
    if (!seen.has(url)) {
      seen.add(url);
      uniqueUrls.push(url);
    }
  }

  return uniqueUrls;
}

/**
 * Scrape le rapport d'arrivée depuis une page de réunion
 * @param {string} reunionUrl - URL de la réunion
 * @param {Object} robotsRules - Règles robots.txt (optionnel)
 * @param {Object} reunionInfo - Informations de la réunion (optionnel) pour vérification : {hippodrome, dateISO, reunionNumber}
 */
async function scrapeArrivalReport(reunionUrl, robotsRules = null, reunionInfo = null) {
  if (!reunionUrl) return null;

  try {
    // NOUVELLE OPTIMISATION : Chercher d'abord les liens directs vers /arrivees-rapports/ sur la page de réunion
    // Ces liens sont souvent présents dans le breadcrumb ou dans les liens de navigation
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(reunionUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'PMU-Archives-Exporter/1.0 (Educational/Research Project; Contact: voir README)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Referer: 'https://www.turf-fr.com/',
        },
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // AMÉLIORATION : Chercher tous les liens vers /arrivees-rapports/ avec des sélecteurs plus larges
        const arrivalLinks = [];
        const linkPatterns = [
          // Sélecteurs directs pour les liens d'arrivées
          'a[href*="arrivees-rapports"]',
          'a[href*="arrivee"]',
          'a[href*="arrival"]',
          // Sélecteurs pour les liens dans les breadcrumbs
          '[class*="breadcrumb"] a[href*="arrivees"]',
          'nav a[href*="arrivees"]',
          // Sélecteurs pour les liens de navigation
          '[class*="nav"] a[href*="arrivees"]',
          '[class*="menu"] a[href*="arrivees"]',
          // Sélecteurs pour les onglets/tabs
          '[class*="tab"] a[href*="arrivees"]',
          '[role="tab"] a[href*="arrivees"]',
          // Liens avec texte contenant "arrivée", "rapports", "résultats"
          'a:contains("Arrivée")',
          'a:contains("arrivée")',
          'a:contains("Arrivées")',
          'a:contains("arrivées")',
          'a:contains("Rapports")',
          'a:contains("rapports")',
          'a:contains("Résultats")',
          'a:contains("résultats")',
        ];

        // Chercher avec les sélecteurs CSS standard
        for (const selector of linkPatterns.slice(0, 6)) {
          $(selector).each((i, elem) => {
            const $link = $(elem);
            const href = $link.attr('href');
            if (href && (href.includes('arrivees-rapports') || href.includes('arrivees') || href.includes('arrival'))) {
              const fullUrl = href.startsWith('http')
                ? href
                : `https://www.turf-fr.com${href.startsWith('/') ? '' : '/'}${href}`;
              if (!arrivalLinks.includes(fullUrl) && fullUrl.includes('arrivees-rapports')) {
                arrivalLinks.push(fullUrl);
              }
            }
          });
        }

        // Chercher aussi par texte des liens (pour les sélecteurs :contains qui ne fonctionnent pas avec cheerio)
        $('a').each((i, elem) => {
          const $link = $(elem);
          const href = $link.attr('href');
          const linkText = $link.text().toLowerCase().trim();
          
          // Vérifier si le texte du lien contient des mots-clés pertinents
          const keywords = ['arrivée', 'arrivées', 'rapports', 'résultats', 'arrivees'];
          const hasKeyword = keywords.some(keyword => linkText.includes(keyword));
          
          if (hasKeyword && href) {
            // Normaliser l'URL
            let fullUrl = href.startsWith('http')
              ? href
              : `https://www.turf-fr.com${href.startsWith('/') ? '' : '/'}${href}`;
            
            // Si l'URL ne contient pas déjà /arrivees-rapports/, essayer de la convertir
            if (!fullUrl.includes('/arrivees-rapports/') && fullUrl.includes('turf-fr.com')) {
              const convertedUrls = convertToArrivalUrl(fullUrl);
              convertedUrls.forEach(convertedUrl => {
                if (!arrivalLinks.includes(convertedUrl)) {
                  arrivalLinks.push(convertedUrl);
                }
              });
            } else if (fullUrl.includes('/arrivees-rapports/')) {
              if (!arrivalLinks.includes(fullUrl)) {
                arrivalLinks.push(fullUrl);
              }
            }
          }
        });
        
        // Tester les liens trouvés (limiter à 5 pour maximiser les chances)
        if (arrivalLinks.length > 0) {
          if (DEBUG) {
            console.log(
              `[Scraper] ${arrivalLinks.length} liens /arrivees-rapports/ trouvés sur ${reunionUrl}, test...`
            );
          }
          
          const arrivalPromises = arrivalLinks.slice(0, 5).map(arrivalUrl =>
            scrapeArrivalReportFromUrl(arrivalUrl, robotsRules)
          );
          const arrivalResults = await Promise.allSettled(arrivalPromises);
          
          for (const result of arrivalResults) {
            if (result.status === 'fulfilled' && result.value) {
              if (DEBUG) {
                console.log(
                  `[Scraper] Rapport trouvé via lien /arrivees-rapports/: ${result.value}`
                );
              }
              return result.value;
            }
          }
        }
      }
    } catch (error) {
      // Erreur silencieuse, continuer avec les autres méthodes
    }

    // NOUVELLE OPTIMISATION : Essayer d'abord de scraper les pages individuelles de courses
    // Certaines réunions ont des pages individuelles pour chaque course avec les rapports
    const individualCourseUrls = await scrapeIndividualCourseUrls(
      reunionUrl,
      robotsRules
    );
    
    if (individualCourseUrls.length > 0) {
      console.log(
        `[Scraper] ${individualCourseUrls.length} pages individuelles de courses trouvées pour ${reunionUrl}, scraping...`
      );
      
      // Scraper les rapports depuis les pages individuelles (limiter à 5 pour améliorer le taux de rapports)
      // Paralléliser les 5 premières pour gagner du temps
      const coursePromises = individualCourseUrls.slice(0, 5).map(courseUrl =>
        scrapeArrivalReportFromUrl(courseUrl, robotsRules)
      );
      const courseResults = await Promise.allSettled(coursePromises);
      
      for (const result of courseResults) {
        if (result.status === 'fulfilled' && result.value) {
          console.log(
            `[Scraper] Rapport trouvé sur page individuelle de course: ${result.value}`
          );
          return result.value;
        }
      }
    }

    // OPTIMISATION : Utiliser convertToArrivalUrl pour générer toutes les URLs possibles
    // et les essayer une par une jusqu'à trouver un rapport

    // Étape 1 : Générer toutes les URLs d'arrivées possibles à partir de l'URL de réunion
    const possibleArrivalUrls = convertToArrivalUrl(reunionUrl);
    
    // Ajouter aussi l'URL originale (elle peut contenir le rapport directement)
    if (!possibleArrivalUrls.includes(reunionUrl)) {
      possibleArrivalUrls.push(reunionUrl);
    }

    // Étape 2 : Essayer chaque URL possible jusqu'à trouver un rapport
    for (const arrivalUrl of possibleArrivalUrls) {
      const arrivalReport = await scrapeArrivalReportFromUrl(
        arrivalUrl,
        robotsRules
      );
      if (arrivalReport) {
        if (DEBUG) {
          console.log(
            `[Scraper] Rapport trouvé via URL convertie ${arrivalUrl}: ${arrivalReport}`
          );
        }
        return arrivalReport;
      }
    }

    // Si toujours pas trouvé, retourner null
    return null;
  } catch (error) {
    console.log(`[Scraper] Erreur pour ${reunionUrl}: ${error.message}`);
    return null;
  }
}

// Cache global pour les rapports d'arrivée (partagé entre les appels)
// Ce cache sera injecté depuis archives.js
let globalArrivalReportsCache = null;
let globalArrivalReportsCacheTTL = 24 * 60 * 60 * 1000;

/**
 * Définir le cache global pour les rapports d'arrivée
 * @param {Map} cache - Map pour le cache
 * @param {number} ttl - TTL en millisecondes
 */
export function setArrivalReportsCache(cache, ttl) {
  globalArrivalReportsCache = cache;
  globalArrivalReportsCacheTTL = ttl;
}

/**
 * Scrape le rapport d'arrivée depuis une URL spécifique
 * @param {string} url - URL à scraper
 * @param {Object} robotsRules - Règles robots.txt (optionnel)
 */
async function scrapeArrivalReportFromUrl(url, robotsRules = null) {
  if (!url) return null;

  // OPTIMISATION : Vérifier le cache avant de scraper
  if (globalArrivalReportsCache) {
    const cached = globalArrivalReportsCache.get(url);
    if (cached) {
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge < globalArrivalReportsCacheTTL) {
        console.log(`[Scraper] Cache hit pour ${url}`);
        return cached.report;
      } else {
        // Cache expiré, le supprimer
        globalArrivalReportsCache.delete(url);
      }
    }
  }

  // Vérifier robots.txt si disponible
  if (robotsRules) {
    const allowed = isUrlAllowed(robotsRules, url, '*');
    if (!allowed) {
      console.log(`[Scraper] URL interdite par robots.txt: ${url}`);
      return null;
    }
  }

  try {
    // OPTIMISATION : Timeout de 2 secondes par requête (compromis optimal entre performance et fiabilité)
    // Augmenté de 1.5s à 2s pour améliorer le taux de succès des requêtes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'PMU-Archives-Exporter/1.0 (Educational/Research Project; Contact: voir README)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Referer: 'https://www.turf-fr.com/',
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        // Timeout silencieux
        return null;
      }
      // Autre erreur réseau
      return null;
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 404 ou autre erreur HTTP
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Chercher le rapport d'arrivée dans différents formats possibles
    let arrivalReport = null;

    // PRIORITÉ 0 : Chercher dans les scripts JSON embarqués (les rapports peuvent être dans des données JS)
    // Les rapports sont parfois générés par JavaScript, chercher dans les scripts
    if (!arrivalReport) {
      const scripts = $('script').toArray();
      for (const script of scripts) {
        if (arrivalReport) break;
        const scriptContent = $(script).html() || '';

        // Chercher des patterns JSON avec des rapports d'arrivée
        // Pattern: "arrivee": "11-1-8-13-14" ou "arrival": "11-1-8-13-14" ou "resultat": "11-1-8-13-14"
        // AMÉLIORATION : Chercher aussi dans des structures JSON plus complexes (tableaux, objets imbriqués)
        const jsonPatterns = [
          /["']arriv[ée]e["']\s*:\s*["'](\d+(?:-\d+){2,})["']/i,
          /["']arrival["']\s*:\s*["'](\d+(?:-\d+){2,})["']/i,
          /["']resultat["']\s*:\s*["'](\d+(?:-\d+){2,})["']/i,
          /["']result["']\s*:\s*["'](\d+(?:-\d+){2,})["']/i,
          /arriv[ée]e[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i,
          // Patterns pour structures JSON complexes (tableaux)
          /\[(\d+(?:,\s*\d+){2,})\]/,
          // Patterns pour objets avec propriétés numériques
          /"(\d+)"\s*:\s*"(\d+)"\s*,\s*"(\d+)"\s*:\s*"(\d+)"/,
          // Patterns pour données sérialisées
          /arriv[ée]e[ée\s\n:]*\[(\d+(?:,\s*\d+){2,})\]/i,
          // NOUVEAUX PATTERNS : Chercher dans window.__INITIAL_STATE__ ou similaire
          /window\.__[A-Z_]+__\s*=\s*\{[^}]*arriv[ée]e[^}]*:["'](\d+(?:-\d+){2,})["']/i,
          // Pattern pour données React/Vue sérialisées
          /"arriv[ée]e":\s*\[(\d+(?:,\s*\d+){2,})\]/i,
          // Pattern pour résultats dans des objets imbriqués
          /"results?":\s*\{[^}]*"arriv[ée]e":\s*["'](\d+(?:-\d+){2,})["']/i,
        ];

        for (const pattern of jsonPatterns) {
          const match = scriptContent.match(pattern);
          if (match) {
            let candidate = match[1] || match[0];
            if (!candidate) continue;

            // Gérer les différents formats (tableaux JSON, chaînes, etc.)
            candidate = candidate
              .replace(/[\[\]"]/g, '') // Enlever les crochets et guillemets
              .replace(/,/g, '|') // Remplacer les virgules par séparateur
              .replace(/\s+/g, ' ')
              .replace(/\s*[-–]\s*/g, '|')
              .replace(/\s+/g, '|')
              .replace(/\|+/g, '|');

            const numbers = candidate
              .split('|')
              .map((n) => n.trim())
              .filter((n) => n.match(/^\d+$/));

            if (numbers.length >= 3) {
              const validNumbers = numbers.filter((n) => {
                const num = parseInt(n);
                return num >= 1 && num <= 30;
              });
              if (validNumbers.length >= 3) {
                arrivalReport = validNumbers.join('-');
                console.log(
                  `[Scraper] Rapport trouvé dans script JSON: ${arrivalReport}`
                );
                break;
              }
            }
          }
        }
      }
    }

    // PRIORITÉ 1 : Chercher dans l'élément spécifique #decompte_depart_course (le plus fiable)
    // OPTIMISATION : Early exit - arrêter dès qu'on trouve le rapport ici
    const $decompte = $('#decompte_depart_course');
    if ($decompte.length > 0 && !arrivalReport) {
      const decompteText = $decompte.text();
      // Pattern pour "Arrivée \n                    1 - 5 - 11 - 12 - 10" avec espaces multiples
      // Améliorer pour gérer les numéros sur plusieurs lignes
      // Pattern amélioré : accepter aussi les numéros séparés par des espaces uniquement
      const decompteMatch = decompteText.match(
        /arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i
      );
      if (decompteMatch) {
        let candidate = decompteMatch[1].trim();
        // CORRECTION : Extraire les numéros complets sans casser les nombres à plusieurs chiffres
        // Remplacer les tirets et espaces multiples par un séparateur unique, mais préserver les numéros
        // Exemple: "11 - 6 - 4" ne doit pas devenir "1-1-6-4"
        candidate = candidate
          .replace(/\s+/g, ' ') // Normaliser les espaces multiples
          .replace(/\s*[-–]\s*/g, '|') // Remplacer les tirets par un séparateur temporaire
          .replace(/\s+/g, '|') // Remplacer les espaces restants par le séparateur
          .replace(/\|+/g, '|'); // Normaliser les séparateurs multiples
        const numbers = candidate
          .split('|')
          .map((n) => n.trim())
          .filter((n) => n.match(/^\d+$/));
        if (numbers.length >= 3) {
          const validNumbers = numbers.filter((n) => {
            const num = parseInt(n);
            return num >= 1 && num <= 30;
          });
          if (validNumbers.length >= 3) {
            arrivalReport = validNumbers.join('-');
            // EARLY EXIT : On a trouvé le rapport, pas besoin de chercher ailleurs
            return arrivalReport;
          }
        }
      }
    }

    // PRIORITÉ 1b : Si #decompte_depart_course ne contient que "Arrivée" sans numéros,
    // chercher dans les éléments .title2 qui contiennent les rapports par course
    if (!arrivalReport) {
      const $title2 = $('.title2');
      $title2.each((i, elem) => {
        if (arrivalReport) return false;
        const $elem = $(elem);
        const text = $elem.text();
        // Chercher un pattern avec "Arrivée" suivi de numéros (peut être sur plusieurs lignes)
        const match = text.match(
          /arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i
        );
        if (match) {
          let candidate = match[1].trim();
          // CORRECTION : Extraire les numéros complets sans casser les nombres à plusieurs chiffres
          candidate = candidate
            .replace(/\s+/g, ' ')
            .replace(/\s*[-–]\s*/g, '|')
            .replace(/\s+/g, '|')
            .replace(/\|+/g, '|');
          const numbers = candidate
            .split('|')
            .map((n) => n.trim())
            .filter((n) => n.match(/^\d+$/));
          if (numbers.length >= 3) {
            const validNumbers = numbers.filter((n) => {
              const num = parseInt(n);
              return num >= 1 && num <= 30;
            });
            if (validNumbers.length >= 3) {
              arrivalReport = validNumbers.join('-');
              return false; // Prendre le premier rapport trouvé
            }
          }
        }
      });
    }

    // PRIORITÉ 1c : Chercher dans les tableaux de résultats (souvent les rapports sont dans des tableaux)
    if (!arrivalReport) {
      // Chercher dans les tableaux avec classes/id pertinents
      const tableSelectors = [
        'table[class*="arrivee"]',
        'table[class*="arrival"]',
        'table[class*="resultat"]',
        'table[class*="result"]',
        'table[id*="arrivee"]',
        'table[id*="arrival"]',
        '.table-arrivee',
        '.table-resultats',
        '[class*="table"]',
      ];

      for (const selector of tableSelectors) {
        if (arrivalReport) break;
        const $tables = $(selector);
        
        $tables.each((i, table) => {
          if (arrivalReport) return false;
          const $table = $(table);
          const tableText = $table.text();
          
          // Chercher "Arrivée" suivi de numéros dans le tableau
          const match = tableText.match(
            /arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i
          );
          
          if (match) {
            let candidate = match[1].trim();
            candidate = candidate
              .replace(/\s+/g, ' ')
              .replace(/\s*[-–]\s*/g, '|')
              .replace(/\s+/g, '|')
              .replace(/\|+/g, '|');
            const numbers = candidate
              .split('|')
              .map((n) => n.trim())
              .filter((n) => n.match(/^\d+$/));
            if (numbers.length >= 3) {
              const validNumbers = numbers.filter((n) => {
                const num = parseInt(n);
                return num >= 1 && num <= 30;
              });
              if (validNumbers.length >= 3) {
                arrivalReport = validNumbers.join('-');
                return false; // Break de la boucle each
              }
            }
          }
        });
      }
    }

    // PRIORITÉ 2 : Chercher dans tout le body pour des séquences de numéros après "Arrivée"
    // Cette méthode capture les rapports même s'ils sont sur plusieurs lignes
    if (!arrivalReport) {
      const pageText = $('body').text();
      // Chercher "Arrivée" suivi de numéros (peut être sur plusieurs lignes avec beaucoup d'espaces)
      // Pattern amélioré pour capturer même avec beaucoup d'espaces et retours à la ligne
      const arrivalMatches = pageText.match(
        /arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/gi
      );
      if (arrivalMatches && arrivalMatches.length > 0) {
        // Prendre le premier match qui contient au moins 3 numéros valides
        for (const match of arrivalMatches) {
          const numbersMatch = match.match(
            /arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i
          );
          if (numbersMatch) {
            let candidate = numbersMatch[1].trim();
            // CORRECTION : Extraire les numéros complets sans casser les nombres à plusieurs chiffres
            candidate = candidate
              .replace(/\s+/g, ' ')
              .replace(/\s*[-–]\s*/g, '|')
              .replace(/\s+/g, '|')
              .replace(/\|+/g, '|');
            const numbers = candidate
              .split('|')
              .map((n) => n.trim())
              .filter((n) => n.match(/^\d+$/));
            if (numbers.length >= 3) {
              const validNumbers = numbers.filter((n) => {
                const num = parseInt(n);
                return num >= 1 && num <= 30;
              });
              if (validNumbers.length >= 3) {
                arrivalReport = validNumbers.join('-');
                break; // Prendre le premier rapport valide trouvé
              }
            }
          }
        }
      }
    }

    // PRIORITÉ 3 : Chercher dans les éléments aside qui contiennent "Arrivée"
    if (!arrivalReport) {
      $('aside').each((i, elem) => {
        if (arrivalReport) return false;
        const $elem = $(elem);
        const text = $elem.text();
        if (text.toLowerCase().includes('arrivée')) {
          const match = text.match(
            /arrivée[ée\s\n]*(\d+(?:\s*[-–]\s*\d+){2,})/i
          );
          if (match) {
            let candidate = match[1].trim();
            // CORRECTION : Extraire les numéros complets sans casser les nombres à plusieurs chiffres
            candidate = candidate
              .replace(/\s+/g, ' ')
              .replace(/\s*[-–]\s*/g, '|')
              .replace(/\s+/g, '|')
              .replace(/\|+/g, '|');
            const numbers = candidate
              .split('|')
              .map((n) => n.trim())
              .filter((n) => n.match(/^\d+$/));
            if (numbers.length >= 3) {
              const validNumbers = numbers.filter((n) => {
                const num = parseInt(n);
                return num >= 1 && num <= 30;
              });
              if (validNumbers.length >= 3) {
                arrivalReport = validNumbers.join('-');
                return false;
              }
            }
          }
        }
      });
    }

    // Patterns pour détecter les rapports d'arrivée (fallback)
    // Format attendu: "Arrivée 11 - 1 - 8 - 13 - 14" ou "11 - 1 - 8 - 13 - 14"
    const arrivalPatterns = [
      // Pattern 1: "Arrivée 11 - 1 - 8 - 13 - 14" avec espaces multiples et retours à la ligne
      /arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i,
      // Pattern 2: "11 - 1 - 8 - 13 - 14" (au moins 3 numéros)
      /(?:^|\s)(\d+(?:\s*[-–]\s*\d+){2,})(?:\s|$)/,
      // Pattern 3: Dans un élément avec texte "Arrivée" suivi de numéros
      /arrivée[ée\s\n:]*([\d\s\-–]{3,})/i,
    ];

    // PRIORITÉ 4 : Chercher dans différents sélecteurs spécifiques
    if (!arrivalReport) {
      const selectors = [
        '[class*="arrivee"]',
        '[class*="arrival"]',
        '[class*="resultat"]',
        '[class*="result"]',
        '[id*="arrivee"]',
        '[id*="arrival"]',
        '[class*="flag"]', // Les drapeaux verts indiquent souvent l'arrivée
        '.arrivee',
        '.arrival',
        '.resultat',
        '.result',
      ];

      for (const selector of selectors) {
        if (arrivalReport) break;
        const $elements = $(selector);
        $elements.each((i, elem) => {
          if (arrivalReport) return false;
          const $elem = $(elem);
          const text = $elem.text().trim();

          // Chercher les patterns dans le texte
          for (const pattern of arrivalPatterns) {
            const match = text.match(pattern);
            if (match) {
              let candidate = match[1].trim();
              // CORRECTION : Extraire les numéros complets sans casser les nombres à plusieurs chiffres
              candidate = candidate
                .replace(/\s+/g, ' ')
                .replace(/\s*[-–]\s*/g, '|')
                .replace(/\s+/g, '|')
                .replace(/\|+/g, '|');
              // Vérifier que c'est un rapport valide (au moins 3 numéros)
              const numbers = candidate
                .split('|')
                .map((n) => n.trim())
                .filter((n) => n.match(/^\d+$/));
              if (numbers.length >= 3) {
                const validNumbers = numbers.filter((n) => {
                  const num = parseInt(n);
                  return num >= 1 && num <= 30;
                });
                if (validNumbers.length >= 3) {
                  arrivalReport = validNumbers.join('-');
                  return false; // Break de la boucle each
                }
              }
            }
          }
        });
      }
    }

    // PRIORITÉ 5 : Si pas trouvé, chercher dans les éléments avec texte contenant "Arrivée"
    if (!arrivalReport) {
      $('*').each((i, elem) => {
        if (arrivalReport) return false;
        const $elem = $(elem);
        const text = $elem.text();
        if (
          text.toLowerCase().includes('arrivée') ||
          text.toLowerCase().includes('arrivee')
        ) {
          for (const pattern of arrivalPatterns) {
            const match = text.match(pattern);
            if (match) {
              let candidate = match[1].trim();
              // CORRECTION : Extraire les numéros complets sans casser les nombres à plusieurs chiffres
              candidate = candidate
                .replace(/\s+/g, ' ')
                .replace(/\s*[-–]\s*/g, '|')
                .replace(/\s+/g, '|')
                .replace(/\|+/g, '|');
              const numbers = candidate
                .split('|')
                .map((n) => n.trim())
                .filter((n) => n.match(/^\d+$/));
              if (numbers.length >= 3) {
                const validNumbers = numbers.filter((n) => {
                  const num = parseInt(n);
                  return num >= 1 && num <= 30;
                });
                if (validNumbers.length >= 3) {
                  arrivalReport = validNumbers.join('-');
                  return false; // Break
                }
              }
            }
          }
        }
      });
    }

    // PRIORITÉ 6 : Dernière tentative : chercher dans tout le body pour des séquences de numéros
    if (!arrivalReport) {
      const pageText = $('body').text();
      // Chercher des séquences comme "11 - 1 - 8 - 13 - 14" près du mot "Arrivée"
      // Améliorer le pattern pour gérer les espaces multiples et retours à la ligne
      const contextMatch = pageText.match(/arrivée[ée\s\n:]*([^\n]{0,150})/i);
      if (contextMatch) {
        const context = contextMatch[1];
        const numbersMatch = context.match(/(\d+(?:\s*[-–]\s*\d+){2,})/);
        if (numbersMatch) {
          let candidate = numbersMatch[1].trim();
          // CORRECTION : Extraire les numéros complets sans casser les nombres à plusieurs chiffres
          candidate = candidate
            .replace(/\s+/g, ' ')
            .replace(/\s*[-–]\s*/g, '|')
            .replace(/\s+/g, '|')
            .replace(/\|+/g, '|');
          const numbers = candidate
            .split('|')
            .map((n) => n.trim())
            .filter((n) => n.match(/^\d+$/));
          if (numbers.length >= 3) {
            const validNumbers = numbers.filter((n) => {
              const num = parseInt(n);
              return num >= 1 && num <= 30;
            });
            if (validNumbers.length >= 3) {
              arrivalReport = validNumbers.join('-');
            }
          }
        }
      }
    }

    // Nettoyer le format final : "11 - 1 - 8 - 13 - 14" -> "11-1-8-13-14"
    if (arrivalReport) {
      // Le rapport est déjà nettoyé et validé dans les étapes précédentes
      // Juste s'assurer qu'il est bien formaté
      arrivalReport = arrivalReport.replace(/\s*[-–]\s*/g, '-');

      // Validation finale
      const numbers = arrivalReport
        .split('-')
        .map((n) => n.trim())
        .filter((n) => n);

      // Vérifier que tous les numéros sont valides (entre 1 et 30)
      const validNumbers = numbers.filter((n) => {
        const num = parseInt(n);
        return num >= 1 && num <= 30;
      });

      // Vérifier qu'il y a au moins 3 numéros valides
      if (validNumbers.length < 3) {
        arrivalReport = null;
      } else {
        arrivalReport = validNumbers.join('-');
      }
    }

    // OPTIMISATION : Mettre en cache le résultat (même si null)
    if (globalArrivalReportsCache && arrivalReport) {
      globalArrivalReportsCache.set(url, {
        report: arrivalReport,
        timestamp: Date.now(),
      });
      console.log(
        `[Scraper] Rapport d'arrivée trouvé et mis en cache: ${url}: ${arrivalReport}`
      );
    } else if (globalArrivalReportsCache && !arrivalReport) {
      // Mettre en cache les échecs aussi (pour éviter de re-scraper les pages sans rapport)
      globalArrivalReportsCache.set(url, {
        report: null,
        timestamp: Date.now(),
      });
    } else if (arrivalReport) {
      console.log(
        `[Scraper] Rapport d'arrivée trouvé sur ${url}: ${arrivalReport}`
      );
    }

    return arrivalReport || null;
  } catch (error) {
    // Erreur silencieuse
    return null;
  }
}

/**
 * Scrape les archives Turf-FR pour les années et mois spécifiés
 * @param {string[]} years - Années à scraper
 * @param {string[]} months - Mois à scraper
 * @param {boolean} includeArrivalReports - Si true, scrape aussi les rapports d'arrivée (défaut: true)
 * @param {Object} filters - Filtres optionnels pour optimiser le scraping (reunionNumbers, countries, etc.)
 */
export async function scrapeTurfFrArchives(
  years,
  months,
  includeArrivalReports = true,
  filters = null
) {
  console.log(
    `[Scraper] Début scraping Turf-FR: années=${years.join(',')}, mois=${months.join(',')}`
  );

  // ✅ RESPECT DE ROBOTS.TXT - Charger les règles au début
  // OPTIMISATION TIMEOUT : Timeout de 5 secondes pour robots.txt
  console.log(`[Scraper] Chargement de robots.txt...`);
  let robotsRules = null;
  let crawlDelay = 400; // Délai par défaut si robots.txt échoue

  try {
    const robotsPromise = fetchRobotsTxt('https://www.turf-fr.com');
    const robotsTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('robots.txt timeout')), 5000);
    });
    robotsRules = await Promise.race([robotsPromise, robotsTimeout]);
    crawlDelay = getCrawlDelay(robotsRules, '*');
    console.log(`[Scraper] Crawl-delay recommandé: ${crawlDelay}ms`);
  } catch (error) {
    console.warn(
      `[Scraper] Impossible de charger robots.txt (timeout ou erreur), utilisation du délai par défaut: ${crawlDelay}ms`
    );
  }

  // OPTIMISATION CRITIQUE : Suivre le temps dès le début pour éviter timeout
  // Le scraping initial peut déjà prendre trop de temps
  // OPTIMISATION ULTIME : Réduire encore plus pour garantir 0 timeout
  // Si 2 mois ou plus, réduire encore plus car le scraping initial prend plus de temps
  const SCRAPING_START_TIME = Date.now();
  const totalMonths = years.length * months.length;
  // OPTIMISATION ULTIME : 15s pour 2+ mois (laisser 41s pour rapports), 25s pour 1 mois (laisser 31s)
  const MAX_INITIAL_SCRAPING_TIME = totalMonths >= 2 ? 15000 : 25000;

  const allReunions = [];

  for (const year of years) {
    for (const month of months) {
      // EARLY EXIT : Vérifier si on approche du timeout pendant le scraping initial
      const elapsedTime = Date.now() - SCRAPING_START_TIME;
      const remainingTime = MAX_INITIAL_SCRAPING_TIME - elapsedTime;
      
      // Early exit plus agressif : arrêter à 5s restantes pour 2+ mois, 8s pour 1 mois
      const earlyExitThreshold = totalMonths >= 2 ? 5000 : 8000;
      if (remainingTime < earlyExitThreshold) {
        if (DEBUG) {
          console.log(
            `[Scraper] ⚠️ Timeout imminent pendant scraping initial (${Math.round(remainingTime / 1000)}s restantes), arrêt`
          );
        }
        break;
      }

      const monthData = MONTHS.find((m) => m.value === month);
      if (!monthData) {
        if (DEBUG) console.warn(`[Scraper] Mois non trouvé: ${month}`);
        continue;
      }

      const monthSlug = monthData.slug;
      if (DEBUG) console.log(`[Scraper] Scraping ${year}/${monthSlug}...`);
      const reunions = await scrapeMonthPage(year, monthSlug, robotsRules);
      if (DEBUG) {
        console.log(
          `[Scraper] ${reunions.length} réunions trouvées pour ${year}/${monthSlug}`
        );
      }
      allReunions.push(...reunions);

      // ✅ RESPECT DE ROBOTS.TXT - Utiliser le crawl-delay recommandé
      await sleep(crawlDelay);
    }
    
    // Si on a arrêté à cause du timeout, sortir de la boucle des années aussi
    const elapsedTime = Date.now() - SCRAPING_START_TIME;
    const earlyExitThreshold = totalMonths >= 2 ? 5000 : 8000;
    if (elapsedTime >= MAX_INITIAL_SCRAPING_TIME - earlyExitThreshold) {
      break;
    }
  }

  if (DEBUG) {
    console.log(
      `[Scraper] Total avant déduplication: ${allReunions.length} réunions`
    );
  }

  // Dédupliquer par ID
  const uniqueReunions = [];
  const seenIds = new Set();

  for (const reunion of allReunions) {
    if (!seenIds.has(reunion.id)) {
      seenIds.add(reunion.id);
      uniqueReunions.push(reunion);
    }
  }

  if (DEBUG) {
    console.log(
      `[Scraper] Total après déduplication: ${uniqueReunions.length} réunions`
    );
  }
  
  // Gestion des résultats partiels : si on a arrêté tôt, ajouter un flag
  const wasEarlyExit = Date.now() - SCRAPING_START_TIME >= MAX_INITIAL_SCRAPING_TIME - (totalMonths >= 2 ? 5000 : 8000);
  if (wasEarlyExit && DEBUG) {
    console.warn(
      `[Scraper] ⚠️ Scraping initial arrêté prématurément, résultats partiels possibles`
    );
  }

  // OPTIMISATION CRITIQUE : Appliquer les filtres AVANT le scraping des rapports
  // pour éviter de scraper des réunions qui seront filtrées après
  let reunionsToProcess = uniqueReunions;
  if (filters) {
    // Utiliser applyFilters depuis utils/filters.js pour éviter la duplication
    reunionsToProcess = applyFilters(uniqueReunions, filters);
    if (DEBUG) {
      console.log(
        `[Scraper] Filtres appliqués: ${uniqueReunions.length} → ${reunionsToProcess.length} réunions`
      );
    }
  }

  // Scraper les rapports d'arrivée seulement si demandé
  if (includeArrivalReports) {
    if (DEBUG) {
      console.log(
        `[Scraper] Début scraping des rapports d'arrivée pour ${reunionsToProcess.length} réunions (filtrées)`
      );
    }

    // OPTIMISATION : Batch size adaptatif selon le crawl-delay, le nombre de réunions ET l'année
    // AUGMENTATION AGRESSIVE : Batch size très élevé pour maximiser le parallélisme
    let adaptiveBatchSize =
      crawlDelay < 1000 ? 40 : crawlDelay < 2000 ? 30 : 25;

    // OPTIMISATION CRITIQUE : Réduire drastiquement pour 2022 pour éviter les timeouts
    const firstYear = years && years.length > 0 ? years[0] : null;
    const has2022 = firstYear === 2022 || (years && years.includes(2022));
    if (has2022) {
      // 2022 a beaucoup de réunions et timeout souvent, réduire drastiquement le batch size
      // Priorité : éviter les timeouts plutôt que maximiser les rapports
      // OPTIMISATION ULTIME : Réduire encore plus (6 au lieu de 8) pour garantir 0 timeout
      adaptiveBatchSize = Math.max(6, Math.floor(adaptiveBatchSize * 0.25));
      if (DEBUG) {
        console.log(
          `[Scraper] ⚠️ Année 2022 détectée, batch size réduit à ${adaptiveBatchSize} pour éviter timeouts`
        );
      }
    }

    // OPTIMISATION : Si beaucoup de réunions, réduire légèrement mais garder élevé
    if (uniqueReunions.length > 240) {
      adaptiveBatchSize = Math.max(20, Math.floor(adaptiveBatchSize * 0.85));
    } else if (uniqueReunions.length > 200) {
      adaptiveBatchSize = Math.max(25, Math.floor(adaptiveBatchSize * 0.9));
    }

    const BATCH_SIZE = adaptiveBatchSize;
    if (DEBUG) {
      console.log(
        `[Scraper] Batch size: ${BATCH_SIZE} (crawl-delay: ${crawlDelay}ms, ${uniqueReunions.length} réunions)`
      );
    }

    // OPTIMISATION : Prioriser les réunions les plus récentes (tri par date décroissante)
    // Les réunions récentes sont souvent plus importantes et peuvent être scrapées en premier
    // UTILISER reunionsToProcess (filtrées) au lieu de uniqueReunions
    const reunionsToScrape = [...reunionsToProcess].sort((a, b) => {
      const dateA = new Date(a.dateISO);
      const dateB = new Date(b.dateISO);
      return dateB - dateA; // Plus récent en premier
    });

    // OPTIMISATION : Suivre le temps écoulé pour early exit si timeout imminent
    // Utiliser le temps déjà écoulé depuis le début du scraping initial
    const ARRIVAL_SCRAPING_START_TIME = Date.now();
    // OPTIMISATION CRITIQUE : Réduire drastiquement le temps max pour 2022 (année problématique)
    // 32s pour 2022 pour laisser encore plus de marge avant le timeout de 56s (24s de marge)
    const MAX_SCRAPING_TIME = has2022 ? 32000 : 50000; // 32s pour 2022, 50s pour les autres (limite 56s)
    let totalScraped = 0;
    let totalWithReports = 0;

    // OPTIMISATION CRITIQUE : Limiter drastiquement le nombre de réunions scrapées pour 2022
    // Pour éviter les timeouts, ne scraper que les 250 premières réunions (les plus récentes)
    // Priorité : éviter les timeouts plutôt que maximiser les rapports
    // OPTIMISATION ULTIME : Réduire à 250 pour garantir 0 timeout
    let reunionsToScrapeFinal = reunionsToScrape;
    if (has2022 && reunionsToScrape.length > 250) {
      if (DEBUG) {
        console.log(
          `[Scraper] ⚠️ 2022: Limitation à 250 réunions (sur ${reunionsToScrape.length}) pour éviter timeout`
        );
      }
      reunionsToScrapeFinal = reunionsToScrape.slice(0, 250);
    }

    if (DEBUG) {
      console.log(
        `[Scraper] Scraping des rapports pour ${reunionsToScrapeFinal.length} réunions (triées par date décroissante)`
      );
    }

    for (let i = 0; i < reunionsToScrapeFinal.length; i += BATCH_SIZE) {
      // EARLY EXIT : Vérifier si on approche du timeout
      // Prendre en compte le temps déjà écoulé pour le scraping initial
      const elapsedTime = Date.now() - ARRIVAL_SCRAPING_START_TIME;
      const totalElapsedTime = Date.now() - SCRAPING_START_TIME; // SCRAPING_START_TIME défini au début de la fonction
      const remainingTime = MAX_SCRAPING_TIME - elapsedTime;
      const totalRemainingTime = 56000 - totalElapsedTime; // 56s timeout global Vercel

      // OPTIMISATION : Early exit pour 2022 (ajusté avec le nouveau MAX_SCRAPING_TIME)
      // OPTIMISATION ULTIME : 10s de marge pour 2022 pour garantir 0 timeout
      // Prendre en compte le temps total écoulé (initial + rapports)
      const earlyExitThreshold = has2022 ? 10000 : 5000; // 10s pour 2022 (marge maximale), 5s pour les autres
      if (remainingTime < earlyExitThreshold || totalRemainingTime < 10000) {
        // Moins de X secondes restantes, arrêter le scraping
        if (DEBUG) {
          console.log(
            `[Scraper] ⚠️ Timeout imminent (${Math.round(remainingTime / 1000)}s restantes pour rapports, ${Math.round(totalRemainingTime / 1000)}s total), arrêt du scraping des rapports`
          );
        }
        // Toujours logger le résumé même si DEBUG est false
        console.log(
          `[Scraper] Rapports scrapés: ${totalWithReports}/${totalScraped} (${totalScraped > 0 ? Math.round((totalWithReports / totalScraped) * 100) : 0}%)`
        );
        break;
      }

      const batch = reunionsToScrapeFinal.slice(i, i + BATCH_SIZE);
      totalScraped += batch.length;

      // OPTIMISATION : Utiliser Promise.allSettled pour ne pas bloquer sur les erreurs
      // ET réduire le crawl-delay entre batches si on approche du timeout
      const promises = batch.map(async (reunion) => {
        try {
          // Passer les informations de la réunion pour vérification de correspondance
          const reunionInfo = {
            hippodrome: reunion.hippodrome,
            dateISO: reunion.dateISO,
            reunionNumber: reunion.reunionNumber,
          };
          const arrivalReport = await scrapeArrivalReport(
            reunion.url,
            robotsRules,
            reunionInfo
          );
          reunion.arrivalReport = arrivalReport;
          if (arrivalReport) totalWithReports++;
          return { status: 'fulfilled', reunion };
        } catch (error) {
          reunion.arrivalReport = null;
          return { status: 'rejected', reunion, error };
        }
      });

      // Promise.allSettled continue même si certaines promesses échouent
      const results = await Promise.allSettled(promises);

      // Compter les succès et échecs pour le logging
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value?.reunion?.arrivalReport
      ).length;
      const failureCount = results.filter(
        (r) => r.status === 'rejected' || !r.value?.reunion?.arrivalReport
      ).length;

      if (DEBUG && (failureCount > 0 || (i + BATCH_SIZE) % (BATCH_SIZE * 3) === 0)) {
        const progress = Math.min(i + BATCH_SIZE, reunionsToScrapeFinal.length);
        const percentage = Math.round(
          (progress / reunionsToScrapeFinal.length) * 100
        );
        console.log(
          `[Scraper] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${successCount}/${batch.length} rapports trouvés | Progression: ${progress}/${reunionsToScrapeFinal.length} (${percentage}%) | Temps: ${Math.round(elapsedTime / 1000)}s`
        );
      }

      // OPTIMISATION : Réduire le crawl-delay si on approche du timeout
      // Plus on approche du timeout, plus on réduit le délai entre batches
      // OPTIMISATION CRITIQUE : Plus agressif pour 2022
      let currentCrawlDelay = crawlDelay;
      if (has2022) {
        // Pour 2022, réduire plus tôt et plus agressivement
        if (remainingTime < 10000) {
          // Moins de 10s restantes, réduire le délai de 75%
          currentCrawlDelay = Math.max(100, Math.floor(crawlDelay * 0.25));
        } else if (remainingTime < 20000) {
          // Moins de 20s restantes, réduire le délai de 50%
          currentCrawlDelay = Math.max(150, Math.floor(crawlDelay * 0.5));
        } else if (remainingTime < 30000) {
          // Moins de 30s restantes, réduire le délai de 25%
          currentCrawlDelay = Math.max(200, Math.floor(crawlDelay * 0.75));
        }
      } else {
        // Pour les autres années, logique normale
        if (remainingTime < 15000) {
          // Moins de 15s restantes, réduire le délai de moitié
          currentCrawlDelay = Math.max(200, Math.floor(crawlDelay * 0.5));
        } else if (remainingTime < 25000) {
          // Moins de 25s restantes, réduire le délai de 25%
          currentCrawlDelay = Math.max(300, Math.floor(crawlDelay * 0.75));
        }
      }

      // ✅ RESPECT DE ROBOTS.TXT - Utiliser le crawl-delay adaptatif entre les lots
      if (i + BATCH_SIZE < reunionsToScrapeFinal.length) {
        await sleep(currentCrawlDelay);
      }
    }

    const finalElapsedTime = Date.now() - ARRIVAL_SCRAPING_START_TIME;
    // Toujours logger le résumé final même si DEBUG est false
    console.log(
      `[Scraper] Scraping des rapports d'arrivée terminé: ${totalWithReports}/${totalScraped} rapports trouvés (${totalScraped > 0 ? Math.round((totalWithReports / totalScraped) * 100) : 0}%) en ${Math.round(finalElapsedTime / 1000)}s`
    );
  } else {
    if (DEBUG) console.log(`[Scraper] Scraping des rapports d'arrivée désactivé`);
  }

  // Retourner uniqueReunions (non filtrées) pour que les filtres finaux soient appliqués dans archives.js
  // Mais les rapports d'arrivée ont été scrapés seulement pour reunionsToProcess (filtrées)
  return uniqueReunions;
}
