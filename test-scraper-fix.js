// Test du scraper amélioré avec les vraies URLs de janvier 2025
import * as cheerio from 'cheerio';

async function testScrapeArrivalReport(reunionUrl) {
  console.log(`\n=== Test: ${reunionUrl} ===`);
  
  try {
    // NE PAS convertir l'URL - utiliser directement celle fournie
    // Les pages /partants-programmes/ contiennent déjà les rapports
    const response = await fetch(reunionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Referer: 'https://www.turf-fr.com/',
      },
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    let arrivalReport = null;

    // PRIORITÉ 1 : Chercher dans #decompte_depart_course
    const $decompte = $('#decompte_depart_course');
    if ($decompte.length > 0) {
      const decompteText = $decompte.text();
      const decompteMatch = decompteText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i);
      if (decompteMatch) {
        let candidate = decompteMatch[1].trim();
        candidate = candidate.replace(/\s*[-–]\s*/g, '-');
        const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
        if (numbers.length >= 3) {
          const validNumbers = numbers.filter(n => {
            const num = parseInt(n);
            return num >= 1 && num <= 30;
          });
          if (validNumbers.length >= 3) {
            arrivalReport = validNumbers.join('-');
            console.log(`✅ Trouvé dans #decompte_depart_course: ${arrivalReport}`);
            return arrivalReport;
          }
        }
      }
    }

    // PRIORITÉ 1b : Chercher dans .title2 (les rapports par course)
    if (!arrivalReport) {
      const $title2 = $('.title2');
      $title2.each((i, elem) => {
        if (arrivalReport) return false;
        const $elem = $(elem);
        const text = $elem.text();
        const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i);
        if (match) {
          let candidate = match[1].trim();
          candidate = candidate.replace(/\s+/g, ' ').replace(/\s*[-–]\s*/g, '-');
          const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
          if (numbers.length >= 3) {
            const validNumbers = numbers.filter(n => {
              const num = parseInt(n);
              return num >= 1 && num <= 30;
            });
            if (validNumbers.length >= 3) {
              arrivalReport = validNumbers.join('-');
              console.log(`✅ Trouvé dans .title2[${i}]: ${arrivalReport}`);
              return false;
            }
          }
        }
      });
    }

    // PRIORITÉ 2 : Chercher dans tout le body
    if (!arrivalReport) {
      const pageText = $('body').text();
      const arrivalMatches = pageText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/gi);
      if (arrivalMatches && arrivalMatches.length > 0) {
        for (const match of arrivalMatches) {
          const numbersMatch = match.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
          if (numbersMatch) {
            let candidate = numbersMatch[1].trim();
            candidate = candidate.replace(/\s+/g, ' ').replace(/\s*[-–]?\s*/g, '-').replace(/-+/g, '-');
            const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
            if (numbers.length >= 3) {
              const validNumbers = numbers.filter(n => {
                const num = parseInt(n);
                return num >= 1 && num <= 30;
              });
              if (validNumbers.length >= 3) {
                arrivalReport = validNumbers.join('-');
                console.log(`✅ Trouvé dans body: ${arrivalReport}`);
                break;
              }
            }
          }
        }
      }
    }

    if (!arrivalReport) {
      console.log(`❌ Aucun rapport trouvé`);
    }

    return arrivalReport;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return null;
  }
}

// Tester avec les vraies URLs
const testUrls = [
  'https://www.turf-fr.com/partants-programmes/r1-vincennes-38787',
  'https://www.turf-fr.com/partants-programmes/r2-cagnes-sur-mer-38786',
  'https://www.turf-fr.com/partants-programmes/r3-spa-son-pardo-38788',
];

console.log('🧪 Test du scraper amélioré\n');

for (const url of testUrls) {
  await testScrapeArrivalReport(url);
  await new Promise(resolve => setTimeout(resolve, 1000));
}

