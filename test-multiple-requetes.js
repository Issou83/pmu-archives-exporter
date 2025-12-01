/**
 * TEST MULTIPLE REQUÊTES - Identifier les problèmes de cache et de rapports
 */

const https = require('https');

function fetchUrl(url, timeout = 70000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let responseData = '';
    let statusCode = null;

    const req = https.get(url, (res) => {
      statusCode = res.statusCode;
      res.on('data', (chunk) => {
        responseData += chunk.toString();
      });
      res.on('end', () => {
        const elapsedTime = Date.now() - startTime;
        try {
          const data = JSON.parse(responseData);
          resolve({
            statusCode,
            data,
            elapsedTime: (elapsedTime / 1000).toFixed(2),
          });
        } catch (e) {
          resolve({
            statusCode,
            data: responseData.substring(0, 500),
            elapsedTime: (elapsedTime / 1000).toFixed(2),
            parseError: e.message,
          });
        }
      });
    });

    req.on('error', (error) => {
      const elapsedTime = Date.now() - startTime;
      reject({ error, elapsedTime: (elapsedTime / 1000).toFixed(2) });
    });

    req.setTimeout(timeout, () => {
      const elapsedTime = Date.now() - startTime;
      req.destroy();
      reject({ error: new Error('Request timeout'), elapsedTime: (elapsedTime / 1000).toFixed(2) });
    });
  });
}

async function testMultipleRequetes() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST MULTIPLE REQUÊTES - Identification des problèmes');
  console.log('='.repeat(80) + '\n');

  const baseUrl = 'https://pmu-archives-exporter.vercel.app/api/archives';

  const testCases = [
    {
      name: 'Test 1: 1 mois sans filtres (rapports activés)',
      url: `${baseUrl}?source=turf-fr&years=2025&months=aout`,
      expectedReports: true,
    },
    {
      name: 'Test 2: 1 mois avec filtres (rapports activés)',
      url: `${baseUrl}?source=turf-fr&years=2025&months=aout&reunionNumbers=1&countries=FR`,
      expectedReports: true,
    },
    {
      name: 'Test 3: 2 mois avec filtres (rapports activés)',
      url: `${baseUrl}?source=turf-fr&years=2025&months=aout%2Cmai&reunionNumbers=1&countries=FR`,
      expectedReports: true,
    },
    {
      name: 'Test 4: 2 mois sans filtres (rapports désactivés)',
      url: `${baseUrl}?source=turf-fr&years=2025&months=aout%2Cmai`,
      expectedReports: false,
    },
    {
      name: 'Test 5: 1 mois avec filtre hippodrome (rapports activés)',
      url: `${baseUrl}?source=turf-fr&years=2025&months=aout&hippodromes=deauville`,
      expectedReports: true,
    },
    {
      name: 'Test 6: 1 mois avec filtre date (rapports activés)',
      url: `${baseUrl}?source=turf-fr&years=2025&months=aout&dateFrom=2025-08-15&dateTo=2025-08-20`,
      expectedReports: true,
    },
  ];

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`📋 ${testCase.name}`);
    console.log(`${'-'.repeat(80)}`);
    console.log(`URL: ${testCase.url}\n`);

    try {
      const result = await fetchUrl(testCase.url);
      const data = Array.isArray(result.data) ? result.data : [];
      const withReports = data.filter((r) => r.arrivalReport).length;
      const reportPct = data.length > 0 ? ((withReports / data.length) * 100).toFixed(1) : 0;

      const testResult = {
        name: testCase.name,
        status: result.statusCode,
        elapsedTime: result.elapsedTime,
        totalReunions: data.length,
        withReports,
        reportPct: `${reportPct}%`,
        expectedReports: testCase.expectedReports,
        success: result.statusCode === 200,
        hasReports: withReports > 0,
        reportMatch: testCase.expectedReports ? withReports > 0 : true, // Si rapports désactivés, on accepte 0
      };

      results.push(testResult);

      console.log(`✅ Status: ${result.statusCode}`);
      console.log(`⏱️  Temps: ${result.elapsedTime}s`);
      console.log(`📊 Total réunions: ${data.length}`);
      console.log(`📄 Avec rapports: ${withReports} (${reportPct}%)`);
      console.log(
        `🎯 Attendu: ${testCase.expectedReports ? 'Avec rapports' : 'Sans rapports'}`
      );
      console.log(
        `${
          testResult.reportMatch
            ? '✅'
            : '❌'
        } Rapports: ${testResult.hasReports ? 'Trouvés' : 'Non trouvés'} (${testResult.reportMatch ? 'OK' : 'PROBLÈME'})`
      );

      if (result.statusCode === 504) {
        console.log(`❌ TIMEOUT détecté !`);
      }
    } catch (errorResult) {
      const testResult = {
        name: testCase.name,
        status: 'error',
        elapsedTime: errorResult.elapsedTime || 'N/A',
        error: errorResult.error?.message || 'Unknown error',
        success: false,
      };

      results.push(testResult);

      console.log(`❌ Erreur: ${testResult.error}`);
      console.log(`⏱️  Temps écoulé: ${testResult.elapsedTime}s`);
    }

    // Pause entre les tests pour éviter le rate limiting
    if (i < testCases.length - 1) {
      console.log(`\n⏳ Pause de 3 secondes avant le prochain test...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Résumé
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(80) + '\n');

  const successCount = results.filter((r) => r.success).length;
  const timeoutCount = results.filter((r) => r.status === 504).length;
  const reportIssues = results.filter((r) => r.reportMatch === false).length;

  console.log(`✅ Succès: ${successCount}/${results.length}`);
  console.log(`❌ Timeouts: ${timeoutCount}`);
  console.log(`⚠️  Problèmes de rapports: ${reportIssues}`);

  console.log(`\n📋 Détails par test:\n`);
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const reportIcon = result.reportMatch !== false ? '✅' : '⚠️';
    console.log(
      `${icon} ${result.name}: Status ${result.status}, ${result.totalReunions || 0} réunions, ${result.withReports || 0} rapports ${reportIcon}`
    );
  });

  // Problèmes identifiés
  if (timeoutCount > 0 || reportIssues > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔍 PROBLÈMES IDENTIFIÉS');
    console.log('='.repeat(80) + '\n');

    if (timeoutCount > 0) {
      console.log(`❌ Timeouts détectés:`);
      results
        .filter((r) => r.status === 504)
        .forEach((r) => {
          console.log(`   - ${r.name}`);
        });
    }

    if (reportIssues > 0) {
      console.log(`\n⚠️  Problèmes de rapports:`);
      results
        .filter((r) => r.reportMatch === false)
        .forEach((r) => {
          console.log(
            `   - ${r.name}: Attendu ${r.expectedReports ? 'avec' : 'sans'} rapports, obtenu ${r.hasReports ? 'avec' : 'sans'}`
          );
        });
    }
  } else {
    console.log(`\n🎉 Tous les tests sont passés avec succès !`);
  }
}

testMultipleRequetes().catch(console.error);

