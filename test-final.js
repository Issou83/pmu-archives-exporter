// Test final après correction
const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=janvier&countries=FR';

async function testFinal() {
  console.log('🧪 TEST FINAL - Vérification des rapports d\'arrivée\n');
  console.log(`📡 URL: ${API_URL}\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(API_URL);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}`);
      return;
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('❌ La réponse n\'est pas un tableau');
      return;
    }

    console.log(`✅ Réponse reçue en ${duration}s`);
    console.log(`📊 Total de réunions: ${data.length}\n`);

    const withReport = data.filter(r => r.arrivalReport);
    const withoutReport = data.filter(r => !r.arrivalReport);

    console.log(`✅ Réunions AVEC rapport d'arrivée: ${withReport.length} (${((withReport.length / data.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Réunions SANS rapport d'arrivée: ${withoutReport.length} (${((withoutReport.length / data.length) * 100).toFixed(1)}%)\n`);

    if (withReport.length === data.length) {
      console.log('🎉 SUCCÈS TOTAL ! Tous les rapports d\'arrivée sont détectés !');
    } else if (withReport.length > data.length * 0.95) {
      console.log('✅ EXCELLENT ! Plus de 95% des rapports sont détectés.');
    } else if (withReport.length > data.length * 0.90) {
      console.log('✅ TRÈS BON ! Plus de 90% des rapports sont détectés.');
    } else if (withReport.length > data.length * 0.80) {
      console.log('⚠️  BON. Plus de 80% des rapports sont détectés.');
    } else {
      console.log('❌ AMÉLIORATION NÉCESSAIRE. Moins de 80% des rapports sont détectés.');
    }

    if (withoutReport.length > 0) {
      console.log(`\n⚠️  ${withoutReport.length} réunions sans rapport:`);
      withoutReport.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.hippodrome} R${r.reunionNumber} → ${r.url}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testFinal();

