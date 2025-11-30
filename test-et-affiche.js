// Test qui écrit les résultats dans un fichier texte lisible
const fs = require('fs');

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function testEtAffiche() {
  const output = [];
  
  function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    output.push(line);
    console.log(line);
  }
  
  log('='.repeat(60));
  log('TEST DIRECT - Vérification des améliorations');
  log('='.repeat(60));
  log('');
  
  try {
    log('🔄 Requête en cours...');
    const startTime = Date.now();
    
    const response = await fetch(
      `${API_URL}?source=turf-fr&years=2023&months=janvier`,
      { signal: AbortSignal.timeout(70000) }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ Erreur HTTP ${response.status}`);
      log(`Message: ${errorText.substring(0, 300)}`);
      fs.writeFileSync('test-output.txt', output.join('\n'));
      return;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      log('❌ Réponse invalide (pas un tableau)');
      fs.writeFileSync('test-output.txt', output.join('\n'));
      return;
    }
    
    const total = data.length;
    const reports = data.filter(r => r.arrivalReport).length;
    const unknown = data.filter(r => r.hippodrome === 'Inconnu').length;
    const reportRate = total > 0 ? ((reports / total) * 100).toFixed(1) : 0;
    
    log('');
    log('✅ RÉSULTATS:');
    log(`   ⏱️  Durée: ${duration}s`);
    log(`   📊 Réunions: ${total}`);
    log(`   📈 Rapports: ${reports} (${reportRate}%)`);
    log(`   🏇 Hippodromes inconnus: ${unknown}`);
    log('');
    
    // Afficher quelques exemples
    if (data.length > 0) {
      log('📋 Exemples de réunions:');
      data.slice(0, 5).forEach((r, i) => {
        log(`   ${i + 1}. ${r.hippodrome} - ${r.dateISO} - Rapport: ${r.arrivalReport ? '✅' : '❌'}`);
      });
    }
    
    log('');
    log('='.repeat(60));
    
    // Sauvegarder
    fs.writeFileSync('test-output.txt', output.join('\n'));
    log('');
    log('✅ Résultats sauvegardés dans test-output.txt');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`);
    if (error.name === 'AbortError') {
      log('   (Timeout)');
    }
    fs.writeFileSync('test-output.txt', output.join('\n'));
  }
}

testEtAffiche();

