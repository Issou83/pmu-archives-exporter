import * as cheerio from 'cheerio';

const url = 'https://www.turf-fr.com/archives/courses-pmu/2024/janvier';
console.log(`[Test] Fetching: ${url}`);

const response = await fetch(url, {
  headers: {
    'User-Agent': 'PMU-Archives-Exporter/1.0',
    'Accept': 'text/html',
  },
});

if (!response.ok) {
  console.error(`[Test] HTTP ${response.status}`);
  process.exit(1);
}

const html = await response.text();
console.log(`[Test] HTML reÃ§u: ${html.length} caractÃ¨res`);

const $ = cheerio.load(html);

// Test 1: Chercher les conteneurs
const $reunionContainers = $('.liste_reunions, .archivesCourses, .bloc_archive_liste_mois');
console.log(`[Test] Conteneurs trouvÃ©s: ${$reunionContainers.length}`);

// Test 2: Chercher les liens dans les conteneurs
const links = $reunionContainers.find('a').toArray();
console.log(`[Test] Liens dans conteneurs: ${links.length}`);

// Test 3: Chercher les liens avec pattern
const reunionUrlPatterns = [
  /\/courses-pmu\/(arrivees-rapports|partants|pronostics)\/r\d+/i,
  /\/partants-programmes\/r\d+/i,
  /\/courses-pmu\/.*\/r\d+/i,
  /(?:https?:\/\/)?(?:www\.)?turf-fr\.com\/partants-programmes\/r\d+/i,
  /(?:https?:\/\/)?(?:www\.)?turf-fr\.com\/courses-pmu\/.*\/r\d+/i,
];

let found = 0;
for (const elem of links) {
  const $link = $(elem);
  const href = $link.attr('href');
  if (!href) continue;
  
  const isReunionUrl = reunionUrlPatterns.some((pattern) => pattern.test(href));
  if (isReunionUrl) {
    found++;
    if (found <= 5) {
      console.log(`[Test] Lien trouvÃ© ${found}: ${href}`);
    }
  }
}

console.log(`[Test] Total liens avec pattern: ${found}`);
