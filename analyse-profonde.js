// Analyse profonde des pages qui échouent
import * as cheerio from 'cheerio';

const testUrls = [
  'https://www.turf-fr.com/partants-programmes/r4-mauquenchy-38832',
  'https://www.turf-fr.com/partants-programmes/r1-vincennes-41262',
];

async function deepAnalyze(url) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 ANALYSE PROFONDE: ${url}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

    // 1. Chercher tous les endroits où "Arrivée" apparaît
    console.log(`\n1️⃣ Recherche de toutes les occurrences de "Arrivée":`);
    const bodyText = $('body').text();
    const allArrivalMatches = bodyText.match(/arrivée[ée\s\n:]*[^\n]{0,100}/gi);
    if (allArrivalMatches) {
      console.log(`   Nombre d'occurrences: ${allArrivalMatches.length}`);
      allArrivalMatches.slice(0, 10).forEach((match, i) => {
        const cleaned = match.replace(/\s+/g, ' ').trim();
        console.log(`   ${i + 1}. "${cleaned.substring(0, 80)}"`);
      });
    }

    // 2. Chercher dans tous les éléments qui contiennent "Arrivée"
    console.log(`\n2️⃣ Éléments HTML contenant "Arrivée":`);
    let count = 0;
    $('*').each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text();
      if (text.toLowerCase().includes('arrivée') && text.length < 200) {
        count++;
        if (count <= 5) {
          const tagName = elem.tagName || elem.name || 'unknown';
          const className = $elem.attr('class') || '';
          const id = $elem.attr('id') || '';
          const preview = text.replace(/\s+/g, ' ').trim().substring(0, 100);
          console.log(`   ${count}. <${tagName}> class="${className}" id="${id}"`);
          console.log(`      Texte: "${preview}"`);
        }
      }
    });
    console.log(`   Total: ${count} éléments`);

    // 3. Chercher des séquences de numéros (1-30) séparés par des tirets ou espaces
    console.log(`\n3️⃣ Recherche de séquences de numéros (1-30):`);
    const numberSequences = bodyText.match(/\b([1-2]?[0-9]|30)(?:\s*[-–]\s*([1-2]?[0-9]|30)){2,}\b/g);
    if (numberSequences) {
      console.log(`   Séquences trouvées: ${numberSequences.length}`);
      numberSequences.slice(0, 10).forEach((seq, i) => {
        console.log(`   ${i + 1}. "${seq}"`);
      });
    } else {
      console.log(`   ❌ Aucune séquence trouvée`);
    }

    // 4. Chercher dans les sections spécifiques
    console.log(`\n4️⃣ Analyse des sections spécifiques:`);
    
    // Chercher les sections de courses
    const $courseSections = $('[class*="course"], [class*="race"], [id*="course"], [id*="race"]');
    console.log(`   Sections course/race: ${$courseSections.length}`);
    
    // Chercher les tableaux
    const $tables = $('table');
    console.log(`   Tableaux: ${$tables.length}`);
    $tables.each((i, table) => {
      const $table = $(table);
      const tableText = $table.text();
      if (tableText.toLowerCase().includes('arrivée')) {
        console.log(`      Tableau ${i + 1}: Contient "Arrivée"`);
        const arrivalInTable = tableText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
        if (arrivalInTable) {
          console.log(`         ✅ Match: "${arrivalInTable[1]}"`);
        }
      }
    });

    // 5. Chercher les liens vers les rapports d'arrivée
    console.log(`\n5️⃣ Liens contenant "arrivée" ou "rapport":`);
    const $arrivalLinks = $('a[href*="arriv"], a[href*="rapport"], a:contains("Arrivée"), a:contains("arrivée")');
    console.log(`   Liens trouvés: ${$arrivalLinks.length}`);
    $arrivalLinks.slice(0, 5).each((i, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      const text = $link.text().trim();
      console.log(`   ${i + 1}. "${text}" → ${href}`);
    });

    // 6. Vérifier si c'est une page de programme (pas encore de résultats)
    console.log(`\n6️⃣ Vérification du type de page:`);
    const hasProgramme = bodyText.toLowerCase().includes('programme') || bodyText.toLowerCase().includes('partant');
    const hasResultat = bodyText.toLowerCase().includes('résultat') || bodyText.toLowerCase().includes('resultat');
    const hasArrivee = bodyText.toLowerCase().includes('arrivée');
    console.log(`   Contient "programme/partant": ${hasProgramme}`);
    console.log(`   Contient "résultat": ${hasResultat}`);
    console.log(`   Contient "arrivée": ${hasArrivee}`);

    // 7. Chercher dans les divs avec des classes spécifiques
    console.log(`\n7️⃣ Analyse des divs avec classes spécifiques:`);
    const $divs = $('div[class*="arriv"], div[class*="result"], div[class*="course"]');
    console.log(`   Divs trouvées: ${$divs.length}`);
    $divs.slice(0, 5).each((i, div) => {
      const $div = $(div);
      const className = $div.attr('class') || '';
      const text = $div.text().trim().substring(0, 100);
      if (text.toLowerCase().includes('arrivée')) {
        console.log(`   ${i + 1}. class="${className}"`);
        console.log(`      Texte: "${text}"`);
        const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
        if (match) {
          console.log(`      ✅ Match: "${match[1]}"`);
        }
      }
    });

    // 8. Vérifier si la page contient des dates futures
    console.log(`\n8️⃣ Vérification des dates:`);
    const dateMatches = bodyText.match(/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/g);
    if (dateMatches) {
      console.log(`   Dates trouvées: ${dateMatches.slice(0, 5).join(', ')}`);
    }

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
  }
}

async function main() {
  for (const url of testUrls) {
    await deepAnalyze(url);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main().catch(console.error);

