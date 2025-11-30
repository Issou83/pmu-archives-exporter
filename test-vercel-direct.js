/**
 * TEST DIRECT VERCEL - Mesure précise du temps
 */

async function testVercelDirect() {
  const url =
    'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=aout%2Cmai&reunionNumbers=1&countries=FR';

  console.log('🔍 Test direct Vercel API...\n');
  console.log(`URL: ${url}\n`);

  const startTime = Date.now();

  // Checkpoints toutes les 2 secondes
  const checkpoints = [];
  const interval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    checkpoints.push(elapsed);
    process.stdout.write(`\r⏱️  ${elapsed}s...`);
  }, 2000);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(70000),
    });

    clearInterval(interval);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n\n✅ Réponse reçue en ${totalTime}s`);
    console.log(`Status: ${response.status}`);

    if (response.status === 504) {
      console.log('\n❌ TIMEOUT 504!');
      console.log(`\n📊 Analyse:`);
      console.log(`   - Temps total: ${totalTime}s`);
      console.log(`   - Checkpoints: ${checkpoints.join('s, ')}s`);
      console.log(`\n💡 Le timeout se produit probablement:`);
      console.log(`   - Pendant le scraping initial (scrapeMonthPage)`);
      console.log(`   - OU pendant le scraping des rapports (scrapeArrivalReport)`);
    } else if (response.status === 200) {
      const data = await response.json();
      console.log(`\n✅ SUCCÈS!`);
      console.log(`   Total réunions: ${data.length}`);
      const withReports = data.filter((r) => r.arrivalReport).length;
      console.log(`   Avec rapports: ${withReports} (${((withReports / data.length) * 100).toFixed(1)}%)`);
    } else {
      const text = await response.text();
      console.log(`\n⚠️  Status: ${response.status}`);
      console.log(`   Body: ${text.substring(0, 500)}`);
    }
  } catch (error) {
    clearInterval(interval);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n\n❌ Erreur après ${totalTime}s`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Checkpoints: ${checkpoints.join('s, ')}s`);

    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      console.log(`\n📊 TIMEOUT détecté à ${totalTime}s`);
      console.log(`\n💡 Solutions:`);
      console.log(`   1. Réduire MAX_INITIAL_SCRAPING_TIME (actuellement 35s)`);
      console.log(`   2. Réduire le batch size pour les rapports`);
      console.log(`   3. Limiter le nombre de réunions scrapées`);
    }
  }
}

testVercelDirect();

