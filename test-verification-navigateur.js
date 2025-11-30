/**
 * TEST VÉRIFICATION NAVIGATEUR - Comparaison URLs scrapées vs Pages réelles
 * Ce script génère une liste d'URLs à vérifier manuellement dans le navigateur
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

async function testVerificationNavigateur() {
  console.log('\n' + '='.repeat(80));
  console.log('🌐 TEST VÉRIFICATION NAVIGATEUR - URLs à Vérifier');
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

    // Sélectionner des réunions représentatives
    const reunionsToVerify = {
      withReports: withReports.slice(0, 5),
      withoutReports: withoutReports.slice(0, 10),
    };

    console.log('📋 URLs À VÉRIFIER DANS LE NAVIGATEUR:\n');
    console.log('='.repeat(80));
    console.log('✅ RÉUNIONS AVEC RAPPORTS (vérifier que les rapports sont corrects):\n');
    reunionsToVerify.withReports.forEach((r, index) => {
      console.log(`${index + 1}. ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}`);
      console.log(`   URL réunion: ${r.url}`);
      console.log(`   Rapport trouvé: ${r.arrivalReport}`);
      console.log(`   URL arrivée attendue: ${r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('❌ RÉUNIONS SANS RAPPORTS (vérifier pourquoi):\n');
    reunionsToVerify.withoutReports.forEach((r, index) => {
      console.log(`${index + 1}. ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}`);
      console.log(`   URL réunion: ${r.url}`);
      console.log(`   URL arrivée à tester: ${r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}`);
      console.log('');
    });

    // Générer un fichier HTML pour faciliter la vérification
    const fs = require('fs');
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vérification URLs Scrapées</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .with-report { background-color: #d4edda; }
    .without-report { background-color: #f8d7da; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .report { font-weight: bold; color: #28a745; }
    .no-report { font-weight: bold; color: #dc3545; }
  </style>
</head>
<body>
  <h1>🌐 Vérification URLs Scrapées</h1>
  <p><strong>Total réunions:</strong> ${data.length}</p>
  <p><strong>Avec rapports:</strong> ${withReports.length} (${((withReports.length / data.length) * 100).toFixed(1)}%)</p>
  <p><strong>Sans rapports:</strong> ${withoutReports.length} (${((withoutReports.length / data.length) * 100).toFixed(1)}%)</p>

  <div class="section with-report">
    <h2>✅ Réunions avec Rapports (${reunionsToVerify.withReports.length})</h2>
    ${reunionsToVerify.withReports
      .map(
        (r, i) => `
    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 3px;">
      <h3>${i + 1}. ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}</h3>
      <p><strong>URL réunion:</strong> <a href="${r.url}" target="_blank">${r.url}</a></p>
      <p><strong>Rapport trouvé:</strong> <span class="report">${r.arrivalReport}</span></p>
      <p><strong>URL arrivée à vérifier:</strong> <a href="${r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}" target="_blank">${r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}</a></p>
    </div>`
      )
      .join('')}
  </div>

  <div class="section without-report">
    <h2>❌ Réunions sans Rapports (${reunionsToVerify.withoutReports.length})</h2>
    ${reunionsToVerify.withoutReports
      .map(
        (r, i) => `
    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 3px;">
      <h3>${i + 1}. ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}</h3>
      <p><strong>URL réunion:</strong> <a href="${r.url}" target="_blank">${r.url}</a></p>
      <p><strong>Rapport:</strong> <span class="no-report">NON TROUVÉ</span></p>
      <p><strong>URL arrivée à tester:</strong> <a href="${r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}" target="_blank">${r.url.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/')}</a></p>
    </div>`
      )
      .join('')}
  </div>
</body>
</html>`;

    fs.writeFileSync('verification-urls.html', html);
    console.log('💾 Fichier HTML créé: verification-urls.html');
    console.log('   Ouvrez ce fichier dans votre navigateur pour vérifier les URLs facilement\n');

    // Sauvegarder aussi en JSON
    const results = {
      timestamp: new Date().toISOString(),
      totalReunions: data.length,
      withReports: withReports.length,
      withoutReports: withoutReports.length,
      reportRate: ((withReports.length / data.length) * 100).toFixed(1),
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
      'test-verification-navigateur-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('💾 Résultats JSON sauvegardés: test-verification-navigateur-results.json\n');

    return results;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    throw error;
  }
}

testVerificationNavigateur().catch(console.error);

