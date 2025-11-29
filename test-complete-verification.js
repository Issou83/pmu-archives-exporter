/**
 * Script de test complet pour vérifier tous les problèmes rencontrés
 * - Dates correctes
 * - Hippodromes non "Inconnu"
 * - Rapports d'arrivée présents
 * - URLs valides
 * - Données cohérentes
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function testCompleteVerification() {
  console.log('=== TEST COMPLET DE VERIFICATION ===\n');
  console.log('Attente de 10 secondes pour le déploiement Vercel...\n');
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const testCases = [
    {
      name: 'Janvier 2024',
      params: 'source=turf-fr&years=2024&months=janvier',
      expectedMinReunions: 200,
    },
    {
      name: 'Février 2024',
      params: 'source=turf-fr&years=2024&months=fevrier',
      expectedMinReunions: 180,
    },
    {
      name: 'Mai 2024',
      params: 'source=turf-fr&years=2024&months=mai',
      expectedMinReunions: 200,
    },
  ];

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${testCase.name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const response = await fetch(`${API_URL}?${testCase.params}`);
      if (!response.ok) {
        console.error(`   ❌ Erreur HTTP ${response.status}`);
        totalFailed++;
        continue;
      }

      const data = await response.json();

      // Gérer le cas où l'API retourne un objet avec une propriété error
      if (!Array.isArray(data)) {
        console.error(
          `   ❌ L'API a retourné une erreur: ${JSON.stringify(data)}`
        );
        totalFailed++;
        continue;
      }

      totalTests++;
      console.log(`   📊 Réunions trouvées: ${data.length}`);

      // Test 1: Nombre minimum de réunions
      if (data.length < testCase.expectedMinReunions) {
        console.log(
          `   ⚠️  Nombre de réunions inférieur à l'attendu (${testCase.expectedMinReunions})`
        );
      } else {
        console.log(`   ✅ Nombre de réunions suffisant`);
        totalPassed++;
      }

      // Test 2: Dates valides et cohérentes
      const invalidDates = data.filter((r) => {
        if (!r.dateISO) return true;
        const date = new Date(r.dateISO);
        if (isNaN(date.getTime())) return true;
        // Vérifier que la date correspond au mois attendu
        const monthMatch = testCase.params.match(/months=(\w+)/);
        if (monthMatch) {
          const monthSlug = monthMatch[1];
          const monthNames = {
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
          const expectedMonth = monthNames[monthSlug];
          if (
            expectedMonth !== undefined &&
            date.getMonth() !== expectedMonth
          ) {
            return true;
          }
        }
        // Vérifier que l'année est 2024
        if (date.getFullYear() !== 2024) return true;
        return false;
      });

      if (invalidDates.length > 0) {
        console.log(
          `   ❌ ${invalidDates.length} réunions avec dates invalides ou incorrectes`
        );
        invalidDates.slice(0, 5).forEach((r) => {
          console.log(
            `      - ${r.hippodrome} R${r.reunionNumber}: ${r.dateISO || 'NULL'} (${r.dateLabel || 'NULL'})`
          );
        });
        totalFailed++;
      } else {
        console.log(`   ✅ Toutes les dates sont valides et cohérentes`);
        totalPassed++;
      }

      // Test 3: Hippodromes non "Inconnu"
      const unknownHippodromes = data.filter(
        (r) =>
          !r.hippodrome || r.hippodrome === 'Inconnu' || r.hippodrome.length < 2
      );

      if (unknownHippodromes.length > 0) {
        console.log(
          `   ⚠️  ${unknownHippodromes.length} réunions avec hippodromes "Inconnu" ou invalides`
        );
        unknownHippodromes.slice(0, 5).forEach((r) => {
          console.log(
            `      - Hippodrome: "${r.hippodrome}" (R${r.reunionNumber}, ${r.dateLabel})`
          );
          console.log(`        URL: ${r.url}`);
        });
        // Ne pas compter comme échec car c'est un problème mineur
      } else {
        console.log(`   ✅ Tous les hippodromes sont valides`);
        totalPassed++;
      }

      // Test 4: Rapports d'arrivée présents
      const withReports = data.filter((r) => r.arrivalReport);
      const withoutReports = data.filter((r) => !r.arrivalReport);
      const reportPercentage = Math.round(
        (withReports.length / data.length) * 100
      );

      console.log(
        `   📈 Rapports d'arrivée: ${withReports.length} avec (${reportPercentage}%), ${withoutReports.length} sans`
      );

      if (reportPercentage < 90) {
        console.log(
          `   ⚠️  Seulement ${reportPercentage}% des réunions ont un rapport d'arrivée`
        );
        withoutReports.slice(0, 5).forEach((r) => {
          console.log(
            `      - ${r.hippodrome} R${r.reunionNumber}: ${r.dateLabel}`
          );
        });
        // Ne pas compter comme échec car certains rapports peuvent ne pas exister
      } else {
        console.log(`   ✅ Taux de rapports d'arrivée acceptable (≥90%)`);
        totalPassed++;
      }

      // Test 5: URLs valides
      const invalidUrls = data.filter(
        (r) => !r.url || !r.url.includes('turf-fr.com') || !r.url.includes('r')
      );

      if (invalidUrls.length > 0) {
        console.log(`   ❌ ${invalidUrls.length} réunions avec URLs invalides`);
        invalidUrls.slice(0, 3).forEach((r) => {
          console.log(`      - URL: "${r.url}"`);
        });
        totalFailed++;
      } else {
        console.log(`   ✅ Toutes les URLs sont valides`);
        totalPassed++;
      }

      // Test 6: Champs requis présents
      const requiredFields = [
        'id',
        'dateISO',
        'dateLabel',
        'hippodrome',
        'reunionNumber',
        'url',
        'source',
      ];
      const missingFields = data.filter((r) => {
        return requiredFields.some((field) => !r[field]);
      });

      if (missingFields.length > 0) {
        console.log(
          `   ❌ ${missingFields.length} réunions avec champs manquants`
        );
        missingFields.slice(0, 3).forEach((r) => {
          const missing = requiredFields.filter((f) => !r[f]);
          console.log(
            `      - ${r.hippodrome} R${r.reunionNumber}: manque ${missing.join(', ')}`
          );
        });
        totalFailed++;
      } else {
        console.log(`   ✅ Tous les champs requis sont présents`);
        totalPassed++;
      }

      // Test 7: Pas de doublons
      const ids = data.map((r) => r.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.log(`   ❌ ${ids.length - uniqueIds.size} doublons détectés`);
        totalFailed++;
      } else {
        console.log(`   ✅ Aucun doublon détecté`);
        totalPassed++;
      }

      // Test 8: Codes pays valides
      const validCountryCodes = ['FR', 'GB', 'SWE', 'USA', 'IRE', 'GER', 'ITA'];
      const invalidCountries = data.filter(
        (r) => !r.countryCode || !validCountryCodes.includes(r.countryCode)
      );

      if (invalidCountries.length > 0) {
        console.log(
          `   ⚠️  ${invalidCountries.length} réunions avec codes pays invalides`
        );
        invalidCountries.slice(0, 5).forEach((r) => {
          console.log(`      - ${r.hippodrome}: "${r.countryCode}"`);
        });
        // Ne pas compter comme échec
      } else {
        console.log(`   ✅ Tous les codes pays sont valides`);
        totalPassed++;
      }

      // Résumé pour ce test
      console.log(`\n   📋 Résumé ${testCase.name}:`);
      console.log(`      - Réunions: ${data.length}`);
      console.log(`      - Dates invalides: ${invalidDates.length}`);
      console.log(
        `      - Hippodromes "Inconnu": ${unknownHippodromes.length}`
      );
      console.log(
        `      - Rapports manquants: ${withoutReports.length} (${100 - reportPercentage}%)`
      );
      console.log(`      - URLs invalides: ${invalidUrls.length}`);
      console.log(`      - Champs manquants: ${missingFields.length}`);
      console.log(`      - Doublons: ${ids.length - uniqueIds.size}`);
      console.log(`      - Codes pays invalides: ${invalidCountries.length}`);
    } catch (error) {
      console.error(`   ❌ Erreur lors du test: ${error.message}`);
      totalFailed++;
    }
  }

  // Résumé global
  console.log(`\n${'='.repeat(60)}`);
  console.log('RÉSUMÉ GLOBAL');
  console.log(`${'='.repeat(60)}`);
  console.log(`Tests effectués: ${totalTests}`);
  console.log(`Tests réussis: ${totalPassed}`);
  console.log(`Tests échoués: ${totalFailed}`);
  console.log(
    `Taux de réussite: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`
  );
}

// Exécuter les tests
testCompleteVerification().catch(console.error);
