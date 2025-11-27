/**
 * Script de test pour vérifier le scraper Turf-FR
 * Usage: node test-scraper.js
 */

import { scrapeTurfFrArchives } from './api/scrapers/turfScraper.js';

console.log('🧪 Test du scraper Turf-FR...\n');

// Test avec une année et un mois récents
const testYears = ['2024'];
const testMonths = ['janvier'];

console.log(`Test avec: années=${testYears.join(',')}, mois=${testMonths.join(',')}\n`);

try {
  const reunions = await scrapeTurfFrArchives(testYears, testMonths);
  
  console.log(`\n✅ Résultat: ${reunions.length} réunions trouvées\n`);
  
  if (reunions.length > 0) {
    console.log('📋 Premières réunions:');
    reunions.slice(0, 5).forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.dateLabel} - ${r.hippodrome} - Réunion ${r.reunionNumber}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   Pays: ${r.countryCode}`);
    });
  } else {
    console.log('❌ Aucune réunion trouvée. Vérifiez:');
    console.log('   - L\'URL est-elle correcte?');
    console.log('   - Le site turf-fr.com est-il accessible?');
    console.log('   - La structure HTML a-t-elle changé?');
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error(error.stack);
}

