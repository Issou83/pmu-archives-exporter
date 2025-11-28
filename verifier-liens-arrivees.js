// Vérifier si les pages ont des liens vers /arrivees-rapports/
import * as cheerio from 'cheerio';

const testUrls = [
  { url: 'https://www.turf-fr.com/partants-programmes/r4-mauquenchy-38832', id: 'r4-mauquenchy-38832' },
  { url: 'https://www.turf-fr.com/partants-programmes/r1-vincennes-41262', id: 'r1-vincennes-41262' },
  { url: 'https://www.turf-fr.com/partants-programmes/r2-compiegne-41263', id: 'r2-compiegne-41263' },
];

async function findArrivalReportLinks(pageUrl, reunionId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Recherche de liens vers /arrivees-rapports/ pour: ${reunionId}`);
  console.log(`   Page: ${pageUrl}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Referer: 'https://www.turf-fr.com/',
      },
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Chercher tous les liens vers /arrivees-rapports/
    console.log(`\n1️⃣ Liens vers /arrivees-rapports/:`);
    const $arrivalLinks = $('a[href*="arrivees-rapports"]');
    console.log(`   Nombre de liens trouvés: ${$arrivalLinks.length}`);
    
    const relevantLinks = [];
    $arrivalLinks.each((i, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      const text = $link.text().trim();
      const fullUrl = href.startsWith('http') ? href : `https://www.turf-fr.com${href}`;
      
      // Vérifier si le lien correspond à cette réunion
      if (href.includes(reunionId) || href.includes(reunionId.replace(/-/g, ''))) {
        relevantLinks.push({ href: fullUrl, text, isRelevant: true });
        console.log(`   ✅ ${i + 1}. "${text}" → ${fullUrl} [PERTINENT]`);
      } else {
        console.log(`   ${i + 1}. "${text}" → ${fullUrl}`);
      }
    });

    // 2. Essayer de construire l'URL d'arrivée-rapport à partir de l'URL de programme
    console.log(`\n2️⃣ Tentative de construction de l'URL d'arrivée-rapport:`);
    const baseUrl = pageUrl.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/');
    console.log(`   URL construite: ${baseUrl}`);
    
    // Tester cette URL
    try {
      const testResponse = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (testResponse.ok) {
        console.log(`   ✅ URL valide (HTTP ${testResponse.status})`);
        const testHtml = await testResponse.text();
        const $test = cheerio.load(testHtml);
        
        // Chercher le rapport dans cette page
        const $testDecompte = $test('#decompte_depart_course');
        if ($testDecompte.length > 0) {
          const testText = $testDecompte.text();
          const testMatch = testText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
          if (testMatch) {
            console.log(`   ✅ RAPPORT TROUVÉ: "${testMatch[1]}"`);
            return { found: true, url: baseUrl, report: testMatch[1] };
          } else {
            console.log(`   ⚠️  Page trouvée mais pas de rapport dans #decompte_depart_course`);
          }
        }
        
        // Chercher dans .title2
        const $testTitle2 = $test('.title2');
        $testTitle2.each((i, elem) => {
          const $elem = $test(elem);
          const text = $elem.text();
          const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
          if (match) {
            console.log(`   ✅ RAPPORT TROUVÉ dans .title2[${i}]: "${match[1]}"`);
            return { found: true, url: baseUrl, report: match[1] };
          }
        });
      } else {
        console.log(`   ❌ URL invalide (HTTP ${testResponse.status})`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors du test: ${error.message}`);
    }

    // 3. Chercher dans les liens "VOIR CETTE RÉUNION" ou similaires
    console.log(`\n3️⃣ Recherche de liens "VOIR CETTE RÉUNION" ou similaires:`);
    const $seeLinks = $('a:contains("VOIR"), a:contains("voir"), a:contains("Réunion"), a:contains("réunion")');
    $seeLinks.each((i, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      const text = $link.text().trim();
      if (href && (href.includes('arrivees-rapports') || href.includes('arrivees'))) {
        console.log(`   ${i + 1}. "${text}" → ${href}`);
      }
    });

    return { found: false };

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return { found: false };
  }
}

async function main() {
  for (const test of testUrls) {
    await findArrivalReportLinks(test.url, test.id);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main().catch(console.error);

