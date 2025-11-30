/**
 * Script de vérification à la source - DATES UNIQUEMENT
 * Teste plusieurs URLs scrapées pour vérifier la véracité des dates extraites
 */

import * as cheerio from 'cheerio';

/**
 * Teste une URL et vérifie si la date extraite correspond à la date réelle
 */
async function testUrlDate(url, expectedDateISO, expectedDateLabel) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 VÉRIFICATION DATE: ${url}`);
  console.log(`${'='.repeat(60)}`);

  try {
    console.log(`\n📄 Test URL: ${url}`);
    console.log(
      `   Date attendue (scrapée): ${expectedDateLabel} (${expectedDateISO})`
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PMU-Archives-Exporter/1.0',
          Accept: 'text/html',
        },
      });
      clearTimeout(timeout);
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.log(`   ⏱️  Timeout (5s)`);
        return { url, error: 'timeout' };
      } else {
        console.log(`   ❌ Erreur: ${error.message}`);
        return { url, error: error.message };
      }
    }

    if (!response || !response.ok) {
      console.log(`   ⚠️  HTTP ${response?.status || 'unknown'}`);
      return { url, error: `HTTP ${response?.status || 'unknown'}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Chercher la date dans différents endroits de la page
    let foundDate = null;
    let foundDateISO = null;
    let foundDateLabel = null;
    let foundIn = null;

    // PRIORITÉ 1 : Chercher dans le titre de la page
    const $title = $('title');
    if ($title.length > 0) {
      const titleText = $title.text();
      // Pattern: "Réunion PMU ... 2025" ou dates dans le titre
      const datePatterns = [
        /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
      ];

      for (const pattern of datePatterns) {
        const match = titleText.match(pattern);
        if (match) {
          foundDate = match[0];
          foundIn = 'title';
          break;
        }
      }
    }

    // PRIORITÉ 2 : Chercher dans les éléments avec classe/ID contenant "date"
    if (!foundDate) {
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
          if (foundDate) return false;
          const $elem = $(elem);
          const text = $elem.text();

          const datePatterns = [
            /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
            /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
            /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
          ];

          for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
              foundDate = match[0];
              foundIn = `selector: ${selector}`;
              return false;
            }
          }
        });
      }
    }

    // PRIORITÉ 3 : Chercher dans le body pour des patterns de date
    if (!foundDate) {
      const bodyText = $('body').text();
      const datePatterns = [
        /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
        /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      ];

      for (const pattern of datePatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          foundDate = match[0];
          foundIn = 'body';
          break;
        }
      }
    }

    // Convertir la date trouvée en format ISO et label
    if (foundDate) {
      // Parser la date selon différents formats
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

      // Format: "1 mai 2025" ou "lundi 1 mai 2025"
      const fullDateMatch = foundDate.match(
        /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i
      );
      if (fullDateMatch) {
        const day = parseInt(fullDateMatch[1]);
        const monthName = fullDateMatch[2].toLowerCase();
        const year = parseInt(fullDateMatch[3]);
        const month = monthNames[monthName];

        if (month) {
          foundDateISO = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          foundDateLabel = `${day} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
        }
      }

      // Format: "01/05/2025" ou "2025/05/01"
      if (!foundDateISO) {
        const slashDateMatch = foundDate.match(
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
        );
        if (slashDateMatch) {
          const part1 = parseInt(slashDateMatch[1]);
          const part2 = parseInt(slashDateMatch[2]);
          const year = parseInt(slashDateMatch[3]);

          // Déterminer si c'est DD/MM/YYYY ou MM/DD/YYYY
          if (part1 > 12) {
            // DD/MM/YYYY
            foundDateISO = `${year}-${String(part2).padStart(2, '0')}-${String(part1).padStart(2, '0')}`;
          } else if (part2 > 12) {
            // MM/DD/YYYY
            foundDateISO = `${year}-${String(part1).padStart(2, '0')}-${String(part2).padStart(2, '0')}`;
          }
        }
      }

      // Format: "2025-05-01"
      if (!foundDateISO) {
        const isoDateMatch = foundDate.match(
          /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
        );
        if (isoDateMatch) {
          foundDateISO = `${isoDateMatch[1]}-${String(isoDateMatch[2]).padStart(2, '0')}-${String(isoDateMatch[3]).padStart(2, '0')}`;
        }
      }
    }

    // Comparaison
    console.log(`\n📊 RÉSULTAT:`);
    if (foundDate) {
      console.log(`   ✅ Date trouvée à la source: "${foundDate}"`);
      if (foundIn) {
        console.log(`   📍 Trouvée dans: ${foundIn}`);
      }
      if (foundDateISO) {
        console.log(`   📅 Date ISO: ${foundDateISO}`);
        if (foundDateLabel) {
          console.log(`   📅 Date label: ${foundDateLabel}`);
        }

        if (foundDateISO === expectedDateISO) {
          console.log(
            `   ✅ Correspond avec la date scrapée: ${expectedDateISO}`
          );
        } else {
          console.log(`   ⚠️  DIFFÉRENT de la date scrapée !`);
          console.log(`      Source: ${foundDateISO}`);
          console.log(`      Scrapé: ${expectedDateISO}`);
        }
      } else {
        console.log(
          `   ⚠️  Date trouvée mais format non reconnu: "${foundDate}"`
        );
      }
    } else {
      console.log(`   ❌ Aucune date trouvée à la source`);
      if (expectedDateISO) {
        console.log(
          `   ⚠️  PROBLÈME: Date scrapée (${expectedDateISO}) mais pas trouvée à la source !`
        );
      }
    }

    return {
      url,
      expectedDateISO,
      expectedDateLabel,
      foundDate,
      foundDateISO,
      foundDateLabel,
      foundIn,
      matches: foundDateISO === expectedDateISO,
    };
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return { url, error: error.message };
  }
}

/**
 * Teste plusieurs URLs
 */
async function testMultipleUrls() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 VÉRIFICATION À LA SOURCE - DATES UNIQUEMENT`);
  console.log(`${'='.repeat(60)}`);

  // URLs à tester (récupérées depuis l'API)
  const urlsToTest = [
    {
      url: 'https://www.turf-fr.com/partants-programmes/r1-saint-cloud-39681',
      expectedDateISO: '2025-05-01',
      expectedDateLabel: '1 mai 2025',
    },
    {
      url: 'https://www.turf-fr.com/partants-programmes/r1-vincennes-39686',
      expectedDateISO: '2025-05-01',
      expectedDateLabel: '1 mai 2025',
    },
    {
      url: 'https://www.turf-fr.com/partants-programmes/r1-paris-longchamp-39710',
      expectedDateISO: '2025-05-01',
      expectedDateLabel: '1 mai 2025',
    },
    {
      url: 'https://www.turf-fr.com/partants-programmes/r1-vichy-39714',
      expectedDateISO: '2025-05-01',
      expectedDateLabel: '1 mai 2025',
    },
    {
      url: 'https://www.turf-fr.com/partants-programmes/r1-chantilly-39729',
      expectedDateISO: '2025-05-01',
      expectedDateLabel: '1 mai 2025',
    },
  ];

  console.log(`\n📋 URLs à tester: ${urlsToTest.length}`);

  const results = [];
  for (const item of urlsToTest) {
    const result = await testUrlDate(
      item.url,
      item.expectedDateISO,
      item.expectedDateLabel
    );
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Délai entre requêtes
  }

  // Résumé
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RÉSUMÉ DES VÉRIFICATIONS - DATES`);
  console.log(`${'='.repeat(60)}`);

  const correct = results.filter((r) => r.matches).length;
  const incorrect = results.filter((r) => r.foundDateISO && !r.matches).length;
  const missing = results.filter((r) => !r.foundDate && !r.error).length;
  const errors = results.filter((r) => r.error).length;

  console.log(`\n✅ Dates correctes: ${correct}/${results.length}`);
  console.log(`⚠️  Dates différentes: ${incorrect}/${results.length}`);
  console.log(`❌ Dates manquantes: ${missing}/${results.length}`);
  console.log(`❌ Erreurs: ${errors}/${results.length}`);

  console.log(`\n📋 Détails:`);
  results.forEach((r, i) => {
    if (r.matches) {
      console.log(
        `   ${i + 1}. ✅ ${r.url.split('/').pop()}: ${r.foundDateISO} (correspond)`
      );
    } else if (r.foundDateISO) {
      console.log(
        `   ${i + 1}. ⚠️  ${r.url.split('/').pop()}: ${r.foundDateISO} (différent de ${r.expectedDateISO})`
      );
    } else if (r.error) {
      console.log(
        `   ${i + 1}. ❌ ${r.url.split('/').pop()}: Erreur (${r.error})`
      );
    } else {
      console.log(
        `   ${i + 1}. ❌ ${r.url.split('/').pop()}: Date non trouvée`
      );
    }
  });
}

// Exécuter les tests
testMultipleUrls().catch(console.error);
