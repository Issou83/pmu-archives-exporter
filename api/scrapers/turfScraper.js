import * as cheerio from 'cheerio';

// Mois en français (dupliqué depuis constants.js pour éviter les imports cross-module)
const MONTHS = [
  { value: 'janvier', label: 'Janvier', slug: 'janvier' },
  { value: 'fevrier', label: 'Février', slug: 'fevrier' },
  { value: 'mars', label: 'Mars', slug: 'mars' },
  { value: 'avril', label: 'Avril', slug: 'avril' },
  { value: 'mai', label: 'Mai', slug: 'mai' },
  { value: 'juin', label: 'Juin', slug: 'juin' },
  { value: 'juillet', label: 'Juillet', slug: 'juillet' },
  { value: 'aout', label: 'Août', slug: 'aout' },
  { value: 'septembre', label: 'Septembre', slug: 'septembre' },
  { value: 'octobre', label: 'Octobre', slug: 'octobre' },
  { value: 'novembre', label: 'Novembre', slug: 'novembre' },
  { value: 'decembre', label: 'Décembre', slug: 'decembre' },
];

/**
 * Sleep function pour éviter le scraping agressif
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalise le code pays depuis le préfixe de l'hippodrome
 */
function normalizeCountryCode(hippodrome) {
  if (!hippodrome) return 'FR';
  if (hippodrome.startsWith('Gb-') || hippodrome.startsWith('GB-')) return 'GB';
  if (hippodrome.startsWith('Swe-') || hippodrome.startsWith('SWE-'))
    return 'SWE';
  if (hippodrome.startsWith('Usa-') || hippodrome.startsWith('USA-'))
    return 'USA';
  if (hippodrome.startsWith('Ire-') || hippodrome.startsWith('IRE-'))
    return 'IRE';
  if (hippodrome.startsWith('Ger-') || hippodrome.startsWith('GER-'))
    return 'GER';
  if (hippodrome.startsWith('Ita-') || hippodrome.startsWith('ITA-'))
    return 'ITA';
  return 'FR';
}

/**
 * Génère un ID stable pour une réunion
 */
function generateId(dateISO, hippodrome, reunionNumber) {
  return `${dateISO}_${hippodrome}_${reunionNumber}`.replace(
    /[^a-zA-Z0-9_]/g,
    '_'
  );
}

/**
 * Parse une date depuis le texte de la page
 */
function parseDate(dateText) {
  if (!dateText) return null;

  // Formats possibles : "15 janvier 2024", "15/01/2024", etc.
  const dateMatch = dateText.match(
    /(\d{1,2})[\/\s]+(\w+|\d{1,2})[\/\s]+(\d{4})/
  );
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthStr = dateMatch[2];
    const year = parseInt(dateMatch[3]);

    // Chercher le mois dans la liste
    const monthIndex = MONTHS.findIndex(
      (m) =>
        m.label.toLowerCase() === monthStr.toLowerCase() ||
        m.slug === monthStr.toLowerCase()
    );

    if (monthIndex !== -1) {
      const month = monthIndex + 1;
      const date = new Date(year, month - 1, day);
      return {
        dateISO: date.toISOString().split('T')[0],
        dateLabel: `${day} ${MONTHS[monthIndex].label} ${year}`,
        year,
        month: monthIndex + 1,
        monthLabel: MONTHS[monthIndex].label,
      };
    }
  }

  return null;
}

/**
 * Scrape une page d'archives pour un mois donné
 */
