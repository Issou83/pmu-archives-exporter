/**
 * TEST RÉEL avec Browser - Comparaison API vs Pages Réelles
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function testReelAvecBrowser() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST RÉEL - Comparaison API vs Pages Réelles');
  console.log('='.repeat(80) + '\n');

  // Test avec une année/mois qui fonctionne bien (2024 janvier)
  const testCases = [
    { year: 2024, month: 'janvier', name: '2024 Janvier' },
    { year: 2023, month: 'decembre', name: '2023 Décembre' },
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`📋 TEST: ${testCase.name}`);
    console.log(`${'-'.repeat(80)}`);

    try {
      const url = `${API_URL}?source=turf-fr&years=${testCase.year}&months=${testCase.month}`;
      console.log(`   🔄 Requête API: ${url}`);

      const response = await fetch(url, {
        signal: AbortSignal.timeout(70000),
      });

      if (!response.ok) {
        console.log(`   ❌ Erreur HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`   ⚠️  Aucune réunion trouvée`);
        continue;
      }

      console.log(`   ✅ ${data.length} réunions trouvées`);

      // Prendre quelques réunions pour test (avec et sans rapports)
      const withReports = data.filter((r) => r.arrivalReport);
      const withoutReports = data.filter((r) => !r.arrivalReport);

      const samples = [
        ...(withReports.slice(0, 2)),
        ...(withoutReports.slice(0, 3)),
      ].slice(0, 5);

      console.log(`\n   📊 Échantillons à vérifier: ${samples.length}`);
      console.log(`      - Avec rapports: ${withReports.length}`);
      console.log(`      - Sans rapports: ${withoutReports.length}`);

      for (const reunion of samples) {
        console.log(`\n   🔍 Vérification: ${reunion.hippodrome} - R${reunion.reunionNumber}`);
        console.log(`      URL: ${reunion.url}`);
        console.log(`      Date: ${reunion.dateLabel}`);
        console.log(`      Rapport API: ${reunion.arrivalReport || 'NON TROUVÉ'}`);

        results.push({
          test: testCase.name,
          reunion: {
            hippodrome: reunion.hippodrome,
            reunionNumber: reunion.reunionNumber,
            date: reunion.dateLabel,
            url: reunion.url,
            arrivalReportAPI: reunion.arrivalReport || null,
          },
        });
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }

  // Sauvegarder les résultats pour inspection manuelle
  const fs = await import('fs');
  fs.writeFileSync(
    'test-reel-urls-a-verifier.json',
    JSON.stringify(results, null, 2)
  );
  console.log(`\n✅ URLs à vérifier sauvegardées dans test-reel-urls-a-verifier.json`);
  console.log(`\n📋 Prochaines étapes:`);
  console.log(`   1. Utiliser le navigateur pour vérifier ces URLs`);
  console.log(`   2. Comparer les rapports trouvés avec ceux de l'API`);
  console.log(`   3. Identifier les problèmes de scraping`);
}

testReelAvecBrowser().catch((error) => {
  console.error('ERREUR FATALE:', error);
  process.exit(1);
});

