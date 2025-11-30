/**
 * Vérification directe sur turf-fr.com
 * - Vérifier si les pages existent
 * - Vérifier si les rapports sont présents dans le HTML
 * - Analyser le format exact des rapports
 */

const testUrls = [
  'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-vincennes-36237',
  'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-cagnes-36234',
  'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-prix-melusina-364557',
  'https://www.turf-fr.com/partants-programmes/r1-vincennes-36237',
];

async function testDirectSources() {
  console.log('=== VÉRIFICATION DIRECTE SUR TURF-FR.COM ===\n');

  for (const url of testUrls) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`URL: ${url}`);
    console.log(`${'='.repeat(70)}\n`);

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status} - Page non accessible`);
        continue;
      }

      const html = await response.text();
      console.log(`   ✅ Page accessible (${html.length} caractères)`);

      // Chercher les rapports d'arrivée dans différents formats
      console.log(`\n   🔍 Recherche de rapports d'arrivée:`);

      // Format 1: "Arrivée 11 - 6 - 4 - 5 - 1"
      const pattern1 = /arrivée[ée\s\n:]*(\d+(?:\s*[-–]\s*\d+){2,})/gi;
      const matches1 = [...html.matchAll(pattern1)];
      if (matches1.length > 0) {
        console.log(`      Format 1 trouvé: ${matches1.length} occurrence(s)`);
        matches1.slice(0, 3).forEach((m, i) => {
          console.log(`        ${i + 1}. "${m[1]}"`);
        });
      } else {
        console.log(`      Format 1: Aucun match`);
      }

      // Format 2: Dans #decompte_depart_course
      if (html.includes('decompte_depart_course')) {
        console.log(`      ✅ Élément #decompte_depart_course présent`);
        const decompteMatch = html.match(
          /id=["']decompte_depart_course["'][^>]*>([^<]+)/i
        );
        if (decompteMatch) {
          console.log(
            `        Contenu: "${decompteMatch[1].substring(0, 100)}"`
          );
        }
      } else {
        console.log(`      ❌ Élément #decompte_depart_course absent`);
      }

      // Format 3: Dans .title2
      const title2Matches = html.match(/class=["']title2["'][^>]*>([^<]+)/gi);
      if (title2Matches && title2Matches.length > 0) {
        console.log(
          `      ✅ Éléments .title2 présents: ${title2Matches.length}`
        );
        title2Matches.slice(0, 3).forEach((m, i) => {
          const content = m.replace(/class=["']title2["'][^>]*>/, '');
          if (content.toLowerCase().includes('arrivée')) {
            console.log(`        ${i + 1}. "${content.substring(0, 80)}"`);
          }
        });
      }

      // Chercher la date
      console.log(`\n   📅 Recherche de date:`);
      const datePatterns = [
        /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
        /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      ];
      for (const pattern of datePatterns) {
        const dateMatch = html.match(pattern);
        if (dateMatch) {
          console.log(`      ✅ Date trouvée: "${dateMatch[0]}"`);
          break;
        }
      }

      // Chercher l'hippodrome
      console.log(`\n   🏇 Recherche d'hippodrome:`);
      const h1Match = html.match(/<h1[^>]*>([^<]+)</i);
      if (h1Match) {
        console.log(`      H1: "${h1Match[1]}"`);
        const hippoMatch = h1Match[1].match(
          /à\s+([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s\-]+?)(?:\s|$|,|\.)/i
        );
        if (hippoMatch) {
          console.log(`      ✅ Hippodrome extrait: "${hippoMatch[1]}"`);
        }
      }

      // Extraire un échantillon du HTML autour de "arrivée"
      const arrivalIndex = html.toLowerCase().indexOf('arrivée');
      if (arrivalIndex !== -1) {
        const sample = html.substring(
          Math.max(0, arrivalIndex - 50),
          Math.min(html.length, arrivalIndex + 200)
        );
        console.log(`\n   📄 Échantillon HTML autour de "arrivée":`);
        console.log(`      "${sample.replace(/\s+/g, ' ').substring(0, 150)}"`);
      }
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
    }
  }
}

testDirectSources().catch(console.error);
