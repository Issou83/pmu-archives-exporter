/**
 * Script de vérification à la source
 * Teste plusieurs URLs scrapées pour vérifier la véracité des rapports d'arrivée
 */

import * as cheerio from 'cheerio';

/**
 * Teste une URL et vérifie si le rapport d'arrivée est présent
 */
async function testUrlSource(url, expectedReport = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 VÉRIFICATION SOURCE: ${url}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Test 1: Page /arrivees-rapports/
    const arrivalUrl = url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/');
    console.log(`\n📄 Test URL arrivées: ${arrivalUrl}`);
    
    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 5000);
    
    let response1;
    try {
      response1 = await fetch(arrivalUrl, {
        signal: controller1.signal,
        headers: {
          'User-Agent': 'PMU-Archives-Exporter/1.0',
          Accept: 'text/html',
        },
      });
      clearTimeout(timeout1);
    } catch (error) {
      clearTimeout(timeout1);
      if (error.name === 'AbortError') {
        console.log(`   ⏱️  Timeout (5s)`);
      } else {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
      response1 = null;
    }
    
    let reportFromArrival = null;
    if (response1 && response1.ok) {
      const html1 = await response1.text();
      const $1 = cheerio.load(html1);
      
      // Chercher dans #decompte_depart_course
      const $decompte = $1('#decompte_depart_course');
      if ($decompte.length > 0) {
        const text = $decompte.text();
        const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
        if (match) {
          let candidate = match[1].trim();
          candidate = candidate
            .replace(/\s+/g, ' ')
            .replace(/\s*[-–]\s*/g, '|')
            .replace(/\s+/g, '|')
            .replace(/\|+/g, '|');
          const numbers = candidate.split('|').map(n => n.trim()).filter(n => n.match(/^\d+$/));
          if (numbers.length >= 3) {
            const validNumbers = numbers.filter(n => {
              const num = parseInt(n);
              return num >= 1 && num <= 30;
            });
            if (validNumbers.length >= 3) {
              reportFromArrival = validNumbers.join('-');
              console.log(`   ✅ Rapport trouvé dans /arrivees-rapports/: ${reportFromArrival}`);
            }
          }
        }
      }
      
      if (!reportFromArrival) {
        // Chercher dans le body
        const bodyText = $1('body').text();
        const matches = bodyText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/gi);
        if (matches && matches.length > 0) {
          for (const match of matches) {
            const numbersMatch = match.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
            if (numbersMatch) {
              let candidate = numbersMatch[1].trim();
              candidate = candidate
                .replace(/\s+/g, ' ')
                .replace(/\s*[-–]\s*/g, '|')
                .replace(/\s+/g, '|')
                .replace(/\|+/g, '|');
              const numbers = candidate.split('|').map(n => n.trim()).filter(n => n.match(/^\d+$/));
              if (numbers.length >= 3) {
                const validNumbers = numbers.filter(n => {
                  const num = parseInt(n);
                  return num >= 1 && num <= 30;
                });
                if (validNumbers.length >= 3) {
                  reportFromArrival = validNumbers.join('-');
                  console.log(`   ✅ Rapport trouvé dans body: ${reportFromArrival}`);
                  break;
                }
              }
            }
          }
        }
      }
      
      if (!reportFromArrival) {
        console.log(`   ⚠️  Aucun rapport trouvé dans /arrivees-rapports/`);
      }
    } else if (response1) {
      console.log(`   ⚠️  HTTP ${response1.status} pour /arrivees-rapports/`);
    }
    
    // Test 2: Page originale /partants-programmes/
    console.log(`\n📄 Test URL originale: ${url}`);
    
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 5000);
    
    let response2;
    try {
      response2 = await fetch(url, {
        signal: controller2.signal,
        headers: {
          'User-Agent': 'PMU-Archives-Exporter/1.0',
          Accept: 'text/html',
        },
      });
      clearTimeout(timeout2);
    } catch (error) {
      clearTimeout(timeout2);
      if (error.name === 'AbortError') {
        console.log(`   ⏱️  Timeout (5s)`);
      } else {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
      response2 = null;
    }
    
    let reportFromOriginal = null;
    if (response2 && response2.ok) {
      const html2 = await response2.text();
      const $2 = cheerio.load(html2);
      
      // Chercher dans #decompte_depart_course
      const $decompte2 = $2('#decompte_depart_course');
      if ($decompte2.length > 0) {
        const text = $decompte2.text();
        const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
        if (match) {
          let candidate = match[1].trim();
          candidate = candidate
            .replace(/\s+/g, ' ')
            .replace(/\s*[-–]\s*/g, '|')
            .replace(/\s+/g, '|')
            .replace(/\|+/g, '|');
          const numbers = candidate.split('|').map(n => n.trim()).filter(n => n.match(/^\d+$/));
          if (numbers.length >= 3) {
            const validNumbers = numbers.filter(n => {
              const num = parseInt(n);
              return num >= 1 && num <= 30;
            });
            if (validNumbers.length >= 3) {
              reportFromOriginal = validNumbers.join('-');
              console.log(`   ✅ Rapport trouvé dans /partants-programmes/: ${reportFromOriginal}`);
            }
          }
        }
      }
      
      if (!reportFromOriginal) {
        // Chercher dans le body
        const bodyText = $2('body').text();
        const matches = bodyText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/gi);
        if (matches && matches.length > 0) {
          for (const match of matches) {
            const numbersMatch = match.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
            if (numbersMatch) {
              let candidate = numbersMatch[1].trim();
              candidate = candidate
                .replace(/\s+/g, ' ')
                .replace(/\s*[-–]\s*/g, '|')
                .replace(/\s+/g, '|')
                .replace(/\|+/g, '|');
              const numbers = candidate.split('|').map(n => n.trim()).filter(n => n.match(/^\d+$/));
              if (numbers.length >= 3) {
                const validNumbers = numbers.filter(n => {
                  const num = parseInt(n);
                  return num >= 1 && num <= 30;
                });
                if (validNumbers.length >= 3) {
                  reportFromOriginal = validNumbers.join('-');
                  console.log(`   ✅ Rapport trouvé dans body: ${reportFromOriginal}`);
                  break;
                }
              }
            }
          }
        }
      }
      
      if (!reportFromOriginal) {
        console.log(`   ⚠️  Aucun rapport trouvé dans /partants-programmes/`);
      }
    } else if (response2) {
      console.log(`   ⚠️  HTTP ${response2.status} pour /partants-programmes/`);
    }
    
    // Comparaison
    const foundReport = reportFromArrival || reportFromOriginal;
    console.log(`\n📊 RÉSULTAT:`);
    if (foundReport) {
      console.log(`   ✅ Rapport trouvé à la source: ${foundReport}`);
      if (expectedReport) {
        if (foundReport === expectedReport) {
          console.log(`   ✅ Correspond avec le rapport scrapé: ${expectedReport}`);
        } else {
          console.log(`   ⚠️  Différent du rapport scrapé: ${expectedReport}`);
          console.log(`      Source: ${foundReport}`);
          console.log(`      Scrapé: ${expectedReport}`);
        }
      }
    } else {
      console.log(`   ❌ Aucun rapport trouvé à la source`);
      if (expectedReport) {
        console.log(`   ⚠️  PROBLÈME: Rapport scrapé (${expectedReport}) mais pas trouvé à la source !`);
      } else {
        console.log(`   ✅ Confirmé: Pas de rapport disponible (scrapé: "Non disponible")`);
      }
    }
    
    return {
      url,
      arrivalUrl,
      reportFromArrival,
      reportFromOriginal,
      foundReport,
      expectedReport,
      matches: foundReport === expectedReport,
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
  console.log(`🧪 VÉRIFICATION À LA SOURCE - MULTIPLE URLs`);
  console.log(`${'='.repeat(60)}`);
  
  // URLs avec rapports (selon notre scraper)
  const urlsWithReports = [
    {
      url: 'https://www.turf-fr.com/partants-programmes/r1-saint-cloud-39681',
      expected: '5-10-7-6-1',
    },
    {
      url: 'https://www.turf-fr.com/partants-programmes/r1-vincennes-39686',
      expected: '8-11-4-7-3',
    },
  ];
  
  // URLs sans rapports (selon notre scraper)
  const urlsWithoutReports = [
    'https://www.turf-fr.com/partants-programmes/r1-paris-longchamp-39710',
    'https://www.turf-fr.com/partants-programmes/r1-vichy-39714',
    'https://www.turf-fr.com/partants-programmes/r1-chantilly-39729',
  ];
  
  console.log(`\n📋 URLs AVEC rapports (selon scraper):`);
  const resultsWith = [];
  for (const item of urlsWithReports) {
    const result = await testUrlSource(item.url, item.expected);
    resultsWith.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Délai entre requêtes
  }
  
  console.log(`\n📋 URLs SANS rapports (selon scraper):`);
  const resultsWithout = [];
  for (const url of urlsWithoutReports) {
    const result = await testUrlSource(url, null);
    resultsWithout.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Délai entre requêtes
  }
  
  // Résumé
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RÉSUMÉ DES VÉRIFICATIONS`);
  console.log(`${'='.repeat(60)}`);
  
  console.log(`\n✅ URLs avec rapports:`);
  resultsWith.forEach((r, i) => {
    if (r.foundReport) {
      if (r.matches) {
        console.log(`   ${i + 1}. ✅ ${r.url.split('/').pop()}: ${r.foundReport} (correspond)`);
      } else {
        console.log(`   ${i + 1}. ⚠️  ${r.url.split('/').pop()}: ${r.foundReport} (différent de ${r.expectedReport})`);
      }
    } else {
      console.log(`   ${i + 1}. ❌ ${r.url.split('/').pop()}: Pas trouvé (attendu: ${r.expectedReport})`);
    }
  });
  
  console.log(`\n❌ URLs sans rapports:`);
  resultsWithout.forEach((r, i) => {
    if (r.foundReport) {
      console.log(`   ${i + 1}. ⚠️  ${r.url.split('/').pop()}: ${r.foundReport} (PROBLÈME: trouvé alors qu'on pensait qu'il n'y en avait pas !)`);
    } else {
      console.log(`   ${i + 1}. ✅ ${r.url.split('/').pop()}: Confirmé - Pas de rapport`);
    }
  });
  
  // Statistiques
  const correctWith = resultsWith.filter(r => r.matches).length;
  const incorrectWith = resultsWith.filter(r => r.foundReport && !r.matches).length;
  const missingWith = resultsWith.filter(r => !r.foundReport && r.expectedReport).length;
  
  const correctWithout = resultsWithout.filter(r => !r.foundReport).length;
  const incorrectWithout = resultsWithout.filter(r => r.foundReport).length;
  
  console.log(`\n📈 STATISTIQUES:`);
  console.log(`   URLs avec rapports:`);
  console.log(`      ✅ Correctes: ${correctWith}/${resultsWith.length}`);
  console.log(`      ⚠️  Différentes: ${incorrectWith}/${resultsWith.length}`);
  console.log(`      ❌ Manquantes: ${missingWith}/${resultsWith.length}`);
  console.log(`   URLs sans rapports:`);
  console.log(`      ✅ Correctes: ${correctWithout}/${resultsWithout.length}`);
  console.log(`      ⚠️  Faux négatifs: ${incorrectWithout}/${resultsWithout.length}`);
}

// Exécuter les tests
testMultipleUrls().catch(console.error);

