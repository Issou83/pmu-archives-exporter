/**
 * TEST COMPLET AUTOMATIQUE
 * Teste toutes les années et mois, affiche les résultats en temps réel
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';
const fs = require('fs');

const YEARS = [2022, 2023, 2024, 2025];
const MONTHS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  fs.appendFileSync('test-complet-log.txt', line + '\n');
}

async function testCompletAutomatique() {
  // Nettoyer le fichier de log
  fs.writeFileSync('test-complet-log.txt', '');
  
  log('='.repeat(80));
  log('🧪 TEST COMPLET AUTOMATIQUE - Toutes les années et mois');
  log('='.repeat(80));
  log('');
  log('⏳ Attente de 15 secondes pour le déploiement Vercel...\n');
  await sleep(15000);

  const results = {
    totalTests: 0,
    success: 0,
    timeouts: 0,
    failed: 0,
    byYear: {},
    globalStats: {
      totalReunions: 0,
      totalReports: 0,
      totalUnknownHippo: 0,
    },
  };

  for (const year of YEARS) {
    results.byYear[year] = {
      success: 0,
      timeouts: 0,
      failed: 0,
      reunions: 0,
      reports: 0,
      unknownHippo: 0,
    };

    for (const month of MONTHS) {
      const testName = `${year} - ${month}`;
      log(`\n${'-'.repeat(80)}`);
      log(`📋 TEST: ${testName}`);
      log(`${'-'.repeat(80)}`);

      results.totalTests++;

      try {
        const startTime = Date.now();
        const url = `${API_URL}?source=turf-fr&years=${year}&months=${month}`;
        log(`   🔄 Requête en cours...`);

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

          log(`   ❌ Erreur HTTP ${response.status}`);
          log(`   Message: ${errorJson.message || errorJson.error?.message || errorText.substring(0, 200)}`);

          results.failed++;
          results.byYear[year].failed++;
          if (response.status === 504) {
            results.timeouts++;
            results.byYear[year].timeouts++;
          }
          continue;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          log(`   ❌ Réponse invalide (pas un tableau)`);
          results.failed++;
          results.byYear[year].failed++;
          continue;
        }

        const total = data.length;
        const withReports = data.filter((r) => r.arrivalReport).length;
        const unknownHippo = data.filter((r) => r.hippodrome === 'Inconnu').length;
        const reportRate = total > 0 ? ((withReports / total) * 100).toFixed(1) : 0;
        const unknownRate = total > 0 ? ((unknownHippo / total) * 100).toFixed(1) : 0;

        results.success++;
        results.byYear[year].success++;
        results.globalStats.totalReunions += total;
        results.globalStats.totalReports += withReports;
        results.globalStats.totalUnknownHippo += unknownHippo;
        results.byYear[year].reunions += total;
        results.byYear[year].reports += withReports;
        results.byYear[year].unknownHippo += unknownHippo;

        log(`   ✅ Succès`);
        log(`   ⏱️  Durée: ${duration}s`);
        log(`   📊 Réunions: ${total}`);
        log(`   📈 Rapports: ${withReports} (${reportRate}%)`);
        log(`   🏇 Hippodromes inconnus: ${unknownHippo} (${unknownRate}%)`);

      } catch (error) {
        log(`   ❌ Erreur: ${error.message}`);
        if (error.name === 'AbortError') {
          log(`   (Timeout)`);
          results.timeouts++;
          results.byYear[year].timeouts++;
        }
        results.failed++;
        results.byYear[year].failed++;
      }

      // Pause entre les tests
      await sleep(2000);
    }
  }

  // Résumé final
  log(`\n${'='.repeat(80)}`);
  log('📊 RÉSUMÉ FINAL');
  log('='.repeat(80) + '\n');

  log(`✅ Succès: ${results.success}/${results.totalTests}`);
  log(`⏱️  Timeouts: ${results.timeouts}/${results.totalTests}`);
  log(`❌ Échecs: ${results.failed}/${results.totalTests}\n`);

  if (results.globalStats.totalReunions > 0) {
    const globalReportRate = ((results.globalStats.totalReports / results.globalStats.totalReunions) * 100).toFixed(1);
    const globalUnknownRate = ((results.globalStats.totalUnknownHippo / results.globalStats.totalReunions) * 100).toFixed(1);

    log(`📊 STATISTIQUES GLOBALES:`);
    log(`   Total réunions: ${results.globalStats.totalReunions}`);
    log(`   Total rapports: ${results.globalStats.totalReports} (${globalReportRate}%)`);
    log(`   Total hippodromes inconnus: ${results.globalStats.totalUnknownHippo} (${globalUnknownRate}%)\n`);

    log(`📅 PAR ANNÉE:`);
    for (const [year, stats] of Object.entries(results.byYear)) {
      const reportRate = stats.reunions > 0 ? ((stats.reports / stats.reunions) * 100).toFixed(1) : 0;
      const unknownRate = stats.reunions > 0 ? ((stats.unknownHippo / stats.reunions) * 100).toFixed(1) : 0;
      log(`   ${year}: ${stats.success}/12 succès, ${stats.reunions} réunions, ${stats.reports} rapports (${reportRate}%), ${stats.unknownHippo} inconnus (${unknownRate}%), ${stats.timeouts} timeouts`);
    }
  }

  // Sauvegarder
  fs.writeFileSync('test-complet-automatique-results.json', JSON.stringify(results, null, 2));
  log(`\n✅ Résultats sauvegardés dans test-complet-automatique-results.json`);
  log(`✅ Log complet dans test-complet-log.txt`);
}

testCompletAutomatique().catch((error) => {
  const errorMsg = `ERREUR FATALE: ${error.message}\n${error.stack}`;
  console.error(errorMsg);
  fs.appendFileSync('test-complet-log.txt', errorMsg);
  process.exit(1);
});

