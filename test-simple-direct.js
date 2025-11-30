/**
 * TEST SIMPLE DIRECT - Test rapide avec affichage immédiat
 */

// Utiliser https si fetch n'est pas disponible
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Invalid JSON: ' + e.message));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      })
      .on('error', reject)
      .setTimeout(60000, () => {
        reject(new Error('Timeout'));
      });
  });
}

async function testSimpleDirect() {
  console.log('\n' + '='.repeat(80));
  console.log('⚡ TEST SIMPLE DIRECT - Vérification amélioration');
  console.log('='.repeat(80) + '\n');

  const testUrl =
    'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2024&months=janvier';

  console.log(`📋 Test URL: ${testUrl}\n`);
  console.log('⏳ Attente de 20 secondes pour le déploiement Vercel...\n');
  await new Promise((resolve) => setTimeout(resolve, 20000));

  try {
    console.log('🔄 Requête en cours...\n');
    const startTime = Date.now();
    const data = await fetchUrl(testUrl);
    const elapsedTime = Date.now() - startTime;
    const elapsedSeconds = (elapsedTime / 1000).toFixed(2);

    const withReports = data.filter((r) => r.arrivalReport);
    const withoutReports = data.filter((r) => !r.arrivalReport);
    const reportRate =
      data.length > 0
        ? ((withReports.length / data.length) * 100).toFixed(1)
        : 0;

    console.log(`✅ Réponse reçue en ${elapsedSeconds}s`);
    console.log(`📊 Total réunions: ${data.length}`);
    console.log(`✅ Avec rapports: ${withReports.length} (${reportRate}%)`);
    console.log(
      `❌ Sans rapports: ${withoutReports.length} (${(100 - parseFloat(reportRate)).toFixed(1)}%)\n`
    );

    // Vérifier spécifiquement Vincennes R1 du 1er janvier
    const vincennesR1 = data.filter(
      (r) =>
        r.hippodrome === 'Vincennes' &&
        r.reunionNumber === 1 &&
        r.dateLabel &&
        r.dateLabel.includes('01 janvier 2024')
    );

    if (vincennesR1.length > 0) {
      const reunion = vincennesR1[0];
      console.log('🔍 Réunion test (Vincennes R1 du 1er janvier 2024):');
      console.log(`   - URL: ${reunion.url}`);
      console.log(`   - Rapport: ${reunion.arrivalReport || 'NON TROUVÉ'}`);

      if (reunion.arrivalReport) {
        console.log(`   ✅ SUCCÈS : Rapport trouvé !`);
      } else {
        console.log(`   ⚠️  Rapport non trouvé pour cette réunion`);
      }
    } else {
      console.log('⚠️  Réunion Vincennes R1 du 1er janvier 2024 non trouvée');
    }

    // Afficher quelques exemples
    if (withReports.length > 0) {
      console.log(`\n📋 Exemples de réunions avec rapports:`);
      withReports.slice(0, 5).forEach((r) => {
        console.log(
          `   ✅ ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}: ${r.arrivalReport}`
        );
      });
    }

    if (withoutReports.length > 0) {
      console.log(`\n📋 Exemples de réunions sans rapports:`);
      withoutReports.slice(0, 3).forEach((r) => {
        console.log(
          `   ❌ ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}: ${r.url}`
        );
      });
    }

    // Comparaison avec les résultats précédents
    console.log(`\n📊 COMPARAISON:`);
    console.log(`   - Taux actuel: ${reportRate}%`);
    console.log(`   - Taux attendu (amélioration): ~15-20%`);
    console.log(`   - Taux précédent: ~5%`);

    if (parseFloat(reportRate) >= 10) {
      console.log(
        `   ✅ AMÉLIORATION DÉTECTÉE ! (${reportRate}% >= 10%)`
      );
    } else if (parseFloat(reportRate) >= 5) {
      console.log(`   ⚠️  Légère amélioration (${reportRate}% >= 5%)`);
    } else {
      console.log(`   ❌ Pas d'amélioration détectée (${reportRate}% < 5%)`);
    }

    // Sauvegarder les résultats
    const fs = require('fs');
    fs.writeFileSync(
      'test-simple-direct-results.json',
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          elapsedTime: elapsedTime / 1000,
          totalReunions: data.length,
          withReports: withReports.length,
          withoutReports: withoutReports.length,
          reportRate: parseFloat(reportRate),
          examples: {
            withReports: withReports.slice(0, 5).map((r) => ({
              date: r.dateLabel,
              hippodrome: r.hippodrome,
              reunion: r.reunionNumber,
              report: r.arrivalReport,
            })),
            withoutReports: withoutReports.slice(0, 3).map((r) => ({
              date: r.dateLabel,
              hippodrome: r.hippodrome,
              reunion: r.reunionNumber,
              url: r.url,
            })),
          },
        },
        null,
        2
      )
    );
    console.log(`\n💾 Résultats sauvegardés dans test-simple-direct-results.json`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    if (error.message.includes('504') || error.message.includes('Timeout')) {
      console.error(`   ⏱️  TIMEOUT détecté`);
    }
  }
}

testSimpleDirect().catch(console.error);

