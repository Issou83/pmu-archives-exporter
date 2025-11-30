/**
 * TEST DE COMPARAISON - Scraper vs Pages Réelles
 * Compare ce que le scraper trouve vs ce qui est réellement sur les pages
 */

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

async function testComparaisonReel() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST DE COMPARAISON - Scraper vs Pages Réelles');
  console.log('='.repeat(80) + '\n');

  // Test avec une réunion spécifique (2024 janvier, Vincennes R1)
  const testUrl = `${API_URL}?source=turf-fr&years=2024&months=janvier`;
  
  console.log(`📋 Test URL: ${testUrl}\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(testUrl);
    const elapsedTime = Date.now() - startTime;
    
    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    const elapsedSeconds = (elapsedTime / 1000).toFixed(2);
    
    console.log(`✅ Réponse reçue en ${elapsedSeconds}s`);
    console.log(`📊 Total réunions: ${data.length}\n`);

    // Filtrer les réunions de Vincennes R1 du 1er janvier 2024
    const vincennesR1 = data.filter(r => 
      r.hippodrome === 'Vincennes' && 
      r.reunionNumber === 1 &&
      r.dateLabel && r.dateLabel.includes('01 janvier 2024')
    );

    console.log(`🔍 Réunions Vincennes R1 du 1er janvier 2024: ${vincennesR1.length}\n`);

    if (vincennesR1.length > 0) {
      const reunion = vincennesR1[0];
      console.log('📋 Données scrapées:');
      console.log(`   - URL: ${reunion.url}`);
      console.log(`   - Date: ${reunion.dateLabel}`);
      console.log(`   - Hippodrome: ${reunion.hippodrome}`);
      console.log(`   - Réunion: ${reunion.reunionNumber}`);
      console.log(`   - Rapport: ${reunion.arrivalReport || 'NON TROUVÉ'}`);
      console.log(`   - Pays: ${reunion.countryCode}`);
      console.log(`   - ID: ${reunion.id}\n`);

      // Comparer avec l'URL réelle
      const expectedUrl = 'https://www.turf-fr.com/partants-programmes/r1-vincennes-36237';
      if (reunion.url === expectedUrl) {
        console.log('✅ URL correspond à l\'URL réelle');
      } else {
        console.log(`⚠️  URL différente:`);
        console.log(`   - Scrapée: ${reunion.url}`);
        console.log(`   - Attendue: ${expectedUrl}`);
      }
    } else {
      console.log('⚠️  Aucune réunion Vincennes R1 du 1er janvier 2024 trouvée');
    }

    // Statistiques générales
    const withReports = data.filter(r => r.arrivalReport);
    const withoutReports = data.filter(r => !r.arrivalReport);
    const unknownHippodromes = data.filter(r => r.hippodrome === 'Inconnu');
    
    console.log('\n📊 Statistiques:');
    console.log(`   - Avec rapports: ${withReports.length} (${((withReports.length / data.length) * 100).toFixed(1)}%)`);
    console.log(`   - Sans rapports: ${withoutReports.length} (${((withoutReports.length / data.length) * 100).toFixed(1)}%)`);
    console.log(`   - Hippodromes inconnus: ${unknownHippodromes.length} (${((unknownHippodromes.length / data.length) * 100).toFixed(1)}%)`);

    // Échantillon de réunions avec rapports
    if (withReports.length > 0) {
      console.log('\n✅ Exemples de réunions avec rapports:');
      withReports.slice(0, 3).forEach(r => {
        console.log(`   - ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}: ${r.arrivalReport}`);
      });
    }

    // Échantillon de réunions sans rapports
    if (withoutReports.length > 0) {
      console.log('\n❌ Exemples de réunions sans rapports:');
      withoutReports.slice(0, 3).forEach(r => {
        console.log(`   - ${r.dateLabel} ${r.hippodrome} R${r.reunionNumber}: ${r.url}`);
      });
    }

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    console.error(error.stack);
  }
}

testComparaisonReel();

