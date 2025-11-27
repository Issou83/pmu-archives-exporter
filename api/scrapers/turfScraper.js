import * as cheerio from 'cheerio';

// Mois en français (dupliqué depuis constants.js pour éviter les imports cross-module)
const MONTHS = [
  { value: 'janvier', label: 'Janvier', slug: 'janvier' },
  { value: 'fevrier', label: 'Février', slug: 'fevrier' },
  { value: 'mars', label: 'Mars', slug: 'mars' },
  { value: 'avril', label: 'Avril', slug: 'avril' },
  { value: 'mai', label: 'Mai', slug: 'mai' },
  { value: 'juin', label: 'Juin', slug: 'juin' },
  { value: 'juillet', label: 'Juillet', slug: 'juillet' },
  { value: 'aout', label: 'Août', slug: 'aout' },
  { value: 'septembre', label: 'Septembre', slug: 'septembre' },
  { value: 'octobre', label: 'Octobre', slug: 'octobre' },
  { value: 'novembre', label: 'Novembre', slug: 'novembre' },
  { value: 'decembre', label: 'Décembre', slug: 'decembre' },
];

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

  // Formats possibles : "15 janvier 2024", "15/01/2024", etc.
  const dateMatch = dateText.match(
    /(\d{1,2})[\/\s]+(\w+|\d{1,2})[\/\s]+(\d{4})/
  );
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthStr = dateMatch[2];
    const year = parseInt(dateMatch[3]);

    // Chercher le mois dans la liste
    const monthIndex = MONTHS.findIndex(
      (m) =>
        m.label.toLowerCase() === monthStr.toLowerCase() ||
        m.slug === monthStr.toLowerCase()
    );

    if (monthIndex !== -1) {
      const month = monthIndex + 1;
      const date = new Date(year, month - 1, day);
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
 * Scrape une page d'archives pour un mois donné
 */
async function scrapeMonthPage(year, monthSlug) {
  const url = `https://www.turf-fr.com/archives/courses-pmu/${year}/${monthSlug}`;
  console.log(`[Scraper] Scraping: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Referer: 'https://www.turf-fr.com/',
      },
    });

    if (!response.ok) {
      console.error(`[Scraper] HTTP ${response.status} pour ${url}`);
      throw new Error(`HTTP ${response.status} pour ${url}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const reunions = [];

    console.log(`[Scraper] HTML reçu, longueur: ${html.length} caractères`);

    // Méthode 1 : Chercher les liens avec "VOIR CETTE REUNION" ou variantes
    const linkTexts = [
      'VOIR CETTE REUNION',
      'Voir cette réunion',
      'Voir cette reunion',
      'voir cette réunion',
      'Voir la réunion',
      'Voir',
    ];
    let foundLinks = 0;

    $('a').each((i, elem) => {
      const $link = $(elem);
      const linkText = $link.text().trim();
      const href = $link.attr('href');

      // Vérifier si le lien contient un texte de réunion ou pointe vers une réunion
      const hasReunionText = linkTexts.some((text) => linkText.includes(text));
      const hasReunionHref =
        href &&
        (href.includes('reunion') ||
          href.includes('course') ||
          href.includes('programme'));

      if ((hasReunionText || hasReunionHref) && href) {
        foundLinks++;
        const fullUrl = href.startsWith('http')
          ? href
          : `https://www.turf-fr.com${href}`;

        // Chercher les informations dans le contexte proche
        let dateText = '';
        let hippodrome = '';
        let reunionNumber = '';

        // Chercher dans le parent et les frères
        const $parent = $link.parent();
        const $container = $parent.closest('div, article, section, li, tr');
        const containerText = $container.text();

        // Extraire la date (plusieurs formats possibles)
        const datePatterns = [
          /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
          /(\d{1,2})\s+(\w+)\s+(\d{4})/,
        ];

        for (const pattern of datePatterns) {
          const match = containerText.match(pattern);
          if (match) {
            dateText = match[0];
            break;
          }
        }

        // Extraire hippodrome et numéro de réunion
        const reunionPatterns = [
          /([A-Za-zÀ-ÿ\s\-]+)\s*[-–]\s*R[ée]union\s*(\d+)/i,
          /([A-Za-zÀ-ÿ\s\-]+)\s*R[ée]union\s*(\d+)/i,
          /Hippodrome[:\s]+([A-Za-zÀ-ÿ\s\-]+).*R[ée]union[:\s]+(\d+)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–]?\s*R[ée]union\s*(\d+)/i,
        ];

        for (const pattern of reunionPatterns) {
          const match = containerText.match(pattern);
          if (match) {
            hippodrome = match[1].trim();
            reunionNumber = match[2];
            break;
          }
        }

        // Si on n'a pas trouvé, essayer de chercher dans les éléments proches
        if (!hippodrome) {
          // Chercher dans les éléments précédents/suivants
          const $prev = $link.prev();
          const $next = $link.next();
          const nearbyText = $prev.text() + ' ' + $next.text();

          const nearbyMatch = nearbyText.match(
            /([A-Za-zÀ-ÿ\s\-]+)\s*[-–]?\s*R[ée]union\s*(\d+)/i
          );
          if (nearbyMatch) {
            hippodrome = nearbyMatch[1].trim();
            reunionNumber = nearbyMatch[2];
          }
        }

        // Essayer d'extraire depuis l'URL si elle contient des infos
        if (!hippodrome && href) {
          const urlMatch = href.match(/([^\/]+)[\/\-]reunion[\/\-]?(\d+)/i);
          if (urlMatch) {
            hippodrome = urlMatch[1].replace(/[-_]/g, ' ');
            reunionNumber = urlMatch[2];
          }
        }

        // Si on a au moins un hippodrome ou un numéro, créer la réunion
        if (hippodrome || reunionNumber) {
          // Générer une date par défaut si on n'en a pas trouvé
          let dateInfo = parseDate(dateText);
          if (!dateInfo) {
            // Utiliser le premier jour du mois comme fallback
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

          if (dateInfo) {
            const countryCode = normalizeCountryCode(hippodrome);
            const id = generateId(
              dateInfo.dateISO,
              hippodrome || 'unknown',
              reunionNumber || '1'
            );

            reunions.push({
              id,
              dateISO: dateInfo.dateISO,
              dateLabel: dateInfo.dateLabel,
              year: dateInfo.year,
              month: dateInfo.month,
              monthLabel: dateInfo.monthLabel,
              hippodrome: hippodrome || 'Inconnu',
              reunionNumber: reunionNumber || '1',
              countryCode,
              url: fullUrl,
              source: 'turf-fr',
            });
          }
        }
      }
    });

    console.log(
      `[Scraper] Trouvé ${foundLinks} liens, ${reunions.length} réunions extraites`
    );

    // Méthode 2 : Si aucune réunion trouvée, essayer une approche différente
    if (reunions.length === 0) {
      console.log(
        `[Scraper] Aucune réunion trouvée avec la méthode 1, essai méthode alternative...`
      );

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
 * Scrape les archives Turf-FR pour les années et mois spécifiés
 */
export async function scrapeTurfFrArchives(years, months) {
  console.log(
    `[Scraper] Début scraping Turf-FR: années=${years.join(',')}, mois=${months.join(',')}`
  );
  const allReunions = [];

  for (const year of years) {
    for (const month of months) {
      const monthData = MONTHS.find((m) => m.value === month);
      if (!monthData) {
        console.warn(`[Scraper] Mois non trouvé: ${month}`);
        continue;
      }

      const monthSlug = monthData.slug;
      console.log(`[Scraper] Scraping ${year}/${monthSlug}...`);
      const reunions = await scrapeMonthPage(year, monthSlug);
      console.log(
        `[Scraper] ${reunions.length} réunions trouvées pour ${year}/${monthSlug}`
      );
      allReunions.push(...reunions);

      // Sleep 400ms entre les pages pour éviter le scraping agressif
      await sleep(400);
    }
  }

  console.log(
    `[Scraper] Total avant déduplication: ${allReunions.length} réunions`
  );

  // Dédupliquer par ID
  const uniqueReunions = [];
  const seenIds = new Set();

  for (const reunion of allReunions) {
    if (!seenIds.has(reunion.id)) {
      seenIds.add(reunion.id);
      uniqueReunions.push(reunion);
    }
  }

  console.log(
    `[Scraper] Total après déduplication: ${uniqueReunions.length} réunions`
  );
  return uniqueReunions;
}
