/**
 * Script de test pour analyser les rapports d'arrivée manquants
 * Ce script teste l'API directement et identifie les cas où "Non disponible" 
 * apparaît alors que le rapport existe réellement sur Turf-FR
 */

import { DEBUG } from './api/utils/constants.js';

const API_BASE_URL = 'https://pmu-archives-exporter.vercel.app/api';

/**
 * Teste une recherche et analyse les rapports d'arrivée
 */
async function testSearch(source, years, months, filters = {}) {
  const params = new URLSearchParams({
    source,
    years: Array.isArray(years) ? years.join(',') : years,
    months: Array.isArray(months) ? months.join(',') : months,
    ...filters,
  });

  const url = `${API_BASE_URL}/archives?${params.toString()}`;
  console.log(`\n🔍 Test: ${source} - Années: ${years} - Mois: ${months}`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status}`);
      return null;
    }

    const reunions = await response.json();
    console.log(`✅ ${reunions.length} réunions trouvées`);

    // Analyser les rapports d'arrivée
    const withReports = reunions.filter((r) => r.arrivalReport && r.arrivalReport !== 'Non disponible');
    const withoutReports = reunions.filter(
      (r) => !r.arrivalReport || r.arrivalReport === 'Non disponible' || r.arrivalReport === null
    );

    const reportPercentage =
      reunions.length > 0 ? Math.round((withReports.length / reunions.length) * 100) : 0;

    console.log(`\n📊 Statistiques:`);
    console.log(`   - Avec rapport: ${withReports.length}`);
    console.log(`   - Sans rapport: ${withoutReports.length}`);
    console.log(`   - Taux de remplissage: ${reportPercentage}%`);

    // Retourner les réunions sans rapport pour analyse
    return {
      total: reunions.length,
      withReports: withReports.length,
      withoutReports: withoutReports.length,
      percentage: reportPercentage,
      missingReports: withoutReports,
      allReunions: reunions,
    };
  } catch (error) {
    console.error(`❌ Erreur lors du test:`, error.message);
    return null;
  }
}

/**
 * Analyse détaillée d'une réunion sans rapport
 */
async function analyzeMissingReport(reunion) {
  console.log(`\n🔍 Analyse de la réunion sans rapport:`);
  console.log(`   - ID: ${reunion.id}`);
  console.log(`   - Date: ${reunion.dateISO} (${reunion.dateLabel})`);
  console.log(`   - Hippodrome: ${reunion.hippodrome}`);
  console.log(`   - Réunion: R${reunion.reunionNumber}`);
  console.log(`   - URL: ${reunion.url}`);
  console.log(`   - Source: ${reunion.source}`);

  // Retourner les infos pour vérification manuelle
  return {
    id: reunion.id,
    dateISO: reunion.dateISO,
    dateLabel: reunion.dateLabel,
    hippodrome: reunion.hippodrome,
    reunionNumber: reunion.reunionNumber,
    url: reunion.url,
    source: reunion.source,
  };
}

/**
 * Lance une série de tests
 */
async function runTests() {
  console.log('🚀 Démarrage des tests de rapports d\'arrivée\n');
  console.log('='.repeat(80));

  const tests = [
    // Test 1: 2024 - Janvier (récent, devrait avoir beaucoup de rapports)
    { source: 'turf-fr', years: ['2024'], months: ['janvier'] },
    // Test 2: 2024 - Février
    { source: 'turf-fr', years: ['2024'], months: ['fevrier'] },
    // Test 3: 2023 - Janvier (un peu plus ancien)
    { source: 'turf-fr', years: ['2023'], months: ['janvier'] },
    // Test 4: 2022 - Janvier (plus ancien, peut avoir moins de rapports)
    { source: 'turf-fr', years: ['2022'], months: ['janvier'] },
  ];

  const results = [];
  const missingReportsList = [];

  for (const test of tests) {
    const result = await testSearch(test.source, test.years, test.months, test.filters || {});
    if (result) {
      results.push({ ...test, ...result });

      // Collecter les réunions sans rapport pour analyse
      if (result.missingReports && result.missingReports.length > 0) {
        console.log(`\n⚠️  ${result.missingReports.length} réunions sans rapport détectées`);
        
        // Analyser les 5 premières pour ne pas surcharger
        const toAnalyze = result.missingReports.slice(0, 5);
        for (const reunion of toAnalyze) {
          const analysis = await analyzeMissingReport(reunion);
          missingReportsList.push(analysis);
        }
      }
    }

    // Attendre un peu entre les tests pour ne pas surcharger
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Résumé global
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ GLOBAL');
  console.log('='.repeat(80));

  let totalReunions = 0;
  let totalWithReports = 0;
  let totalWithoutReports = 0;

  for (const result of results) {
    totalReunions += result.total;
    totalWithReports += result.withReports;
    totalWithoutReports += result.withoutReports;
    console.log(
      `\n${result.years.join(',')} - ${result.months.join(',')}: ${result.percentage}% (${result.withReports}/${result.total})`
    );
  }

  const globalPercentage =
    totalReunions > 0 ? Math.round((totalWithReports / totalReunions) * 100) : 0;

  console.log(`\n🎯 TAUX GLOBAL: ${globalPercentage}% (${totalWithReports}/${totalReunions})`);
  console.log(`⚠️  RÉUNIONS SANS RAPPORT: ${totalWithoutReports}`);

  // Sauvegarder les résultats dans un fichier
  const fs = await import('fs');
  const outputDir = './test-results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = `${outputDir}/test-arrival-reports-${timestamp}.json`;

  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalReunions,
      totalWithReports,
      totalWithoutReports,
      globalPercentage,
    },
    tests: results,
    missingReports: missingReportsList,
  };

  fs.writeFileSync(outputFile, JSON.stringify(reportData, null, 2));
  console.log(`\n💾 Résultats sauvegardés dans: ${outputFile}`);

  return { results, missingReportsList };
}

// Exécuter les tests
runTests()
  .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
