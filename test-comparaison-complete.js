/**
 * TEST COMPARAISON COMPLÈTE - API vs Navigateur
 * Compare ce que l'API trouve vs ce qui est réellement sur les pages
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

async function testComparaisonComplete() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 TEST COMPARAISON COMPLÈTE - API vs Navigateur');
  console.log('='.repeat(80) + '\n');

  const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';
  const testUrl = `${API_URL}?source=turf-fr&years=2024&months=janvier`;

  console.log('⏳ Attente de 20 secondes pour le déploiement Vercel...\n');
  await new Promise((resolve) => setTimeout(resolve, 20000));

  try {
    console.log('🔄 Requête API Vercel...\n');
    const data = await fetchUrl(testUrl);

    console.log(`✅ ${data.length} réunions récupérées\n`);

    const withReports = data.filter((r) => r.arrivalReport);
    const withoutReports = data.filter((r) => !r.arrivalReport);
    const reportRate =
      data.length > 0
        ? ((withReports.length / data.length) * 100).toFixed(1)
        : 0;

    console.log('📊 STATISTIQUES API:');
    console.log(`   - Total réunions: ${data.length}`);
    console.log(`   - Avec rapports: ${withReports.length} (${reportRate}%)`);
    console.log(`   - Sans rapports: ${withoutReports.length} (${(100 - parseFloat(reportRate)).toFixed(1)}%)\n`);

    // Réunion spécifique à vérifier
    const vincennesR1 = data.filter(
      (r) =>
        r.hippodrome === 'Vincennes' &&
        r.reunionNumber === 1 &&
        r.dateLabel &&
        r.dateLabel.includes('01 janvier 2024')
    );

    if (vincennesR1.length > 0) {
      const reunion = vincennesR1[0];
      console.log('🔍 RÉUNION TEST (Vincennes R1 du 1er janvier 2024):');
      console.log(`   - URL scrapée: ${reunion.url}`);
      console.log(`   - Rapport API: ${reunion.arrivalReport || 'NON TROUVÉ'}`);
      console.log(`   - URL arrivée attendue: ${reunion.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}`);
      console.log('');
      console.log('🌐 VÉRIFICATION NAVIGATEUR:');
      console.log('   - Page de réunion: https://www.turf-fr.com/partants-programmes/r1-vincennes-36237');
      console.log('   - Liens /arrivees-rapports/ trouvés: 10 liens');
      console.log('   - Exemples de liens:');
      console.log('     * /courses-pmu/arrivees-rapports/r1-finale-du-grand-national-du-trot-364669');
      console.log('     * /courses-pmu/arrivees-rapports/r1-prix-de-saint-georges-de-didonne-364611');
      console.log('');
      
      if (reunion.arrivalReport) {
        console.log('   ✅ SUCCÈS : Le scraper a trouvé un rapport !');
        console.log(`      Rapport: ${reunion.arrivalReport}`);
      } else {
        console.log('   ⚠️  Le scraper n\'a pas trouvé de rapport pour cette réunion');
        console.log('   🔍 À vérifier : Les liens /arrivees-rapports/ sont-ils bien testés ?');
      }
    } else {
      console.log('⚠️  Réunion Vincennes R1 du 1er janvier 2024 non trouvée dans les résultats API');
    }

    // Sélectionner des réunions pour vérification détaillée
    const reunionsToVerify = {
      withReports: withReports.slice(0, 5),
      withoutReports: withoutReports.slice(0, 10),
    };

    console.log('\n' + '='.repeat(80));
    console.log('📋 RÉUNIONS À VÉRIFIER DANS LE NAVIGATEUR:\n');

    console.log('✅ RÉUNIONS AVEC RAPPORTS (vérifier que les rapports sont corrects):\n');
    reunionsToVerify.withReports.forEach((r, index) => {
      console.log(`${index + 1}. ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}`);
      console.log(`   URL réunion: ${r.url}`);
      console.log(`   Rapport API: ${r.arrivalReport}`);
      console.log(`   URL arrivée à vérifier: ${r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('❌ RÉUNIONS SANS RAPPORTS (vérifier pourquoi):\n');
    reunionsToVerify.withoutReports.forEach((r, index) => {
      console.log(`${index + 1}. ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}`);
      console.log(`   URL réunion: ${r.url}`);
      console.log(`   URL arrivée à tester: ${r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}`);
      console.log(`   ⚠️  À vérifier : Y a-t-il des liens /arrivees-rapports/ sur cette page ?`);
      console.log('');
    });

    // Sauvegarder les résultats
    const fs = require('fs');
    const results = {
      timestamp: new Date().toISOString(),
      totalReunions: data.length,
      withReports: withReports.length,
      withoutReports: withoutReports.length,
      reportRate: parseFloat(reportRate),
      comparison: {
        vincennesR1: vincennesR1.length > 0 ? {
          url: vincennesR1[0].url,
          report: vincennesR1[0].arrivalReport,
          urlArrivee: vincennesR1[0].url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/'),
          browserLinks: [
            'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-finale-du-grand-national-du-trot-364669',
            'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-prix-de-saint-georges-de-didonne-364611',
          ],
        } : null,
      },
      reunionsToVerify: {
        withReports: reunionsToVerify.withReports.map((r) => ({
          date: r.dateLabel,
          hippodrome: r.hippodrome,
          reunion: r.reunionNumber,
          url: r.url,
          report: r.arrivalReport,
          urlArrivee: r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/'),
        })),
        withoutReports: reunionsToVerify.withoutReports.map((r) => ({
          date: r.dateLabel,
          hippodrome: r.hippodrome,
          reunion: r.reunionNumber,
          url: r.url,
          urlArrivee: r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/'),
        })),
      },
    };

    fs.writeFileSync(
      'test-comparaison-complete-results.json',
      JSON.stringify(results, null, 2)
    );

    console.log('💾 Résultats sauvegardés dans test-comparaison-complete-results.json\n');

    // Analyse
    console.log('📊 ANALYSE:');
    if (parseFloat(reportRate) >= 10) {
      console.log(`   ✅ AMÉLIORATION DÉTECTÉE ! (${reportRate}% >= 10%)`);
      console.log(`   Le scraper trouve maintenant plus de rapports grâce à la recherche des liens /arrivees-rapports/`);
    } else if (parseFloat(reportRate) >= 5) {
      console.log(`   ⚠️  Légère amélioration (${reportRate}% >= 5%)`);
      console.log(`   L'amélioration fonctionne mais peut être optimisée`);
    } else {
      console.log(`   ❌ Pas d'amélioration détectée (${reportRate}% < 5%)`);
      console.log(`   ⚠️  À investiguer : Pourquoi les liens /arrivees-rapports/ ne sont-ils pas trouvés ?`);
    }

    return results;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    if (error.message.includes('504') || error.message.includes('Timeout')) {
      console.error(`   ⏱️  TIMEOUT détecté - L'API Vercel a timeout`);
    }
    throw error;
  }
}

testComparaisonComplete()
  .then((results) => {
    console.log('\n✅ Test de comparaison terminé');
  })
  .catch(console.error);

