/**
 * TEST RAPIDE - Affiche les résultats en temps réel
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRapide() {
  console.log('='.repeat(80));
  console.log('TEST RAPIDE - Vérification des améliorations');
  console.log('='.repeat(80));
  console.log('\n⏳ Attente de 10 secondes pour le déploiement Vercel...\n');
  await sleep(10000);

  // Test sur quelques mois problématiques
  const tests = [
    { year: 2022, month: 'avril', name: '2022 Avril (problématique)' },
    { year: 2022, month: 'mai', name: '2022 Mai (problématique)' },
    { year: 2023, month: 'janvier', name: '2023 Janvier' },
    { year: 2024, month: 'janvier', name: '2024 Janvier' },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`TEST: ${test.name}`);
    console.log(`${'-'.repeat(80)}`);

    try {
      const startTime = Date.now();
      const response = await fetch(
        `${API_URL}?source=turf-fr&years=${test.year}&months=${test.month}`,
        {
          signal: AbortSignal.timeout(70000),
        }
      );
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`   ❌ Erreur HTTP ${response.status}`);
        console.error(`   Message: ${errorText.substring(0, 200)}`);
        results.push({
          test: test.name,
          status: 'failed',
          error: `HTTP ${response.status}`,
          duration,
        });
        continue;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error(`   ❌ Réponse invalide`);
        results.push({
          test: test.name,
          status: 'failed',
          error: 'Réponse invalide',
          duration,
        });
        continue;
      }

      // Statistiques
      const totalReunions = data.length;
      const withReports = data.filter((r) => r.arrivalReport).length;
      const unknownHippo = data.filter((r) => r.hippodrome === 'Inconnu').length;
      const reportRate = totalReunions > 0 ? ((withReports / totalReunions) * 100).toFixed(1) : 0;

      console.log(`   ✅ Succès`);
      console.log(`   ⏱️  Durée: ${duration}s`);
      console.log(`   📊 Réunions: ${totalReunions}`);
      console.log(`   📈 Rapports: ${withReports} (${reportRate}%)`);
      console.log(`   🏇 Hippodromes inconnus: ${unknownHippo}`);

      results.push({
        test: test.name,
        status: 'success',
        duration,
        totalReunions,
        withReports,
        reportRate: parseFloat(reportRate),
        unknownHippo,
      });
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      results.push({
        test: test.name,
        status: 'error',
        error: error.message,
      });
    }

    // Pause entre les tests
    await sleep(2000);
  }

  // Résumé
  console.log(`\n${'='.repeat(80)}`);
  console.log('RÉSUMÉ DES TESTS');
  console.log('='.repeat(80));

  const success = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'failed' || r.status === 'error').length;

  console.log(`\n✅ Succès: ${success}/${results.length}`);
  console.log(`❌ Échecs: ${failed}/${results.length}`);

  if (success > 0) {
    const avgReportRate =
      results
        .filter((r) => r.reportRate !== undefined)
        .reduce((sum, r) => sum + r.reportRate, 0) / success;
    const totalUnknown = results
      .filter((r) => r.unknownHippo !== undefined)
      .reduce((sum, r) => sum + r.unknownHippo, 0);

    console.log(`\n📈 Taux moyen de rapports: ${avgReportRate.toFixed(1)}%`);
    console.log(`🏇 Total hippodromes inconnus: ${totalUnknown}`);
  }

  // Sauvegarder
  const fs = await import('fs');
  fs.writeFileSync('test-rapide-results.json', JSON.stringify(results, null, 2));
  console.log(`\n✅ Résultats sauvegardés dans test-rapide-results.json`);
}

testRapide().catch((error) => {
  console.error('ERREUR:', error);
  process.exit(1);
});

