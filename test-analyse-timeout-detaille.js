/**
 * TEST ANALYSE TIMEOUT DÉTAILLÉE
 * Mesure le temps à chaque étape pour identifier où le timeout se produit
 */

const https = require('https');

function fetchUrl(url, timeout = 70000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let responseData = '';
    let statusCode = null;

    const req = https.get(url, (res) => {
      statusCode = res.statusCode;
      res.on('data', (chunk) => {
        responseData += chunk.toString();
      });
      res.on('end', () => {
        const elapsedTime = Date.now() - startTime;
        resolve({
          statusCode,
          data: responseData,
          elapsedTime,
        });
      });
    });

    req.on('error', (error) => {
      const elapsedTime = Date.now() - startTime;
      reject({ error, elapsedTime });
    });

    req.setTimeout(timeout, () => {
      const elapsedTime = Date.now() - startTime;
      req.destroy();
      reject({ error: new Error('Request timeout'), elapsedTime });
    });
  });
}

async function testAnalyseTimeout() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANALYSE DÉTAILLÉE DU TIMEOUT');
  console.log('='.repeat(80) + '\n');

  const testUrl =
    'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=aout%2Cmai&reunionNumbers=1&countries=FR';

  console.log(`📋 URL testée: ${testUrl}\n`);
  console.log('⏱️  Chronométrage détaillé:\n');

  const overallStart = Date.now();
  let checkpoints = [];

  // Checkpoint toutes les 5 secondes
  const checkpointInterval = setInterval(() => {
    const elapsed = Date.now() - overallStart;
    const elapsedSeconds = (elapsed / 1000).toFixed(1);
    checkpoints.push({
      time: elapsedSeconds,
      message: `⏱️  ${elapsedSeconds}s écoulées...`,
    });
    process.stdout.write(`\r⏱️  ${elapsedSeconds}s écoulées...`);
  }, 5000);

  try {
    const result = await fetchUrl(testUrl, 70000);
    clearInterval(checkpointInterval);
    console.log('\n\n');

    const totalTime = result.elapsedTime;
    const totalSeconds = (totalTime / 1000).toFixed(2);

    console.log(`✅ Réponse reçue en ${totalSeconds}s\n`);

    if (result.statusCode === 504) {
      console.log('❌ TIMEOUT 504 détecté!\n');
      console.log('📊 Analyse:');
      console.log(`   - Temps total: ${totalSeconds}s`);
      console.log(`   - Le timeout se produit probablement pendant:`);
      console.log(`     * Le scraping initial des réunions (scrapeMonthPage)`);
      console.log(`     * OU le scraping des rapports d'arrivée (scrapeArrivalReport)`);
      console.log(`\n💡 Solutions:`);
      console.log(`   1. Réduire MAX_INITIAL_SCRAPING_TIME encore plus (actuellement 35s)`);
      console.log(`   2. Réduire le batch size pour les rapports`);
      console.log(`   3. Limiter le nombre de réunions scrapées initialement`);
    } else if (result.statusCode === 200) {
      try {
        const data = JSON.parse(result.data);
        console.log('✅ SUCCÈS!\n');
        console.log(`📊 Résultats:`);
        console.log(`   - Total réunions: ${Array.isArray(data) ? data.length : 0}`);
        if (Array.isArray(data) && data.length > 0) {
          const withReports = data.filter((r) => r.arrivalReport).length;
          console.log(
            `   - Avec rapports: ${withReports} (${((withReports / data.length) * 100).toFixed(1)}%)`
          );
        }
      } catch (e) {
        console.log('⚠️  Réponse reçue mais JSON invalide');
        console.log(`   Status: ${result.statusCode}`);
        console.log(`   Body (premiers 500 chars): ${result.data.substring(0, 500)}`);
      }
    } else {
      console.log(`⚠️  Status code inattendu: ${result.statusCode}`);
      console.log(`   Body (premiers 500 chars): ${result.data.substring(0, 500)}`);
    }
  } catch (errorResult) {
    clearInterval(checkpointInterval);
    console.log('\n\n');

    const totalTime = errorResult.elapsedTime || 0;
    const totalSeconds = (totalTime / 1000).toFixed(2);

    if (errorResult.error?.message?.includes('timeout')) {
      console.log(`❌ TIMEOUT après ${totalSeconds}s\n`);
      console.log('📊 Analyse:');
      console.log(`   - Le timeout se produit à ${totalSeconds}s`);
      console.log(`   - Limite Vercel: 60s (notre timeout: 56s)`);
      console.log(`\n💡 Le problème vient probablement de:`);
      console.log(`   1. Le scraping initial prend trop de temps (>35s)`);
      console.log(`   2. Le scraping des rapports prend trop de temps`);
      console.log(`   3. La combinaison des deux dépasse 56s`);
    } else {
      console.log(`❌ Erreur: ${errorResult.error?.message || 'Unknown error'}`);
      console.log(`   Temps écoulé: ${totalSeconds}s`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 Checkpoints enregistrés:');
  checkpoints.forEach((cp) => {
    console.log(`   ${cp.message}`);
  });
  console.log('='.repeat(80) + '\n');
}

testAnalyseTimeout().catch(console.error);

