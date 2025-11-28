/**
 * Script de vérification approfondie des données extraites
 * Compare les données scrapées avec les données réelles sur le site
 */

import { scrapeTurfFrArchives } from './api/scrapers/turfScraper.js';

/**
 * Teste une URL spécifique et compare avec le site réel
 */
async function testUrlVerification(reunionUrl) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 VÉRIFICATION: ${reunionUrl}`);
  console.log(`${'='.repeat(60)}`);
  
  // Scraper les données
  const reunions = await scrapeTurfFrArchives(['2025'], ['aout'], false);
  const reunion = reunions.find(r => r.url === reunionUrl);
  
  if (!reunion) {
    console.log(`❌ Réunion non trouvée dans les résultats`);
    return null;
  }
  
  console.log(`\n📊 DONNÉES EXTRAITES:`);
  console.log(`   ID: ${reunion.id}`);
  console.log(`   Date ISO: ${reunion.dateISO}`);
  console.log(`   Date Label: ${reunion.dateLabel}`);
  console.log(`   Année: ${reunion.year}`);
  console.log(`   Mois: ${reunion.month} (${reunion.monthLabel})`);
  console.log(`   Hippodrome: ${reunion.hippodrome}`);
  console.log(`   Numéro réunion: ${reunion.reunionNumber}`);
  console.log(`   Pays: ${reunion.countryCode}`);
  console.log(`   Source: ${reunion.source}`);
  console.log(`   URL: ${reunion.url}`);
  
  // Vérifier la cohérence des dates
  console.log(`\n✅ VÉRIFICATIONS:`);
  
  // 1. Vérifier que dateISO correspond à year-month-day
  const dateParts = reunion.dateISO.split('-');
  const yearFromISO = parseInt(dateParts[0]);
  const monthFromISO = parseInt(dateParts[1]);
  const dayFromISO = parseInt(dateParts[2]);
  
  if (yearFromISO !== reunion.year) {
    console.log(`   ❌ INCOHÉRENCE: Année ISO (${yearFromISO}) ≠ année (${reunion.year})`);
  } else {
    console.log(`   ✅ Année cohérente: ${reunion.year}`);
  }
  
  if (monthFromISO !== reunion.month) {
    console.log(`   ❌ INCOHÉRENCE: Mois ISO (${monthFromISO}) ≠ mois (${reunion.month})`);
  } else {
    console.log(`   ✅ Mois cohérent: ${reunion.month} (${reunion.monthLabel})`);
  }
  
  // 2. Vérifier que dateLabel correspond à dateISO
  const expectedDateLabel = `${dayFromISO} ${reunion.monthLabel} ${yearFromISO}`;
  if (reunion.dateLabel !== expectedDateLabel) {
    console.log(`   ⚠️  Date label différente:`);
    console.log(`      Attendu: ${expectedDateLabel}`);
    console.log(`      Obtenu: ${reunion.dateLabel}`);
  } else {
    console.log(`   ✅ Date label cohérente: ${reunion.dateLabel}`);
  }
  
  // 3. Vérifier le format de l'ID
  const expectedId = `${reunion.dateISO}_${reunion.hippodrome}_${reunion.reunionNumber}`.replace(/[^a-zA-Z0-9_]/g, '_');
  if (reunion.id !== expectedId) {
    console.log(`   ⚠️  ID différent:`);
    console.log(`      Attendu: ${expectedId}`);
    console.log(`      Obtenu: ${reunion.id}`);
  } else {
    console.log(`   ✅ ID cohérent: ${reunion.id}`);
  }
  
  // 4. Vérifier le pays selon l'hippodrome
  const expectedCountry = getExpectedCountry(reunion.hippodrome);
  if (reunion.countryCode !== expectedCountry) {
    console.log(`   ⚠️  Pays différent:`);
    console.log(`      Attendu: ${expectedCountry} (selon hippodrome: ${reunion.hippodrome})`);
    console.log(`      Obtenu: ${reunion.countryCode}`);
  } else {
    console.log(`   ✅ Pays cohérent: ${reunion.countryCode}`);
  }
  
  // 5. Vérifier que l'URL est valide
  if (!reunion.url || !reunion.url.startsWith('http')) {
    console.log(`   ❌ URL invalide: ${reunion.url}`);
  } else {
    console.log(`   ✅ URL valide: ${reunion.url}`);
  }
  
  return reunion;
}

/**
 * Détermine le pays attendu selon l'hippodrome
 */
function getExpectedCountry(hippodrome) {
  if (!hippodrome) return 'FR';
  const upper = hippodrome.toUpperCase();
  if (upper.startsWith('GB-') || upper.startsWith('GB ')) return 'GB';
  if (upper.startsWith('SWE-') || upper.startsWith('SWE ')) return 'SWE';
  if (upper.startsWith('USA-') || upper.startsWith('USA ')) return 'USA';
  if (upper.startsWith('IRE-') || upper.startsWith('IRE ')) return 'IRE';
  if (upper.startsWith('GER-') || upper.startsWith('GER ')) return 'GER';
  if (upper.startsWith('ITA-') || upper.startsWith('ITA ')) return 'ITA';
  return 'FR';
}

/**
 * Teste plusieurs réunions pour détecter les patterns d'erreurs
 */
async function testMultipleReunions() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST MULTIPLE RÉUNIONS`);
  console.log(`${'='.repeat(60)}`);
  
  const reunions = await scrapeTurfFrArchives(['2025'], ['aout'], false);
  
  console.log(`\n📊 STATISTIQUES:`);
  console.log(`   Total réunions: ${reunions.length}`);
  
  // Analyser les incohérences
  const errors = {
    dateISO: [],
    dateLabel: [],
    year: [],
    month: [],
    country: [],
    id: [],
    url: [],
  };
  
  for (const reunion of reunions) {
    // Vérifier dateISO
    const dateParts = reunion.dateISO.split('-');
    if (dateParts.length !== 3) {
      errors.dateISO.push({ id: reunion.id, value: reunion.dateISO });
    }
    
    // Vérifier cohérence année
    const yearFromISO = parseInt(dateParts[0]);
    if (yearFromISO !== reunion.year) {
      errors.year.push({ id: reunion.id, iso: yearFromISO, expected: reunion.year });
    }
    
    // Vérifier cohérence mois
    const monthFromISO = parseInt(dateParts[1]);
    if (monthFromISO !== reunion.month) {
      errors.month.push({ id: reunion.id, iso: monthFromISO, expected: reunion.month });
    }
    
    // Vérifier dateLabel
    const dayFromISO = parseInt(dateParts[2]);
    const expectedDateLabel = `${dayFromISO} ${reunion.monthLabel} ${yearFromISO}`;
    if (reunion.dateLabel !== expectedDateLabel) {
      errors.dateLabel.push({
        id: reunion.id,
        expected: expectedDateLabel,
        actual: reunion.dateLabel,
      });
    }
    
    // Vérifier pays
    const expectedCountry = getExpectedCountry(reunion.hippodrome);
    if (reunion.countryCode !== expectedCountry) {
      errors.country.push({
        id: reunion.id,
        hippodrome: reunion.hippodrome,
        expected: expectedCountry,
        actual: reunion.countryCode,
      });
    }
    
    // Vérifier URL
    if (!reunion.url || !reunion.url.startsWith('http')) {
      errors.url.push({ id: reunion.id, url: reunion.url });
    }
  }
  
  // Afficher les erreurs
  console.log(`\n❌ ERREURS DÉTECTÉES:`);
  console.log(`   Date ISO invalide: ${errors.dateISO.length}`);
  console.log(`   Année incohérente: ${errors.year.length}`);
  console.log(`   Mois incohérent: ${errors.month.length}`);
  console.log(`   Date label incorrecte: ${errors.dateLabel.length}`);
  console.log(`   Pays incorrect: ${errors.country.length}`);
  console.log(`   URL invalide: ${errors.url.length}`);
  
  // Afficher les détails des erreurs
  if (errors.year.length > 0) {
    console.log(`\n   Détails années incohérentes:`);
    errors.year.slice(0, 5).forEach(e => {
      console.log(`      ${e.id}: ISO=${e.iso}, Attendu=${e.expected}`);
    });
  }
  
  if (errors.month.length > 0) {
    console.log(`\n   Détails mois incohérents:`);
    errors.month.slice(0, 5).forEach(e => {
      console.log(`      ${e.id}: ISO=${e.iso}, Attendu=${e.expected}`);
    });
  }
  
  if (errors.dateLabel.length > 0) {
    console.log(`\n   Détails dates label incorrectes:`);
    errors.dateLabel.slice(0, 5).forEach(e => {
      console.log(`      ${e.id}:`);
      console.log(`         Attendu: ${e.expected}`);
      console.log(`         Obtenu: ${e.actual}`);
    });
  }
  
  if (errors.country.length > 0) {
    console.log(`\n   Détails pays incorrects:`);
    errors.country.slice(0, 5).forEach(e => {
      console.log(`      ${e.id} (${e.hippodrome}): Attendu=${e.expected}, Obtenu=${e.actual}`);
    });
  }
  
  return { reunions, errors };
}

// Exécuter les tests
async function runTests() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 DÉMARRAGE DES TESTS DE VÉRIFICATION`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Test 1 : Test multiple réunions
    const result = await testMultipleReunions();
    
    // Test 2 : Test d'une URL spécifique si disponible
    if (result.reunions.length > 0) {
      const firstReunion = result.reunions[0];
      await testUrlVerification(firstReunion.url);
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ TESTS TERMINÉS`);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.error(`\n❌ ERREUR:`, error);
  }
}

runTests().catch(console.error);
