/**
 * TEST PRODUCTION FINAL - Vérification de toutes les améliorations
 * Teste directement l'API Vercel et affiche les résultats
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testProduction() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST PRODUCTION FINAL - Vérification des améliorations');
  console.log('='.repeat(80) + '\n');

  const tests = [
    {
      name: '2022 Avril (problématique - timeout)',
      params: { years: 2022, months: 'avril' },
      priority: 'high',
    },
    {
      name: '2022 Mai (problématique - timeout)',
      params: { years: 2022, months: 'mai' },
      priority: 'high',
    },
    {
      name: '2023 Janvier (référence)',
      params: { years: 2023, months: 'janvier' },
      priority: 'medium',
    },
    {
      name: '2024 Janvier (référence)',
      params: { years: 2024, months: 'janvier' },
      priority: 'medium',
    },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`📋 TEST: ${test.name}`);
    console.log(`${'-'.repeat(80)}`);

    try {
      const startTime = Date.now();
      const url = `${API_URL}?source=turf-fr&years=${test.params.years}&months=${test.params.months}`;
      console.log(`   🔄 Requête: ${url.substring(0, 100)}...`);

      const response = await fetch(url, {
        signal: AbortSignal.timeout(70000),
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          errorJson = { message: errorText.substring(0, 200) };
        }

        console.log(`   ❌ Erreur HTTP ${response.status}`);
        console.log(`   Message: ${errorJson.message || errorJson.error?.message || errorText.substring(0, 200)}`);

        results.push({
          test: test.name,
          status: response.status === 504 ? 'timeout' : 'failed',
          httpStatus: response.status,
          duration,
          error: errorJson.message || errorJson.error?.message || 'Erreur inconnue',
        });
        continue;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.log(`   ❌ Réponse invalide (pas un tableau)`);
        results.push({
          test: test.name,
          status: 'failed',
          duration,
          error: 'Réponse invalide',
        });
        continue;
      }

      // Statistiques détaillées
      const total = data.length;
      const withReports = data.filter((r) => r.arrivalReport).length;
      const unknownHippo = data.filter((r) => r.hippodrome === 'Inconnu').length;
      const reportRate = total > 0 ? ((withReports / total) * 100).toFixed(1) : 0;
      const unknownRate = total > 0 ? ((unknownHippo / total) * 100).toFixed(1) : 0;

      console.log(`   ✅ Succès`);
      console.log(`   ⏱️  Durée: ${duration}s`);
      console.log(`   📊 Réunions: ${total}`);
      console.log(`   📈 Rapports: ${withReports} (${reportRate}%)`);
      console.log(`   🏇 Hippodromes inconnus: ${unknownHippo} (${unknownRate}%)`);

      // Exemples
      if (data.length > 0) {
        const withReport = data.find((r) => r.arrivalReport);
        const withoutReport = data.find((r) => !r.arrivalReport);
        const knownHippo = data.find((r) => r.hippodrome !== 'Inconnu');
        const unknownHippoEx = data.find((r) => r.hippodrome === 'Inconnu');

        console.log(`\n   📋 Exemples:`);
        if (withReport) {
          console.log(`      ✅ Avec rapport: ${withReport.hippodrome} - ${withReport.dateISO} - ${withReport.arrivalReport}`);
        }
        if (withoutReport) {
          console.log(`      ❌ Sans rapport: ${withoutReport.hippodrome} - ${withoutReport.dateISO}`);
        }
        if (knownHippo) {
          console.log(`      🏇 Hippodrome connu: ${knownHippo.hippodrome} - ${knownHippo.dateISO}`);
        }
        if (unknownHippoEx) {
          console.log(`      ⚠️  Hippodrome inconnu: ${unknownHippoEx.hippodrome} - ${unknownHippoEx.url.substring(0, 80)}`);
        }
      }

      results.push({
        test: test.name,
        status: 'success',
        duration: parseFloat(duration),
        totalReunions: total,
        withReports,
        reportRate: parseFloat(reportRate),
        unknownHippo,
        unknownRate: parseFloat(unknownRate),
      });
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      if (error.name === 'AbortError') {
        console.log(`   (Timeout)`);
      }
      results.push({
        test: test.name,
        status: 'error',
        error: error.message,
      });
    }

    // Pause entre les tests
    await sleep(3000);
  }

  // Résumé final
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(80) + '\n');

  const success = results.filter((r) => r.status === 'success').length;
  const timeouts = results.filter((r) => r.status === 'timeout').length;
  const failed = results.filter((r) => r.status === 'failed' || r.status === 'error').length;

  console.log(`✅ Succès: ${success}/${results.length}`);
  console.log(`⏱️  Timeouts: ${timeouts}/${results.length}`);
  console.log(`❌ Échecs: ${failed}/${results.length}\n`);

  if (success > 0) {
    const avgReportRate =
      results
        .filter((r) => r.reportRate !== undefined)
        .reduce((sum, r) => sum + r.reportRate, 0) / success;
    const avgUnknownRate =
      results
        .filter((r) => r.unknownRate !== undefined)
        .reduce((sum, r) => sum + r.unknownRate, 0) / success;
    const totalUnknown = results
      .filter((r) => r.unknownHippo !== undefined)
      .reduce((sum, r) => sum + r.unknownHippo, 0);
    const totalReports = results
      .filter((r) => r.withReports !== undefined)
      .reduce((sum, r) => sum + r.withReports, 0);
    const totalReunions = results
      .filter((r) => r.totalReunions !== undefined)
      .reduce((sum, r) => sum + r.totalReunions, 0);

    console.log(`📈 Taux moyen de rapports: ${avgReportRate.toFixed(1)}%`);
    console.log(`🏇 Taux moyen d'hippodromes inconnus: ${avgUnknownRate.toFixed(1)}%`);
    console.log(`📊 Total réunions: ${totalReunions}`);
    console.log(`📈 Total rapports: ${totalReports} (${totalReunions > 0 ? ((totalReports / totalReunions) * 100).toFixed(1) : 0}%)`);
    console.log(`🏇 Total hippodromes inconnus: ${totalUnknown} (${totalReunions > 0 ? ((totalUnknown / totalReunions) * 100).toFixed(1) : 0}%)\n`);
  }

  // Détails par test
  console.log('📋 Détails par test:');
  results.forEach((r) => {
    const icon = r.status === 'success' ? '✅' : r.status === 'timeout' ? '⏱️' : '❌';
    console.log(`   ${icon} ${r.test}`);
    if (r.status === 'success') {
      console.log(`      Durée: ${r.duration}s | Rapports: ${r.reportRate}% | Inconnus: ${r.unknownRate}%`);
    } else if (r.status === 'timeout') {
      console.log(`      Timeout après ${r.duration}s`);
    } else {
      console.log(`      Erreur: ${r.error || 'Inconnue'}`);
    }
  });

  // Sauvegarder
  const fs = await import('fs');
  fs.writeFileSync('test-production-final-results.json', JSON.stringify(results, null, 2));
  console.log(`\n✅ Résultats sauvegardés dans test-production-final-results.json`);
}

testProduction().catch((error) => {
  console.error('ERREUR FATALE:', error);
  process.exit(1);
});

