/**
 * Script d'analyse complète de l'application
 * Teste tous les aspects du scraping et vérifie la véracité des données
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const TEST_URLS = {
  archivePage: 'https://www.turf-fr.com/archives/courses-pmu/2024/janvier',
  reunionPage: 'https://www.turf-fr.com/partants-programmes/r1-vincennes-36237',
  arrivalPage:
    'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-vincennes-36237',
};

/**
 * Analyse la structure HTML d'une page d'archives
 */
async function analyzeArchivePage() {
  console.log('\n=== ANALYSE PAGE ARCHIVES ===');
  try {
    const response = await fetch(TEST_URLS.archivePage);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Structure des liens de réunion
    console.log('\n1. STRUCTURE DES LIENS DE REUNION:');
    const reunionLinks = $(
      'a[href*="/partants-programmes/"], a[href*="/courses-pmu/"]'
    );
    console.log(`   Total liens trouvés: ${reunionLinks.length}`);

    const sampleLinks = reunionLinks.slice(0, 5);
    sampleLinks.each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const text = $link.text().trim();
      console.log(`   Lien ${i + 1}: ${href}`);
      console.log(`   Texte: "${text}"`);
    });

    // 2. Structure des dates
    console.log('\n2. STRUCTURE DES DATES:');
    const datePatterns = [
      /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
    ];

    const pageText = $('body').text();
    const dates = [];
    for (const pattern of datePatterns) {
      const matches = pageText.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        dates.push(...matches.slice(0, 5));
      }
    }
    console.log(`   Dates trouvées: ${dates.length}`);
    dates.slice(0, 5).forEach((date, i) => {
      console.log(`   Date ${i + 1}: ${date}`);
    });

    // 3. Structure des conteneurs
    console.log('\n3. STRUCTURE DES CONTENEURS:');
    const containers = [
      '.liste_reunions',
      '.archivesCourses',
      '.bloc_archive_liste_mois',
      '[class*="reunion"]',
      '[class*="archive"]',
    ];

    containers.forEach((selector) => {
      const $container = $(selector);
      if ($container.length > 0) {
        console.log(`   ${selector}: ${$container.length} éléments`);
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'analyse:", error.message);
  }
}

/**
 * Analyse la structure HTML d'une page de réunion
 */
async function analyzeReunionPage() {
  console.log('\n=== ANALYSE PAGE REUNION ===');
  try {
    const response = await fetch(TEST_URLS.reunionPage);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Structure de la date
    console.log('\n1. STRUCTURE DE LA DATE:');
    const dateSelectors = [
      '[class*="date"]',
      '[id*="date"]',
      '.date',
      '#date',
      'title',
    ];

    dateSelectors.forEach((selector) => {
      const $elem = $(selector);
      if ($elem.length > 0) {
        const text = $elem.first().text().trim();
        if (text.length < 100) {
          console.log(`   ${selector}: "${text}"`);
        }
      }
    });

    // 2. Structure de l'hippodrome
    console.log("\n2. STRUCTURE DE L'HIPPODROME:");
    const title = $('title').text();
    const h1 = $('h1').text();
    console.log(`   Title: ${title}`);
    console.log(`   H1: ${h1}`);

    // 3. Structure du numéro de réunion
    console.log('\n3. STRUCTURE DU NUMERO DE REUNION:');
    const reunionPattern = /R(\d+)/i;
    const matches = [title, h1].join(' ').match(reunionPattern);
    if (matches) {
      console.log(`   Numéro trouvé: R${matches[1]}`);
    }
  } catch (error) {
    console.error("Erreur lors de l'analyse:", error.message);
  }
}

/**
 * Analyse la structure HTML d'une page avec rapport d'arrivée
 */
async function analyzeArrivalPage() {
  console.log('\n=== ANALYSE PAGE RAPPORT ARRIVEE ===');
  try {
    const response = await fetch(TEST_URLS.arrivalPage);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Structure du rapport d'arrivée
    console.log("\n1. STRUCTURE DU RAPPORT D'ARRIVEE:");

    // Chercher dans les éléments avec classe/ID contenant "arrivée"
    const arrivalSelectors = [
      '[class*="arrivée"]',
      '[class*="arrivee"]',
      '[id*="arrivée"]',
      '[id*="arrivee"]',
      '.arrivee',
      '#arrivee',
    ];

    arrivalSelectors.forEach((selector) => {
      const $elem = $(selector);
      if ($elem.length > 0) {
        const text = $elem.first().text().trim();
        if (text.length < 200) {
          console.log(`   ${selector}: "${text}"`);
        }
      }
    });

    // Chercher dans le body
    const bodyText = $('body').text();
    const arrivalMatches = bodyText.match(
      /arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/gi
    );
    if (arrivalMatches) {
      console.log(`   Rapports trouvés dans body: ${arrivalMatches.length}`);
      arrivalMatches.slice(0, 3).forEach((match, i) => {
        console.log(`   Match ${i + 1}: ${match}`);
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'analyse:", error.message);
  }
}

/**
 * Teste le parsing des rapports d'arrivée
 */
function testArrivalReportParsing() {
  console.log('\n=== TEST PARSING RAPPORTS ARRIVEE ===');

  const testCases = [
    '11-6-4-5-1',
    '7-8-6-4-11',
    '5-7-11-6-1',
    '11 - 6 - 4 - 5 - 1',
    '11–6–4–5–1',
    'Arrivée : 11-6-4-5-1',
    'arrivée 11 6 4 5 1',
  ];

  testCases.forEach((testCase) => {
    // Simuler le parsing
    let candidate = testCase
      .replace(/\s+/g, ' ')
      .replace(/\s*[-–]\s*/g, '|')
      .replace(/\s+/g, '|')
      .replace(/\|+/g, '|');

    const numbers = candidate
      .split('|')
      .map((n) => n.trim())
      .filter((n) => n.match(/^\d+$/));

    const validNumbers = numbers.filter((n) => {
      const num = parseInt(n);
      return num >= 1 && num <= 30;
    });

    const result = validNumbers.length >= 3 ? validNumbers.join('-') : null;
    console.log(`   Input: "${testCase}" -> Output: ${result || 'NULL'}`);
  });
}

/**
 * Teste l'extraction des dates
 */
function testDateExtraction() {
  console.log('\n=== TEST EXTRACTION DATES ===');

  const testCases = [
    'lundi 15 janvier 2024',
    '15 janvier 2024',
    '1 janvier 2024',
    '31 décembre 2023',
    '15/01/2024',
    '01/15/2024',
  ];

  testCases.forEach((testCase) => {
    // Simuler le parsing
    const monthNames = {
      janvier: 1,
      février: 2,
      mars: 3,
      avril: 4,
      mai: 5,
      juin: 6,
      juillet: 7,
      août: 8,
      septembre: 9,
      octobre: 10,
      novembre: 11,
      décembre: 12,
    };

    let result = null;

    // Pattern 1: Date complète
    const fullDateMatch = testCase.match(
      /(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\s*(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i
    );
    if (fullDateMatch) {
      const day = parseInt(fullDateMatch[1]);
      const monthName = fullDateMatch[2].toLowerCase();
      const year = parseInt(fullDateMatch[3]);
      const month = monthNames[monthName];
      if (month) {
        result = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    // Pattern 2: Date avec slash
    if (!result) {
      const slashDateMatch = testCase.match(
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
      );
      if (slashDateMatch) {
        const part1 = parseInt(slashDateMatch[1]);
        const part2 = parseInt(slashDateMatch[2]);
        const year = parseInt(slashDateMatch[3]);
        let day, month;
        if (part1 > 12) {
          day = part1;
          month = part2;
        } else if (part2 > 12) {
          day = part2;
          month = part1;
        } else {
          day = part1;
          month = part2;
        }
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          result = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    console.log(`   Input: "${testCase}" -> Output: ${result || 'NULL'}`);
  });
}

/**
 * Fonction principale
 */
async function main() {
  console.log("=== ANALYSE COMPLETE DE L'APPLICATION ===\n");

  await analyzeArchivePage();
  await analyzeReunionPage();
  await analyzeArrivalPage();
  testArrivalReportParsing();
  testDateExtraction();

  console.log('\n=== ANALYSE TERMINEE ===');
}

main().catch(console.error);
