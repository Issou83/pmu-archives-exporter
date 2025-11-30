// Script pour afficher les résultats précédents et lancer un nouveau test
const fs = require('fs');

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function afficherEtTester() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS DES TESTS PRÉCÉDENTS');
  console.log('='.repeat(80) + '\n');
  
  // Lire les résultats précédents
  if (fs.existsSync('test-results-complete.json')) {
    const previous = JSON.parse(fs.readFileSync('test-results-complete.json', 'utf8'));
    
    console.log('📈 STATISTIQUES GLOBALES:');
    console.log(`   Total réunions: ${previous.globalStats.totalReunions}`);
    console.log(`   Total rapports: ${previous.globalStats.totalReports} (${((previous.globalStats.totalReports / previous.globalStats.totalReunions) * 100).toFixed(1)}%)`);
    console.log(`   Hippodromes inconnus: ${previous.globalStats.totalUnknownHippo}`);
    console.log(`   Timeouts: ${previous.timeouts}`);
    console.log('');
    
    console.log('📅 PAR ANNÉE:');
    for (const [year, stats] of Object.entries(previous.byYear)) {
      const reportRate = stats.reunions > 0 ? ((stats.reports / stats.reunions) * 100).toFixed(1) : 0;
      console.log(`   ${year}: ${stats.reunions} réunions, ${stats.reports} rapports (${reportRate}%), ${stats.unknownHippo} inconnus, ${stats.timeouts} timeouts`);
    }
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('🔄 NOUVEAU TEST - Vérification des améliorations');
  console.log('='.repeat(80) + '\n');
  
  // Test sur 2023 janvier (mois qui fonctionne bien)
  try {
    console.log('⏳ Test en cours sur 2023 janvier...\n');
    const startTime = Date.now();
    
    const response = await fetch(
      `${API_URL}?source=turf-fr&years=2023&months=janvier`,
      { signal: AbortSignal.timeout(70000) }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}`);
      console.log(`Message: ${errorText.substring(0, 300)}\n`);
      return;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.log('❌ Réponse invalide (pas un tableau)\n');
      return;
    }
    
    const total = data.length;
    const reports = data.filter(r => r.arrivalReport).length;
    const unknown = data.filter(r => r.hippodrome === 'Inconnu').length;
    const reportRate = total > 0 ? ((reports / total) * 100).toFixed(1) : 0;
    
    console.log('✅ RÉSULTATS DU NOUVEAU TEST:');
    console.log(`   ⏱️  Durée: ${duration}s`);
    console.log(`   📊 Réunions: ${total}`);
    console.log(`   📈 Rapports: ${reports} (${reportRate}%)`);
    console.log(`   🏇 Hippodromes inconnus: ${unknown}`);
    console.log('');
    
    // Comparaison avec les résultats précédents
    if (fs.existsSync('test-results-complete.json')) {
      const previous = JSON.parse(fs.readFileSync('test-results-complete.json', 'utf8'));
      const prev2023 = previous.byYear['2023'];
      if (prev2023) {
        const prevJanReports = prev2023.reports / 12; // Estimation pour janvier
        const prevJanUnknown = prev2023.unknownHippo / 12; // Estimation pour janvier
        
        console.log('📊 COMPARAISON:');
        console.log(`   Rapports: ${reports} (nouveau) vs ~${Math.round(prevJanReports)} (précédent)`);
        console.log(`   Inconnus: ${unknown} (nouveau) vs ~${Math.round(prevJanUnknown)} (précédent)`);
        console.log('');
      }
    }
    
    // Exemples
    if (data.length > 0) {
      console.log('📋 Exemples de réunions:');
      data.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.hippodrome} - ${r.dateISO} - Rapport: ${r.arrivalReport ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    if (error.name === 'AbortError') {
      console.log('   (Timeout)\n');
    }
  }
}

afficherEtTester();

