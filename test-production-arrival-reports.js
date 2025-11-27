// Script de test pour vérifier les rapports d'arrivée en production
const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function testArrivalReports() {
  console.log('🧪 TEST DES RAPPORTS D\'ARRIVÉE EN PRODUCTION\n');
  console.log('⏳ Attente de 5 secondes pour le déploiement...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Test 1: Février 2024, réunions 1 et 2, France
    console.log('📋 Test 1: Février 2024, Réunions 1-2, France');
    const url1 = `${API_URL}?source=turf-fr&years=2024&months=fevrier&reunionNumbers=1,2&countries=FR`;
    const response1 = await fetch(url1);
    
    if (!response1.ok) {
      console.error(`❌ Erreur HTTP ${response1.status}: ${response1.statusText}`);
      const text = await response1.text();
      console.error('Réponse:', text.substring(0, 200));
      return;
    }

    const data1 = await response1.json();
    
    if (!Array.isArray(data1)) {
      console.error('❌ La réponse n\'est pas un tableau:', typeof data1);
      console.error('Réponse:', JSON.stringify(data1).substring(0, 200));
      return;
    }

    const withReport1 = data1.filter(r => r.arrivalReport);
    const withoutReport1 = data1.filter(r => !r.arrivalReport);
    
    console.log(`   Total: ${data1.length} réunions`);
    console.log(`   ✅ Avec rapport: ${withReport1.length}`);
    console.log(`   ❌ Sans rapport: ${withoutReport1.length}`);
    console.log(`   📊 Taux de réussite: ${((withReport1.length / data1.length) * 100).toFixed(1)}%`);
    
    if (withReport1.length > 0) {
      console.log('\n   Exemples de rapports trouvés:');
      withReport1.slice(0, 5).forEach(r => {
        console.log(`   ✅ ${r.hippodrome} R${r.reunionNumber}: ${r.arrivalReport}`);
      });
    }
    
    if (withoutReport1.length > 0) {
      console.log('\n   ⚠️ Réunions sans rapport:');
      withoutReport1.slice(0, 5).forEach(r => {
        console.log(`   ❌ ${r.hippodrome} R${r.reunionNumber} - URL: ${r.url}`);
      });
    }

    // Test 2: Janvier + Février 2024, toutes réunions
    console.log('\n\n📋 Test 2: Janvier + Février 2024, Réunions 1-2, France');
    const url2 = `${API_URL}?source=turf-fr&years=2024&months=janvier,fevrier&reunionNumbers=1,2&countries=FR`;
    const response2 = await fetch(url2);
    
    if (response2.ok) {
      const data2 = await response2.json();
      if (Array.isArray(data2)) {
        const withReport2 = data2.filter(r => r.arrivalReport);
        const withoutReport2 = data2.filter(r => !r.arrivalReport);
        
        console.log(`   Total: ${data2.length} réunions`);
        console.log(`   ✅ Avec rapport: ${withReport2.length}`);
        console.log(`   ❌ Sans rapport: ${withoutReport2.length}`);
        console.log(`   📊 Taux de réussite: ${((withReport2.length / data2.length) * 100).toFixed(1)}%`);
      }
    }

    // Résumé final
    console.log('\n\n📊 RÉSUMÉ FINAL');
    console.log('═══════════════════════════════════════');
    if (withoutReport1.length === 0) {
      console.log('✅ SUCCÈS: Tous les rapports d\'arrivée sont présents!');
    } else {
      console.log(`⚠️ ATTENTION: ${withoutReport1.length} réunion(s) sans rapport sur ${data1.length}`);
      console.log('   Le scraper a besoin d\'être amélioré pour ces cas spécifiques.');
    }
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testArrivalReports();

