import ExcelJS from 'exceljs';
import { scrapeTurfFrArchives } from './scrapers/turfScraper.js';
import { scrapePmuJsonArchives } from './scrapers/pmuJsonScraper.js';

/**
 * Applique les filtres sur les réunions (même logique que archives.js)
 */
function applyFilters(reunions, filters) {
  let filtered = [...reunions];

  if (filters.dateFrom) {
    filtered = filtered.filter((r) => r.dateISO >= filters.dateFrom);
  }
  if (filters.dateTo) {
    filtered = filtered.filter((r) => r.dateISO <= filters.dateTo);
  }
  if (filters.hippodromes?.length) {
    filtered = filtered.filter((r) =>
      filters.hippodromes.some((h) =>
        r.hippodrome?.toLowerCase().includes(h.toLowerCase())
      )
    );
  }
  if (filters.reunionNumbers?.length) {
    filtered = filtered.filter((r) =>
      filters.reunionNumbers.includes(r.reunionNumber)
    );
  }
  if (filters.countries?.length) {
    filtered = filtered.filter((r) => filters.countries.includes(r.countryCode));
  }
  if (filters.textQuery) {
    const query = filters.textQuery.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.hippodrome?.toLowerCase().includes(query) ||
        r.dateLabel?.toLowerCase().includes(query) ||
        r.reunionNumber?.toString().includes(query)
    );
  }

  return filtered;
}

/**
 * Génère un fichier Excel avec les réunions
 */
async function generateExcel(reunions) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('reunions');

  // Définir les colonnes
  worksheet.columns = [
    { header: 'Année', key: 'year', width: 10 },
    { header: 'Mois', key: 'monthLabel', width: 15 },
    { header: 'Date (Label)', key: 'dateLabel', width: 20 },
    { header: 'Date (ISO)', key: 'dateISO', width: 12 },
    { header: 'Hippodrome', key: 'hippodrome', width: 25 },
    { header: 'Réunion', key: 'reunionNumber', width: 10 },
    { header: 'Pays', key: 'countryCode', width: 10 },
    { header: 'URL', key: 'url', width: 50 },
    { header: 'Source', key: 'source', width: 15 },
  ];

  // Style de l'en-tête
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Ajouter les données
  for (const reunion of reunions) {
    worksheet.addRow({
      year: reunion.year || '',
      monthLabel: reunion.monthLabel || '',
      dateLabel: reunion.dateLabel || '',
      dateISO: reunion.dateISO || '',
      hippodrome: reunion.hippodrome || '',
      reunionNumber: reunion.reunionNumber || '',
      countryCode: reunion.countryCode || '',
      url: reunion.url || '',
      source: reunion.source || '',
    });
  }

  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Handler API /api/export
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      source = 'turf-fr',
      years = [],
      months = [],
      dateFrom,
      dateTo,
      hippodromes = [],
      reunionNumbers = [],
      countries = [],
      textQuery,
    } = req.body;

    const filters = {
      dateFrom,
      dateTo,
      hippodromes,
      reunionNumbers,
      countries,
      textQuery,
    };

    // Scraper les données (même logique que /api/archives)
    let reunions = [];

    if (source === 'turf-fr') {
      if (!years.length || !months.length) {
        return res.status(400).json({
          error: 'Years and months are required for turf-fr source',
        });
      }
      reunions = await scrapeTurfFrArchives(years, months);
    } else if (source === 'pmu-json') {
      if (dateFrom && dateTo) {
        reunions = await scrapePmuJsonArchives([], [], dateFrom, dateTo);
      } else if (years.length > 0 && months.length > 0) {
        reunions = await scrapePmuJsonArchives(years, months);
      } else {
        return res.status(400).json({
          error: 'Either dateFrom/dateTo or years/months are required for pmu-json source',
        });
      }
    } else {
      return res.status(400).json({ error: 'Invalid source' });
    }

    // Appliquer les filtres
    const filtered = applyFilters(reunions, filters);

    if (filtered.length === 0) {
      return res.status(400).json({ error: 'No reunions found with the specified filters' });
    }

    // Générer le fichier Excel
    const buffer = await generateExcel(filtered);

    // Retourner le fichier
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reunions_pmu_export.xlsx"'
    );
    res.setHeader('Content-Length', buffer.length);

    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Erreur dans /api/export:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}

