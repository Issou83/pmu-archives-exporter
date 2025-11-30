/**
 * TEST AVEC LOG FICHIER - Pour voir les résultats en temps réel
 */

const fs = require('fs');
const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  fs.appendFileSync('test-log.txt', logMessage);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAvecLog() {
  // Nettoyer le fichier de log
  fs.writeFileSync('test-log.txt', '');
  
  log('='.repeat(80));
  log('TEST AVEC LOG - Vérification des améliorations');
  log('='.repeat(80));
  log('\n⏳ Attente de 10 secondes pour le déploiement Vercel...\n');
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
    log(`\n${'-'.repeat(80)}`);
    log(`TEST: ${test.name}`);
    log(`${'-'.repeat(80)}`);

    try {
      const startTime = Date.now();
      log(`   🔄 Requête en cours...`);
      
      const response = await fetch(
        `${API_URL}?source=turf-fr&years=${test.year}&months=${test.month}`,
        {
          signal: AbortSignal.timeout(70000),
        }
      );
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        const errorText = await response.text();
        log(`   ❌ Erreur HTTP ${response.status}`);
        log(`   Message: ${errorText.substring(0, 200)}`);
        results.push({
          test: test.name,
          status: 'failed',
          error: `HTTP ${response.status}`,
          duration,
        });
        continue;
      }

      log(`   ✅ Réponse reçue (${duration}s)`);
      log(`   📥 Parsing JSON...`);
      
      const data = await response.json();

      if (!Array.isArray(data)) {
        log(`   ❌ Réponse invalide`);
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

      log(`   ✅ Succès`);
      log(`   ⏱️  Durée: ${duration}s`);
      log(`   📊 Réunions: ${totalReunions}`);
      log(`   📈 Rapports: ${withReports} (${reportRate}%)`);
      log(`   🏇 Hippodromes inconnus: ${unknownHippo}`);

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
      log(`   ❌ Erreur: ${error.message}`);
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
  log(`\n${'='.repeat(80)}`);
  log('RÉSUMÉ DES TESTS');
  log('='.repeat(80));

  const success = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'failed' || r.status === 'error').length;

  log(`\n✅ Succès: ${success}/${results.length}`);
  log(`❌ Échecs: ${failed}/${results.length}`);

  if (success > 0) {
    const avgReportRate =
      results
        .filter((r) => r.reportRate !== undefined)
        .reduce((sum, r) => sum + r.reportRate, 0) / success;
    const totalUnknown = results
      .filter((r) => r.unknownHippo !== undefined)
      .reduce((sum, r) => sum + r.unknownHippo, 0);

    log(`\n📈 Taux moyen de rapports: ${avgReportRate.toFixed(1)}%`);
    log(`🏇 Total hippodromes inconnus: ${totalUnknown}`);
  }

  // Sauvegarder
  fs.writeFileSync('test-avec-log-results.json', JSON.stringify(results, null, 2));
  log(`\n✅ Résultats sauvegardés dans test-avec-log-results.json`);
  log(`\n✅ Log complet dans test-log.txt`);
}

testAvecLog().catch((error) => {
  const errorMsg = `ERREUR: ${error.message}\n${error.stack}`;
  console.error(errorMsg);
  fs.appendFileSync('test-log.txt', errorMsg);
  process.exit(1);
});

