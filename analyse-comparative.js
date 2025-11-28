// Analyse comparative des pages avec et sans rapport d'arrivée
import * as cheerio from 'cheerio';

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2025&months=janvier&countries=FR';

async function fetchData() {
  const response = await fetch(API_URL);
  return await response.json();
}

async function analyzePage(url, label) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${label}: ${url}`);
  console.log('='.repeat(80));

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Referer: 'https://www.turf-fr.com/',
      },
    });
    const loadTime = Date.now() - startTime;

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status} (${loadTime}ms)`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log(`✅ Page chargée en ${loadTime}ms`);
    console.log(`📄 Taille HTML: ${(html.length / 1024).toFixed(2)} KB`);

    // Analyse #decompte_depart_course
    const $decompte = $('#decompte_depart_course');
    console.log(`\n1️⃣ #decompte_depart_course:`);
    console.log(`   Présent: ${$decompte.length > 0 ? 'OUI' : 'NON'}`);
    
    if ($decompte.length > 0) {
      const text = $decompte.text();
      const textPreview = text.replace(/\s+/g, ' ').substring(0, 150);
      console.log(`   Texte (nettoyé): "${textPreview}..."`);
      console.log(`   Longueur: ${text.length} caractères`);
      
      // Test du pattern actuel
      const match1 = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i);
      const match2 = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
      
      console.log(`   Pattern strict (avec tirets obligatoires): ${match1 ? `✅ ${match1[1]}` : '❌'}`);
      console.log(`   Pattern flexible (tirets optionnels): ${match2 ? `✅ ${match2[1]}` : '❌'}`);
      
      // Analyse détaillée du contenu
      if (text.toLowerCase().includes('arrivée')) {
        const lines = text.split('\n');
        const arrivalLineIndex = lines.findIndex(l => l.toLowerCase().includes('arrivée'));
        if (arrivalLineIndex !== -1) {
          console.log(`   Ligne avec "Arrivée" trouvée à l'index ${arrivalLineIndex}`);
          console.log(`   Lignes autour (${Math.max(0, arrivalLineIndex-1)} à ${Math.min(lines.length-1, arrivalLineIndex+3)}):`);
          for (let i = Math.max(0, arrivalLineIndex-1); i <= Math.min(lines.length-1, arrivalLineIndex+3); i++) {
            const line = lines[i].trim();
            if (line) {
              console.log(`      [${i}] "${line}"`);
            }
          }
        }
      }
    }

    // Analyse .title2
    const $title2 = $('.title2');
    console.log(`\n2️⃣ .title2:`);
    console.log(`   Nombre d'éléments: ${$title2.length}`);
    
    let title2WithArrival = 0;
    $title2.each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text();
      if (text.toLowerCase().includes('arrivée')) {
        title2WithArrival++;
        const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
        if (match) {
          console.log(`   Élément ${i + 1}: ✅ "${match[1]}"`);
        } else {
          console.log(`   Élément ${i + 1}: ⚠️  Contient "Arrivée" mais pas de match`);
          const preview = text.replace(/\s+/g, ' ').substring(0, 100);
          console.log(`      Prévisualisation: "${preview}..."`);
        }
      }
    });
    console.log(`   Éléments avec "Arrivée": ${title2WithArrival}`);

    // Analyse body
    console.log(`\n3️⃣ Recherche dans body:`);
    const pageText = $('body').text();
    const arrivalMatches = pageText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/gi);
    console.log(`   Matches trouvés: ${arrivalMatches ? arrivalMatches.length : 0}`);
    
    if (arrivalMatches && arrivalMatches.length > 0) {
      console.log(`   Premiers matches:`);
      arrivalMatches.slice(0, 3).forEach((match, i) => {
        const numbersMatch = match.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
        if (numbersMatch) {
          console.log(`      ${i + 1}. "${numbersMatch[1]}"`);
        }
      });
    } else {
      console.log(`   ⚠️  Aucun match trouvé`);
      // Chercher juste "Arrivée" pour voir si c'est présent
      const hasArrival = pageText.toLowerCase().includes('arrivée');
      console.log(`   "Arrivée" présent dans la page: ${hasArrival ? 'OUI' : 'NON'}`);
    }

    // Test de la fonction scrapeArrivalReport simulée
    console.log(`\n4️⃣ Test de détection (simulation scraper):`);
    let detectedReport = null;

    // PRIORITÉ 1: #decompte_depart_course
    if ($decompte.length > 0) {
      const decompteText = $decompte.text();
      const decompteMatch = decompteText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
      if (decompteMatch) {
        let candidate = decompteMatch[1].trim();
        candidate = candidate.replace(/\s+/g, ' ').replace(/\s*[-–]?\s*/g, '-').replace(/-+/g, '-');
        const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
        if (numbers.length >= 3) {
          const validNumbers = numbers.filter(n => {
            const num = parseInt(n);
            return num >= 1 && num <= 30;
          });
          if (validNumbers.length >= 3) {
            detectedReport = validNumbers.join('-');
            console.log(`   ✅ Détecté dans #decompte_depart_course: ${detectedReport}`);
          }
        }
      }
    }

    // PRIORITÉ 1b: .title2
    if (!detectedReport) {
      $title2.each((i, elem) => {
        if (detectedReport) return false;
        const $elem = $(elem);
        const text = $elem.text();
        const match = text.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/i);
        if (match) {
          let candidate = match[1].trim();
          candidate = candidate.replace(/\s+/g, ' ').replace(/\s*[-–]\s*/g, '-');
          const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
          if (numbers.length >= 3) {
            const validNumbers = numbers.filter(n => {
              const num = parseInt(n);
              return num >= 1 && num <= 30;
            });
            if (validNumbers.length >= 3) {
              detectedReport = validNumbers.join('-');
              console.log(`   ✅ Détecté dans .title2[${i}]: ${detectedReport}`);
              return false;
            }
          }
        }
      });
    }

    // PRIORITÉ 2: body
    if (!detectedReport) {
      const arrivalMatches = pageText.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/gi);
      if (arrivalMatches && arrivalMatches.length > 0) {
        for (const match of arrivalMatches) {
          const numbersMatch = match.match(/arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i);
          if (numbersMatch) {
            let candidate = numbersMatch[1].trim();
            candidate = candidate.replace(/\s+/g, ' ').replace(/\s*[-–]?\s*/g, '-').replace(/-+/g, '-');
            const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
            if (numbers.length >= 3) {
              const validNumbers = numbers.filter(n => {
                const num = parseInt(n);
                return num >= 1 && num <= 30;
              });
              if (validNumbers.length >= 3) {
                detectedReport = validNumbers.join('-');
                console.log(`   ✅ Détecté dans body: ${detectedReport}`);
                break;
              }
            }
          }
        }
      }
    }

    if (!detectedReport) {
      console.log(`   ❌ AUCUN RAPPORT DÉTECTÉ`);
    }

    return {
      url,
      loadTime,
      htmlSize: html.length,
      hasDecompte: $decompte.length > 0,
      title2Count: $title2.length,
      detectedReport,
    };

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 ANALYSE COMPARATIVE DES RAPPORTS D\'ARRIVÉE\n');
  console.log(`📡 Récupération des données depuis: ${API_URL}\n`);

  const data = await fetchData();
  
  const withReport = data.filter(r => r.arrivalReport);
  const withoutReport = data.filter(r => !r.arrivalReport);

  console.log(`📊 Statistiques:`);
  console.log(`   Total: ${data.length}`);
  console.log(`   Avec rapport: ${withReport.length} (${((withReport.length / data.length) * 100).toFixed(1)}%)`);
  console.log(`   Sans rapport: ${withoutReport.length} (${((withoutReport.length / data.length) * 100).toFixed(1)}%)`);

  // Analyser 2 pages avec rapport
  console.log(`\n\n${'█'.repeat(80)}`);
  console.log(`✅ ANALYSE DES PAGES AVEC RAPPORT D'ARRIVÉE`);
  console.log(`${'█'.repeat(80)}`);
  
  const successPages = [];
  for (let i = 0; i < Math.min(2, withReport.length); i++) {
    const reunion = withReport[i];
    const result = await analyzePage(reunion.url, `✅ SUCCÈS ${i + 1}`);
    if (result) successPages.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Analyser 3 pages sans rapport
  console.log(`\n\n${'█'.repeat(80)}`);
  console.log(`❌ ANALYSE DES PAGES SANS RAPPORT D'ARRIVÉE`);
  console.log(`${'█'.repeat(80)}`);
  
  const failurePages = [];
  for (let i = 0; i < Math.min(3, withoutReport.length); i++) {
    const reunion = withoutReport[i];
    const result = await analyzePage(reunion.url, `❌ ÉCHEC ${i + 1}`);
    if (result) failurePages.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Comparaison
  console.log(`\n\n${'█'.repeat(80)}`);
  console.log(`📊 COMPARAISON`);
  console.log(`${'█'.repeat(80)}`);
  
  console.log(`\n✅ Pages avec rapport:`);
  successPages.forEach((p, i) => {
    console.log(`   ${i + 1}. Temps: ${p.loadTime}ms | Taille: ${(p.htmlSize / 1024).toFixed(2)} KB | #decompte: ${p.hasDecompte} | .title2: ${p.title2Count}`);
  });

  console.log(`\n❌ Pages sans rapport:`);
  failurePages.forEach((p, i) => {
    console.log(`   ${i + 1}. Temps: ${p.loadTime}ms | Taille: ${(p.htmlSize / 1024).toFixed(2)} KB | #decompte: ${p.hasDecompte} | .title2: ${p.title2Count}`);
  });

  // Identifier les différences
  console.log(`\n🔍 DIFFÉRENCES IDENTIFIÉES:`);
  const avgSuccessTime = successPages.reduce((sum, p) => sum + p.loadTime, 0) / successPages.length;
  const avgFailureTime = failurePages.reduce((sum, p) => sum + p.loadTime, 0) / failurePages.length;
  
  console.log(`   Temps de chargement moyen:`);
  console.log(`      Succès: ${avgSuccessTime.toFixed(0)}ms`);
  console.log(`      Échecs: ${avgFailureTime.toFixed(0)}ms`);
  
  const successHasDecompte = successPages.filter(p => p.hasDecompte).length;
  const failureHasDecompte = failurePages.filter(p => p.hasDecompte).length;
  
  console.log(`   Présence de #decompte_depart_course:`);
  console.log(`      Succès: ${successHasDecompte}/${successPages.length}`);
  console.log(`      Échecs: ${failureHasDecompte}/${failurePages.length}`);
}

main().catch(console.error);

