/**
 * TEST RAPIDE 2022 - Vérification des optimisations ultimes
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function test2022Rapide() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST RAPIDE 2022 - Vérification optimisations ultimes');
  console.log('='.repeat(80) + '\n');

  const tests = [
    { year: 2022, month: 'avril', name: '2022 Avril (timeout avant)' },
    { year: 2022, month: 'mai', name: '2022 Mai (timeout avant)' },
    { year: 2022, month: 'juin', name: '2022 Juin (timeout avant)' },
  ];

  console.log('⏳ Attente de 20 secondes pour le déploiement Vercel...\n');
  await sleep(20000);

  const results = [];

  for (const test of tests) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`📋 TEST: ${test.name}`);
    console.log(`${'-'.repeat(80)}`);

    try {
      const startTime = Date.now();
      const url = `${API_URL}?source=turf-fr&years=${test.year}&months=${test.month}`;
      console.log(`   🔄 Requête en cours...`);

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
        });
        continue;
      }

      const total = data.length;
      const withReports = data.filter((r) => r.arrivalReport).length;
      const unknownHippo = data.filter((r) => r.hippodrome === 'Inconnu').length;
      const reportRate = total > 0 ? ((withReports / total) * 100).toFixed(1) : 0;
      const unknownRate = total > 0 ? ((unknownHippo / total) * 100).toFixed(1) : 0;

      console.log(`   ✅ SUCCÈS (plus de timeout!)`);
      console.log(`   ⏱️  Durée: ${duration}s`);
      console.log(`   📊 Réunions: ${total}`);
      console.log(`   📈 Rapports: ${withReports} (${reportRate}%)`);
      console.log(`   🏇 Hippodromes inconnus: ${unknownHippo} (${unknownRate}%)`);

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
        results.push({
          test: test.name,
          status: 'timeout',
          error: 'Timeout',
        });
      } else {
        results.push({
          test: test.name,
          status: 'error',
          error: error.message,
        });
      }
    }

    await sleep(3000);
  }

  // Résumé
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ');
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

    console.log(`📈 Taux moyen de rapports: ${avgReportRate.toFixed(1)}%`);
    console.log(`🏇 Taux moyen d'hippodromes inconnus: ${avgUnknownRate.toFixed(1)}%`);
  }

  if (timeouts === 0 && success === results.length) {
    console.log(`\n🎉 SUCCÈS TOTAL ! Plus aucun timeout pour 2022 !`);
  } else if (timeouts > 0) {
    console.log(`\n⚠️  Encore ${timeouts} timeout(s) - optimisations supplémentaires nécessaires`);
  }

  const fs = await import('fs');
  fs.writeFileSync('test-2022-rapide-results.json', JSON.stringify(results, null, 2));
  console.log(`\n✅ Résultats sauvegardés dans test-2022-rapide-results.json`);
}

test2022Rapide().catch((error) => {
  console.error('ERREUR FATALE:', error);
  process.exit(1);
});

