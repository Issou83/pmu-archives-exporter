/**
 * Script de vérification complète de la véracité des données
 * Compare les données scrapées avec les sources réelles
 */

import fetch from 'node-fetch';

const API_URL = 'https://pmu-archives-exporter.vercel.app/api/archives';

/**
 * Teste l'API et vérifie la véracité des données
 */
async function testAPIAndVerifyData() {
  console.log('=== TEST API ET VERIFICATION DES DONNEES ===\n');
  
  // Test 1: Janvier 2024
  console.log('TEST 1: Janvier 2024');
  try {
    const response = await fetch(`${API_URL}?source=turf-fr&years=2024&months=janvier`);
    const result = await response.json();
    
    // Gérer le cas où l'API retourne un objet avec une propriété error
    if (!Array.isArray(result)) {
      console.log(`   ❌ L'API a retourné une erreur: ${JSON.stringify(result)}`);
      return;
    }
    
    const data = result;
    console.log(`   Réunions trouvées: ${data.length}`);
    
    // Vérifier que toutes les réunions ont les champs requis
    const requiredFields = ['id', 'dateISO', 'dateLabel', 'hippodrome', 'reunionNumber', 'url', 'source'];
    const missingFields = data.filter(r => {
      return requiredFields.some(field => !r[field]);
    });
    
    if (missingFields.length > 0) {
      console.log(`   ⚠️  ${missingFields.length} réunions avec champs manquants`);
      missingFields.slice(0, 3).forEach(r => {
        const missing = requiredFields.filter(f => !r[f]);
        console.log(`      - ${r.hippodrome} R${r.reunionNumber}: manque ${missing.join(', ')}`);
      });
    } else {
      console.log('   ✅ Toutes les réunions ont les champs requis');
    }
    
    // Vérifier les dates
    const invalidDates = data.filter(r => {
      if (!r.dateISO) return true;
      const date = new Date(r.dateISO);
      return isNaN(date.getTime()) || date.getFullYear() !== 2024 || date.getMonth() !== 0;
    });
    
    if (invalidDates.length > 0) {
      console.log(`   ⚠️  ${invalidDates.length} réunions avec dates invalides ou hors janvier 2024`);
      invalidDates.slice(0, 5).forEach(r => {
        console.log(`      - ${r.hippodrome} R${r.reunionNumber}: ${r.dateISO || 'NULL'} (${r.dateLabel || 'NULL'})`);
      });
    } else {
      console.log('   ✅ Toutes les dates sont valides et en janvier 2024');
    }
    
    // Vérifier les rapports d'arrivée
    const withReports = data.filter(r => r.arrivalReport);
    const withoutReports = data.filter(r => !r.arrivalReport);
    
    console.log(`   Rapports d'arrivée: ${withReports.length} avec, ${withoutReports.length} sans`);
    
    if (withoutReports.length > 0) {
      console.log(`   ⚠️  ${withoutReports.length} réunions sans rapport d'arrivée`);
      withoutReports.slice(0, 5).forEach(r => {
        console.log(`      - ${r.hippodrome} R${r.reunionNumber}: ${r.dateLabel}`);
      });
    }
    
    // Vérifier les hippodromes
    const invalidHippodromes = data.filter(r => {
      return !r.hippodrome || r.hippodrome === 'Inconnu' || r.hippodrome.length < 2;
    });
    
    if (invalidHippodromes.length > 0) {
      console.log(`   ⚠️  ${invalidHippodromes.length} réunions avec hippodromes invalides`);
      invalidHippodromes.slice(0, 5).forEach(r => {
        console.log(`      - Hippodrome: "${r.hippodrome}" (R${r.reunionNumber})`);
      });
    } else {
      console.log('   ✅ Tous les hippodromes sont valides');
    }
    
    // Vérifier les URLs
    const invalidUrls = data.filter(r => {
      return !r.url || !r.url.includes('turf-fr.com') || !r.url.includes('r');
    });
    
    if (invalidUrls.length > 0) {
      console.log(`   ⚠️  ${invalidUrls.length} réunions avec URLs invalides`);
      invalidUrls.slice(0, 3).forEach(r => {
        console.log(`      - URL: "${r.url}"`);
      });
    } else {
      console.log('   ✅ Toutes les URLs sont valides');
    }
    
    // Vérifier les codes pays
    const invalidCountries = data.filter(r => {
      return !r.countryCode || !['FR', 'GB', 'SWE', 'USA', 'IRE', 'GER', 'ITA'].includes(r.countryCode);
    });
    
    if (invalidCountries.length > 0) {
      console.log(`   ⚠️  ${invalidCountries.length} réunions avec codes pays invalides`);
      invalidCountries.slice(0, 5).forEach(r => {
        console.log(`      - ${r.hippodrome}: "${r.countryCode}"`);
      });
    } else {
      console.log('   ✅ Tous les codes pays sont valides');
    }
    
    // Vérifier les doublons
    const ids = data.map(r => r.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.log(`   ⚠️  ${ids.length - uniqueIds.size} doublons détectés`);
    } else {
      console.log('   ✅ Aucun doublon détecté');
    }
    
    // Exemples de données
    console.log('\n   Exemples de données:');
    data.slice(0, 5).forEach(r => {
      console.log(`      - ${r.hippodrome} R${r.reunionNumber}: ${r.dateLabel} | Rapport: ${r.arrivalReport || 'N/A'}`);
    });
    
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
  }
  
  console.log('\n');
}

/**
 * Vérifie la véracité des données en comparant avec les sources réelles
 */
async function verifyDataAgainstSource() {
  console.log('=== VERIFICATION CONTRE SOURCES REELLES ===\n');
  
  // Test avec quelques URLs spécifiques
  const testUrls = [
    'https://www.turf-fr.com/partants-programmes/r1-vincennes-36237',
    'https://www.turf-fr.com/courses-pmu/arrivees-rapports/r1-vincennes-36237',
  ];
  
  for (const url of testUrls) {
    console.log(`Test URL: ${url}`);
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Vérifier la présence de la date
      const datePattern = /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
      const dateMatch = html.match(datePattern);
      if (dateMatch) {
        console.log(`   ✅ Date trouvée: ${dateMatch[0]}`);
      } else {
        console.log(`   ⚠️  Date non trouvée dans le HTML`);
      }
      
      // Vérifier la présence du rapport d'arrivée (si page arrivees-rapports)
      if (url.includes('arrivees-rapports')) {
        const arrivalPattern = /arrivée[ée\s\n:]*(\d+(?:\s*[-–]?\s*\d+){2,})/i;
        const arrivalMatch = html.match(arrivalPattern);
        if (arrivalMatch) {
          console.log(`   ✅ Rapport d'arrivée trouvé: ${arrivalMatch[0]}`);
        } else {
          console.log(`   ⚠️  Rapport d'arrivée non trouvé`);
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    console.log('');
  }
}

/**
 * Fonction principale
 */
async function main() {
  await testAPIAndVerifyData();
  await verifyDataAgainstSource();
  console.log('=== VERIFICATION TERMINEE ===');
}

main().catch(console.error);

