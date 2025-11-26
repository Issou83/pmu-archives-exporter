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
  if (hippodrome.startsWith('Swe-') || hippodrome.startsWith('SWE-')) return 'SWE';
  if (hippodrome.startsWith('Usa-') || hippodrome.startsWith('USA-')) return 'USA';
  if (hippodrome.startsWith('Ire-') || hippodrome.startsWith('IRE-')) return 'IRE';
  if (hippodrome.startsWith('Ger-') || hippodrome.startsWith('GER-')) return 'GER';
  if (hippodrome.startsWith('Ita-') || hippodrome.startsWith('ITA-')) return 'ITA';
  return 'FR';
}

/**
 * Génère un ID stable pour une réunion
 */
function generateId(dateISO, hippodrome, reunionNumber) {
  return `${dateISO}_${hippodrome}_${reunionNumber}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Parse une date depuis le texte de la page
 */
function parseDate(dateText) {
  if (!dateText) return null;

  // Formats possibles : "15 janvier 2024", "15/01/2024", etc.
  const dateMatch = dateText.match(/(\d{1,2})[\/\s]+(\w+|\d{1,2})[\/\s]+(\d{4})/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthStr = dateMatch[2];
    const year = parseInt(dateMatch[3]);

    // Chercher le mois dans la liste
    const monthIndex = MONTHS.findIndex(
      (m) => m.label.toLowerCase() === monthStr.toLowerCase() || m.slug === monthStr.toLowerCase()
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

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} pour ${url}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const reunions = [];

    // Chercher tous les liens contenant "VOIR CETTE REUNION"
    $('a').each((i, elem) => {
      const $link = $(elem);
      const linkText = $link.text().trim();

      if (linkText.includes('VOIR CETTE REUNION') || linkText.includes('Voir cette réunion')) {
        const href = $link.attr('href');
        const url = href?.startsWith('http') ? href : `https://www.turf-fr.com${href}`;

        // Chercher le texte de date proche (dans le même conteneur parent)
        let dateText = '';
        let reunionText = '';

        // Chercher dans les éléments parents
        $link.parents().each((j, parent) => {
          const $parent = $(parent);
          const parentText = $parent.text();

          // Extraire la date
          const dateMatch = parentText.match(/(\d{1,2}[\/\s]+\w+[\/\s]+\d{4})/);
          if (dateMatch && !dateText) {
            dateText = dateMatch[1];
          }

          // Extraire "Hippodrome - Réunion X"
          const reunionMatch = parentText.match(/([^-]+)\s*-\s*R[ée]union\s*(\d+)/i);
          if (reunionMatch && !reunionText) {
            reunionText = reunionMatch[0];
            const hippodrome = reunionMatch[1].trim();
            const reunionNumber = reunionMatch[2];

            const dateInfo = parseDate(dateText || `${year}-${monthSlug}`);
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
                hippodrome,
                reunionNumber,
                countryCode,
                url,
                source: 'turf-fr',
              });
            }
          }
        });
      }
    });

    return reunions;
  } catch (error) {
    console.error(`Erreur lors du scraping de ${url}:`, error.message);
    return [];
  }
}

/**
 * Scrape les archives Turf-FR pour les années et mois spécifiés
 */
export async function scrapeTurfFrArchives(years, months) {
  const allReunions = [];

  for (const year of years) {
    for (const month of months) {
      const monthData = MONTHS.find((m) => m.value === month);
      if (!monthData) continue;

      const monthSlug = monthData.slug;
      const reunions = await scrapeMonthPage(year, monthSlug);
      allReunions.push(...reunions);

      // Sleep 400ms entre les pages pour éviter le scraping agressif
      await sleep(400);
    }
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

  return uniqueReunions;
}