async function scrapeMonthPage(year, monthSlug) {
  const url = `https://www.turf-fr.com/archives/courses-pmu/${year}/${monthSlug}`;
  console.log(`[Scraper] Scraping: ${url}`);

  // Vérifier que fetch est disponible
  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not available. Node.js version must be >= 18.0.0');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Referer: 'https://www.turf-fr.com/',
      },
    });

    if (!response.ok) {
      console.error(`[Scraper] HTTP ${response.status} pour ${url}`);
      throw new Error(`HTTP ${response.status} pour ${url}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const reunions = [];

    console.log(`[Scraper] HTML reçu, longueur: ${html.length} caractères`);

    // Méthode 1 : Chercher les liens vers les réunions
    // Patterns détectés : /courses-pmu/arrivees-rapports/r1-... ou /partants-programmes/r1-...
    const reunionUrlPatterns = [
      /\/courses-pmu\/(arrivees-rapports|partants|pronostics)\/r\d+/i,
      /\/partants-programmes\/r\d+/i,
      /\/courses-pmu\/.*\/r\d+/i,
    ];
    
    // Chercher aussi dans les éléments avec classes pertinentes
    const $reunionContainers = $('.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, [class*="reunion"], [class*="archive"]');
    
    let foundLinks = 0;
    const processedUrls = new Set(); // Pour éviter les doublons

    // Méthode 1a : Chercher dans les conteneurs de réunions
    $reunionContainers.find('a').each((i, elem) => {
      const $link = $(elem);
      const linkText = $link.text().trim();
      const href = $link.attr('href');
      
      if (!href || processedUrls.has(href)) return;
      
      // Vérifier si l'URL correspond à un pattern de réunion
      const isReunionUrl = reunionUrlPatterns.some(pattern => pattern.test(href));
      
      // Vérifier si le texte contient un pattern de réunion (R1, R2, etc.)
      const hasReunionPattern = /R\d+/i.test(linkText) || /réunion\s*\d+/i.test(linkText);
      
      if (isReunionUrl || hasReunionPattern) {
        processedUrls.add(href);
        
        // Extraire les infos depuis l'URL ou le texte
        const urlMatch = href.match(/r(\d+)[\-_]([^\/\-]+)/i);
        const textMatch = linkText.match(/R(\d+)[\s\-]+(.+)/i) || linkText.match(/(.+)[\s\-]+R(\d+)/i);
        
        if (urlMatch || textMatch) {
          foundLinks++;
          const reunionNumber = urlMatch ? urlMatch[1] : (textMatch ? (textMatch[1] || textMatch[2]) : '1');
          const hippodromeFromUrl = urlMatch ? urlMatch[2].replace(/[-_]/g, ' ') : '';
          const hippodromeFromText = textMatch ? (textMatch[2] || textMatch[1]).trim() : '';
          const hippodrome = hippodromeFromText || hippodromeFromUrl || 'Inconnu';
          
          const fullUrl = href.startsWith('http') ? href : `https://www.turf-fr.com${href}`;
          
          // Chercher la date dans le conteneur parent
          const $container = $link.closest('.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, div, article, section');
          const containerText = $container.text();
          
          let dateText = '';
          const datePatterns = [
            /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
          ];
          
          for (const pattern of datePatterns) {
            const match = containerText.match(pattern);
            if (match) {
              dateText = match[0];
              break;
            }
          }
          
          let dateInfo = parseDate(dateText);
          if (!dateInfo) {
            // Utiliser le premier jour du mois comme fallback
            const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);
            if (monthIndex !== -1) {
              dateInfo = {
                dateISO: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
                dateLabel: `1 ${MONTHS[monthIndex].label} ${year}`,
                year: parseInt(year),
                month: monthIndex + 1,
                monthLabel: MONTHS[monthIndex].label,
              };
            }
          }
          
          if (dateInfo) {
            const countryCode = normalizeCountryCode(hippodrome);
            const id = generateId(dateInfo.dateISO, hippodrome, reunionNumber);
            
            reunions.push({
              id,
              dateISO: dateInfo.dateISO,
              dateLabel: dateInfo.dateLabel,
              year: dateInfo.year,
              month: dateInfo.month,
              monthLabel: dateInfo.monthLabel,
              hippodrome: hippodrome,
              reunionNumber: reunionNumber,
              countryCode,
              url: fullUrl,
              source: 'turf-fr',
            });
          }
        }
      }
    });

    // Méthode 1b : Chercher tous les liens avec patterns d'URL de réunion
    $('a').each((i, elem) => {
      const $link = $(elem);
      const linkText = $link.text().trim();
      const href = $link.attr('href');

      if (!href || processedUrls.has(href)) return;

      // Vérifier si l'URL correspond à un pattern de réunion
      const isReunionUrl = reunionUrlPatterns.some(pattern => pattern.test(href));
      
      if (isReunionUrl) {
        processedUrls.add(href);
        foundLinks++;
        
        // Extraire le numéro de réunion depuis l'URL (format: r1-, r2-, etc.)
        const urlReunionMatch = href.match(/r(\d+)[\-_]/i);
        const reunionNumber = urlReunionMatch ? urlReunionMatch[1] : '1';
        
        // Extraire l'hippodrome depuis l'URL ou le texte
        let hippodrome = '';
        
        // Pattern 1: Extraire depuis l'URL
        // Exemples: 
        // - r1-vincennes-36237 → "Vincennes"
        // - r2-cagnes-sur-mer-36234 → "Cagnes Sur Mer"
        // - r3-ger-gelsenkirchen-36245 → "Ger-Gelsenkirchen"
        // Regex améliorée : capturer jusqu'au numéro final (s'il existe)
        const urlHippoMatch = href.match(/r\d+[\-_]([^\/\-]+(?:-[^\/\-]+)*?)(?:-\d+)?$/i);
        if (urlHippoMatch) {
          let extracted = urlHippoMatch[1];
          // Nettoyer : enlever les mots de prix à la fin si présents
          const priceWords = ['prix', 'de', 'la', 'le', 'du', 'des'];
          let words = extracted.split('-');
          // Si le dernier mot est un mot de prix, l'enlever
          while (words.length > 0 && priceWords.includes(words[words.length - 1].toLowerCase())) {
            words.pop();
          }
          extracted = words.join('-');
          const ignoredWords = ['prix', 'de', 'la', 'le', 'du', 'des', 'partants', 'arrivees', 'rapports', 'pronostics', 'programmes'];
          words = extracted.split(/[-_]/);
          
          // Vérifier si c'est un hippodrome connu (pas un prix)
          const knownHippodromes = {
            'vincennes': 'Vincennes',
            'cagnes': 'Cagnes',
            'cagnes-sur-mer': 'Cagnes Sur Mer',
            'cagnes-sur': 'Cagnes Sur Mer',
            'longchamp': 'Longchamp',
            'chantilly': 'Chantilly',
            'deauville': 'Deauville',
            'auteuil': 'Auteuil',
            'enghien': 'Enghien',
            'pau': 'Pau',
            'ger': 'Ger',
            'ger-gelsenkirchen': 'Ger-Gelsenkirchen',
            'spa': 'Spa',
            'spa-son-pardo': 'Spa-Son Pardo',
            'spa-son': 'Spa-Son Pardo',
          };
          
          const extractedLower = extracted.toLowerCase();
          
          // Vérifier d'abord les cas spéciaux (plus spécifiques)
          if (extractedLower.startsWith('cagnes-sur')) {
            hippodrome = 'Cagnes Sur Mer';
          } else if (extractedLower.startsWith('spa-son')) {
            hippodrome = 'Spa-Son Pardo';
          } else if (extractedLower.startsWith('ger-')) {
            hippodrome = 'Ger-Gelsenkirchen';
          } else {
            // Chercher une correspondance exacte ou partielle (ordre important : plus spécifique d'abord)
            const sortedKeys = Object.keys(knownHippodromes).sort((a, b) => b.length - a.length);
            for (const key of sortedKeys) {
              if (extractedLower === key || 
                  extractedLower.startsWith(key + '-') || 
                  extractedLower.includes('-' + key + '-') ||
                  (key.includes('-') && extractedLower.includes(key))) {
                hippodrome = knownHippodromes[key];
                break;
              }
            }
          }
          
          // Si pas trouvé mais que le premier mot n'est pas ignoré, formater
          if (!hippodrome && words.length > 0 && !ignoredWords.includes(words[0].toLowerCase())) {
            const firstWord = words[0].toLowerCase();
            // Si c'est un hippodrome connu mais pas dans la liste complète
            if (['vincennes', 'cagnes', 'longchamp', 'chantilly', 'deauville', 'auteuil', 'enghien', 'pau'].includes(firstWord)) {
              // Capitaliser et prendre jusqu'à 2 mots
              hippodrome = words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            } else if (words.length <= 3) {
              // Si c'est court, c'est peut-être l'hippodrome
              hippodrome = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
          }
        }
        
        // Pattern 2: Depuis le texte du lien (ex: "R1 - Vincennes" ou "R2 Cagnes Sur Mer")
        if (!hippodrome && linkText) {
          const textMatch = linkText.match(/R\d+[\s\-]+(.+?)(?:\s*[-–]|$)/i) || linkText.match(/(.+?)[\s\-]+R\d+/i);
          if (textMatch) {
            const extracted = textMatch[1].trim();
            // Vérifier si c'est un hippodrome (pas un prix)
            const knownHippodromes = ['Vincennes', 'Cagnes', 'Longchamp', 'Chantilly', 'Deauville', 'Auteuil', 'Enghien', 'Pau'];
            for (const h of knownHippodromes) {
              if (extracted.includes(h)) {
                hippodrome = h;
                // Si "Cagnes Sur Mer", prendre tout
                if (extracted.includes('Sur Mer') || extracted.includes('sur mer')) {
                  hippodrome = 'Cagnes Sur Mer';
                }
                break;
              }
            }
            if (!hippodrome && extracted.length < 30) {
              // Si c'est court et ne contient pas "prix", c'est peut-être l'hippodrome
              if (!extracted.toLowerCase().includes('prix')) {
                hippodrome = extracted.split(/[\s\-]/)[0]; // Prendre le premier mot
              }
            }
          }
        }
        
        // Pattern 3: Depuis le breadcrumb ou le conteneur parent
        if (!hippodrome) {
          const $container = $link.closest('.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, div, article, section');
          const containerText = $container.text();
          
          // Chercher dans le breadcrumb
          const breadcrumb = $container.find('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').text();
          const searchText = breadcrumb || containerText;
          
          // Hippodromes connus avec variations
          const hippodromes = [
            { pattern: /cagnes\s+sur\s+mer/i, name: 'Cagnes Sur Mer' },
            { pattern: /vincennes/i, name: 'Vincennes' },
            { pattern: /longchamp/i, name: 'Longchamp' },
            { pattern: /chantilly/i, name: 'Chantilly' },
            { pattern: /deauville/i, name: 'Deauville' },
            { pattern: /auteuil/i, name: 'Auteuil' },
            { pattern: /enghien/i, name: 'Enghien' },
            { pattern: /pau/i, name: 'Pau' },
            { pattern: /ger[-\s]?gelsenkirchen/i, name: 'Ger-Gelsenkirchen' },
            { pattern: /spa[-\s]?son[-\s]?pardo/i, name: 'Spa-Son Pardo' },
          ];
          
          for (const h of hippodromes) {
            if (h.pattern.test(searchText)) {
              hippodrome = h.name;
              break;
            }
          }
        }
        
        if (!hippodrome) {
          hippodrome = 'Inconnu';
        }
        
        const fullUrl = href.startsWith('http') ? href : `https://www.turf-fr.com${href}`;
        
        // Chercher la date dans le conteneur, le breadcrumb, ou le texte proche
        const $container = $link.closest('.liste_reunions, .archivesCourses, .bloc_archive_liste_mois, div, article, section');
        let containerText = $container.text();
        
        // Chercher aussi dans les éléments parents et frères
        const $parent = $link.parent();
        const $siblings = $parent.siblings();
        const nearbyText = $parent.text() + ' ' + $siblings.text() + ' ' + containerText;
        
        let dateText = '';
        const datePatterns = [
          /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
          /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        ];
        
        // Chercher dans le texte proche d'abord, puis dans le conteneur
        for (const text of [nearbyText, containerText]) {
          for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
              dateText = match[0];
              break;
            }
          }
          if (dateText) break;
        }
        
        let dateInfo = parseDate(dateText);
        if (!dateInfo) {
          // Fallback: utiliser le premier jour du mois
          const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);
          if (monthIndex !== -1) {
            dateInfo = {
              dateISO: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
              dateLabel: `1 ${MONTHS[monthIndex].label} ${year}`,
              year: parseInt(year),
              month: monthIndex + 1,
              monthLabel: MONTHS[monthIndex].label,
            };
          }
        }
        
        if (dateInfo) {
          const countryCode = normalizeCountryCode(hippodrome);
          const id = generateId(dateInfo.dateISO, hippodrome, reunionNumber);
          
          reunions.push({
            id,
            dateISO: dateInfo.dateISO,
            dateLabel: dateInfo.dateLabel,
            year: dateInfo.year,
            month: dateInfo.month,
            monthLabel: dateInfo.monthLabel,
            hippodrome: hippodrome,
            reunionNumber: reunionNumber,
            countryCode,
            url: fullUrl,
            source: 'turf-fr',
          });
        }
      }
    });

    console.log(
      `[Scraper] Trouvé ${foundLinks} liens, ${reunions.length} réunions extraites`
    );

    // Méthode 2 : Si aucune réunion trouvée, essayer une approche différente
    if (reunions.length === 0) {
      console.log(
        `[Scraper] Aucune réunion trouvée avec la méthode 1, essai méthode alternative...`
      );

      // Chercher tous les liens qui pointent vers des réunions
      $('a[href*="reunion"], a[href*="course"], a[href*="programme"]').each(
        (i, elem) => {
          const $link = $(elem);
          const href = $link.attr('href');
          const linkText = $link.text().trim();

          if (href && (linkText.length > 0 || href.includes('reunion'))) {
            // Essayer d'extraire des infos depuis le texte du lien
            const reunionMatch = linkText.match(
              /([A-Za-zÀ-ÿ\s\-]+)\s*[-–]?\s*R[ée]union\s*(\d+)/i
            );
            if (reunionMatch) {
              const hippodrome = reunionMatch[1].trim();
              const reunionNumber = reunionMatch[2];
              const monthIndex = MONTHS.findIndex((m) => m.slug === monthSlug);

              if (monthIndex !== -1) {
                const dateInfo = {
                  dateISO: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
                  dateLabel: `1 ${MONTHS[monthIndex].label} ${year}`,
                  year: parseInt(year),
                  month: monthIndex + 1,
                  monthLabel: MONTHS[monthIndex].label,
                };

                const countryCode = normalizeCountryCode(hippodrome);
                const id = generateId(
                  dateInfo.dateISO,
                  hippodrome,
                  reunionNumber
                );
                const fullUrl = href.startsWith('http')
                  ? href
                  : `https://www.turf-fr.com${href}`;

                reunions.push({
                  id,
                  dateISO: dateInfo.dateISO,
                  dateLabel: dateInfo.dateLabel,
                  year: dateInfo.year,
                  month: dateInfo.month,
                  monthLabel: dateInfo.monthLabel,
                  hippodrome,
                  reunionNumber,
                  countryCode,
                  url: fullUrl,
                  source: 'turf-fr',
                });
              }
            }
          }
        }
      );

      console.log(
        `[Scraper] Méthode alternative: ${reunions.length} réunions trouvées`
      );
    }

    return reunions;
  } catch (error) {
    console.error(
      `[Scraper] Erreur lors du scraping de ${url}:`,
      error.message
    );
    console.error(error.stack);
    return [];
  }
}

