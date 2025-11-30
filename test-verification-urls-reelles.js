/**
 * TEST DE VÉRIFICATION - URLs Réelles avec Browser
 * Compare ce que le scraper trouve vs ce qui est réellement sur les pages
 */

// URLs de test (exemples de réunions réelles)
const TEST_URLS = [
  // Exemples d'URLs de réunions (à remplacer par de vraies URLs trouvées)
  'https://www.turf-fr.com/partants-programmes/r1-vincennes-12345',
  'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-vincennes-12345',
];

async function testVerificationUrlsReelles() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST DE VÉRIFICATION - URLs Réelles');
  console.log('='.repeat(80) + '\n');

  const results = [];

  for (const url of TEST_URLS) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`🔍 Test URL: ${url}`);
    console.log(`${'-'.repeat(80)}`);

    try {
      // Test 1: Vérifier si l'URL existe
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status} - URL non accessible`);
        results.push({
          url,
          status: 'error',
          httpStatus: response.status,
          error: `HTTP ${response.status}`,
        });
        continue;
      }

      const html = await response.text();
      console.log(`   ✅ URL accessible (${html.length} caractères)`);

      // Test 2: Chercher le rapport d'arrivée dans le HTML
      const arrivalPatterns = [
        /arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i,
        /["']arriv[ée]e["']\s*:\s*["'](\d+(?:-\d+){2,})["']/i,
      ];

      let foundReport = null;
      for (const pattern of arrivalPatterns) {
        const match = html.match(pattern);
        if (match) {
          foundReport = match[1];
          break;
        }
      }

      // Test 3: Chercher l'hippodrome
      const hippodromePatterns = [
        /<h1[^>]*>([^<]+)<\/h1>/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ];

      let foundHippodrome = null;
      for (const pattern of hippodromePatterns) {
        const match = html.match(pattern);
        if (match) {
          foundHippodrome = match[1];
          break;
        }
      }

      // Test 4: Chercher la date
      const datePatterns = [
        /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      ];

      let foundDate = null;
      for (const pattern of datePatterns) {
        const match = html.match(pattern);
        if (match) {
          foundDate = match[0];
          break;
        }
      }

      console.log(`   📊 Résultats:`);
      console.log(`      - Rapport: ${foundReport || 'NON TROUVÉ'}`);
      console.log(`      - Hippodrome: ${foundHippodrome || 'NON TROUVÉ'}`);
      console.log(`      - Date: ${foundDate || 'NON TROUVÉ'}`);

      results.push({
        url,
        status: 'success',
        foundReport,
        foundHippodrome,
        foundDate,
        htmlLength: html.length,
      });
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      results.push({
        url,
        status: 'error',
        error: error.message,
      });
    }
  }

  // Sauvegarder les résultats
  const fs = await import('fs');
  fs.writeFileSync(
    'test-verification-urls-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log(`\n✅ Résultats sauvegardés dans test-verification-urls-results.json`);

  // Résumé
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  const success = results.filter((r) => r.status === 'success').length;
  const withReports = results.filter((r) => r.foundReport).length;
  console.log(`✅ URLs testées: ${success}/${results.length}`);
  console.log(`📈 Rapports trouvés: ${withReports}/${success}`);
}

testVerificationUrlsReelles().catch((error) => {
  console.error('ERREUR FATALE:', error);
  process.exit(1);
});

