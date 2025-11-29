/**
 * Vérifier si les pages d'archives existent pour tous les mois de 2024
 */

const months = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
];

async function testArchivesPagesExistence() {
  console.log('=== VÉRIFICATION EXISTENCE PAGES ARCHIVES 2024 ===\n');

  for (const month of months) {
    const url = `https://www.turf-fr.com/archives/courses-pmu/2024/${month}`;
    console.log(`Test: ${month}`);
    console.log(`  URL: ${url}`);

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.log(`  ❌ HTTP ${response.status} - Page non accessible\n`);
        continue;
      }

      const html = await response.text();
      console.log(`  ✅ Page accessible (${html.length} caractères)`);

      // Chercher des indices de réunions
      const reunionIndicators = [
        html.match(/r\d+[-_]/gi)?.length || 0,
        html.match(/réunion/gi)?.length || 0,
        html.match(/courses-pmu.*r\d+/gi)?.length || 0,
        html.match(/partants-programmes.*r\d+/gi)?.length || 0,
      ];

      const totalIndicators = reunionIndicators.reduce((a, b) => a + b, 0);
      console.log(`  📊 Indicateurs de réunions:`);
      console.log(`     - Patterns r\\d+: ${reunionIndicators[0]}`);
      console.log(`     - Mot "réunion": ${reunionIndicators[1]}`);
      console.log(`     - URLs courses-pmu: ${reunionIndicators[2]}`);
      console.log(`     - URLs partants: ${reunionIndicators[3]}`);
      console.log(`     - Total: ${totalIndicators}`);

      if (totalIndicators === 0) {
        console.log(`  ⚠️  Aucun indicateur de réunion trouvé - Page peut être vide\n`);
      } else {
        console.log(`  ✅ Indicateurs trouvés - Page contient probablement des réunions\n`);
      }
    } catch (error) {
      console.log(`  ❌ Erreur: ${error.message}\n`);
    }

    // Attendre un peu entre les requêtes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

testArchivesPagesExistence().catch(console.error);

