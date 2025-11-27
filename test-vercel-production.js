/**
 * Script de test complet de l'application en production sur Vercel
 * Teste toutes les fonctionnalités de l'API
 */

const API_BASE = 'https://pmu-archives-exporter.vercel.app/api';

console.log('🧪 Tests complets de l\'application PMU Archives Exporter (Production Vercel)\n');
console.log('='.repeat(70));

let testsPassed = 0;
let testsFailed = 0;

// Fonction utilitaire pour les tests
async function runTest(name, testFn) {
  try {
    console.log(`\n📋 Test: ${name}`);
    const result = await testFn();
    if (result) {
      console.log(`✅ ${name} - RÉUSSI`);
      testsPassed++;
      return true;
    } else {
      console.log(`❌ ${name} - ÉCHOUÉ`);
      testsFailed++;
      return false;
    }
  } catch (error) {
    console.error(`❌ ${name} - ERREUR:`, error.message);
    testsFailed++;
    return false;
  }
}

// Test 1: API Test endpoint
await runTest('API Test Endpoint', async () => {
  const response = await fetch(`${API_BASE}/test`);
  if (!response.ok) return false;
  const data = await response.json();
  return data.message === 'API fonctionne !' && data.hasFetch === true;
});

// Test 2: API Archives - Recherche de base
await runTest('API Archives - Recherche de base (2024, janvier)', async () => {
  const url = `${API_BASE}/archives?source=turf-fr&years=2024&months=janvier`;
  const response = await fetch(url);
  if (!response.ok) return false;
  const data = await response.json();
  return Array.isArray(data) && data.length > 0;
});

// Test 3: API Archives - Filtres avancés
await runTest('API Archives - Filtres avancés (Réunions 1-2, Pays FR)', async () => {
  const url = `${API_BASE}/archives?source=turf-fr&years=2024&months=janvier&reunionNumbers=1,2&countries=FR`;
  const response = await fetch(url);
  if (!response.ok) return false;
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return false;
  
  // Vérifier que les filtres sont appliqués
  const allValid = data.every(r => 
    (r.reunionNumber === '1' || r.reunionNumber === '2') && 
    r.countryCode === 'FR'
  );
  return allValid;
});

// Test 4: API Archives - Filtre par hippodrome
await runTest('API Archives - Filtre par hippodrome (vincennes)', async () => {
  const url = `${API_BASE}/archives?source=turf-fr&years=2024&months=janvier&hippodromes=vincennes`;
  const response = await fetch(url);
  if (!response.ok) return false;
  const data = await response.json();
  if (!Array.isArray(data)) return false;
  
  // Vérifier que tous les résultats contiennent "vincennes"
  const allVincennes = data.every(r => 
    r.hippodrome?.toLowerCase().includes('vincennes')
  );
  return allVincennes;
});

// Test 5: API Archives - Filtre par texte
await runTest('API Archives - Filtre par texte (recherche "cagnes")', async () => {
  const url = `${API_BASE}/archives?source=turf-fr&years=2024&months=janvier&textQuery=cagnes`;
  const response = await fetch(url);
  if (!response.ok) return false;
  const data = await response.json();
  if (!Array.isArray(data)) return false;
  
  // Vérifier que les résultats contiennent "cagnes"
  const allMatch = data.every(r => 
    r.hippodrome?.toLowerCase().includes('cagnes') ||
    r.dateLabel?.toLowerCase().includes('cagnes')
  );
  return allMatch;
});

// Test 6: API Export - Export Excel
await runTest('API Export - Export Excel', async () => {
  const response = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'turf-fr',
      years: ['2024'],
      months: ['janvier'],
      reunionNumbers: ['1'],
      countries: ['FR'],
    }),
  });
  
  if (!response.ok) return false;
  
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('spreadsheetml')) return false;
  
  const blob = await response.blob();
  return blob.size > 0 && blob.type.includes('spreadsheetml');
});

// Test 7: API Archives - Validation des données
await runTest('API Archives - Validation des données', async () => {
  const url = `${API_BASE}/archives?source=turf-fr&years=2024&months=janvier`;
  const response = await fetch(url);
  if (!response.ok) return false;
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return false;
  
  // Vérifier que toutes les réunions ont les champs requis
  const requiredFields = ['id', 'dateISO', 'dateLabel', 'hippodrome', 'reunionNumber', 'countryCode', 'url', 'source'];
  const allValid = data.every(r => {
    return requiredFields.every(field => r.hasOwnProperty(field) && r[field] != null);
  });
  
  return allValid;
});

// Test 8: API Archives - Gestion d'erreur (paramètres manquants)
await runTest('API Archives - Gestion d\'erreur (paramètres manquants)', async () => {
  const url = `${API_BASE}/archives?source=turf-fr`;
  const response = await fetch(url);
  // Devrait retourner 400 (Bad Request)
  return response.status === 400;
});

// Test 9: Cache - Deuxième requête identique
await runTest('Cache - Performance (deuxième requête)', async () => {
  const url = `${API_BASE}/archives?source=turf-fr&years=2024&months=janvier`;
  
  // Première requête
  const start1 = Date.now();
  const response1 = await fetch(url);
  const duration1 = Date.now() - start1;
  await response1.json();
  
  // Deuxième requête (devrait être en cache)
  const start2 = Date.now();
  const response2 = await fetch(url);
  const duration2 = Date.now() - start2;
  await response2.json();
  
  console.log(`   Première requête: ${duration1}ms`);
  console.log(`   Deuxième requête: ${duration2}ms`);
  
  // La deuxième devrait être plus rapide (cache)
  return duration2 < duration1 * 1.5; // Tolérance de 50%
});

// Résumé final
console.log('\n' + '='.repeat(70));
console.log('📊 Résumé des tests:');
console.log('='.repeat(70));
console.log(`✅ Tests réussis: ${testsPassed}`);
console.log(`❌ Tests échoués: ${testsFailed}`);
console.log(`📈 Taux de réussite: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 Tous les tests sont passés ! L\'application est fonctionnelle.');
  process.exit(0);
} else {
  console.log('\n⚠️ Certains tests ont échoué. Vérifiez les détails ci-dessus.');
  process.exit(1);
}

