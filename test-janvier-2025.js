// Test spécifique pour janvier 2025
import * as cheerio from 'cheerio';

// URLs de test pour janvier 2025
const testUrls = [
  'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-vincennes-123456', // URL exemple
];

async function analyzePage(url) {
  console.log(`\n=== Analyse de ${url} ===`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Referer: 'https://www.turf-fr.com/',
      },
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Chercher #decompte_depart_course
    const $decompte = $('#decompte_depart_course');
    console.log(`\n1. #decompte_depart_course trouvé: ${$decompte.length > 0 ? 'OUI' : 'NON'}`);
    if ($decompte.length > 0) {
      const text = $decompte.text();
      console.log(`   Texte: ${text.substring(0, 150)}`);
    }

    // Chercher .title2
    const $title2 = $('.title2');
    console.log(`\n2. .title2 trouvé: ${$title2.length} élément(s)`);
    $title2.each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text();
      if (text.toLowerCase().includes('arrivée')) {
        console.log(`   Élément ${i + 1}: ${text.substring(0, 100)}`);
      }
    });

    // Chercher tous les éléments avec "Arrivée"
    console.log(`\n3. Recherche de "Arrivée" dans la page:`);
    const bodyText = $('body').text();
    const arrivalMatches = bodyText.match(/arrivée[ée\s\n:]*([^\n]{0,100})/gi);
    if (arrivalMatches) {
      arrivalMatches.slice(0, 5).forEach(match => {
        console.log(`   ${match.substring(0, 100)}`);
      });
    }

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
  }
}

// D'abord, récupérer les vraies URLs depuis l'API
async function getRealUrls() {
  try {
    const response = await fetch('https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=janvier&countries=FR');
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`\n📋 ${data.length} réunions trouvées\n`);
      const withoutReport = data.filter(r => !r.arrivalReport);
      console.log(`⚠️ ${withoutReport.length} réunions sans rapport d'arrivée\n`);
      
      if (withoutReport.length > 0) {
        console.log('🔍 Analyse des premières URLs sans rapport:\n');
        for (let i = 0; i < Math.min(3, withoutReport.length); i++) {
          const reunion = withoutReport[i];
          console.log(`\n${i + 1}. ${reunion.hippodrome} R${reunion.reunionNumber}`);
          console.log(`   URL: ${reunion.url}`);
          await analyzePage(reunion.url);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Pause entre les requêtes
        }
      }
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

getRealUrls();

