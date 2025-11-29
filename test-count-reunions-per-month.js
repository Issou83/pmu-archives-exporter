/**
 * Compter le nombre de réunions par mois pour comprendre les timeouts
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

async function countReunionsPerMonth() {
  console.log('=== COMPTAGE RÉUNIONS PAR MOIS (SANS RAPPORTS) ===\n');

  for (const month of months) {
    const url = `https://pmu-archives-exporter.vercel.app/api/archives?source=turf-fr&years=2024&months=${month}`;
    console.log(`Test: ${month}`);

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        signal: AbortSignal.timeout(70000),
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        console.log(`  ❌ HTTP ${response.status} - ${duration}s\n`);
        continue;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.log(`  ❌ Réponse invalide: ${JSON.stringify(data).substring(0, 100)}\n`);
        continue;
      }

      const withReports = data.filter((r) => r.arrivalReport).length;
      const reportPct = data.length > 0 ? Math.round((withReports / data.length) * 100) : 0;

      console.log(`  ✅ ${data.length} réunions (${withReports} avec rapports, ${reportPct}%) - ${duration}s\n`);
    } catch (error) {
      console.log(`  ❌ Erreur: ${error.message}\n`);
    }

    // Attendre un peu entre les requêtes
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

countReunionsPerMonth().catch(console.error);

