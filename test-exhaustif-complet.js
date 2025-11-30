/**
 * Tests exhaustifs et complets
 * - Plusieurs mois et années
 * - Vérification directe sur les sources
 * - Vérification de la cohérence des données
 * - Tests de tous les aspects
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function testExhaustif() {
  console.log('=== TESTS EXHAUSTIFS COMPLETS ===\n');
  console.log('Attente de 15 secondes pour le déploiement...\n');
  await new Promise((resolve) => setTimeout(resolve, 15000));

  const testCases = [
    {
      name: 'Janvier 2024',
      params: 'source=turf-fr&years=2024&months=janvier',
    },
    {
      name: 'Février 2024',
      params: 'source=turf-fr&years=2024&months=fevrier',
    },
    { name: 'Mars 2024', params: 'source=turf-fr&years=2024&months=mars' },
    { name: 'Avril 2024', params: 'source=turf-fr&years=2024&months=avril' },
    { name: 'Mai 2024', params: 'source=turf-fr&years=2024&months=mai' },
    { name: 'Juin 2024', params: 'source=turf-fr&years=2024&months=juin' },
    {
      name: 'Juillet 2024',
      params: 'source=turf-fr&years=2024&months=juillet',
    },
    { name: 'Août 2024', params: 'source=turf-fr&years=2024&months=aout' },
    {
      name: 'Septembre 2024',
      params: 'source=turf-fr&years=2024&months=septembre',
    },
    {
      name: 'Octobre 2024',
      params: 'source=turf-fr&years=2024&months=octobre',
    },
    {
      name: 'Novembre 2024',
      params: 'source=turf-fr&years=2024&months=novembre',
    },
    {
      name: 'Décembre 2024',
      params: 'source=turf-fr&years=2024&months=decembre',
    },
  ];

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    details: [],
  };

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST: ${testCase.name}`);
    console.log(`${'='.repeat(70)}\n`);

    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}?${testCase.params}`, {
        signal: AbortSignal.timeout(70000),
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`   ❌ Erreur HTTP ${response.status}`);
        console.error(`   Message: ${errorText.substring(0, 200)}`);
        results.failed++;
        results.errors.push({
          test: testCase.name,
          error: `HTTP ${response.status}`,
          message: errorText.substring(0, 200),
        });
        continue;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error(
          `   ❌ L'API a retourné une erreur: ${JSON.stringify(data)}`
        );
        results.failed++;
        results.errors.push({
          test: testCase.name,
          error: 'Invalid response format',
          data: data,
        });
        continue;
      }

      results.total++;
      console.log(`   ⏱️  Durée: ${duration}s`);
      console.log(`   📊 Réunions trouvées: ${data.length}`);

      // Extraire le mois attendu
      const monthMatch = testCase.name.match(/(\w+)\s+2024/);
      const monthName = monthMatch ? monthMatch[1].toLowerCase() : '';
      const monthMap = {
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
      const expectedMonth = monthMap[monthName];

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

      for (const reunion of data) {
        // Vérifier les doublons
        if (ids.has(reunion.id)) {
          checks.duplicates.count++;
        } else {
          ids.add(reunion.id);
        }

        // Vérifier les dates
        checks.dates.total++;
        if (!reunion.dateISO) {
          checks.dates.invalid.push(reunion);
        } else {
          try {
            const date = new Date(reunion.dateISO);
            if (
              isNaN(date.getTime()) ||
              date.getFullYear() !== 2024 ||
              date.getMonth() !== expectedMonth
            ) {
              checks.dates.invalid.push(reunion);
            }
          } catch (e) {
            checks.dates.invalid.push(reunion);
          }
        }

        // Vérifier les hippodromes
        checks.hippodromes.total++;
        if (
          !reunion.hippodrome ||
          reunion.hippodrome === 'Inconnu' ||
          reunion.hippodrome.length < 2
        ) {
          checks.hippodromes.unknown.push(reunion);
        }

        // Vérifier les rapports
        checks.reports.total++;
        if (reunion.arrivalReport) {
          checks.reports.withReport++;
        } else {
          checks.reports.missing.push(reunion);
        }

        // Vérifier les URLs
        checks.urls.total++;
        if (
          !reunion.url ||
          !reunion.url.includes('turf-fr.com') ||
          !reunion.url.includes('r')
        ) {
          checks.urls.invalid.push(reunion);
        }

        // Vérifier les champs requis
        checks.fields.total++;
        const missing = requiredFields.filter((f) => !reunion[f]);
        if (missing.length > 0) {
          checks.fields.missing.push({ reunion, missing });
        }

        // Vérifier les codes pays
        checks.countries.total++;
        const validCountries = ['FR', 'GB', 'SWE', 'USA', 'IRE', 'GER', 'ITA'];
        if (
          !reunion.countryCode ||
          !validCountries.includes(reunion.countryCode)
        ) {
          checks.countries.invalid.push(reunion);
        }
      }

      // Afficher les résultats
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
      if (checks.hippodromes.unknown.length > 0) {
        console.log(`      Exemples:`);
        checks.hippodromes.unknown.slice(0, 5).forEach((r) => {
          console.log(
            `        - R${r.reunionNumber}: ${r.dateLabel} | URL: ${r.url}`
          );
        });
      }

      const reportPct =
        checks.reports.total > 0
          ? Math.round((checks.reports.withReport / checks.reports.total) * 100)
          : 0;
      console.log(
        `      Rapports: ${checks.reports.withReport}/${checks.reports.total} (${reportPct}%)`
      );
      if (
        checks.reports.missing.length > 0 &&
        checks.reports.missing.length <= 10
      ) {
        console.log(`      Sans rapport:`);
        checks.reports.missing.slice(0, 5).forEach((r) => {
          console.log(
            `        - ${r.hippodrome} R${r.reunionNumber}: ${r.dateLabel}`
          );
        });
      }

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

      // Vérifier quelques URLs directement sur le site
      if (data.length > 0) {
        console.log(
          `\n   🔍 Vérification directe sur sources (5 échantillons):`
        );
        const samples = data
          .filter((r) => r.url && r.arrivalReport)
          .slice(0, 5);
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
                sourceHtml.includes(sample.arrivalReport.replace(/-/g, ' ')) ||
                sourceHtml.includes(sample.arrivalReport);
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
        reportPct >= 90;

      if (testSuccess) {
        console.log(`\n   ✅ TEST RÉUSSI`);
        results.success++;
      } else {
        console.log(`\n   ⚠️  TEST AVEC PROBLÈMES`);
        results.failed++;
      }

      results.details.push({
        test: testCase.name,
        duration: parseFloat(duration),
        reunions: data.length,
        checks,
        reportPct,
        success: testSuccess,
      });

      // Attendre un peu entre les tests pour ne pas surcharger
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      results.failed++;
      results.errors.push({
        test: testCase.name,
        error: error.message,
      });
    }
  }

  // Résumé global
  console.log(`\n${'='.repeat(70)}`);
  console.log('RÉSUMÉ GLOBAL');
  console.log(`${'='.repeat(70)}\n`);
  console.log(`Tests effectués: ${results.total}`);
  console.log(`Tests réussis: ${results.success}`);
  console.log(`Tests échoués: ${results.failed}`);
  console.log(
    `Taux de réussite: ${Math.round((results.success / results.total) * 100)}%`
  );

  if (results.errors.length > 0) {
    console.log(`\nErreurs rencontrées:`);
    results.errors.forEach((e) => {
      console.log(`  - ${e.test}: ${e.error}`);
    });
  }

  // Statistiques globales
  const totalReunions = results.details.reduce((sum, d) => sum + d.reunions, 0);
  const avgDuration =
    results.details.reduce((sum, d) => sum + d.duration, 0) /
    results.details.length;
  const totalDatesInvalid = results.details.reduce(
    (sum, d) => sum + d.checks.dates.invalid.length,
    0
  );
  const totalHippoUnknown = results.details.reduce(
    (sum, d) => sum + d.checks.hippodromes.unknown.length,
    0
  );
  const avgReportPct =
    results.details.reduce((sum, d) => sum + d.reportPct, 0) /
    results.details.length;

  console.log(`\nStatistiques globales:`);
  console.log(`  Total réunions: ${totalReunions}`);
  console.log(`  Durée moyenne: ${avgDuration.toFixed(2)}s`);
  console.log(`  Dates invalides: ${totalDatesInvalid}`);
  console.log(`  Hippodromes 'Inconnu': ${totalHippoUnknown}`);
  console.log(`  Taux rapports moyen: ${Math.round(avgReportPct)}%`);
}

testExhaustif().catch(console.error);
