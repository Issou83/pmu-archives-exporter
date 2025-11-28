// Test détaillé d'une page qui échoue
import * as cheerio from 'cheerio';

const testUrl = 'https://www.turf-fr.com/partants-programmes/r4-ger-gelsenkirchen-38789';

async function analyzeFailedPage() {
  console.log(`🔍 Analyse détaillée de: ${testUrl}\n`);

  try {
    const response = await fetch(testUrl, {
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

    console.log('1️⃣ Recherche dans #decompte_depart_course:');
    const $decompte = $('#decompte_depart_course');
    if ($decompte.length > 0) {
      const text = $decompte.text();
      console.log(`   Trouvé: OUI`);
      console.log(`   Texte (200 premiers caractères): ${text.substring(0, 200)}`);
      const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i);
      if (match) {
        console.log(`   ✅ Match trouvé: ${match[1]}`);
      } else {
        console.log(`   ❌ Pas de match`);
      }
    } else {
      console.log(`   ❌ Élément non trouvé`);
    }

    console.log('\n2️⃣ Recherche dans .title2:');
    const $title2 = $('.title2');
    console.log(`   Nombre d'éléments: ${$title2.length}`);
    $title2.each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text();
      if (text.toLowerCase().includes('arrivée')) {
        console.log(`   Élément ${i + 1}:`);
        console.log(`      Texte: ${text.substring(0, 150)}`);
        const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i);
        if (match) {
          console.log(`      ✅ Match: ${match[1]}`);
        } else {
          console.log(`      ❌ Pas de match`);
        }
      }
    });

    console.log('\n3️⃣ Recherche dans tout le body:');
    const pageText = $('body').text();
    const arrivalMatches = pageText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/gi);
    if (arrivalMatches) {
      console.log(`   Nombre de matches: ${arrivalMatches.length}`);
      arrivalMatches.slice(0, 5).forEach((match, i) => {
        console.log(`   Match ${i + 1}: ${match.substring(0, 100)}`);
        const numbersMatch = match.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
        if (numbersMatch) {
          console.log(`      → Nombres extraits: ${numbersMatch[1]}`);
        }
      });
    } else {
      console.log(`   ❌ Aucun match trouvé`);
    }

    console.log('\n4️⃣ Recherche de tous les patterns "Arrivée" dans la page:');
    const allArrivalTexts = pageText.match(/arrivée[ée\s\n:]*[^\n]{0,100}/gi);
    if (allArrivalTexts) {
      console.log(`   Nombre d'occurrences: ${allArrivalTexts.length}`);
      allArrivalTexts.slice(0, 10).forEach((text, i) => {
        console.log(`   ${i + 1}. ${text.trim()}`);
      });
    }

    console.log('\n5️⃣ Recherche de séquences de numéros après "Arrivée":');
    // Chercher "Arrivée" suivi de numéros sur plusieurs lignes
    const lines = pageText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('arrivée')) {
        // Regarder les 3 lignes suivantes
        const context = lines.slice(i, i + 4).join(' ');
        const numbersMatch = context.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
        if (numbersMatch) {
          console.log(`   ✅ Trouvé à la ligne ${i + 1}:`);
          console.log(`      Contexte: ${context.substring(0, 200)}`);
          console.log(`      Nombres: ${numbersMatch[1]}`);
          break;
        }
      }
    }

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
  }
}

analyzeFailedPage();

