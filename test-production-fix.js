// Test de l'API en production après le fix
const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=janvier&countries=FR';

async function testProductionAPI() {
  console.log('🧪 Test de l\'API en production après le fix\n');
  console.log(`📡 URL: ${API_URL}\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(API_URL);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('❌ La réponse n\'est pas un tableau');
      return;
    }

    console.log(`✅ Réponse reçue en ${duration}s`);
    console.log(`📊 Total de réunions: ${data.length}\n`);

    // Analyser les rapports d'arrivée
    const withReport = data.filter(r => r.arrivalReport);
    const withoutReport = data.filter(r => !r.arrivalReport);

    console.log(`✅ Réunions AVEC rapport d'arrivée: ${withReport.length} (${((withReport.length / data.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Réunions SANS rapport d'arrivée: ${withoutReport.length} (${((withoutReport.length / data.length) * 100).toFixed(1)}%)\n`);

    // Afficher quelques exemples avec rapport
    if (withReport.length > 0) {
      console.log('📋 Exemples de réunions AVEC rapport d\'arrivée:');
      withReport.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.hippodrome} R${r.reunionNumber} → ${r.arrivalReport}`);
      });
      console.log('');
    }

    // Afficher quelques exemples sans rapport
    if (withoutReport.length > 0) {
      console.log('⚠️  Exemples de réunions SANS rapport d\'arrivée:');
      withoutReport.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.hippodrome} R${r.reunionNumber} → URL: ${r.url}`);
      });
      console.log('');

      // Tester manuellement quelques URLs sans rapport
      if (withoutReport.length > 0) {
        console.log('🔍 Test manuel des premières URLs sans rapport...\n');
        for (let i = 0; i < Math.min(3, withoutReport.length); i++) {
          const reunion = withoutReport[i];
          console.log(`   Test ${i + 1}: ${reunion.hippodrome} R${reunion.reunionNumber}`);
          console.log(`   URL: ${reunion.url}`);
          
          try {
            const pageResponse = await fetch(reunion.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });
            
            if (pageResponse.ok) {
              const html = await pageResponse.text();
              // Chercher rapidement si "Arrivée" est présent
              if (html.includes('Arrivée') || html.includes('arrivée')) {
                console.log(`   ✅ La page contient "Arrivée"`);
              } else {
                console.log(`   ⚠️  La page ne contient pas "Arrivée"`);
              }
            } else {
              console.log(`   ❌ HTTP ${pageResponse.status}`);
            }
          } catch (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
          }
          
          console.log('');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Résumé final
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   Total: ${data.length} réunions`);
    console.log(`   Avec rapport: ${withReport.length} (${((withReport.length / data.length) * 100).toFixed(1)}%)`);
    console.log(`   Sans rapport: ${withoutReport.length} (${((withoutReport.length / data.length) * 100).toFixed(1)}%)`);
    
    if (withReport.length === data.length) {
      console.log('\n🎉 SUCCÈS TOTAL ! Tous les rapports d\'arrivée sont détectés !');
    } else if (withReport.length > data.length * 0.8) {
      console.log('\n✅ EXCELLENT ! Plus de 80% des rapports sont détectés.');
    } else if (withReport.length > data.length * 0.5) {
      console.log('\n⚠️  AMÉLIORATION NÉCESSAIRE. Moins de 50% des rapports sont détectés.');
    } else {
      console.log('\n❌ PROBLÈME. Moins de 50% des rapports sont détectés.');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error.stack);
  }
}

testProductionAPI();

