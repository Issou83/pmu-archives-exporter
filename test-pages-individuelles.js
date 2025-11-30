/**
 * Script de test pour explorer les pages individuelles de courses
 * Vérifie si chaque course a sa propre page avec le rapport d'arrivée
 */

import * as cheerio from 'cheerio';

// URLs de test (différentes années et mois)
const testUrls = [
  'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-vincennes-36237',
  'https://www.turf-fr.com/courses-pmu/partants-programmes/r1-vincennes-36237',
  'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r2-cagnes-sur-mer-36234',
  'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-longchamp-36240',
];

async function testReunionPage(url) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test de: ${url}`);
  console.log('='.repeat(80));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'PMU-Archives-Exporter/1.0 (Educational/Research Project)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        Referer: 'https://www.turf-fr.com/',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    console.log(`✅ Page chargée (${html.length} caractères)`);

    // 1. Chercher les liens vers des courses individuelles
    console.log(`\n📋 Recherche de liens vers des courses individuelles:`);
    const courseLinks = [];
    $('a[href*="course"], a[href*="arrivee"], a[href*="rapport"]').each(
      (i, elem) => {
        const $link = $(elem);
        const href = $link.attr('href');
        const text = $link.text().trim();
        if (href && (href.includes('/course/') || href.includes('c'))) {
          const fullUrl = href.startsWith('http')
            ? href
            : `https://www.turf-fr.com${href}`;
          courseLinks.push({ url: fullUrl, text });
        }
      }
    );

    if (courseLinks.length > 0) {
      console.log(`   ✅ ${courseLinks.length} liens de courses trouvés:`);
      courseLinks.slice(0, 5).forEach((link, i) => {
        console.log(`   ${i + 1}. ${link.text.substring(0, 50)} → ${link.url}`);
      });
    } else {
      console.log(`   ⚠️  Aucun lien de course individuelle trouvé`);
    }

    // 2. Chercher les numéros de courses dans la page
    console.log(`\n📋 Recherche de numéros de courses (C1, C2, etc.):`);
    const courseNumbers = new Set();
    $('*').each((i, elem) => {
      const text = $(elem).text();
      const matches = text.match(/C\s*(\d+)/gi);
      if (matches) {
        matches.forEach((m) => {
          const num = m.match(/\d+/)?.[0];
          if (num) courseNumbers.add(num);
        });
      }
    });
    console.log(
      `   ${courseNumbers.size > 0 ? '✅' : '⚠️'} ${courseNumbers.size} courses détectées: ${Array.from(courseNumbers).sort((a, b) => a - b).join(', ')}`
    );

    // 3. Chercher les rapports d'arrivée dans la page
    console.log(`\n📋 Recherche de rapports d'arrivée dans la page:`);
    const arrivalReports = [];
    
    // Pattern 1: Format "11-1-8-13-14" ou "11 - 1 - 8 - 13 - 14"
    const reportPattern = /(\d{1,2}[\s\-–]+){2,}\d{1,2}/g;
    $('*').each((i, elem) => {
      const text = $(elem).text();
      const matches = text.match(reportPattern);
      if (matches) {
        matches.forEach((m) => {
          const numbers = m.match(/\d+/g);
          if (numbers && numbers.length >= 3 && numbers.length <= 10) {
            const report = numbers.join('-');
            if (!arrivalReports.includes(report)) {
              arrivalReports.push(report);
            }
          }
        });
      }
    });

    if (arrivalReports.length > 0) {
      console.log(`   ✅ ${arrivalReports.length} rapports trouvés:`);
      arrivalReports.slice(0, 10).forEach((report, i) => {
        console.log(`   ${i + 1}. ${report}`);
      });
    } else {
      console.log(`   ⚠️  Aucun rapport trouvé dans le HTML`);
    }

    // 4. Chercher dans les scripts JSON
    console.log(`\n📋 Recherche dans les scripts JSON:`);
    const jsonScripts = [];
    $('script[type="application/json"], script:not([src])').each(
      (i, elem) => {
        const scriptText = $(elem).html();
        if (scriptText && scriptText.includes('arrivee') || scriptText.includes('arrivée') || scriptText.includes('rapport')) {
          jsonScripts.push(scriptText.substring(0, 200));
        }
      }
    );
    console.log(
      `   ${jsonScripts.length > 0 ? '✅' : '⚠️'} ${jsonScripts.length} scripts JSON potentiels trouvés`
    );
    if (jsonScripts.length > 0) {
      jsonScripts.slice(0, 2).forEach((script, i) => {
        console.log(`   Script ${i + 1}: ${script}...`);
      });
    }

    // 5. Structure HTML de la page
    console.log(`\n📋 Structure HTML:`);
    const sections = [];
    $('[class*="course"], [class*="arrivee"], [class*="rapport"], [id*="course"], [id*="arrivee"]').each(
      (i, elem) => {
        const $elem = $(elem);
        const className = $elem.attr('class') || '';
        const id = $elem.attr('id') || '';
        const tag = $elem.prop('tagName');
        sections.push({ tag, className, id });
      }
    );
    console.log(
      `   ${sections.length > 0 ? '✅' : '⚠️'} ${sections.length} éléments liés aux courses trouvés`
    );
    if (sections.length > 0) {
      sections.slice(0, 5).forEach((section, i) => {
        console.log(
          `   ${i + 1}. <${section.tag}> class="${section.className.substring(0, 50)}" id="${section.id}"`
        );
      });
    }

    // 6. Tester si les URLs de courses individuelles existent
    if (courseLinks.length > 0) {
      console.log(`\n📋 Test d'accès aux pages de courses individuelles:`);
      for (const link of courseLinks.slice(0, 3)) {
        try {
          const courseController = new AbortController();
          const courseTimeoutId = setTimeout(() => courseController.abort(), 3000);
          const courseResponse = await fetch(link.url, {
            signal: courseController.signal,
            headers: {
              'User-Agent':
                'PMU-Archives-Exporter/1.0 (Educational/Research Project)',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });
          clearTimeout(courseTimeoutId);
          if (courseResponse.ok) {
            const courseHtml = await courseResponse.text();
            const $course = cheerio.load(courseHtml);
            // Chercher le rapport dans cette page
            const courseReport = $course('*').text().match(/(\d{1,2}[\s\-–]+){2,}\d{1,2}/);
            console.log(
              `   ✅ ${link.url}: ${courseResponse.status} (${courseHtml.length} chars)${courseReport ? ' - Rapport trouvé!' : ''}`
            );
          } else {
            console.log(`   ❌ ${link.url}: HTTP ${courseResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ ${link.url}: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Exploration des pages individuelles de courses\n');
  console.log(`Nombre d\'URLs à tester: ${testUrls.length}\n`);

  for (const url of testUrls) {
    await testReunionPage(url);
    // Pause entre les requêtes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Tests terminés');
  console.log('='.repeat(80));
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

