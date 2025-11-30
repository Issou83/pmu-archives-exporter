/**
 * TEST COMPLET AVEC DEBUG - Comparaison API vs Pages Réelles
 * Utilise le navigateur pour vérifier les URLs scrapées
 */

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

async function testCompletAvecDebug() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST COMPLET AVEC DEBUG - Comparaison API vs Pages Réelles');
  console.log('='.repeat(80) + '\n');

  const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';
  const testUrl = `${API_URL}?source=turf-fr&years=2024&months=janvier`;

  console.log('⏳ Attente de 20 secondes pour le déploiement Vercel...\n');
  await new Promise((resolve) => setTimeout(resolve, 20000));

  try {
    console.log('🔄 Requête API Vercel...\n');
    const startTime = Date.now();
    const data = await fetchUrl(testUrl);
    const elapsedTime = Date.now() - startTime;
    const elapsedSeconds = (elapsedTime / 1000).toFixed(2);

    console.log(`✅ Réponse API reçue en ${elapsedSeconds}s`);
    console.log(`📊 Total réunions: ${data.length}\n`);

    const withReports = data.filter((r) => r.arrivalReport);
    const withoutReports = data.filter((r) => !r.arrivalReport);
    const reportRate =
      data.length > 0
        ? ((withReports.length / data.length) * 100).toFixed(1)
        : 0;

    console.log(`📈 Statistiques:`);
    console.log(`   - Avec rapports: ${withReports.length} (${reportRate}%)`);
    console.log(`   - Sans rapports: ${withoutReports.length} (${(100 - parseFloat(reportRate)).toFixed(1)}%)\n`);

    // Sélectionner quelques réunions pour vérification manuelle
    const reunionsToVerify = [
      ...withReports.slice(0, 2),
      ...withoutReports.slice(0, 3),
    ].slice(0, 5);

    console.log('🔍 URLs à vérifier dans le navigateur:\n');
    reunionsToVerify.forEach((r, index) => {
      console.log(`${index + 1}. ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   Rapport: ${r.arrivalReport || 'NON TROUVÉ'}`);
      console.log(`   Pays: ${r.countryCode}`);
      console.log('');
    });

    // Sauvegarder les résultats pour analyse
    const fs = require('fs');
    const results = {
      timestamp: new Date().toISOString(),
      elapsedTime: elapsedTime / 1000,
      totalReunions: data.length,
      withReports: withReports.length,
      withoutReports: withoutReports.length,
      reportRate: parseFloat(reportRate),
      reunionsToVerify: reunionsToVerify.map((r) => ({
        date: r.dateLabel,
        hippodrome: r.hippodrome,
        reunion: r.reunionNumber,
        url: r.url,
        report: r.arrivalReport,
        country: r.countryCode,
      })),
      allReunions: data.map((r) => ({
        date: r.dateLabel,
        hippodrome: r.hippodrome,
        reunion: r.reunionNumber,
        url: r.url,
        report: r.arrivalReport || null,
        country: r.countryCode,
      })),
    };

    fs.writeFileSync(
      'test-complet-avec-debug-results.json',
      JSON.stringify(results, null, 2)
    );

    console.log('💾 Résultats sauvegardés dans test-complet-avec-debug-results.json');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Vérifier les URLs dans le navigateur');
    console.log('   2. Comparer les rapports trouvés vs pages réelles');
    console.log('   3. Analyser les réunions sans rapports');

    return results;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    if (error.message.includes('504') || error.message.includes('Timeout')) {
      console.error(`   ⏱️  TIMEOUT détecté`);
    }
    throw error;
  }
}

testCompletAvecDebug()
  .then((results) => {
    console.log('\n✅ Test terminé avec succès');
    console.log(`📊 Taux de rapports: ${results.reportRate}%`);
  })
  .catch(console.error);