/**
 * Scrape le rapport d'arrivée depuis une page de réunion
 */
async function scrapeArrivalReport(reunionUrl) {
  if (!reunionUrl) return null;

  try {
    // Convertir l'URL en URL de rapport d'arrivée si nécessaire
    // Les URLs peuvent être /partants-programmes/ ou /arrivees-rapports/
    let arrivalUrl = reunionUrl;
    
    // Si l'URL pointe vers partants-programmes, essayer arrivees-rapports
    if (arrivalUrl.includes('/partants-programmes/')) {
      arrivalUrl = arrivalUrl.replace('/partants-programmes/', '/courses-pmu/arrivees-rapports/');
    } else if (!arrivalUrl.includes('/arrivees-rapports/') && !arrivalUrl.includes('/courses-pmu/')) {
      // Si l'URL ne contient pas déjà arrivees-rapports, essayer de la convertir
      arrivalUrl = arrivalUrl.replace(/\/courses-pmu\/[^\/]+\//, '/courses-pmu/arrivees-rapports/');
    }

    console.log(`[Scraper] Scraping rapport d'arrivée: ${arrivalUrl}`);

    const response = await fetch(arrivalUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Referer: 'https://www.turf-fr.com/',
      },
    });

    if (!response.ok) {
      // Si 404, essayer l'URL originale
      if (response.status === 404 && arrivalUrl !== reunionUrl) {
        console.log(`[Scraper] 404 sur ${arrivalUrl}, essai avec URL originale`);
        return await scrapeArrivalReport(reunionUrl);
      }
      console.log(`[Scraper] HTTP ${response.status} pour ${arrivalUrl}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Chercher le rapport d'arrivée dans différents formats possibles
    let arrivalReport = null;

    // Patterns pour détecter les rapports d'arrivée
    // Format attendu: "Arrivée 11 - 1 - 8 - 13 - 14" ou "11 - 1 - 8 - 13 - 14"
    const arrivalPatterns = [
      // Pattern 1: "Arrivée 11 - 1 - 8 - 13 - 14"
      /arrivée[ée\s:]*(\d+(?:\s*[-–]\s*\d+){2,})/i,
      // Pattern 2: "11 - 1 - 8 - 13 - 14" (au moins 3 numéros)
      /(?:^|\s)(\d+(?:\s*[-–]\s*\d+){2,})(?:\s|$)/,
      // Pattern 3: Dans un élément avec texte "Arrivée" suivi de numéros
      /arrivée[ée\s:]*([\d\s\-–]{3,})/i,
    ];

    // Chercher dans différents sélecteurs spécifiques
    const selectors = [
      '[class*="arrivee"]',
      '[class*="arrival"]',
      '[class*="resultat"]',
      '[class*="result"]',
      '[id*="arrivee"]',
      '[id*="arrival"]',
      '[class*="flag"]', // Les drapeaux verts indiquent souvent l'arrivée
      '.arrivee',
      '.arrival',
      '.resultat',
      '.result',
    ];

    // Chercher d'abord dans les sélecteurs spécifiques
    for (const selector of selectors) {
      const $elements = $(selector);
      $elements.each((i, elem) => {
        const $elem = $(elem);
        const text = $elem.text().trim();
        
        // Chercher les patterns dans le texte
        for (const pattern of arrivalPatterns) {
          const match = text.match(pattern);
          if (match) {
            let candidate = match[1].trim();
            // Nettoyer et valider
            candidate = candidate.replace(/\s+/g, ' ').replace(/[-–]/g, '-');
            // Vérifier que c'est un rapport valide (au moins 3 numéros)
            const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
            if (numbers.length >= 3) {
              arrivalReport = numbers.join('-');
              return false; // Break de la boucle each
            }
          }
        }
      });
      if (arrivalReport) break;
    }

    // Si pas trouvé, chercher dans les éléments avec texte contenant "Arrivée"
    if (!arrivalReport) {
      $('*').each((i, elem) => {
        const $elem = $(elem);
        const text = $elem.text();
        if (text.toLowerCase().includes('arrivée') || text.toLowerCase().includes('arrivee')) {
          for (const pattern of arrivalPatterns) {
            const match = text.match(pattern);
            if (match) {
              let candidate = match[1].trim();
              candidate = candidate.replace(/\s+/g, ' ').replace(/[-–]/g, '-');
              const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
              if (numbers.length >= 3) {
                arrivalReport = numbers.join('-');
                return false; // Break
              }
            }
          }
        }
      });
    }

    // Dernière tentative : chercher dans tout le body pour des séquences de numéros
    if (!arrivalReport) {
      const pageText = $('body').text();
      // Chercher des séquences comme "11 - 1 - 8 - 13 - 14" près du mot "Arrivée"
      const contextMatch = pageText.match(/arrivée[ée\s:]*([^\n]{0,100})/i);
      if (contextMatch) {
        const context = contextMatch[1];
        const numbersMatch = context.match(/(\d+(?:\s*[-–]\s*\d+){2,})/);
        if (numbersMatch) {
          let candidate = numbersMatch[1].trim();
          candidate = candidate.replace(/\s+/g, ' ').replace(/[-–]/g, '-');
          const numbers = candidate.split('-').filter(n => n.trim().match(/^\d+$/));
          if (numbers.length >= 3) {
            arrivalReport = numbers.join('-');
          }
        }
      }
    }

    // Nettoyer le format : "11 - 1 - 8 - 13 - 14" -> "11-1-8-13-14"
    if (arrivalReport) {
      arrivalReport = arrivalReport.replace(/\s*[-–]\s*/g, '-');
    }

    if (arrivalReport) {
      console.log(`[Scraper] Rapport d'arrivée trouvé: ${arrivalReport}`);
    } else {
      console.log(`[Scraper] Aucun rapport d'arrivée trouvé pour ${arrivalUrl}`);
    }

    return arrivalReport || null;
  } catch (error) {
    console.error(
      `[Scraper] Erreur lors du scraping du rapport d'arrivée pour ${reunionUrl}:`,
      error.message
    );
    return null;
  }
}

