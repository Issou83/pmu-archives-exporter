// API pour gérer la liste des hippodromes avec mise à jour automatique
// Liste des hippodromes par pays (identique à src/data/hippodromes.js)
const HIPPODROMES_BY_COUNTRY = {
  FR: [
    'Vincennes', 'Longchamp', 'Auteuil', 'Chantilly', 'Enghien', 'Maisons-Laffitte',
    'Saint-Cloud', 'Evry', 'Cergy-Pontoise', 'Cagnes Sur Mer', 'Cagnes', 'Marseille',
    'Toulon', 'Pau', 'Bordeaux', 'La Teste', 'Arcachon', 'Royan', 'Angoulême', 'Limoges',
    'Toulouse', 'Montpellier', 'Carcassonne', 'Nîmes', 'Perpignan', 'Lyon', 'Vichy',
    'Clermont-Ferrand', 'Grenoble', 'Valence', 'Lille', 'Lens', 'Amiens', 'Compiègne',
    'Cabourg', 'Deauville', 'Caen', 'Vire', 'Argentan', 'Alençon', 'Lisieux', 'Pont-Audemer',
    'Vannes', 'Lorient', 'Rennes', 'Saint-Brieuc', 'Pontchâteau', 'Nantes', 'Angers',
    'Le Mans', 'Laval', 'Sablé-sur-Sarthe', 'Châteauroux', 'Tours', 'Orléans', 'Blois',
    'Dijon', 'Chalon-sur-Saône', 'Mâcon', 'Besançon', 'Strasbourg', 'Nancy', 'Metz',
    'Reims', 'Châlons-en-Champagne', 'Biarritz', 'Bayonne', 'Dax', 'Mauquenchy',
    'La Capelle', 'Wissembourg',
  ],
  GB: [
    'Ascot', 'Newmarket', 'Epsom', 'Goodwood', 'York', 'Doncaster', 'Aintree', 'Cheltenham',
    'Sandown', 'Kempton', 'Lingfield', 'Wolverhampton', 'Newcastle', 'Haydock', 'Chester',
    'Ripon', 'Beverley', 'Redcar', 'Catterick', 'Pontefract', 'Thirsk', 'Hamilton', 'Ayr',
    'Perth', 'Kelso', 'Hexham', 'Carlisle', 'Sedgefield', 'Musselburgh',
  ],
  IRE: [
    'Leopardstown', 'The Curragh', 'Fairyhouse', 'Punchestown', 'Galway', 'Cork', 'Limerick',
    'Tipperary', 'Naas', 'Gowran Park', 'Dundalk', 'Down Royal', 'Downpatrick', 'Listowel',
    'Killarney', 'Tramore', 'Wexford', 'Thurles', 'Roscommon', 'Sligo', 'Ballinrobe',
    'Kilbeggan', 'Bellewstown', 'Laytown',
  ],
  USA: [
    'Gulfstream Park', 'Churchill Downs', 'Belmont Park', 'Aqueduct', 'Santa Anita', 'Del Mar',
    'Keeneland', 'Saratoga', 'Arlington', 'Monmouth Park', 'Pimlico', 'Laurel', 'Fair Grounds',
    'Oaklawn Park', 'Tampa Bay Downs',
  ],
  GER: [
    'Ger-Gelsenkirchen', 'Gelsenkirchen', 'Düsseldorf', 'Cologne', 'Hamburg', 'Berlin', 'Munich',
    'Frankfurt', 'Baden-Baden', 'Dortmund', 'Essen', 'Hannover',
  ],
  ITA: [
    'San Siro', 'Capannelle', 'Tor di Valle', 'Milan', 'Rome', 'Naples', 'Turin', 'Florence', 'Venice',
  ],
  SWE: [
    'Jägersro', 'Solvalla', 'Åby', 'Bergsåker', 'Halmstad', 'Kalmar', 'Malmö', 'Örebro', 'Uppsala',
  ],
};

// Cache pour stocker la liste des hippodromes
let hippodromesCache = null;
let lastUpdateDate = null;

// Vérifier si une mise à jour est nécessaire (tous les 2 du mois)
function shouldUpdate() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  // Si c'est le 2 du mois ou si le cache n'existe pas
  if (dayOfMonth === 2 || !hippodromesCache) {
    return true;
  }
  
  // Si la dernière mise à jour date de plus d'un mois
  if (lastUpdateDate) {
    const daysSinceUpdate = Math.floor(
      (today - lastUpdateDate) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 30) {
      return true;
    }
  }
  
  return false;
}

// Scraper les hippodromes depuis turf-fr (optionnel, pour mise à jour automatique)
async function scrapeHippodromesFromTurfFr() {
  try {
    // Scraper la page des archives pour extraire tous les hippodromes uniques
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const monthSlug = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 
                       'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'][currentMonth - 1];
    
    const url = `https://www.turf-fr.com/archives/courses-pmu/${currentYear}/${monthSlug}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        Referer: 'https://www.turf-fr.com/',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    // Utiliser ESM import comme dans le reste du projet
    const cheerioModule = await import('cheerio');
    const cheerio = cheerioModule.default || cheerioModule;
    const $ = cheerio.load(html);
    
    const hippodromes = new Set();
    
    // Extraire les hippodromes depuis les liens et le texte
    $('a[href*="/courses-pmu/"], a[href*="/partants-programmes/"]').each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const text = $link.text();
      
      // Extraire depuis l'URL
      const urlMatch = href.match(/r\d+[\-_]([^\/\-]+(?:-[^\/\-]+)*?)(?:-\d+)?$/i);
      if (urlMatch) {
        const extracted = urlMatch[1];
        // Nettoyer
        const words = extracted.split(/[-_]/).filter(w => 
          !['prix', 'de', 'la', 'le', 'du', 'des', 'partants', 'arrivees', 'rapports'].includes(w.toLowerCase())
        );
        if (words.length > 0) {
          const hippodrome = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          if (hippodrome.length > 2) {
            hippodromes.add(hippodrome);
          }
        }
      }
    });
    
    return Array.from(hippodromes);
  } catch (error) {
    console.error('[Hippodromes] Erreur lors du scraping:', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { country } = req.query;

    // Si une mise à jour est nécessaire, essayer de scraper
    if (shouldUpdate()) {
      console.log('[Hippodromes] Mise à jour nécessaire, scraping en cours...');
      const scrapedHippodromes = await scrapeHippodromesFromTurfFr();
      
      if (scrapedHippodromes && scrapedHippodromes.length > 0) {
        // Mettre à jour le cache (optionnel, pour l'instant on garde la liste statique)
        lastUpdateDate = new Date();
        console.log(`[Hippodromes] ${scrapedHippodromes.length} hippodromes scrapés`);
      }
    }

    // Retourner les hippodromes selon le pays
    if (country) {
      const hippodromes = HIPPODROMES_BY_COUNTRY[country] || [];
      return res.status(200).json({
        country,
        hippodromes,
        count: hippodromes.length,
      });
    }

    // Retourner tous les hippodromes par pays
    return res.status(200).json({
      hippodromes: HIPPODROMES_BY_COUNTRY,
      lastUpdate: lastUpdateDate || new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Hippodromes] Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
}

