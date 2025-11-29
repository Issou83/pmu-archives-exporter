/**
 * Test spécifique pour identifier le problème de timeout avec mai 2025
 */

import { scrapeTurfFrArchives, setArrivalReportsCache } from './api/scrapers/turfScraper.js';

// Cache pour les rapports d'arrivée
const arrivalReportsCache = new Map();
const ARRIVAL_REPORTS_CACHE_TTL = 24 * 60 * 60 * 1000;

async function testMai2025() {
  console.log('=== TEST MAI 2025 ===\n');
  
  const startTime = Date.now();
  
  try {
    // Injecter le cache
    setArrivalReportsCache(arrivalReportsCache, ARRIVAL_REPORTS_CACHE_TTL);
    
    console.log('1. Test SANS rapports d\'arrivée (plus rapide)...');
    const startWithout = Date.now();
    const reunionsWithout = await scrapeTurfFrArchives(['2025'], ['mai'], false);
    const timeWithout = Date.now() - startWithout;
    console.log(`   ✅ ${reunionsWithout.length} réunions trouvées en ${timeWithout}ms (${(timeWithout/1000).toFixed(2)}s)`);
    
    console.log('\n2. Test AVEC rapports d\'arrivée (peut être lent)...');
    const startWith = Date.now();
    const reunionsWith = await scrapeTurfFrArchives(['2025'], ['mai'], true);
    const timeWith = Date.now() - startWith;
    console.log(`   ✅ ${reunionsWith.length} réunions trouvées en ${timeWith}ms (${(timeWith/1000).toFixed(2)}s)`);
    
    // Compter les rapports d'arrivée
    const withReports = reunionsWith.filter(r => r.arrivalReport && r.arrivalReport !== 'Non disponible').length;
    console.log(`   📊 ${withReports}/${reunionsWith.length} réunions avec rapport d'arrivée`);
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Temps total: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
    
    if (timeWith > 60000) {
      console.log('\n❌ PROBLÈME: Le scraping AVEC rapports dépasse 60s (limite Vercel)');
      console.log(`   Solution: Désactiver les rapports d'arrivée pour mai 2025`);
    } else {
      console.log('\n✅ OK: Le scraping est dans les limites Vercel');
    }
    
    // Afficher quelques exemples
    console.log('\n📋 Exemples de réunions:');
    reunionsWith.slice(0, 5).forEach((r, i) => {
      console.log(`   ${i+1}. ${r.dateLabel} - ${r.hippodrome} - R${r.reunionNumber} - ${r.arrivalReport || 'Non disponible'}`);
    });
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMai2025().catch(console.error);

