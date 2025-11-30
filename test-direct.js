// Test direct avec fetch (Node.js 18+)
const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function testDirect() {
  console.log('='.repeat(60));
  console.log('TEST DIRECT - Vérification des améliorations');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    console.log('🔄 Requête en cours...');
    const startTime = Date.now();
    
    const response = await fetch(
      `${API_URL}?source=turf-fr&years=2023&months=janvier`,
      { signal: AbortSignal.timeout(70000) }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}`);
      console.log(`Message: ${errorText.substring(0, 300)}`);
      return;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.log('❌ Réponse invalide (pas un tableau)');
      return;
    }
    
    const total = data.length;
    const reports = data.filter(r => r.arrivalReport).length;
    const unknown = data.filter(r => r.hippodrome === 'Inconnu').length;
    const reportRate = total > 0 ? ((reports / total) * 100).toFixed(1) : 0;
    
    console.log('');
    console.log('✅ RÉSULTATS:');
    console.log('   ⏱️  Durée:', duration + 's');
    console.log('   📊 Réunions:', total);
    console.log('   📈 Rapports:', reports, `(${reportRate}%)`);
    console.log('   🏇 Hippodromes inconnus:', unknown);
    console.log('');
    
    // Afficher quelques exemples
    if (data.length > 0) {
      console.log('📋 Exemples de réunions:');
      data.slice(0, 3).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.hippodrome} - ${r.dateISO} - Rapport: ${r.arrivalReport ? '✅' : '❌'}`);
      });
    }
    
    console.log('');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
    if (error.name === 'AbortError') {
      console.log('   (Timeout)');
    }
  }
}

testDirect();