/**
 * Scrape les archives Turf-FR pour les années et mois spécifiés
 */
export async function scrapeTurfFrArchives(years, months) {
  console.log(
    `[Scraper] Début scraping Turf-FR: années=${years.join(',')}, mois=${months.join(',')}`
  );
  const allReunions = [];

  for (const year of years) {
    for (const month of months) {
      const monthData = MONTHS.find((m) => m.value === month);
      if (!monthData) {
        console.warn(`[Scraper] Mois non trouvé: ${month}`);
        continue;
      }

      const monthSlug = monthData.slug;
      console.log(`[Scraper] Scraping ${year}/${monthSlug}...`);
      const reunions = await scrapeMonthPage(year, monthSlug);
      console.log(
        `[Scraper] ${reunions.length} réunions trouvées pour ${year}/${monthSlug}`
      );
      allReunions.push(...reunions);

      // Sleep 400ms entre les pages pour éviter le scraping agressif
      await sleep(400);
    }
  }

  console.log(
    `[Scraper] Total avant déduplication: ${allReunions.length} réunions`
  );

  // Dédupliquer par ID
  const uniqueReunions = [];
  const seenIds = new Set();

  for (const reunion of allReunions) {
    if (!seenIds.has(reunion.id)) {
      seenIds.add(reunion.id);
      uniqueReunions.push(reunion);
    }
  }

  console.log(
    `[Scraper] Total après déduplication: ${uniqueReunions.length} réunions`
  );

  // Scraper les rapports d'arrivée pour chaque réunion
  console.log(`[Scraper] Début scraping des rapports d'arrivée...`);
  for (let i = 0; i < uniqueReunions.length; i++) {
    const reunion = uniqueReunions[i];
    const arrivalReport = await scrapeArrivalReport(reunion.url);
    reunion.arrivalReport = arrivalReport;
    
    // Sleep 200ms entre chaque requête pour éviter le scraping agressif
    if (i < uniqueReunions.length - 1) {
      await sleep(200);
    }
    
    // Afficher la progression tous les 10 éléments
    if ((i + 1) % 10 === 0) {
      console.log(`[Scraper] Rapports d'arrivée: ${i + 1}/${uniqueReunions.length}`);
    }
  }
  
  console.log(`[Scraper] Scraping des rapports d'arrivée terminé`);

  return uniqueReunions;
}
