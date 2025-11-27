/**
 * Script de diagnostic pour analyser la structure HTML de turf-fr.com
 */

import * as cheerio from 'cheerio';

const url = 'https://www.turf-fr.com/archives/courses-pmu/2024/janvier';

console.log(`🔍 Analyse de la structure HTML de: ${url}\n`);

try {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    console.error(`❌ HTTP ${response.status}`);
    process.exit(1);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  
  console.log(`✅ HTML reçu: ${html.length} caractères\n`);

  // Chercher tous les liens
  const allLinks = [];
  $('a').each((i, elem) => {
    const $link = $(elem);
    const text = $link.text().trim();
    const href = $link.attr('href');
    if (text && href) {
      allLinks.push({ text, href });
    }
  });

  console.log(`📊 Total de liens trouvés: ${allLinks.length}\n`);

  // Chercher les liens avec "réunion" ou "reunion"
  const reunionLinks = allLinks.filter(link => 
    link.text.toLowerCase().includes('réunion') || 
    link.text.toLowerCase().includes('reunion') ||
    link.href.includes('reunion')
  );

  console.log(`🔗 Liens contenant "réunion": ${reunionLinks.length}\n`);
  
  if (reunionLinks.length > 0) {
    console.log('📋 Premiers liens de réunion:');
    reunionLinks.slice(0, 10).forEach((link, i) => {
      console.log(`\n${i + 1}. Texte: "${link.text}"`);
      console.log(`   URL: ${link.href}`);
    });
  }

  // Chercher les éléments contenant des dates
  const datePatterns = [
    /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
  ];

  const dateElements = [];
  $('*').each((i, elem) => {
    const text = $(elem).text();
    for (const pattern of datePatterns) {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        dateElements.push({
          tag: elem.tagName,
          text: text.substring(0, 100),
          match: match[0],
        });
        break;
      }
    }
  });

  console.log(`\n📅 Éléments contenant des dates: ${dateElements.length}`);
  if (dateElements.length > 0) {
    console.log('\nPremières dates trouvées:');
    dateElements.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. ${item.tag}: "${item.match}"`);
    });
  }

  // Chercher les éléments contenant "hippodrome"
  const hippodromeElements = [];
  $('*').each((i, elem) => {
    const text = $(elem).text();
    if (text.toLowerCase().includes('hippodrome') || text.match(/[A-Z][a-z]+\s*[-–]\s*R[ée]union/i)) {
      hippodromeElements.push({
        tag: elem.tagName,
        text: text.substring(0, 150),
      });
    }
  });

  console.log(`\n🏇 Éléments contenant "hippodrome" ou "Réunion": ${hippodromeElements.length}`);
  if (hippodromeElements.length > 0) {
    console.log('\nPremiers éléments:');
    hippodromeElements.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. ${item.tag}: "${item.text}"`);
    });
  }

  // Chercher les classes CSS qui pourraient contenir des réunions
  const classesWithReunion = new Set();
  $('[class*="reunion"], [class*="course"], [class*="archive"], [class*="programme"]').each((i, elem) => {
    const classes = $(elem).attr('class');
    if (classes) {
      classes.split(' ').forEach(cls => {
        if (cls.toLowerCase().includes('reunion') || 
            cls.toLowerCase().includes('course') || 
            cls.toLowerCase().includes('archive')) {
          classesWithReunion.add(cls);
        }
      });
    }
  });

  console.log(`\n🎨 Classes CSS pertinentes trouvées: ${classesWithReunion.size}`);
  if (classesWithReunion.size > 0) {
    console.log('\nClasses:');
    Array.from(classesWithReunion).slice(0, 10).forEach(cls => {
      console.log(`  - ${cls}`);
    });
  }

  // Sauvegarder un extrait du HTML pour inspection
  const bodyText = $('body').text().substring(0, 2000);
  console.log(`\n📄 Extrait du contenu de la page (2000 premiers caractères):\n${bodyText}...`);

} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error(error.stack);
}

