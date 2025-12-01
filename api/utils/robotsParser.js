/**
 * Parser et vérificateur de robots.txt
 * Respecte le protocole robots.txt pour éviter les violations légales
 */

/**
 * Parse le contenu d'un fichier robots.txt
 * @param {string} robotsTxtContent - Contenu du fichier robots.txt
 * @returns {Object} Objet avec les règles par User-Agent
 */
export function parseRobotsTxt(robotsTxtContent) {
  const rules = {
    '*': {
      disallow: [],
      allow: [],
      crawlDelay: null,
    },
  };

  if (!robotsTxtContent) {
    return rules;
  }

  const lines = robotsTxtContent.split('\n');
  let currentUserAgent = '*';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignorer les commentaires et lignes vides
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Parser User-agent
    if (line.toLowerCase().startsWith('user-agent:')) {
      const userAgent = line.substring(11).trim();
      currentUserAgent = userAgent;
      if (!rules[currentUserAgent]) {
        rules[currentUserAgent] = {
          disallow: [],
          allow: [],
          crawlDelay: null,
        };
      }
      continue;
    }

    // Parser Disallow
    if (line.toLowerCase().startsWith('disallow:')) {
      const path = line.substring(9).trim();
      if (path && !rules[currentUserAgent].disallow.includes(path)) {
        rules[currentUserAgent].disallow.push(path);
      }
      continue;
    }

    // Parser Allow
    if (line.toLowerCase().startsWith('allow:')) {
      const path = line.substring(6).trim();
      if (path && !rules[currentUserAgent].allow.includes(path)) {
        rules[currentUserAgent].allow.push(path);
      }
      continue;
    }

    // Parser Crawl-delay
    if (line.toLowerCase().startsWith('crawl-delay:')) {
      const delay = parseFloat(line.substring(12).trim());
      if (!isNaN(delay)) {
        rules[currentUserAgent].crawlDelay = delay;
      }
      continue;
    }
  }

  return rules;
}

/**
 * Vérifie si une URL est autorisée selon les règles robots.txt
 * Respecte la spécification robots.txt : la règle la plus spécifique (la plus longue) l'emporte
 * 
 * @param {Object} rules - Règles parsées depuis robots.txt
 * @param {string} url - URL à vérifier
 * @param {string} userAgent - User-Agent à utiliser (défaut: '*')
 * @returns {boolean} true si l'URL est autorisée
 */
export function isUrlAllowed(rules, url, userAgent = '*') {
  if (!rules || !url) {
    return true; // Par défaut, autoriser si pas de règles
  }

  // Utiliser les règles spécifiques au User-Agent ou les règles générales
  const agentRules = rules[userAgent] || rules['*'] || { disallow: [], allow: [] };

  // Extraire le chemin de l'URL
  let path;
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname;
  } catch (e) {
    // Si l'URL n'est pas valide, utiliser le chemin tel quel
    path = url;
  }

  // Trouver la règle la plus spécifique (la plus longue) qui correspond
  // Selon la spécification robots.txt, la règle la plus longue l'emporte
  let mostSpecificRule = null;
  let mostSpecificLength = -1;
  let mostSpecificType = null; // 'allow' ou 'disallow'

  // Chercher dans les règles Allow
  for (const allowPath of agentRules.allow || []) {
    if (allowPath === '/' || path.startsWith(allowPath)) {
      const pathLength = allowPath.length;
      if (pathLength > mostSpecificLength) {
        mostSpecificLength = pathLength;
        mostSpecificRule = allowPath;
        mostSpecificType = 'allow';
      }
    }
  }

  // Chercher dans les règles Disallow
  for (const disallowPath of agentRules.disallow || []) {
    if (disallowPath === '/') {
      // Disallow: / interdit tout (très spécifique)
      const pathLength = 1;
      if (pathLength > mostSpecificLength) {
        mostSpecificLength = pathLength;
        mostSpecificRule = disallowPath;
        mostSpecificType = 'disallow';
      }
    } else if (path.startsWith(disallowPath)) {
      const pathLength = disallowPath.length;
      if (pathLength > mostSpecificLength) {
        mostSpecificLength = pathLength;
        mostSpecificRule = disallowPath;
        mostSpecificType = 'disallow';
      }
    }
  }

  // Si on a trouvé une règle spécifique, appliquer son type
  if (mostSpecificRule !== null) {
    return mostSpecificType === 'allow';
  }

  // Par défaut, autoriser (si aucune règle ne correspond)
  return true;
}

/**
 * Récupère et parse le fichier robots.txt d'un domaine
 * @param {string} baseUrl - URL de base du site (ex: https://www.turf-fr.com)
 * @returns {Promise<Object>} Règles parsées
 */
export async function fetchRobotsTxt(baseUrl) {
  try {
    let robotsUrl;
    try {
      const urlObj = new URL(baseUrl);
      robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    } catch (e) {
      robotsUrl = `${baseUrl}/robots.txt`;
    }

    console.log(`[RobotsParser] Récupération de robots.txt: ${robotsUrl}`);

    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'PMU-Archives-Exporter/1.0 (Contact: voir README)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[RobotsParser] robots.txt non trouvé, autorisation par défaut');
        return { '*': { disallow: [], allow: [], crawlDelay: null } };
      }
      throw new Error(`HTTP ${response.status} pour ${robotsUrl}`);
    }

    const content = await response.text();
    const rules = parseRobotsTxt(content);

    console.log(`[RobotsParser] robots.txt parsé avec succès`);
    console.log(`[RobotsParser] Règles Disallow pour '*': ${rules['*']?.disallow?.length || 0}`);
    console.log(`[RobotsParser] Crawl-delay: ${rules['*']?.crawlDelay || 'non spécifié'}`);

    return rules;
  } catch (error) {
    console.error(`[RobotsParser] Erreur lors de la récupération de robots.txt:`, error.message);
    // En cas d'erreur, retourner des règles par défaut (tout autorisé)
    return { '*': { disallow: [], allow: [], crawlDelay: null } };
  }
}

/**
 * Obtient le délai de crawl recommandé depuis robots.txt
 * @param {Object} rules - Règles parsées
 * @param {string} userAgent - User-Agent (défaut: '*')
 * @returns {number} Délai en millisecondes (défaut: 1000ms)
 */
export function getCrawlDelay(rules, userAgent = '*') {
  const agentRules = rules[userAgent] || rules['*'];
  if (agentRules?.crawlDelay) {
    return agentRules.crawlDelay * 1000; // Convertir en millisecondes
  }
  return 1000; // Délai par défaut de 1 seconde
}

