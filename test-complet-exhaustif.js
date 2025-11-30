/**
 * TEST COMPLET EXHAUSTIF
 * - Tous les tests depuis le début de la conversation
 * - Toutes les années (2022-2025)
 * - Tous les mois
 * - Tous les critères possibles
 * - Vérification directe sur sources
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

const YEARS = [2022, 2023, 2024, 2025];
const MONTHS = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
];

const MONTH_MAP = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testCompleteExhaustive() {
  console.log('='.repeat(80));
  console.log('TEST COMPLET EXHAUSTIF - TOUS LES TESTS DEPUIS LE DÉBUT');
  console.log('='.repeat(80));
  console.log('\nAttente de 20 secondes pour le déploiement Vercel...\n');
  await sleep(20000);

  const allResults = {
    totalTests: 0,
    success: 0,
    failed: 0,
    timeouts: 0,
    errors: [],
    byYear: {},
    byMonth: {},
    globalStats: {
      totalReunions: 0,
      totalReports: 0,
      totalUnknownHippo: 0,
      totalInvalidDates: 0,
      totalInvalidUrls: 0,
      totalMissingFields: 0,
      totalDuplicates: 0,
      durations: [],
    },
  };

  // TEST 1 : Tous les mois de toutes les années
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1 : TOUS LES MOIS DE TOUTES LES ANNÉES');
  console.log('='.repeat(80) + '\n');

  for (const year of YEARS) {
    allResults.byYear[year] = {
      success: 0,
      failed: 0,
      timeouts: 0,
      reunions: 0,
      reports: 0,
      unknownHippo: 0,
      durations: [],
    };

    for (const month of MONTHS) {
      const testName = `${year} - ${month}`;
      console.log(`\n${'-'.repeat(80)}`);
      console.log(`TEST: ${testName}`);
      console.log(`${'-'.repeat(80)}\n`);

      allResults.totalTests++;

      try {
        const startTime = Date.now();
        const response = await fetch(
          `${API_URL}?source=turf-fr&years=${year}&months=${month}`,
          {
            signal: AbortSignal.timeout(70000),
          }
        );
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`   ❌ Erreur HTTP ${response.status}`);
          console.error(`   Message: ${errorText.substring(0, 200)}`);
          allResults.failed++;
          allResults.byYear[year].failed++;
          if (response.status === 504) {
            allResults.timeouts++;
            allResults.byYear[year].timeouts++;
          }
          allResults.errors.push({
            test: testName,
            error: `HTTP ${response.status}`,
            message: errorText.substring(0, 200),
          });
          continue;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.error(
            `   ❌ Réponse invalide: ${JSON.stringify(data).substring(0, 200)}`
          );
          allResults.failed++;
          allResults.byYear[year].failed++;
          continue;
        }

        allResults.success++;
        allResults.byYear[year].success++;
        allResults.globalStats.durations.push(parseFloat(duration));
        allResults.byYear[year].durations.push(parseFloat(duration));

        console.log(`   ⏱️  Durée: ${duration}s`);
        console.log(`   📊 Réunions trouvées: ${data.length}`);

        // Vérifications détaillées
        const checks = {
          dates: { invalid: [], total: 0 },
          hippodromes: { unknown: [], total: 0 },
          reports: { missing: [], total: 0, withReport: 0 },
          urls: { invalid: [], total: 0 },
          fields: { missing: [], total: 0 },
          duplicates: { count: 0 },
          countries: { invalid: [], total: 0 },
        };

        const ids = new Set();
        const requiredFields = [
          'id',
          'dateISO',
          'dateLabel',
          'hippodrome',
          'reunionNumber',
          'url',
          'source',
        ];

        const expectedMonth = MONTH_MAP[month];

        for (const reunion of data) {
          // Doublons
          if (ids.has(reunion.id)) {
            checks.duplicates.count++;
          } else {
            ids.add(reunion.id);
          }

          // Dates
          checks.dates.total++;
          if (!reunion.dateISO) {
            checks.dates.invalid.push(reunion);
          } else {
            try {
              const date = new Date(reunion.dateISO);
              if (
                isNaN(date.getTime()) ||
                date.getFullYear() !== year ||
                date.getMonth() !== expectedMonth
              ) {
                checks.dates.invalid.push(reunion);
              }
            } catch (e) {
              checks.dates.invalid.push(reunion);
            }
          }

          // Hippodromes
          checks.hippodromes.total++;
          if (
            !reunion.hippodrome ||
            reunion.hippodrome === 'Inconnu' ||
            reunion.hippodrome.length < 2
          ) {
            checks.hippodromes.unknown.push(reunion);
          }

          // Rapports
          checks.reports.total++;
          if (reunion.arrivalReport) {
            checks.reports.withReport++;
          } else {
            checks.reports.missing.push(reunion);
          }

          // URLs
          checks.urls.total++;
          if (
            !reunion.url ||
            !reunion.url.includes('turf-fr.com') ||
            !reunion.url.includes('r')
          ) {
            checks.urls.invalid.push(reunion);
          }

          // Champs requis
          checks.fields.total++;
          const missing = requiredFields.filter((f) => !reunion[f]);
          if (missing.length > 0) {
            checks.fields.missing.push({ reunion, missing });
          }

          // Codes pays
          checks.countries.total++;
          const validCountries = [
            'FR',
            'GB',
            'SWE',
            'USA',
            'IRE',
            'GER',
            'ITA',
          ];
          if (
            !reunion.countryCode ||
            !validCountries.includes(reunion.countryCode)
          ) {
            checks.countries.invalid.push(reunion);
          }
        }

        // Statistiques globales
        allResults.globalStats.totalReunions += data.length;
        allResults.globalStats.totalReports += checks.reports.withReport;
        allResults.globalStats.totalUnknownHippo +=
          checks.hippodromes.unknown.length;
        allResults.globalStats.totalInvalidDates += checks.dates.invalid.length;
        allResults.globalStats.totalInvalidUrls += checks.urls.invalid.length;
        allResults.globalStats.totalMissingFields +=
          checks.fields.missing.length;
        allResults.globalStats.totalDuplicates += checks.duplicates.count;

        allResults.byYear[year].reunions += data.length;
        allResults.byYear[year].reports += checks.reports.withReport;
        allResults.byYear[year].unknownHippo +=
          checks.hippodromes.unknown.length;

        // Afficher les résultats
        const reportPct =
          checks.reports.total > 0
            ? Math.round(
                (checks.reports.withReport / checks.reports.total) * 100
              )
            : 0;

        console.log(`\n   📋 Vérifications:`);
        console.log(
          `      Dates invalides: ${checks.dates.invalid.length}/${checks.dates.total}`
        );
        if (checks.dates.invalid.length > 0) {
          console.log(`      Exemples:`);
          checks.dates.invalid.slice(0, 3).forEach((r) => {
            console.log(
              `        - ${r.hippodrome} R${r.reunionNumber}: ${r.dateISO || 'NULL'}`
            );
          });
        }

        console.log(
          `      Hippodromes 'Inconnu': ${checks.hippodromes.unknown.length}/${checks.hippodromes.total}`
        );
        if (
          checks.hippodromes.unknown.length > 0 &&
          checks.hippodromes.unknown.length <= 10
        ) {
          console.log(`      Exemples:`);
          checks.hippodromes.unknown.slice(0, 5).forEach((r) => {
            console.log(
              `        - R${r.reunionNumber}: ${r.dateLabel} | URL: ${r.url}`
            );
          });
        }

        console.log(
          `      Rapports: ${checks.reports.withReport}/${checks.reports.total} (${reportPct}%)`
        );
        console.log(
          `      URLs invalides: ${checks.urls.invalid.length}/${checks.urls.total}`
        );
        console.log(
          `      Champs manquants: ${checks.fields.missing.length}/${checks.fields.total}`
        );
        console.log(`      Doublons: ${checks.duplicates.count}`);
        console.log(
          `      Codes pays invalides: ${checks.countries.invalid.length}/${checks.countries.total}`
        );

        // Vérification directe sur sources (échantillon de 3)
        if (data.length > 0 && checks.reports.withReport > 0) {
          console.log(
            `\n   🔍 Vérification directe sur sources (3 échantillons):`
          );
          const samples = data
            .filter((r) => r.url && r.arrivalReport)
            .slice(0, 3);
          let verified = 0;
          for (const sample of samples) {
            try {
              const sourceResponse = await fetch(sample.url, {
                signal: AbortSignal.timeout(5000),
              });
              if (sourceResponse.ok) {
                const sourceHtml = await sourceResponse.text();
                // Vérifier que le rapport est présent dans le HTML
                const reportInHtml =
                  sourceHtml.includes(
                    sample.arrivalReport.replace(/-/g, ' ')
                  ) ||
                  sourceHtml.includes(sample.arrivalReport) ||
                  sourceHtml
                    .toLowerCase()
                    .includes(
                      sample.arrivalReport.split('-').join(' arrivée ')
                    );
                if (reportInHtml) {
                  verified++;
                  console.log(
                    `      ✅ ${sample.hippodrome} R${sample.reunionNumber}: Rapport vérifié`
                  );
                } else {
                  console.log(
                    `      ⚠️  ${sample.hippodrome} R${sample.reunionNumber}: Rapport non trouvé dans HTML`
                  );
                }
              }
            } catch (e) {
              console.log(
                `      ❌ ${sample.hippodrome} R${sample.reunionNumber}: Erreur vérification (${e.message})`
              );
            }
          }
          console.log(`      Vérifiés: ${verified}/${samples.length}`);
        }

        // Résumé pour ce test
        const testSuccess =
          checks.dates.invalid.length === 0 &&
          checks.urls.invalid.length === 0 &&
          checks.fields.missing.length === 0 &&
          checks.duplicates.count === 0 &&
          reportPct >= 70;

        if (testSuccess) {
          console.log(`\n   ✅ TEST RÉUSSI`);
        } else {
          console.log(`\n   ⚠️  TEST AVEC PROBLÈMES`);
        }

        // Attendre entre les tests
        await sleep(2000);
      } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}`);
        allResults.failed++;
        allResults.byYear[year].failed++;
        if (
          error.message.includes('timeout') ||
          error.message.includes('504')
        ) {
          allResults.timeouts++;
          allResults.byYear[year].timeouts++;
        }
        allResults.errors.push({
          test: testName,
          error: error.message,
        });
      }
    }
  }

  // TEST 2 : Filtres spécifiques
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST 2 : FILTRES SPÉCIFIQUES');
  console.log('='.repeat(80) + '\n');

  const filterTests = [
    {
      name: 'Filtre hippodrome (Vincennes)',
      params: 'source=turf-fr&years=2024&months=janvier&hippodromes=Vincennes',
    },
    {
      name: 'Filtre pays (FR)',
      params: 'source=turf-fr&years=2024&months=janvier&countries=FR',
    },
    {
      name: 'Filtre réunion (R1)',
      params: 'source=turf-fr&years=2024&months=janvier&reunionNumbers=1',
    },
    {
      name: 'Filtre date (2024-01-01 à 2024-01-15)',
      params:
        'source=turf-fr&years=2024&months=janvier&dateFrom=2024-01-01&dateTo=2024-01-15',
    },
    {
      name: 'Filtre texte (Vincennes)',
      params: 'source=turf-fr&years=2024&months=janvier&textQuery=Vincennes',
    },
  ];

  for (const filterTest of filterTests) {
    console.log(`\nTest: ${filterTest.name}`);
    allResults.totalTests++;

    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}?${filterTest.params}`, {
        signal: AbortSignal.timeout(70000),
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        console.error(`   ❌ Erreur HTTP ${response.status}`);
        allResults.failed++;
        continue;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error(`   ❌ Réponse invalide`);
        allResults.failed++;
        continue;
      }

      allResults.success++;
      console.log(`   ✅ ${data.length} réunions trouvées - ${duration}s`);

      // Vérifier que les filtres fonctionnent
      if (filterTest.params.includes('hippodromes=Vincennes')) {
        const allVincennes = data.every((r) =>
          r.hippodrome.toLowerCase().includes('vincennes')
        );
        console.log(
          `   ${allVincennes ? '✅' : '⚠️'} Tous Vincennes: ${allVincennes}`
        );
      }

      await sleep(1000);
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      allResults.failed++;
    }
  }

  // TEST 3 : Multi-mois
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST 3 : MULTI-MOIS');
  console.log('='.repeat(80) + '\n');

  const multiMonthTests = [
    {
      name: '2 mois (janvier, février 2024)',
      params: 'source=turf-fr&years=2024&months=janvier,fevrier',
    },
    {
      name: '3 mois (janvier, février, mars 2024)',
      params: 'source=turf-fr&years=2024&months=janvier,fevrier,mars',
    },
  ];

  for (const multiTest of multiMonthTests) {
    console.log(`\nTest: ${multiTest.name}`);
    allResults.totalTests++;

    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}?${multiTest.params}`, {
        signal: AbortSignal.timeout(70000),
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        console.error(`   ❌ Erreur HTTP ${response.status}`);
        allResults.failed++;
        if (response.status === 504) {
          allResults.timeouts++;
        }
        continue;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error(`   ❌ Réponse invalide`);
        allResults.failed++;
        continue;
      }

      allResults.success++;
      const withReports = data.filter((r) => r.arrivalReport).length;
      const reportPct =
        data.length > 0 ? Math.round((withReports / data.length) * 100) : 0;
      console.log(
        `   ✅ ${data.length} réunions trouvées (${withReports} rapports, ${reportPct}%) - ${duration}s`
      );

      await sleep(2000);
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      allResults.failed++;
      if (error.message.includes('timeout')) {
        allResults.timeouts++;
      }
    }
  }

  // RÉSUMÉ GLOBAL
  console.log('\n\n' + '='.repeat(80));
  console.log('RÉSUMÉ GLOBAL COMPLET');
  console.log('='.repeat(80) + '\n');

  console.log(`Tests effectués: ${allResults.totalTests}`);
  console.log(`Tests réussis: ${allResults.success}`);
  console.log(`Tests échoués: ${allResults.failed}`);
  console.log(`Timeouts: ${allResults.timeouts}`);
  console.log(
    `Taux de réussite: ${Math.round((allResults.success / allResults.totalTests) * 100)}%`
  );

  console.log(`\nStatistiques globales:`);
  console.log(`  Total réunions: ${allResults.globalStats.totalReunions}`);
  console.log(`  Total rapports: ${allResults.globalStats.totalReports}`);
  const avgReportPct =
    allResults.globalStats.totalReunions > 0
      ? Math.round(
          (allResults.globalStats.totalReports /
            allResults.globalStats.totalReunions) *
            100
        )
      : 0;
  console.log(`  Taux rapports moyen: ${avgReportPct}%`);
  console.log(
    `  Hippodromes 'Inconnu': ${allResults.globalStats.totalUnknownHippo}`
  );
  console.log(`  Dates invalides: ${allResults.globalStats.totalInvalidDates}`);
  console.log(`  URLs invalides: ${allResults.globalStats.totalInvalidUrls}`);
  console.log(
    `  Champs manquants: ${allResults.globalStats.totalMissingFields}`
  );
  console.log(`  Doublons: ${allResults.globalStats.totalDuplicates}`);
  const avgDuration =
    allResults.globalStats.durations.length > 0
      ? allResults.globalStats.durations.reduce((a, b) => a + b, 0) /
        allResults.globalStats.durations.length
      : 0;
  console.log(`  Durée moyenne: ${avgDuration.toFixed(2)}s`);

  console.log(`\nPar année:`);
  for (const year of YEARS) {
    const yearData = allResults.byYear[year];
    if (yearData) {
      const yearSuccessRate =
        yearData.success + yearData.failed > 0
          ? Math.round(
              (yearData.success / (yearData.success + yearData.failed)) * 100
            )
          : 0;
      const yearAvgDuration =
        yearData.durations.length > 0
          ? yearData.durations.reduce((a, b) => a + b, 0) /
            yearData.durations.length
          : 0;
      console.log(`  ${year}:`);
      console.log(
        `    Succès: ${yearData.success}/${yearData.success + yearData.failed} (${yearSuccessRate}%)`
      );
      console.log(`    Timeouts: ${yearData.timeouts}`);
      console.log(`    Réunions: ${yearData.reunions}`);
      console.log(`    Rapports: ${yearData.reports}`);
      console.log(`    'Inconnu': ${yearData.unknownHippo}`);
      console.log(`    Durée moyenne: ${yearAvgDuration.toFixed(2)}s`);
    }
  }

  if (allResults.errors.length > 0) {
    console.log(`\nErreurs rencontrées (${allResults.errors.length}):`);
    allResults.errors.slice(0, 10).forEach((e) => {
      console.log(`  - ${e.test}: ${e.error}`);
    });
    if (allResults.errors.length > 10) {
      console.log(`  ... et ${allResults.errors.length - 10} autres`);
    }
  }

  // Sauvegarder les résultats
  const fs = await import('fs');
  fs.writeFileSync(
    'test-results-complete.json',
    JSON.stringify(allResults, null, 2)
  );
  console.log(`\n✅ Résultats sauvegardés dans test-results-complete.json`);
}

testCompleteExhaustive().catch(console.error);
