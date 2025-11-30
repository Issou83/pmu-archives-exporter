/**
 * TEST AMÉLIORATION - Vérification de la recherche des liens /arrivees-rapports/
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAmeliorationRapports() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST AMÉLIORATION - Recherche liens /arrivees-rapports/');
  console.log('='.repeat(80) + '\n');

  // Attendre que le déploiement Vercel soit à jour
  console.log('⏳ Attente de 20 secondes pour le déploiement Vercel...\n');
  await sleep(20000);

  const testCases = [
    { year: 2024, month: 'janvier', name: '2024 Janvier' },
    { year: 2023, month: 'decembre', name: '2023 Décembre' },
    { year: 2022, month: 'janvier', name: '2022 Janvier (test timeout)' },
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`📋 TEST: ${testCase.name}`);
    console.log(`${'-'.repeat(80)}`);

    try {
      const url = `${API_URL}?source=turf-fr&years=${testCase.year}&months=${testCase.month}`;
      console.log(`   🔄 Requête API: ${url}`);

      const startTime = Date.now();
      const response = await fetch(url);
      const elapsedTime = Date.now() - startTime;

      if (!response.ok) {
        if (response.status === 504) {
          console.log(`   ❌ TIMEOUT (504) après ${(elapsedTime / 1000).toFixed(2)}s`);
          results.push({
            ...testCase,
            status: 'timeout',
            elapsedTime: elapsedTime / 1000,
            totalReunions: 0,
            withReports: 0,
            reportRate: 0,
          });
          continue;
        } else {
          console.log(`   ❌ Erreur HTTP: ${response.status} ${response.statusText}`);
          results.push({
            ...testCase,
            status: 'error',
            error: `${response.status} ${response.statusText}`,
          });
          continue;
        }
      }

      const data = await response.json();
      const elapsedSeconds = (elapsedTime / 1000).toFixed(2);

      const withReports = data.filter((r) => r.arrivalReport);
      const withoutReports = data.filter((r) => !r.arrivalReport);
      const reportRate = data.length > 0 ? ((withReports.length / data.length) * 100).toFixed(1) : 0;

      console.log(`   ✅ Réponse reçue en ${elapsedSeconds}s`);
      console.log(`   📊 Total réunions: ${data.length}`);
      console.log(`   ✅ Avec rapports: ${withReports.length} (${reportRate}%)`);
      console.log(`   ❌ Sans rapports: ${withoutReports.length} (${(100 - parseFloat(reportRate)).toFixed(1)}%)`);

      // Afficher quelques exemples
      if (withReports.length > 0) {
        console.log(`\n   📋 Exemples de réunions avec rapports:`);
        withReports.slice(0, 3).forEach((r) => {
          console.log(`      - ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}: ${r.arrivalReport}`);
        });
      }

      if (withoutReports.length > 0) {
        console.log(`\n   📋 Exemples de réunions sans rapports:`);
        withoutReports.slice(0, 3).forEach((r) => {
          console.log(`      - ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}: ${r.url}`);
        });
      }

      results.push({
        ...testCase,
        status: 'success',
        elapsedTime: elapsedTime / 1000,
        totalReunions: data.length,
        withReports: withReports.length,
        withoutReports: withoutReports.length,
        reportRate: parseFloat(reportRate),
      });
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      results.push({
        ...testCase,
        status: 'error',
        error: error.message,
      });
    }

    // Pause entre les tests
    if (testCase !== testCases[testCases.length - 1]) {
      console.log(`\n   ⏳ Pause de 5 secondes avant le prochain test...`);
      await sleep(5000);
    }
  }

  // Résumé final
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(80) + '\n');

  const successful = results.filter((r) => r.status === 'success');
  const timeouts = results.filter((r) => r.status === 'timeout');
  const errors = results.filter((r) => r.status === 'error');

  console.log(`✅ Succès: ${successful.length}/${results.length}`);
  console.log(`⏱️  Timeouts: ${timeouts.length}/${results.length}`);
  console.log(`❌ Erreurs: ${errors.length}/${results.length}\n`);

  if (successful.length > 0) {
    console.log('📈 Taux de rapports par test:');
    successful.forEach((r) => {
      console.log(
        `   - ${r.name}: ${r.withReports}/${r.totalReunions} (${r.reportRate}%) - ${r.elapsedTime.toFixed(2)}s`
      );
    });

    const avgReportRate =
      successful.reduce((sum, r) => sum + r.reportRate, 0) / successful.length;
    console.log(`\n   📊 Taux moyen: ${avgReportRate.toFixed(1)}%`);
  }

  if (timeouts.length > 0) {
    console.log('\n⏱️  Tests avec timeout:');
    timeouts.forEach((r) => {
      console.log(`   - ${r.name}: Timeout après ${r.elapsedTime.toFixed(2)}s`);
    });
  }

  if (errors.length > 0) {
    console.log('\n❌ Tests avec erreurs:');
    errors.forEach((r) => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  // Sauvegarder les résultats
  const fs = require('fs');
  fs.writeFileSync(
    'test-amelioration-rapports-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log(`\n💾 Résultats sauvegardés dans test-amelioration-rapports-results.json`);

  return results;
}

testAmeliorationRapports().catch(console.error);

