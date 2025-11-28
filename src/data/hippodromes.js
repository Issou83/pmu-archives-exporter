// Liste complète des hippodromes par pays
// Cette liste sera mise à jour automatiquement tous les 2 du mois

export const HIPPODROMES_BY_COUNTRY = {
  FR: [
    // Île-de-France
    'Vincennes',
    'Longchamp',
    'Auteuil',
    'Chantilly',
    'Enghien',
    'Maisons-Laffitte',
    'Saint-Cloud',
    'Evry',
    'Cergy-Pontoise',
    
    // Provence-Alpes-Côte d'Azur
    'Cagnes Sur Mer',
    'Cagnes',
    'Marseille',
    'Toulon',
    
    // Nouvelle-Aquitaine
    'Pau',
    'Bordeaux',
    'La Teste',
    'Arcachon',
    'Royan',
    'Angoulême',
    'Limoges',
    
    // Occitanie
    'Toulouse',
    'Montpellier',
    'Carcassonne',
    'Nîmes',
    'Perpignan',
    
    // Auvergne-Rhône-Alpes
    'Lyon',
    'Vichy',
    'Clermont-Ferrand',
    'Grenoble',
    'Valence',
    
    // Hauts-de-France
    'Lille',
    'Lens',
    'Amiens',
    'Compiègne',
    'Chantilly',
    'Cabourg',
    'Deauville',
    'Caen',
    'Vire',
    'Argentan',
    'Alençon',
    
    // Normandie
    'Deauville',
    'Cabourg',
    'Caen',
    'Vire',
    'Argentan',
    'Alençon',
    'Lisieux',
    'Pont-Audemer',
    
    // Bretagne
    'Vannes',
    'Lorient',
    'Rennes',
    'Saint-Brieuc',
    'Pontchâteau',
    
    // Pays de la Loire
    'Nantes',
    'Angers',
    'Le Mans',
    'Laval',
    'Sablé-sur-Sarthe',
    
    // Centre-Val de Loire
    'Châteauroux',
    'Tours',
    'Orléans',
    'Blois',
    
    // Bourgogne-Franche-Comté
    'Dijon',
    'Chalon-sur-Saône',
    'Mâcon',
    'Besançon',
    
    // Grand Est
    'Strasbourg',
    'Nancy',
    'Metz',
    'Reims',
    'Châlons-en-Champagne',
    
    // Nouvelle-Aquitaine (suite)
    'Biarritz',
    'Bayonne',
    'Dax',
    
    // Autres
    'Mauquenchy',
    'La Capelle',
    'Wissembourg',
    'Nancy',
    'Metz',
    'Reims',
  ],
  
  GB: [
    'Ascot',
    'Newmarket',
    'Epsom',
    'Goodwood',
    'York',
    'Doncaster',
    'Aintree',
    'Cheltenham',
    'Sandown',
    'Kempton',
    'Lingfield',
    'Wolverhampton',
    'Newcastle',
    'Haydock',
    'Chester',
    'Ripon',
    'Beverley',
    'Redcar',
    'Catterick',
    'Pontefract',
    'Thirsk',
    'Hamilton',
    'Ayr',
    'Perth',
    'Kelso',
    'Hexham',
    'Carlisle',
    'Sedgefield',
    'Musselburgh',
  ],
  
  IRE: [
    'Leopardstown',
    'The Curragh',
    'Fairyhouse',
    'Punchestown',
    'Galway',
    'Cork',
    'Limerick',
    'Tipperary',
    'Naas',
    'Gowran Park',
    'Dundalk',
    'Down Royal',
    'Downpatrick',
    'Listowel',
    'Killarney',
    'Tramore',
    'Wexford',
    'Thurles',
    'Roscommon',
    'Sligo',
    'Ballinrobe',
    'Kilbeggan',
    'Bellewstown',
    'Laytown',
  ],
  
  USA: [
    'Gulfstream Park',
    'Churchill Downs',
    'Belmont Park',
    'Aqueduct',
    'Santa Anita',
    'Del Mar',
    'Keeneland',
    'Saratoga',
    'Arlington',
    'Monmouth Park',
    'Pimlico',
    'Laurel',
    'Fair Grounds',
    'Oaklawn Park',
    'Tampa Bay Downs',
  ],
  
  GER: [
    'Ger-Gelsenkirchen',
    'Gelsenkirchen',
    'Düsseldorf',
    'Cologne',
    'Hamburg',
    'Berlin',
    'Munich',
    'Frankfurt',
    'Baden-Baden',
    'Dortmund',
    'Essen',
    'Hannover',
  ],
  
  ITA: [
    'San Siro',
    'Capannelle',
    'Tor di Valle',
    'Milan',
    'Rome',
    'Naples',
    'Turin',
    'Florence',
    'Venice',
  ],
  
  SWE: [
    'Jägersro',
    'Solvalla',
    'Åby',
    'Bergsåker',
    'Halmstad',
    'Kalmar',
    'Malmö',
    'Örebro',
    'Uppsala',
  ],
};

// Fonction pour obtenir les hippodromes d'un pays
export function getHippodromesByCountry(countryCode) {
  return HIPPODROMES_BY_COUNTRY[countryCode] || [];
}

// Fonction pour obtenir tous les hippodromes
export function getAllHippodromes() {
  return Object.values(HIPPODROMES_BY_COUNTRY).flat();
}

// Fonction pour normaliser un nom d'hippodrome
export function normalizeHippodromeName(name) {
  if (!name) return '';
  
  // Normaliser les variations communes
  const variations = {
    'cagnes-sur-mer': 'Cagnes Sur Mer',
    'cagnes sur mer': 'Cagnes Sur Mer',
    'cagnes': 'Cagnes Sur Mer',
    'ger-gelsenkirchen': 'Ger-Gelsenkirchen',
    'gelsenkirchen': 'Ger-Gelsenkirchen',
    'spa-son-pardo': 'Spa-Son Pardo',
    'spa son pardo': 'Spa-Son Pardo',
    'spa': 'Spa-Son Pardo',
  };
  
  const normalized = name.toLowerCase().trim();
  return variations[normalized] || name;
}

