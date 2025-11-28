/**
 * Script de test complet pour valider les optimisations du scraping
 * Teste différents scénarios avec mesure du temps
 */

import { scrapeTurfFrArchives, setArrivalReportsCache } from './api/scrapers/turfScraper.js';

// Cache pour les rapports d'arrivée
const arrivalReportsCache = new Map();
const ARRIVAL_REPORTS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

// Injecter le cache
setArrivalReportsCache(arrivalReportsCache, ARRIVAL_REPORTS_CACHE_TTL);

/**
 * Test un scénario de scraping
 */
async function testScenario(name, years, months, includeArrivalReports = true) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST: ${name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Années: ${years.join(', ')}`);
  console.log(`Mois: ${months.join(', ')}`);
  console.log(`Rapports d'arrivée: ${includeArrivalReports ? 'OUI' : 'NON'}`);
  
  const startTime = Date.now();
  
  try {
    const reunions = await scrapeTurfFrArchives(years, months, includeArrivalReports);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Statistiques
    const withReports = reunions.filter(r => r.arrivalReport).length;
    const withoutReports = reunions.length - withReports;
    const cacheHits = Array.from(arrivalReportsCache.values()).filter(
      c => Date.now() - c.timestamp < ARRIVAL_REPORTS_CACHE_TTL
    ).length;
    
    console.log(`\n✅ RÉSULTATS:`);
    console.log(`   Durée: ${duration.toFixed(2)}s`);
    console.log(`   Total réunions: ${reunions.length}`);
    console.log(`   Avec rapports: ${withReports}`);
    console.log(`   Sans rapports: ${withoutReports}`);
    console.log(`   Cache hits: ${cacheHits}`);
    console.log(`   Taux de succès: ${((withReports / reunions.length) * 100).toFixed(1)}%`);
    
    // Vérifier si on est dans les limites de timeout
    if (duration > 50) {
      console.log(`   ⚠️  ATTENTION: Durée proche du timeout (60s)`);
    } else if (duration > 40) {
      console.log(`   ⚠️  ATTENTION: Durée élevée`);
    } else {
      console.log(`   ✅ Durée acceptable`);
    }
    
    return {
      success: true,
      duration,
      reunions: reunions.length,
      withReports,
      withoutReports,
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n❌ ERREUR:`);
    console.log(`   Durée avant erreur: ${duration.toFixed(2)}s`);
    console.log(`   Message: ${error.message}`);
    
    return {
      success: false,
      duration,
      error: error.message,
    };
  }
}

/**
 * Suite de tests complète
 */
async function runAllTests() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 DÉMARRAGE DES TESTS D'OPTIMISATION`);
  console.log(`${'='.repeat(60)}`);
  
  const results = [];
  
  // Test 1: Petit scénario (1 mois, 1 année)
  results.push(await testScenario(
    'Petit scénario - 1 mois, 1 année',
    ['2025'],
    ['janvier'],
    true
  ));
  
  // Attendre un peu entre les tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Scénario moyen (2 mois, 1 année)
  results.push(await testScenario(
    'Scénario moyen - 2 mois, 1 année',
    ['2025'],
    ['janvier', 'fevrier'],
    true
  ));
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Scénario avec cache (même requête)
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST: Scénario avec cache (même requête)`);
  console.log(`${'='.repeat(60)}`);
  const cacheStartTime = Date.now();
  const cachedReunions = await scrapeTurfFrArchives(['2025'], ['janvier'], true);
  const cacheEndTime = Date.now();
  const cacheDuration = (cacheEndTime - cacheStartTime) / 1000;
  console.log(`✅ Durée avec cache: ${cacheDuration.toFixed(2)}s`);
  console.log(`   Réunions: ${cachedReunions.length}`);
  results.push({
    success: true,
    duration: cacheDuration,
    reunions: cachedReunions.length,
    cached: true,
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Scénario grand (4 mois, 1 année) - sans rapports pour éviter timeout
  results.push(await testScenario(
    'Grand scénario - 4 mois, 1 année (sans rapports)',
    ['2025'],
    ['janvier', 'fevrier', 'mars', 'avril'],
    false // Pas de rapports pour éviter timeout
  ));
  
  // Résumé final
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RÉSUMÉ DES TESTS`);
  console.log(`${'='.repeat(60)}`);
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
  const totalReunions = successfulTests.reduce((sum, r) => sum + (r.reunions || 0), 0);
  
  console.log(`Tests réussis: ${successfulTests.length}/${results.length}`);
  console.log(`Tests échoués: ${failedTests.length}/${results.length}`);
  console.log(`Durée moyenne: ${avgDuration.toFixed(2)}s`);
  console.log(`Total réunions scrapées: ${totalReunions}`);
  
  if (failedTests.length > 0) {
    console.log(`\n❌ Tests échoués:`);
    failedTests.forEach((test, i) => {
      console.log(`   ${i + 1}. ${test.error}`);
    });
  }
  
  // Vérifications de performance
  console.log(`\n${'='.repeat(60)}`);
  console.log(`⚡ VÉRIFICATIONS DE PERFORMANCE`);
  console.log(`${'='.repeat(60)}`);
  
  const allDurations = successfulTests.map(r => r.duration);
  const maxDuration = Math.max(...allDurations);
  const minDuration = Math.min(...allDurations);
  
  console.log(`Durée minimale: ${minDuration.toFixed(2)}s`);
  console.log(`Durée maximale: ${maxDuration.toFixed(2)}s`);
  console.log(`Durée moyenne: ${avgDuration.toFixed(2)}s`);
  
  if (maxDuration < 30) {
    console.log(`✅ EXCELLENT: Toutes les requêtes sont rapides (< 30s)`);
  } else if (maxDuration < 50) {
    console.log(`✅ BON: Les requêtes sont acceptables (< 50s)`);
  } else if (maxDuration < 60) {
    console.log(`⚠️  ATTENTION: Certaines requêtes sont proches du timeout`);
  } else {
    console.log(`❌ PROBLÈME: Certaines requêtes dépassent le timeout`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ TESTS TERMINÉS`);
  console.log(`${'='.repeat(60)}\n`);
}

// Exécuter les tests
runAllTests().catch(console.error);

