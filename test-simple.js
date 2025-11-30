const https = require('https');
const fs = require('fs');

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

function testSimple() {
  const url = `${API_URL}?source=turf-fr&years=2023&months=janvier`;
  
  console.log('Test en cours...');
  console.log('URL:', url);
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        if (res.statusCode !== 200) {
          const result = {
            error: `HTTP ${res.statusCode}`,
            message: data.substring(0, 500),
            timestamp: new Date().toISOString()
          };
          fs.writeFileSync('test-result.json', JSON.stringify(result, null, 2));
          console.log('❌ Erreur:', result.error);
          console.log('Résultat sauvegardé dans test-result.json');
          return;
        }
        
        const json = JSON.parse(data);
        const total = json.length;
        const reports = json.filter(r => r.arrivalReport).length;
        const unknown = json.filter(r => r.hippodrome === 'Inconnu').length;
        const reportRate = total > 0 ? ((reports / total) * 100).toFixed(1) : 0;
        
        const result = {
          success: true,
          timestamp: new Date().toISOString(),
          totalReunions: total,
          withReports: reports,
          reportRate: parseFloat(reportRate),
          unknownHippo: unknown,
          sampleReunions: json.slice(0, 5).map(r => ({
            id: r.id,
            hippodrome: r.hippodrome,
            hasReport: !!r.arrivalReport,
            dateISO: r.dateISO
          }))
        };
        
        fs.writeFileSync('test-result.json', JSON.stringify(result, null, 2));
        
        console.log('');
        console.log('✅ RÉSULTATS:');
        console.log('   📊 Réunions:', total);
        console.log('   📈 Rapports:', reports, `(${reportRate}%)`);
        console.log('   🏇 Hippodromes inconnus:', unknown);
        console.log('');
        console.log('✅ Résultat sauvegardé dans test-result.json');
        
      } catch (e) {
        const result = {
          error: 'Parse error',
          message: e.message,
          response: data.substring(0, 1000),
          timestamp: new Date().toISOString()
        };
        fs.writeFileSync('test-result.json', JSON.stringify(result, null, 2));
        console.log('❌ Erreur de parsing:', e.message);
        console.log('Résultat sauvegardé dans test-result.json');
      }
    });
  }).on('error', (e) => {
    const result = {
      error: 'Network error',
      message: e.message,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('test-result.json', JSON.stringify(result, null, 2));
    console.error('❌ Erreur réseau:', e.message);
    console.log('Résultat sauvegardé dans test-result.json');
  });
}

testSimple();

