/**
 * Test du scraper pour vérifier l'extraction des dates
 * Teste directement la fonction scrapeDateFromReunionPage
 */

import * as cheerio from 'cheerio';

/**
 * Scrape la date depuis la page individuelle d'une réunion
 * (Copie de la fonction du scraper pour tester)
 */
async function scrapeDateFromReunionPage(reunionUrl) {
  if (!reunionUrl) return null;

  try {
    // Timeout de 3 secondes pour la requête
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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
    let dateText = '';
    const datePatterns = [
      /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    ];

    // PRIORITÉ 1 : Chercher dans les éléments avec classe/ID contenant "date"
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
            dateText = match[0];
            return false;
          }
        }
      });
      if (dateText) break;
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

    // PRIORITÉ 3 : Chercher dans le body
    if (!dateText) {
      const bodyText = $('body').text();
      for (const pattern of datePatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          dateText = match[0];
          break;
        }
      }
    }

    // Parser la date trouvée
    if (dateText) {
      return parseDate(dateText);
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Parse une date depuis le texte
 */
function parseDate(dateText) {
  if (!dateText) return null;

  const monthNames = {
    janvier: 1,
    février: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    août: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    décembre: 12,
  };

  const MONTHS = [
    { label: 'Janvier', slug: 'janvier' },
    { label: 'Février', slug: 'fevrier' },
    { label: 'Mars', slug: 'mars' },
    { label: 'Avril', slug: 'avril' },
    { label: 'Mai', slug: 'mai' },
    { label: 'Juin', slug: 'juin' },
    { label: 'Juillet', slug: 'juillet' },
    { label: 'Août', slug: 'aout' },
    { label: 'Septembre', slug: 'septembre' },
    { label: 'Octobre', slug: 'octobre' },
    { label: 'Novembre', slug: 'novembre' },
    { label: 'Décembre', slug: 'decembre' },
  ];

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
 * Teste plusieurs URLs
 */
async function testScraperDates() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST DU SCRAPER - EXTRACTION DES DATES`);
  console.log(`${'='.repeat(60)}`);

  const urlsToTest = [
    'https://www.turf-fr.com/partants-programmes/r1-saint-cloud-39681',
    'https://www.turf-fr.com/partants-programmes/r1-vincennes-39686',
    'https://www.turf-fr.com/partants-programmes/r1-paris-longchamp-39710',
  ];

  console.log(`\n📋 URLs à tester: ${urlsToTest.length}`);

  const results = [];
  for (const url of urlsToTest) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Test: ${url}`);
    console.log(`${'='.repeat(60)}`);

    const start = Date.now();
    const dateInfo = await scrapeDateFromReunionPage(url);
    const duration = Date.now() - start;

    if (dateInfo) {
      console.log(
        `✅ Date trouvée: ${dateInfo.dateLabel} (${dateInfo.dateISO})`
      );
      console.log(`   Durée: ${duration}ms`);
      results.push({ url, success: true, dateInfo, duration });
    } else {
      console.log(`❌ Aucune date trouvée`);
      console.log(`   Durée: ${duration}ms`);
      results.push({ url, success: false, duration });
    }

    // Délai entre requêtes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Résumé
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RÉSUMÉ DES TESTS`);
  console.log(`${'='.repeat(60)}`);

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log(`\n✅ Succès: ${successCount}/${results.length}`);
  console.log(`❌ Échecs: ${failureCount}/${results.length}`);
  console.log(`⏱️  Durée moyenne: ${Math.round(avgDuration)}ms`);

  console.log(`\n📋 Détails:`);
  results.forEach((r, i) => {
    if (r.success) {
      console.log(
        `   ${i + 1}. ✅ ${r.url.split('/').pop()}: ${r.dateInfo.dateISO} (${r.duration}ms)`
      );
    } else {
      console.log(
        `   ${i + 1}. ❌ ${r.url.split('/').pop()}: Aucune date (${r.duration}ms)`
      );
    }
  });

  // Vérifier que les dates ne sont pas toutes identiques (signe de fallback)
  if (successCount > 1) {
    const dates = results
      .filter((r) => r.success)
      .map((r) => r.dateInfo.dateISO);
    const uniqueDates = new Set(dates);
    if (uniqueDates.size === 1 && dates[0].endsWith('-01')) {
      console.log(
        `\n⚠️  ATTENTION: Toutes les dates sont identiques et se terminent par '-01'`
      );
      console.log(
        `   Cela pourrait indiquer que le fallback est utilisé au lieu de dates réelles`
      );
    } else {
      console.log(`\n✅ Les dates sont variées, pas de problème de fallback`);
    }
  }
}

// Exécuter les tests
testScraperDates().catch(console.error);
