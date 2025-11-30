/**
 * TEST ANALYSE TIMEOUT - Comprendre pourquoi le timeout persiste
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
          } else if (res.statusCode === 504) {
            reject(new Error('TIMEOUT 504'));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      })
      .on('error', reject)
      .setTimeout(70000, () => {
        reject(new Error('Timeout'));
      });
  });
}

async function testTimeoutAnalyse() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANALYSE TIMEOUT - Comprendre le problème');
  console.log('='.repeat(80) + '\n');

  const testCases = [
    {
      name: 'Test avec filtres (timeout actuel)',
      url: 'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=aout%2Cmai&reunionNumbers=1&countries=FR',
    },
    {
      name: 'Test sans filtres (1 mois)',
      url: 'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=aout',
    },
    {
      name: 'Test avec filtres (1 mois)',
      url: 'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=aout&reunionNumbers=1&countries=FR',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`📋 TEST: ${testCase.name}`);
    console.log(`${'-'.repeat(80)}`);
    console.log(`URL: ${testCase.url}\n`);

    try {
      const startTime = Date.now();
      const data = await fetchUrl(testCase.url);
      const elapsedTime = Date.now() - startTime;
      const elapsedSeconds = (elapsedTime / 1000).toFixed(2);

      console.log(`✅ Réponse reçue en ${elapsedSeconds}s`);
      console.log(`📊 Total réunions: ${Array.isArray(data) ? data.length : 0}`);
      if (Array.isArray(data) && data.length > 0) {
        const withReports = data.filter((r) => r.arrivalReport).length;
        console.log(`✅ Avec rapports: ${withReports} (${((withReports / data.length) * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      const elapsedSeconds = (elapsedTime / 1000).toFixed(2);
      
      if (error.message.includes('TIMEOUT') || error.message.includes('504')) {
        console.log(`❌ TIMEOUT après ${elapsedSeconds}s`);
        console.log(`   ⚠️  Le scraping prend trop de temps même avec les filtres`);
      } else {
        console.log(`❌ Erreur: ${error.message} (après ${elapsedSeconds}s)`);
      }
    }

    // Pause entre les tests
    if (testCase !== testCases[testCases.length - 1]) {
      console.log(`\n⏳ Pause de 10 secondes avant le prochain test...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 ANALYSE:');
  console.log('='.repeat(80));
  console.log(`
Le problème peut venir de plusieurs sources :

1. **Scraping initial des réunions** (scrapeMonthPage) :
   - Scrape TOUTES les réunions de 2025 (août + mai)
   - Même avec filtres, cette étape prend du temps
   - Solution : Appliquer les filtres AVANT scrapeMonthPage (plus complexe)

2. **Scraping des rapports** :
   - Même avec filtres, si beaucoup de réunions R1 FR, ça peut timeout
   - Solution : Les filtres sont appliqués, mais peut-être pas assez tôt

3. **Cache** :
   - Le cache peut contenir des données non filtrées
   - Solution : Inclure les filtres dans la clé de cache

4. **Déploiement Vercel** :
   - Les modifications peuvent ne pas être déployées
   - Solution : Vérifier les logs Vercel
  `);
}

testTimeoutAnalyse().catch(console.error);

