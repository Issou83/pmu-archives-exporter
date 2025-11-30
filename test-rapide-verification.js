/**
 * TEST RAPIDE - Vérification rapide de l'amélioration
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function testRapideVerification() {
  console.log('\n' + '='.repeat(80));
  console.log('⚡ TEST RAPIDE - Vérification amélioration');
  console.log('='.repeat(80) + '\n');

  // Test avec 2024 janvier (devrait avoir beaucoup de rapports)
  const testUrl = `${API_URL}?source=turf-fr&years=2024&months=janvier`;
  
  console.log(`📋 Test URL: ${testUrl}\n`);

  try {
    console.log('⏳ Attente de 15 secondes pour le déploiement Vercel...\n');
    await new Promise((resolve) => setTimeout(resolve, 15000));

    const startTime = Date.now();
    const response = await fetch(testUrl);
    const elapsedTime = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 504) {
        console.log(`❌ TIMEOUT (504) après ${(elapsedTime / 1000).toFixed(2)}s`);
        return;
      } else {
        console.log(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
        return;
      }
    }

    const data = await response.json();
    const elapsedSeconds = (elapsedTime / 1000).toFixed(2);

    const withReports = data.filter((r) => r.arrivalReport);
    const withoutReports = data.filter((r) => !r.arrivalReport);
    const reportRate = data.length > 0 ? ((withReports.length / data.length) * 100).toFixed(1) : 0;

    console.log(`✅ Réponse reçue en ${elapsedSeconds}s`);
    console.log(`📊 Total réunions: ${data.length}`);
    console.log(`✅ Avec rapports: ${withReports.length} (${reportRate}%)`);
    console.log(`❌ Sans rapports: ${withoutReports.length} (${(100 - parseFloat(reportRate)).toFixed(1)}%)\n`);

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
        console.log(`   ✅ ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}: ${r.arrivalReport}`);
      });
    }

    // Comparaison avec les résultats précédents
    console.log(`\n📊 COMPARAISON:`);
    console.log(`   - Taux actuel: ${reportRate}%`);
    console.log(`   - Taux attendu (amélioration): ~15-20%`);
    console.log(`   - Taux précédent: ~5%`);
    
    if (parseFloat(reportRate) >= 10) {
      console.log(`   ✅ AMÉLIORATION DÉTECTÉE ! (${reportRate}% >= 10%)`);
    } else if (parseFloat(reportRate) >= 5) {
      console.log(`   ⚠️  Légère amélioration (${reportRate}% >= 5%)`);
    } else {
      console.log(`   ❌ Pas d'amélioration détectée (${reportRate}% < 5%)`);
    }

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    console.error(error.stack);
  }
}

testRapideVerification().catch(console.error);

